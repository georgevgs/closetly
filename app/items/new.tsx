import { useEffect, useRef, useState } from "react";
import {
  View,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { SymbolView } from "expo-symbols";
import { toast } from "sonner-native";

import { ensureCameraPermission } from "~/lib/permissions";

import { Screen } from "~/components/ui/Screen";
import { Text } from "~/components/ui/Text";
import { Button } from "~/components/ui/Button";
import { Pill } from "~/components/ui/Pill";
import { Disclosure } from "~/components/ui/Disclosure";
import { KeyboardAvoider } from "~/components/ui/KeyboardAvoider";
import { Section } from "~/features/closet/components/Section";
import { ItemFormBar } from "~/features/closet/components/ItemFormBar";
import { ItemAttributesForm } from "~/features/closet/components/ItemAttributesForm";
import { ItemPhotoPreview } from "~/features/closet/components/ItemPhotoPreview";
import { launchPicker, type PickerSource } from "~/features/closet/itemPicker";
import {
  defaultFormalityFor,
  defaultWarmthFor,
  DEFAULT_PATTERN,
} from "~/features/closet/itemDefaults";
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
import {
  trimmedNameOrNull,
  parsePriceInput,
  normaliseCurrencyInput,
  parsePurchasedOnInput,
} from "~/features/closet/itemFormParsers";
import { useCategoryPrefs } from "~/providers/CategoryPrefsProvider";
import {
  CATEGORIES,
  type Category,
  type Style,
  type Season,
  type Pattern,
  type Formality,
  type Warmth,
  type Occasion,
  type VisionAttrs,
} from "~/types/items";

const pickInitialCategory = (visible: readonly Category[]): Category => {
  if (visible.length > 0) return visible[0];
  return CATEGORIES[0];
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


export default function NewItemScreen() {
  const create = useCreateItem();
  const { visible: visibleCategories } = useCategoryPrefs();
  const initialCategory = pickInitialCategory(visibleCategories);
  const initialWarmth = defaultWarmthFor(initialCategory);
  const initialFormality = defaultFormalityFor(initialCategory);

  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [picks, setPicks] = useState<Swatch[]>([]);
  const palette = buildPalette(picks);

  const [name, setName] = useState("");
  const [category, setCategory] = useState<Category>(initialCategory);
  const [styles, setStyles] = useState<Set<Style>>(new Set(["minimal"]));
  const [seasons, setSeasons] = useState<Set<Season>>(
    new Set(seasonsForWarmth(initialWarmth)),
  );
  const [seasonsTouched, setSeasonsTouched] = useState(false);
  const [pattern, setPattern] = useState<Pattern>(DEFAULT_PATTERN);
  const [formality, setFormality] = useState<Formality>(initialFormality);
  const [formalityTouched, setFormalityTouched] = useState(false);
  const [warmth, setWarmth] = useState<Warmth>(initialWarmth);
  const [warmthTouched, setWarmthTouched] = useState(false);
  const [occasions, setOccasions] = useState<Set<Occasion>>(new Set());
  const [priceText, setPriceText] = useState("");
  const [currencyText, setCurrencyText] = useState("");
  const [purchasedOnText, setPurchasedOnText] = useState("");

  useEffect(() => {
    if (seasonsTouched) return;
    setSeasons(new Set(seasonsForWarmth(warmth)));
  }, [warmth, seasonsTouched]);

  // Switching category re-seats the smart defaults for any field the user
  // hasn't explicitly touched. So a user adding a dress sees formality 4 and
  // warmth 2 without ever opening the More details panel.
  useEffect(() => {
    if (!warmthTouched) setWarmth(defaultWarmthFor(category));
    if (!formalityTouched) setFormality(defaultFormalityFor(category));
  }, [category, warmthTouched, formalityTouched]);

  const [analyzing, setAnalyzing] = useState(false);
  const [trimming, setTrimming] = useState(false);
  const [autoFilled, setAutoFilled] = useState(false);
  const [keepAdding, setKeepAdding] = useState(false);
  const colorsTouchedRef = useRef(false);
  const visionAttrsRef = useRef<VisionAttrs | null>(null);
  const analyzeReqRef = useRef(0);

  // Bulk-add support: reset the photo + colors + name to empty but keep the
  // structural choices (category, style, formality, occasions) so a user
  // photographing all their tops doesn't have to re-pick "top, minimal,
  // formality 3" every time.
  const resetForNextItem = () => {
    setPhotoUri(null);
    setPicks([]);
    setName("");
    setAutoFilled(false);
    colorsTouchedRef.current = false;
    visionAttrsRef.current = null;
    analyzeReqRef.current += 1;
  };

  async function pickPhoto(source: PickerSource) {
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
        const snapped = snapHexesToPresets(
          visionAttrs.colors.map((color) => color.hex),
        );
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

  function toggleSwatch(swatch: Swatch) {
    colorsTouchedRef.current = true;
    setAutoFilled(false);
    setPicks((previous) => {
      const exists = previous.find((pick) => pick.hex === swatch.hex);
      if (exists) return previous.filter((pick) => pick.hex !== swatch.hex);
      if (previous.length >= 3) return previous;
      return [...previous, swatch];
    });
  }

  const blockedReason = blockedReasonFor({ photoUri, palette });

  function save() {
    if (!photoUri || !palette) return;
    const colors = [palette.primary, palette.secondary, palette.tertiary].filter(
      (color): color is NonNullable<typeof color> => Boolean(color)
    );
    create.mutate(
      {
        photoUri,
        category,
        name: trimmedNameOrNull(name),
        styles: [...styles],
        seasons: [...seasons],
        pattern,
        formality,
        warmth,
        occasions: [...occasions],
        price: parsePriceInput(priceText),
        currency: normaliseCurrencyInput(currencyText),
        purchased_on: parsePurchasedOnInput(purchasedOnText),
        colors,
        visionAttrs: visionAttrsRef.current,
      },
      {
        onSuccess: () => {
          if (keepAdding) {
            toast.success("Added — ready for the next one");
            resetForNextItem();
            return;
          }
          toast.success("Added to closet");
          router.back();
        },
      },
    );
  }

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
      <KeyboardAvoider className="flex-1">
      <ScrollView
        contentContainerStyle={{ padding: 20, gap: 24, paddingBottom: 60 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Photo */}
        <View>
          <ItemPhotoPreview photoUri={photoUri} trimming={trimming} />
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
            {PRESET_PALETTE.map((swatch) => {
              const pickIndex = picks.findIndex((pick) => pick.hex === swatch.hex);
              const selected = pickIndex >= 0;
              return (
                <Pressable
                  key={swatch.hex}
                  onPress={() => toggleSwatch(swatch)}
                  className="items-center"
                >
                  <View
                    className={`w-12 h-12 rounded-full border-2 ${swatchBorderClass(selected)}`}
                    style={{ backgroundColor: swatch.hex }}
                  />
                  {selected && (
                    <Text variant="caption" className="mt-1">
                      {ordinalLabel(pickIndex)}
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
            {visibleCategories.map((categoryOption) => (
              <Pill
                key={categoryOption}
                label={categoryOption}
                selected={category === categoryOption}
                onPress={() => setCategory(categoryOption)}
              />
            ))}
          </View>
        </Section>

        {/* Everything below this point is optional. Defaults are inferred
            from the category — formality, warmth, seasons, pattern — so the
            user can tap Save without opening the panel. */}
        <Disclosure
          title="More details"
          subtitle="Style, fit, seasons, occasions, price"
        >
          <ItemAttributesForm
            styles={styles}
            onChangeStyles={setStyles}
            pattern={pattern}
            onChangePattern={setPattern}
            seasons={seasons}
            onChangeSeasons={(next) => {
              setSeasonsTouched(true);
              setSeasons(next);
            }}
            seasonsConfig={{ subtitle: seasonsSubtitle(seasonsTouched) }}
            formality={formality}
            onChangeFormality={(next) => {
              setFormalityTouched(true);
              setFormality(next);
            }}
            warmth={warmth}
            onChangeWarmth={(next) => {
              setWarmthTouched(true);
              setWarmth(next);
            }}
            occasions={occasions}
            onChangeOccasions={setOccasions}
            priceText={priceText}
            onChangePriceText={setPriceText}
            currencyText={currencyText}
            onChangeCurrencyText={setCurrencyText}
            purchasedOnText={purchasedOnText}
            onChangePurchasedOnText={setPurchasedOnText}
          />
        </Disclosure>

        <KeepAddingToggle
          enabled={keepAdding}
          onChange={setKeepAdding}
        />

      </ScrollView>
      <ItemFormBar
        label={saveButtonLabel(keepAdding)}
        onSave={save}
        saving={create.isPending}
        hint={blockedReason}
      />
      </KeyboardAvoider>
    </Screen>
  );
}

const saveButtonLabel = (keepAdding: boolean): string => {
  if (keepAdding) return "Save and add another";
  return "Save to closet";
};

function KeepAddingToggle({
  enabled,
  onChange,
}: {
  enabled: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <Pressable
      onPress={() => onChange(!enabled)}
      hitSlop={8}
      className="flex-row items-center gap-3 mt-2"
    >
      <View
        className={toggleBoxClass(enabled)}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: enabled }}
      >
        {enabled && (
          <SymbolView name="checkmark" size={14} tintColor="#ffffff" />
        )}
      </View>
      <View className="flex-1">
        <Text variant="body">Keep adding items</Text>
        <Text variant="caption" className="mt-0.5">
          Saves and clears the photo so you can shoot the next piece.
        </Text>
      </View>
    </Pressable>
  );
}

const toggleBoxClass = (enabled: boolean): string => {
  const base = "w-6 h-6 rounded-md items-center justify-center border";
  if (enabled) return `${base} bg-ink dark:bg-ink-dark border-ink dark:border-ink-dark`;
  return `${base} border-line dark:border-line-dark`;
};

const blockedReasonFor = ({
  photoUri,
  palette,
}: {
  photoUri: string | null;
  palette: ReturnType<typeof buildPalette>;
}): string | null => {
  if (!photoUri) return "Add a photo first";
  if (!palette) return "Pick at least one color";
  return null;
};

const seasonsSubtitle = (touched: boolean): string => {
  if (touched) return "Pick all that apply";
  return "Suggested from warmth — tap to adjust";
};
