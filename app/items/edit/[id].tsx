import { useEffect, useState } from "react";
import { View, ScrollView, TextInput, ActivityIndicator, Pressable } from "react-native";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner-native";

import { Screen } from "~/components/ui/Screen";
import { Text } from "~/components/ui/Text";
import { Button } from "~/components/ui/Button";
import { Pill } from "~/components/ui/Pill";
import { Section } from "~/features/closet/components/Section";
import { ItemFormBar } from "~/features/closet/components/ItemFormBar";
import { useItem, useUpdateItem, useReplaceItemPhoto } from "~/features/closet/hooks/useItems";
import { signItemUrls } from "~/features/closet/mapper";
import { seasonsForWarmth } from "~/lib/seasons";
import { ensureCameraPermission } from "~/lib/permissions";
import { isBgRemovalAvailable, removeBackground } from "expo-bg-remover";
import { useCategoryPrefs } from "~/providers/CategoryPrefsProvider";
import {
  trimmedNameOrNull,
  parsePriceInput,
  normaliseCurrencyInput,
  parsePurchasedOnInput,
} from "~/features/closet/itemFormParsers";
import {
  STYLES,
  SEASONS,
  PATTERNS,
  OCCASIONS,
  type Category,
  type Style,
  type Season,
  type Pattern,
  type Formality,
  type Warmth,
  type Silhouette,
  type Occasion,
} from "~/types/items";

type Fit = Silhouette["fit"];
const FITS: Fit[] = ["slim", "regular", "relaxed", "oversized"];

export default function EditItemScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: item, isLoading } = useItem(id);
  const update = useUpdateItem();
  const replacePhoto = useReplaceItemPhoto();
  const { visible: visibleCategories } = useCategoryPrefs();

  const { data: signed } = useQuery({
    queryKey: ["item-signed", item?.id],
    enabled: !!item,
    queryFn: async () => (item ? (await signItemUrls([item]))[0] : null),
  });
  const photoUrl = signed?.photo_url ?? item?.photo_url;

  const [name, setName] = useState("");
  const [category, setCategory] = useState<Category>("top");
  const [styles, setStyles] = useState<Set<Style>>(new Set());
  const [seasons, setSeasons] = useState<Set<Season>>(new Set());
  const [pattern, setPattern] = useState<Pattern>("solid");
  const [formality, setFormality] = useState<Formality>(3);
  const [warmth, setWarmth] = useState<Warmth>(2);
  const [fit, setFit] = useState<Fit | null>(null);
  const [occasions, setOccasions] = useState<Set<Occasion>>(new Set());
  const [priceText, setPriceText] = useState("");
  const [currencyText, setCurrencyText] = useState("");
  const [purchasedOnText, setPurchasedOnText] = useState("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!item || hydrated) return;
    setName(initialName(item.name));
    setCategory(item.category);
    setStyles(new Set(item.styles));
    setSeasons(new Set(item.seasons));
    setPattern(item.pattern);
    setFormality(item.formality);
    setWarmth(item.warmth);
    setFit(initialFit(item.silhouette));
    setOccasions(new Set(item.occasions));
    setPriceText(initialPriceText(item.price));
    setCurrencyText(initialCurrencyText(item.currency));
    setPurchasedOnText(initialPurchasedOnText(item.purchasedOn));
    setHydrated(true);
  }, [item, hydrated]);

  if (isLoading || !item) {
    return (
      <Screen className="items-center justify-center">
        <ActivityIndicator />
      </Screen>
    );
  }

  function toggle<T>(set: Set<T>, value: T, setter: (s: Set<T>) => void) {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    setter(next);
  }

  async function pickReplacement(source: "camera" | "library") {
    if (!item) return;
    if (source === "camera") {
      const granted = await ensureCameraPermission();
      if (!granted) return;
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
    const original = result.assets[0].uri;
    let photoUri = original;
    if (isBgRemovalAvailable()) {
      try {
        const trimmed = await removeBackground(original);
        photoUri = trimmed.uri;
      } catch {
        // No subject detected — fall back to original.
      }
    }
    replacePhoto.mutate(
      {
        id: item.id,
        photoUri,
        analysisUri: original,
      },
      {
        onSuccess: () => toast.success("Photo replaced — colors updated"),
      },
    );
  }

  function save() {
    if (!item) return;
    update.mutate(
      {
        id: item.id,
        name: trimmedNameOrNull(name),
        category,
        styles: [...styles],
        seasons: [...seasons],
        pattern,
        formality,
        warmth,
        occasions: [...occasions],
        price: parsePriceInput(priceText),
        currency: normaliseCurrencyInput(currencyText),
        purchasedOn: parsePurchasedOnInput(purchasedOnText),
        silhouette: silhouetteFromFit(fit, item.silhouette),
      },
      {
        onSuccess: () => {
          toast.success("Saved");
          router.back();
        },
      },
    );
  }

  const handleFitTap = (option: Fit) => {
    if (fit === option) {
      setFit(null);
      return;
    }
    setFit(option);
  };

  const categoryOptions = visibleCategories.includes(category)
    ? visibleCategories
    : [category, ...visibleCategories];

  return (
    <Screen edges={["bottom"]}>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 24, paddingBottom: 60 }}>
        <View>
          <View
            className="rounded-xl overflow-hidden bg-line dark:bg-line-dark"
            style={{ aspectRatio: 1 }}
          >
            {photoUrl ? (
              <Image source={{ uri: photoUrl }} style={{ flex: 1 }} contentFit="cover" />
            ) : null}
            {replacePhoto.isPending && (
              <View className="absolute inset-0 items-center justify-center bg-black/30">
                <ActivityIndicator color="#fff" />
                <Text className="text-white mt-2">Updating photo…</Text>
              </View>
            )}
          </View>
          <View className="flex-row gap-2 mt-3">
            <Button
              label="Camera"
              variant="secondary"
              className="flex-1"
              onPress={() => pickReplacement("camera")}
              disabled={replacePhoto.isPending}
            />
            <Button
              label="Library"
              variant="secondary"
              className="flex-1"
              onPress={() => pickReplacement("library")}
              disabled={replacePhoto.isPending}
            />
          </View>
          <Text variant="caption" className="mt-2">
            Replacing the photo also re-detects colors.
          </Text>
        </View>

        <Section title="Name (optional)">
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. Black Levi's 501"
            placeholderTextColor="#a8a29e"
            className="h-12 px-4 rounded-lg border border-line dark:border-line-dark text-ink dark:text-ink-dark"
          />
        </Section>

        <Section title="Category">
          <View className="flex-row flex-wrap gap-2">
            {categoryOptions.map((c) => (
              <Pill
                key={c}
                label={c}
                selected={category === c}
                onPress={() => setCategory(c)}
              />
            ))}
          </View>
        </Section>

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
          <Pressable
            onPress={() => setSeasons(new Set(seasonsForWarmth(warmth)))}
            hitSlop={8}
            className="mt-2 self-start"
          >
            <Text variant="caption" className="underline">
              Use warmth defaults ({warmthLabel(warmth)})
            </Text>
          </Pressable>
        </Section>

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

        <Section title="Fit" subtitle="How does it sit on the body? Tap again to clear.">
          <View className="flex-row flex-wrap gap-2">
            {FITS.map((option) => (
              <Pill
                key={option}
                label={option}
                selected={fit === option}
                onPress={() => handleFitTap(option)}
              />
            ))}
          </View>
        </Section>

        <Section title="Occasions" subtitle="Optional — when you'd reach for this piece">
          <View className="flex-row flex-wrap gap-2">
            {OCCASIONS.map((occasion) => (
              <Pill
                key={occasion}
                label={occasion}
                selected={occasions.has(occasion)}
                onPress={() => toggle(occasions, occasion, setOccasions)}
              />
            ))}
          </View>
        </Section>

        <Section title="Price" subtitle="Optional — used for cost-per-wear">
          <View className="flex-row gap-2">
            <TextInput
              value={priceText}
              onChangeText={setPriceText}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor="#a8a29e"
              className="flex-1 h-12 px-4 rounded-lg border border-line dark:border-line-dark text-ink dark:text-ink-dark"
            />
            <TextInput
              value={currencyText}
              onChangeText={setCurrencyText}
              autoCapitalize="characters"
              maxLength={3}
              placeholder="USD"
              placeholderTextColor="#a8a29e"
              className="w-24 h-12 px-4 rounded-lg border border-line dark:border-line-dark text-ink dark:text-ink-dark"
            />
          </View>
        </Section>

        <Section title="Purchased on" subtitle="Optional — YYYY-MM-DD">
          <TextInput
            value={purchasedOnText}
            onChangeText={setPurchasedOnText}
            placeholder="2026-05-10"
            placeholderTextColor="#a8a29e"
            keyboardType="numbers-and-punctuation"
            className="h-12 px-4 rounded-lg border border-line dark:border-line-dark text-ink dark:text-ink-dark"
          />
        </Section>

      </ScrollView>
      <ItemFormBar
        label="Save changes"
        onSave={save}
        saving={update.isPending}
        hint={null}
      />
    </Screen>
  );
}

const initialFit = (silhouette: Silhouette | null): Fit | null => {
  if (!silhouette) return null;
  return silhouette.fit;
};

const initialName = (name: string | null): string => {
  if (name === null) return "";
  return name;
};

const initialPriceText = (price: number | null): string => {
  if (price === null) return "";
  return String(price);
};

const initialCurrencyText = (currency: string | null): string => {
  if (currency === null) return "";
  return currency;
};

const initialPurchasedOnText = (purchasedOn: string | null): string => {
  if (purchasedOn === null) return "";
  return purchasedOn;
};

// Preserve any non-fit silhouette fields (length, rise) the vision pass set.
const silhouetteFromFit = (
  fit: Fit | null,
  current: Silhouette | null,
): Silhouette | null => {
  if (fit === null) return null;
  if (!current) return { fit };
  return { ...current, fit };
};

const warmthLabel = (warmth: Warmth): string => {
  if (warmth === 0) return "bare";
  if (warmth === 1) return "light";
  if (warmth === 2) return "regular";
  if (warmth === 3) return "warm";
  return "parka";
};
