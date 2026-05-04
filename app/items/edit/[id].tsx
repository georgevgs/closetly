import { useEffect, useState } from "react";
import { View, ScrollView, TextInput, ActivityIndicator, Alert } from "react-native";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner-native";

import { Screen } from "~/components/ui/Screen";
import { Text } from "~/components/ui/Text";
import { Button } from "~/components/ui/Button";
import { Pill } from "~/components/ui/Pill";
import { useItem, useUpdateItem, useReplaceItemPhoto } from "~/features/closet/hooks/useItems";
import { signItemUrls } from "~/features/closet/mapper";
import { isBgRemovalAvailable, removeBackground } from "expo-bg-remover";
import { useCategoryPrefs } from "~/providers/CategoryPrefsProvider";
import {
  STYLES,
  SEASONS,
  PATTERNS,
  type Category,
  type Style,
  type Season,
  type Pattern,
  type Formality,
  type Warmth,
} from "~/types/items";

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
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!item || hydrated) return;
    setName(item.name ?? "");
    setCategory(item.category);
    setStyles(new Set(item.styles));
    setSeasons(new Set(item.seasons));
    setPattern(item.pattern);
    setFormality(item.formality);
    setWarmth(item.warmth);
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
    try {
      await replacePhoto.mutateAsync({
        id: item.id,
        photoUri,
        analysisUri: original,
      });
      toast.success("Photo replaced — colors updated");
    } catch (e) {
      const err = e as Error;
      Alert.alert("Could not replace photo", err.message);
    }
  }

  async function save() {
    if (!item) return;
    try {
      await update.mutateAsync({
        id: item.id,
        name: name.trim() || null,
        category,
        styles: [...styles],
        seasons: [...seasons],
        pattern,
        formality,
        warmth,
      });
      toast.success("Saved");
      router.back();
    } catch (e) {
      const err = e as Error;
      Alert.alert("Could not save", err.message);
    }
  }

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

        <Button
          label="Save changes"
          onPress={save}
          loading={update.isPending}
          size="lg"
        />
      </ScrollView>
    </Screen>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <View>
      <Text variant="label" className="mb-1">
        {title}
      </Text>
      {subtitle ? (
        <Text variant="caption" className="mb-3">
          {subtitle}
        </Text>
      ) : (
        <View className="mb-2" />
      )}
      {children}
    </View>
  );
}
