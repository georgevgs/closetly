import { useRef, useState } from "react";
import {
  View,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { router } from "expo-router";
import { SymbolView } from "expo-symbols";
import { toast } from "sonner-native";

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
import { analyzeItemFromUri } from "~/features/closet/vision";
import { isBgRemovalAvailable, removeBackground } from "expo-bg-remover";
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

export default function NewItemScreen() {
  const create = useCreateItem();
  const { visible: visibleCategories } = useCategoryPrefs();
  const initialCategory: Category = visibleCategories[0] ?? CATEGORIES[0];

  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [picks, setPicks] = useState<Swatch[]>([]);
  const palette = buildPalette(picks);

  const [name, setName] = useState("");
  const [category, setCategory] = useState<Category>(initialCategory);
  const [styles, setStyles] = useState<Set<Style>>(new Set(["minimal"]));
  const [seasons, setSeasons] = useState<Set<Season>>(new Set(SEASONS));
  const [pattern, setPattern] = useState<Pattern>("solid");
  const [formality, setFormality] = useState<Formality>(3);
  const [warmth, setWarmth] = useState<Warmth>(2);

  const [analyzing, setAnalyzing] = useState(false);
  const [trimming, setTrimming] = useState(false);
  const [autoFilled, setAutoFilled] = useState(false);
  const colorsTouchedRef = useRef(false);
  const visionAttrsRef = useRef<VisionAttrs | null>(null);
  const visionReqRef = useRef(0);
  const trimReqRef = useRef(0);

  async function pickPhoto(source: "camera" | "library") {
    if (source === "camera") {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("Camera permission needed");
        return;
      }
    }
    const result =
      source === "camera"
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ["images"],
            quality: 0.9,
            allowsEditing: true,
            aspect: [1, 1],
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            quality: 0.9,
            allowsEditing: true,
            aspect: [1, 1],
          });
    if (result.canceled) return;
    const uri = result.assets[0].uri;
    setPhotoUri(uri);
    runVision(uri);
    runTrim(uri);
  }

  async function runTrim(originalUri: string) {
    if (!isBgRemovalAvailable()) return;
    const reqId = ++trimReqRef.current;
    setTrimming(true);
    try {
      const trimmed = await removeBackground(originalUri);
      if (reqId !== trimReqRef.current) return;
      setPhotoUri((current) => (current === originalUri ? trimmed.uri : current));
    } catch {
      // No subject detected or Vision failed — keep original.
    } finally {
      if (reqId === trimReqRef.current) setTrimming(false);
    }
  }

  async function runVision(uri: string) {
    const reqId = ++visionReqRef.current;
    setAnalyzing(true);
    setAutoFilled(false);
    try {
      const attrs = await analyzeItemFromUri(uri);
      if (reqId !== visionReqRef.current) return;
      visionAttrsRef.current = attrs;
      if (!colorsTouchedRef.current) {
        const snapped = snapHexesToPresets(attrs.colors.map((c) => c.hex));
        if (snapped.length > 0) {
          setPicks(snapped);
          setAutoFilled(true);
        }
      }
    } catch {
      // Best-effort. Manual color picking still works.
    } finally {
      if (reqId === visionReqRef.current) setAnalyzing(false);
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

  async function save() {
    if (!photoUri) {
      toast.error("Add a photo first");
      return;
    }
    if (!palette) {
      toast.error("Pick at least one color");
      return;
    }
    const colors = [palette.primary, palette.secondary, palette.tertiary].filter(
      (c): c is NonNullable<typeof c> => Boolean(c)
    );
    try {
      await create.mutateAsync({
        photoUri,
        category,
        name: name.trim() || null,
        styles: [...styles],
        seasons: [...seasons],
        pattern,
        formality,
        warmth,
        colors,
        visionAttrs: visionAttrsRef.current,
      });
      toast.success("Added to closet");
      router.back();
    } catch (e) {
      const err = e as Error;
      Alert.alert("Could not save", err.message);
    }
  }

  function toggle<T>(set: Set<T>, value: T, setter: (s: Set<T>) => void) {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    setter(next);
  }

  return (
    <Screen edges={["bottom"]}>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 24, paddingBottom: 60 }}>
        {/* Photo */}
        <View>
          {photoUri ? (
            <View className="rounded-xl overflow-hidden bg-line dark:bg-line-dark" style={{ aspectRatio: 1 }}>
              <Image source={{ uri: photoUri }} style={{ flex: 1 }} contentFit="cover" />
              {trimming && (
                <View className="absolute inset-0 items-center justify-center bg-black/30">
                  <ActivityIndicator color="#fff" />
                  <Text className="text-white mt-2">Removing background…</Text>
                </View>
              )}
            </View>
          ) : (
            <View
              className="rounded-xl border-2 border-dashed border-line dark:border-line-dark items-center justify-center"
              style={{ aspectRatio: 1 }}
            >
              <SymbolView name="camera" size={32} tintColor="#a8a29e" />
              <Text variant="caption" className="mt-2">
                Add a photo of the piece
              </Text>
            </View>
          )}
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
          subtitle={
            analyzing
              ? "Picking colors from the photo…"
              : autoFilled
                ? "Auto-picked — tap to adjust"
                : "Tap up to 3 — first pick is the primary"
          }
          accessory={
            analyzing ? (
              <ActivityIndicator size="small" />
            ) : autoFilled ? (
              <SymbolView name="sparkles" size={16} tintColor="#a8a29e" />
            ) : null
          }
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
                    className={
                      "w-12 h-12 rounded-full border-2 " +
                      (selected
                        ? "border-ink dark:border-ink-dark"
                        : "border-line dark:border-line-dark")
                    }
                    style={{ backgroundColor: s.hex }}
                  />
                  {selected && (
                    <Text variant="caption" className="mt-1">
                      {index === 0 ? "1st" : index === 1 ? "2nd" : "3rd"}
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
        <Section title="Seasons">
          <View className="flex-row flex-wrap gap-2">
            {SEASONS.map((s) => (
              <Pill
                key={s}
                label={s}
                selected={seasons.has(s)}
                onPress={() => toggle(seasons, s, setSeasons)}
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
      {subtitle && (
        <Text variant="caption" className="mb-3">
          {subtitle}
        </Text>
      )}
      {!subtitle && <View className="mb-2" />}
      {children}
    </View>
  );
}
