import { View, ScrollView, Pressable, ActivityIndicator, Alert } from "react-native";
import { Image } from "expo-image";
import { Stack, useLocalSearchParams, router } from "expo-router";
import { SymbolView } from "expo-symbols";
import * as Haptics from "expo-haptics";
import { useColorScheme } from "nativewind";
import { toast } from "sonner-native";

import { Screen } from "~/components/ui/Screen";
import { Text } from "~/components/ui/Text";
import { Button } from "~/components/ui/Button";
import { Pill } from "~/components/ui/Pill";
import { GlassSurface } from "~/components/ui/GlassSurface";
import { useItem, useDeleteItem } from "~/features/closet/hooks/useItems";
import { useMarkWashed } from "~/features/closet/hooks/useMarkWashed";
import { signItemUrls } from "~/features/closet/mapper";
import { useQuery } from "@tanstack/react-query";
import type { Item } from "~/types/items";

export default function ItemDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: item, isLoading } = useItem(id);
  const del = useDeleteItem();
  const markWashed = useMarkWashed();
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
            {display.styles.map((style) => (
              <Pill key={style} label={style} />
            ))}
            {display.seasons.map((season) => (
              <Pill key={season} label={season} />
            ))}
            {display.occasions.map((occasion) => (
              <Pill key={occasion} label={occasion} />
            ))}
            <Pill label={`formality ${display.formality}`} />
            <Pill label={`warmth ${display.warmth}`} />
            {display.pattern !== "solid" && <Pill label={display.pattern} />}
          </View>
        </View>

        <PriceSection item={display} />
        <CareSection
          item={display}
          marking={markWashed.isPending}
          onMarkWashed={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            markWashed.mutate(display.id, {
              onSuccess: () => toast.success("Wash logged"),
            });
          }}
        />

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

function PriceSection({ item }: { item: Item }) {
  if (item.price === null && item.purchasedOn === null) return null;
  return (
    <View>
      <Text variant="label" className="mb-2">
        Purchase
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {item.price !== null && <Pill label={formatPrice(item.price, item.currency)} />}
        {item.purchasedOn !== null && <Pill label={`bought ${item.purchasedOn}`} />}
      </View>
    </View>
  );
}

function CareSection({
  item,
  marking,
  onMarkWashed,
}: {
  item: Item;
  marking: boolean;
  onMarkWashed: () => void;
}) {
  return (
    <View>
      <Text variant="label" className="mb-2">
        Care
      </Text>
      <View className="flex-row items-center justify-between">
        <Text variant="body">{washCountLabel(item.timesWashed)}</Text>
        <Button
          label={markWashedLabel(marking)}
          variant="secondary"
          onPress={onMarkWashed}
          disabled={marking}
        />
      </View>
    </View>
  );
}

const formatPrice = (price: number, currency: string | null): string => {
  const fixed = price.toFixed(2);
  if (currency === null) return fixed;
  return `${fixed} ${currency}`;
};

const washCountLabel = (count: number): string => {
  if (count === 0) return "Not yet washed";
  if (count === 1) return "Washed once";
  return `Washed ${count} times`;
};

const markWashedLabel = (marking: boolean): string => {
  if (marking) return "Logging…";
  return "Mark washed";
};
