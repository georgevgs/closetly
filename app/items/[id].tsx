import { View, ScrollView, Pressable, ActivityIndicator, Alert } from "react-native";
import { Image } from "expo-image";
import { Stack, useLocalSearchParams, router } from "expo-router";
import { SymbolView } from "expo-symbols";
import * as Haptics from "expo-haptics";
import { useColorScheme } from "nativewind";

import { Screen } from "~/components/ui/Screen";
import { Text } from "~/components/ui/Text";
import { Button } from "~/components/ui/Button";
import { Pill } from "~/components/ui/Pill";
import { GlassSurface } from "~/components/ui/GlassSurface";
import { useItem, useDeleteItem } from "~/features/closet/hooks/useItems";
import { signItemUrls } from "~/features/closet/mapper";
import { useQuery } from "@tanstack/react-query";

export default function ItemDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: item, isLoading } = useItem(id);
  const del = useDeleteItem();
  const { colorScheme } = useColorScheme();
  const fg = colorScheme === "dark" ? "#f5f3ef" : "#1a1a1a";

  const { data: signed } = useQuery({
    queryKey: ["item-signed", item?.id],
    enabled: !!item,
    queryFn: async () => (item ? (await signItemUrls([item]))[0] : null),
  });

  const display = signed ?? item;

  if (isLoading) {
    return (
      <Screen className="items-center justify-center">
        <ActivityIndicator />
      </Screen>
    );
  }
  if (!display) {
    return (
      <Screen className="items-center justify-center">
        <Text variant="headline">Not found</Text>
      </Screen>
    );
  }

  return (
    <Screen edges={["bottom"]}>
      <Stack.Screen
        options={{
          title: display.name ?? "Item",
          headerRight: () => (
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push(`/items/edit/${display.id}`);
              }}
              hitSlop={12}
              accessibilityLabel="Edit item"
              accessibilityRole="button"
            >
              <GlassSurface
                isInteractive
                style={{
                  height: 36,
                  width: 36,
                  borderRadius: 18,
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                }}
                fallbackClassName="bg-canvas/70 dark:bg-canvas-dark/70 border border-line/60 dark:border-line-dark/60"
              >
                <SymbolView
                  name="square.and.pencil"
                  size={17}
                  tintColor={fg}
                  weight="semibold"
                />
              </GlassSurface>
            </Pressable>
          ),
        }}
      />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 20 }}>
        <View className="rounded-xl overflow-hidden" style={{ aspectRatio: 1 }}>
          <Image source={{ uri: display.photo_url }} style={{ flex: 1 }} contentFit="cover" />
        </View>

        <View>
          <Text variant="caption" className="uppercase tracking-widest">
            {display.category}
          </Text>
          <Text variant="title" className="mt-0.5">
            {display.name ?? "Unnamed"}
          </Text>
        </View>

        <View>
          <Text variant="label" className="mb-2">
            Colors
          </Text>
          <View className="flex-row gap-3">
            {display.colors.map((c, i) => (
              <View key={i} className="items-center">
                <View
                  className="w-10 h-10 rounded-full border border-line"
                  style={{ backgroundColor: c.hex }}
                />
                <Text variant="caption">{c.hex}</Text>
              </View>
            ))}
          </View>
        </View>

        <View>
          <Text variant="label" className="mb-2">
            Tags
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {display.styles.map((s) => (
              <Pill key={s} label={s} />
            ))}
            {display.seasons.map((s) => (
              <Pill key={s} label={s} />
            ))}
            <Pill label={`formality ${display.formality}`} />
            <Pill label={`warmth ${display.warmth}`} />
            {display.pattern !== "solid" && <Pill label={display.pattern} />}
          </View>
        </View>

        <Button
          label="Find outfits with this"
          onPress={() =>
            router.push({ pathname: "/outfits/suggest", params: { anchorId: display.id } })
          }
        />

        <Pressable
          onPress={() =>
            Alert.alert("Remove item", "This will hide it from your closet.", [
              { text: "Cancel", style: "cancel" },
              {
                text: "Remove",
                style: "destructive",
                onPress: () =>
                  del.mutate(display.id, { onSuccess: () => router.back() }),
              },
            ])
          }
          className="items-center py-3"
        >
          <Text className="text-red-600">Remove</Text>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}
