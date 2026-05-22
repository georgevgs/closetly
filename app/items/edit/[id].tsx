import { useEffect, useState } from "react";
import { View, ScrollView, TextInput, ActivityIndicator } from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams, router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner-native";

import { Screen } from "~/components/ui/Screen";
import { Text } from "~/components/ui/Text";
import { Button } from "~/components/ui/Button";
import { Pill } from "~/components/ui/Pill";
import { Disclosure } from "~/components/ui/Disclosure";
import { KeyboardAvoider } from "~/components/ui/KeyboardAvoider";
import { Section } from "~/features/closet/components/Section";
import { ItemFormBar } from "~/features/closet/components/ItemFormBar";
import { ItemAttributesForm } from "~/features/closet/components/ItemAttributesForm";
import { WarmthDefaultsButton } from "~/features/closet/components/WarmthDefaultsButton";
import { useItem, useUpdateItem, useReplaceItemPhoto } from "~/features/closet/hooks/useItems";
import { launchPicker, signFirst, type PickerSource } from "~/features/closet/itemPicker";
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

export default function EditItemScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: item, isLoading } = useItem(id);
  const update = useUpdateItem();
  const replacePhoto = useReplaceItemPhoto();
  const { visible: visibleCategories } = useCategoryPrefs();

  const { data: signed } = useQuery({
    queryKey: ["item-signed", item?.id],
    enabled: !!item,
    queryFn: async () => signFirst(item),
  });
  const photoUrl = pickPhotoUrl(signed, item);

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

  async function pickReplacement(source: PickerSource) {
    if (!item) return;
    if (source === "camera") {
      const granted = await ensureCameraPermission();
      if (!granted) return;
    }
    const result = await launchPicker(source);
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

  const categoryOptions = categoryOptionsFor(category, visibleCategories);

  return (
    <Screen edges={["bottom"]}>
      <KeyboardAvoider className="flex-1">
      <ScrollView
        contentContainerStyle={{ padding: 20, gap: 24, paddingBottom: 60 }}
        keyboardShouldPersistTaps="handled"
      >
        <View>
          <View
            className="rounded-xl overflow-hidden bg-line dark:bg-line-dark"
            style={{ aspectRatio: 1 }}
          >
            {photoUrl && (
              <Image source={{ uri: photoUrl }} style={{ flex: 1 }} contentFit="cover" />
            )}
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
            {categoryOptions.map((categoryOption) => (
              <Pill
                key={categoryOption}
                label={categoryOption}
                selected={category === categoryOption}
                onPress={() => setCategory(categoryOption)}
              />
            ))}
          </View>
        </Section>

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
            onChangeSeasons={setSeasons}
            seasonsConfig={{
              accessory: (
                <WarmthDefaultsButton
                  warmth={warmth}
                  onApply={() => setSeasons(new Set(seasonsForWarmth(warmth)))}
                />
              ),
            }}
            formality={formality}
            onChangeFormality={setFormality}
            warmth={warmth}
            onChangeWarmth={setWarmth}
            occasions={occasions}
            onChangeOccasions={setOccasions}
            fit={{ value: fit, onTap: handleFitTap }}
            priceText={priceText}
            onChangePriceText={setPriceText}
            currencyText={currencyText}
            onChangeCurrencyText={setCurrencyText}
            purchasedOnText={purchasedOnText}
            onChangePurchasedOnText={setPurchasedOnText}
          />
        </Disclosure>

      </ScrollView>
      <ItemFormBar
        label="Save changes"
        onSave={save}
        saving={update.isPending}
        hint={null}
      />
      </KeyboardAvoider>
    </Screen>
  );
}

const pickPhotoUrl = (
  signed: { photo_url: string } | null | undefined,
  fallback: { photo_url: string } | null | undefined,
): string | undefined => {
  if (signed?.photo_url) return signed.photo_url;
  if (fallback?.photo_url) return fallback.photo_url;
  return undefined;
};

const categoryOptionsFor = (
  current: Category,
  visible: readonly Category[],
): Category[] => {
  if (visible.includes(current)) return [...visible];
  return [current, ...visible];
};

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

