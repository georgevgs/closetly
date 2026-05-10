import { useEffect, useRef, useState } from "react";
import {
  View,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { router } from "expo-router";
import { SymbolView } from "expo-symbols";
import { toast } from "sonner-native";

import { ensureCameraPermission } from "~/lib/permissions";

import { Screen } from "~/components/ui/Screen";
import { Text } from "~/components/ui/Text";
import { Button } from "~/components/ui/Button";
import { Pill } from "~/components/ui/Pill";
import {
  PRESET_PALETTE,
  buildPalette,
  snapHexesToPresets,
  type Swatch,
} from "~/lib/color/extract";
import { useCreateItem } from "~/features/closet/hooks/useCreateItem";
import { seasonsForWarmth } from "~/lib/seasons";
import {
  analyzeItemFromUri,
  attrsFromMaskedColors,
  inferSilhouetteFromMask,
} from "~/features/closet/vision";
import {
  isBgRemovalAvailable,
  removeBackground,
  type BgRemoveResult,
} from "expo-bg-remover";
import { useCategoryPrefs } from "~/providers/CategoryPrefsProvider";
import {
  CATEGORIES,
  STYLES,
  SEASONS,
  PATTERNS,
  type Category,
  type Style,
  type Season,
  type Pattern,
  type Formality,
  type Warmth,
  type VisionAttrs,
} from "~/types/items";

const pickInitialCategory = (visible: readonly Category[]): Category => {
  if (visible.length > 0) return visible[0];
  return CATEGORIES[0];
};

const nameOrNull = (raw: string): string | null => {
  const trimmed = raw.trim();
  if (trimmed.length === 0) return null;
  return trimmed;
};

const swatchBorderClass = (selected: boolean): string => {
  if (selected) return "border-ink dark:border-ink-dark";
  return "border-line dark:border-line-dark";
};

const ordinalLabel = (index: number): string => {
  if (index === 0) return "1st";
  if (index === 1) return "2nd";
  return "3rd";
};

const PICKER_OPTIONS: Parameters<typeof ImagePicker.launchCameraAsync>[0] = {
  mediaTypes: ["images"],
  quality: 0.9,
  allowsEditing: true,
  aspect: [1, 1],
};

const launchPicker = (source: "camera" | "library") => {
  if (source === "camera") return ImagePicker.launchCameraAsync(PICKER_OPTIONS);
  return ImagePicker.launchImageLibraryAsync(PICKER_OPTIONS);
};

const INITIAL_WARMTH: Warmth = 2;

export default function NewItemScreen() {
  const create = useCreateItem();
  const { visible: visibleCategories } = useCategoryPrefs();
  const initialCategory = pickInitialCategory(visibleCategories);

  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [picks, setPicks] = useState<Swatch[]>([]);
  const palette = buildPalette(picks);

  const [name, setName] = useState("");
  const [category, setCategory] = useState<Category>(initialCategory);
  const [styles, setStyles] = useState<Set<Style>>(new Set(["minimal"]));
  const [seasons, setSeasons] = useState<Set<Season>>(
    new Set(seasonsForWarmth(INITIAL_WARMTH)),
  );
  const [seasonsTouched, setSeasonsTouched] = useState(false);
  const [pattern, setPattern] = useState<Pattern>("solid");
  const [formality, setFormality] = useState<Formality>(3);
  const [warmth, setWarmth] = useState<Warmth>(INITIAL_WARMTH);

  useEffect(() => {
    if (seasonsTouched) return;
    setSeasons(new Set(seasonsForWarmth(warmth)));
  }, [warmth, seasonsTouched]);

  const [analyzing, setAnalyzing] = useState(false);
  const [trimming, setTrimming] = useState(false);
  const [autoFilled, setAutoFilled] = useState(false);
  const colorsTouchedRef = useRef(false);
  const visionAttrsRef = useRef<VisionAttrs | null>(null);
  const analyzeReqRef = useRef(0);

  async function pickPhoto(source: "camera" | "library") {
    if (source === "camera") {
      const granted = await ensureCameraPermission();
      if (!granted) return;
    }
    const result = await launchPicker(source);
    if (result.canceled) return;
    const uri = result.assets[0].uri;
    setPhotoUri(uri);
    visionAttrsRef.current = null;
    analyzePhoto(uri);
  }

  // Sequential pipeline: bg removal first (so colors are sampled from
  // foreground pixels only via the Vision mask), then library-based
  // extraction as fallback when bg removal isn't available or finds no
  // subject. Running color extraction on the original photo would otherwise
  // pick up the surface the garment is laid on.
  async function analyzePhoto(originalUri: string) {
    const reqId = ++analyzeReqRef.current;
    setAnalyzing(true);
    setAutoFilled(false);

    let trimResult: BgRemoveResult | null = null;
    if (isBgRemovalAvailable()) {
      setTrimming(true);
      try {
        trimResult = await removeBackground(originalUri);
        if (reqId !== analyzeReqRef.current) return;
        const trimmedUri = trimResult.uri;
        setPhotoUri((current) => {
          if (current === originalUri) return trimmedUri;
          return current;
        });
      } catch {
        // No subject detected — fall through to library extraction.
      } finally {
        if (reqId === analyzeReqRef.current) setTrimming(false);
      }
    }

    try {
      const visionAttrs: VisionAttrs = { colors: [] };

      if (trimResult?.mask) {
        const silhouette = inferSilhouetteFromMask(trimResult.mask);
        if (silhouette) visionAttrs.silhouette = silhouette;
      }

      if (trimResult?.colors && trimResult.colors.length > 0) {
        visionAttrs.colors = attrsFromMaskedColors(trimResult.colors).colors;
      } else {
        const attrs = await analyzeItemFromUri(originalUri);
        if (reqId !== analyzeReqRef.current) return;
        visionAttrs.colors = attrs.colors;
      }

      visionAttrsRef.current = visionAttrs;

      if (!colorsTouchedRef.current && visionAttrs.colors.length > 0) {
        const snapped = snapHexesToPresets(visionAttrs.colors.map((c) => c.hex));
        if (snapped.length > 0) {
          setPicks(snapped);
          setAutoFilled(true);
        }
      }
    } catch {
      // Best-effort. Manual color picking still works.
    } finally {
      if (reqId === analyzeReqRef.current) setAnalyzing(false);
    }
  }

  function toggleSwatch(s: Swatch) {
    colorsTouchedRef.current = true;
    setAutoFilled(false);
    setPicks((prev) => {
      const exists = prev.find((p) => p.hex === s.hex);
      if (exists) return prev.filter((p) => p.hex !== s.hex);
      if (prev.length >= 3) return prev;
      return [...prev, s];
    });
  }

  function save() {
    if (!photoUri) {
      toast.error("Add a photo first");
      return;
    }
    if (!palette) {
      toast.error("Pick at least one color");
      return;
    }
    const colors = [palette.primary, palette.secondary, palette.tertiary].filter(
      (color): color is NonNullable<typeof color> => Boolean(color)
    );
    create.mutate(
      {
        photoUri,
        category,
        name: nameOrNull(name),
        styles: [...styles],
        seasons: [...seasons],
        pattern,
        formality,
        warmth,
        colors,
        visionAttrs: visionAttrsRef.current,
      },
      {
        onSuccess: () => {
          toast.success("Added to closet");
          router.back();
        },
      },
    );
  }

  function toggle<T>(set: Set<T>, value: T, setter: (s: Set<T>) => void) {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    setter(next);
  }

  const renderPhoto = () => (
    <View className="rounded-xl overflow-hidden bg-line dark:bg-line-dark" style={{ aspectRatio: 1 }}>
      <Image source={{ uri: photoUri! }} style={{ flex: 1 }} contentFit="cover" />
      {trimming && (
        <View className="absolute inset-0 items-center justify-center bg-black/30">
          <ActivityIndicator color="#fff" />
          <Text className="text-white mt-2">Removing background…</Text>
        </View>
      )}
    </View>
  );

  const renderEmptyPhoto = () => (
    <View
      className="rounded-xl border-2 border-dashed border-line dark:border-line-dark items-center justify-center"
      style={{ aspectRatio: 1 }}
    >
      <SymbolView name="camera" size={32} tintColor="#a8a29e" />
      <Text variant="caption" className="mt-2">
        Add a photo of the piece
      </Text>
    </View>
  );

  const colorsSubtitle = (): string => {
    if (analyzing) return "Picking colors from the photo…";
    if (autoFilled) return "Auto-picked — tap to adjust";
    return "Tap up to 3 — first pick is the primary";
  };

  const colorsAccessory = (): React.ReactNode => {
    if (analyzing) return <ActivityIndicator size="small" />;
    if (autoFilled) return <SymbolView name="sparkles" size={16} tintColor="#a8a29e" />;
    return null;
  };

  return (
    <Screen edges={["bottom"]}>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 24, paddingBottom: 60 }}>
        {/* Photo */}
        <View>
          {photoUri && renderPhoto()}
          {!photoUri && renderEmptyPhoto()}
          <View className="flex-row gap-2 mt-3">
            <Button
              label="Camera"
              variant="secondary"
              className="flex-1"
              onPress={() => pickPhoto("camera")}
            />
            <Button
              label="Library"
              variant="secondary"
              className="flex-1"
              onPress={() => pickPhoto("library")}
            />
          </View>
        </View>

        {/* Colors */}
        <Section
          title="Colors"
          subtitle={colorsSubtitle()}
          accessory={colorsAccessory()}
        >
          <View className="flex-row flex-wrap gap-3">
            {PRESET_PALETTE.map((s) => {
              const index = picks.findIndex((p) => p.hex === s.hex);
              const selected = index >= 0;
              return (
                <Pressable
                  key={s.hex}
                  onPress={() => toggleSwatch(s)}
                  className="items-center"
                >
                  <View
                    className={`w-12 h-12 rounded-full border-2 ${swatchBorderClass(selected)}`}
                    style={{ backgroundColor: s.hex }}
                  />
                  {selected && (
                    <Text variant="caption" className="mt-1">
                      {ordinalLabel(index)}
                    </Text>
                  )}
                </Pressable>
              );
            })}
          </View>
        </Section>

        {/* Name */}
        <Section title="Name (optional)">
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. Black Levi's 501"
            placeholderTextColor="#a8a29e"
            className="h-12 px-4 rounded-lg border border-line dark:border-line-dark text-ink dark:text-ink-dark"
          />
        </Section>

        {/* Category */}
        <Section title="Category">
          <View className="flex-row flex-wrap gap-2">
            {visibleCategories.map((c) => (
              <Pill
                key={c}
                label={c}
                selected={category === c}
                onPress={() => setCategory(c)}
              />
            ))}
          </View>
        </Section>

        {/* Style */}
        <Section title="Style" subtitle="Pick all that apply">
          <View className="flex-row flex-wrap gap-2">
            {STYLES.map((s) => (
              <Pill
                key={s}
                label={s}
                selected={styles.has(s)}
                onPress={() => toggle(styles, s, setStyles)}
              />
            ))}
          </View>
        </Section>

        {/* Pattern */}
        <Section title="Pattern">
          <View className="flex-row flex-wrap gap-2">
            {PATTERNS.map((p) => (
              <Pill
                key={p}
                label={p}
                selected={pattern === p}
                onPress={() => setPattern(p)}
              />
            ))}
          </View>
        </Section>

        {/* Seasons */}
        <Section title="Seasons" subtitle={seasonsSubtitle(seasonsTouched)}>
          <View className="flex-row flex-wrap gap-2">
            {SEASONS.map((season) => (
              <Pill
                key={season}
                label={season}
                selected={seasons.has(season)}
                onPress={() => {
                  setSeasonsTouched(true);
                  toggle(seasons, season, setSeasons);
                }}
              />
            ))}
          </View>
        </Section>

        {/* Formality */}
        <Section title="Formality" subtitle="1 = loungewear · 5 = black tie">
          <View className="flex-row gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <Pill
                key={n}
                label={String(n)}
                selected={formality === n}
                onPress={() => setFormality(n as Formality)}
              />
            ))}
          </View>
        </Section>

        {/* Warmth */}
        <Section title="Warmth" subtitle="0 = bare · 4 = parka">
          <View className="flex-row gap-2">
            {[0, 1, 2, 3, 4].map((n) => (
              <Pill
                key={n}
                label={String(n)}
                selected={warmth === n}
                onPress={() => setWarmth(n as Warmth)}
              />
            ))}
          </View>
        </Section>

        <Button
          label="Save to closet"
          onPress={save}
          loading={create.isPending}
          size="lg"
        />
      </ScrollView>
    </Screen>
  );
}

const seasonsSubtitle = (touched: boolean): string => {
  if (touched) return "Pick all that apply";
  return "Suggested from warmth — tap to adjust";
};

const renderSubtitleSlot = (subtitle?: string): React.ReactNode => {
  if (subtitle) {
    return (
      <Text variant="caption" className="mb-3">
        {subtitle}
      </Text>
    );
  }
  return <View className="mb-2" />;
};

function Section({
  title,
  subtitle,
  accessory,
  children,
}: {
  title: string;
  subtitle?: string;
  accessory?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <View>
      <View className="flex-row items-center justify-between mb-1">
        <Text variant="label">{title}</Text>
        {accessory}
      </View>
      {renderSubtitleSlot(subtitle)}
      {children}
    </View>
  );
}
