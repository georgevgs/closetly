import { View, ScrollView, Pressable, Alert } from "react-native";
import { Image } from "expo-image";
import { Stack, useLocalSearchParams, router } from "expo-router";
import { SymbolView } from "expo-symbols";
import * as Haptics from "expo-haptics";
import { useColorScheme } from "nativewind";
import { toast } from "sonner-native";

import { Screen } from "~/components/ui/Screen";
import { Text } from "~/components/ui/Text";
import { Button } from "~/components/ui/Button";
import { Tag } from "~/components/ui/Tag";
import { GlassSurface } from "~/components/ui/GlassSurface";
import { useItem, useDeleteItem } from "~/features/closet/hooks/useItems";
import { ItemDetailSkeleton } from "~/features/closet/components/ItemDetailSkeleton";
import { useMarkWashed } from "~/features/closet/hooks/useMarkWashed";
import { useToggleInWash } from "~/features/closet/hooks/useToggleInWash";
import { signFirst } from "~/features/closet/itemPicker";
import { useQuery } from "@tanstack/react-query";
import { foregroundFor } from "~/lib/utils";
import type { Item } from "~/types/items";

export default function ItemDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: item, isLoading } = useItem(id);
  const del = useDeleteItem();
  const markWashed = useMarkWashed();
  const toggleInWash = useToggleInWash();
  const { colorScheme } = useColorScheme();
  const foreground = foregroundFor(colorScheme);

  const { data: signed } = useQuery({
    queryKey: ["item-signed", item?.id],
    enabled: !!item,
    queryFn: async () => signFirst(item),
  });

  const display = displayItem(signed, item);

  if (isLoading) {
    return (
      <Screen>
        <ItemDetailSkeleton />
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
          title: titleFor(display),
          headerRight: () => (
            <EditItemHeaderButton
              itemId={display.id}
              foreground={foreground}
            />
          ),
        }}
      />
      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 20 }}
        contentInsetAdjustmentBehavior="automatic"
      >
        <View className="rounded-xl overflow-hidden" style={{ aspectRatio: 1 }}>
          <Image source={{ uri: display.photo_url }} style={{ flex: 1 }} contentFit="cover" />
        </View>

        <View>
          <Text variant="caption" className="uppercase tracking-widest">
            {display.category}
          </Text>
          <Text variant="title" className="mt-0.5">
            {nameOrFallback(display.name)}
          </Text>
        </View>

        <View>
          <Text variant="label" className="mb-2">
            Colors
          </Text>
          <View className="flex-row gap-3">
            {display.colors.map((color, colorIndex) => (
              <View key={colorIndex} className="items-center">
                <View
                  className="w-10 h-10 rounded-full border border-line"
                  style={{ backgroundColor: color.hex }}
                />
                <Text variant="caption">{color.hex}</Text>
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
              <Tag key={style} label={style} />
            ))}
            {display.seasons.map((season) => (
              <Tag key={season} label={season} />
            ))}
            {display.occasions.map((occasion) => (
              <Tag key={occasion} label={occasion} />
            ))}
            <Tag label={`formality ${display.formality}`} />
            <Tag label={`warmth ${display.warmth}`} />
            {display.pattern !== "solid" && <Tag label={display.pattern} />}
          </View>
        </View>

        <PriceSection item={display} />
        <CareSection
          item={display}
          marking={markWashed.isPending}
          togglingInWash={toggleInWash.isPending}
          onMarkWashed={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            markWashed.mutate(display.id, {
              onSuccess: () => toast.success("Wash logged"),
            });
          }}
          onToggleInWash={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            const nextInWash = !display.inWash;
            toggleInWash.mutate(
              { itemId: display.id, inWash: nextInWash },
              { onSuccess: () => toast.success(washStatusToastFor(nextInWash)) },
            );
          }}
        />

        <Button
          label="Find outfits with this"
          onPress={() =>
            router.push({ pathname: "/outfits/suggest", params: { anchorId: display.id } })
          }
        />

        <Button
          label="Remove from closet"
          variant="destructive"
          onPress={() => confirmRemoval(display.name, display.id, del.mutate)}
          loading={del.isPending}
        />
      </ScrollView>
    </Screen>
  );
}

const confirmRemoval = (
  name: string | null,
  itemId: string,
  remove: (id: string, options: { onSuccess: () => void }) => void,
) => {
  Alert.alert(removalTitle(name), "This will hide it from your closet.", [
    { text: "Cancel", style: "cancel" },
    {
      text: "Remove",
      style: "destructive",
      onPress: () => remove(itemId, { onSuccess: () => router.back() }),
    },
  ]);
};

const removalTitle = (name: string | null): string => {
  if (name === null) return "Remove this item?";
  return `Remove "${name}"?`;
};

function PriceSection({ item }: { item: Item }) {
  if (item.price === null && item.purchasedOn === null) return null;
  return (
    <View>
      <Text variant="label" className="mb-2">
        Purchase
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {item.price !== null && <Tag label={formatPrice(item.price, item.currency)} />}
        {item.purchasedOn !== null && <Tag label={`bought ${item.purchasedOn}`} />}
      </View>
    </View>
  );
}

function CareSection({
  item,
  marking,
  togglingInWash,
  onMarkWashed,
  onToggleInWash,
}: {
  item: Item;
  marking: boolean;
  togglingInWash: boolean;
  onMarkWashed: () => void;
  onToggleInWash: () => void;
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
      <View className="flex-row items-center justify-between mt-3">
        <Text variant="body">{wearAvailabilityLabel(item.inWash)}</Text>
        <Button
          label={inWashToggleLabel(item.inWash, togglingInWash)}
          variant="secondary"
          onPress={onToggleInWash}
          disabled={togglingInWash}
        />
      </View>
    </View>
  );
}

function EditItemHeaderButton({
  itemId,
  foreground,
}: {
  itemId: string;
  foreground: string;
}) {
  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push(`/items/edit/${itemId}`);
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
          tintColor={foreground}
          weight="semibold"
        />
      </GlassSurface>
    </Pressable>
  );
}

const displayItem = (
  signed: Item | null | undefined,
  fallback: Item | null | undefined,
): Item | undefined => {
  if (signed) return signed;
  if (fallback) return fallback;
  return undefined;
};

const titleFor = (item: Item): string => {
  if (item.name) return item.name;
  return "Item";
};

const nameOrFallback = (name: string | null): string => {
  if (name === null) return "Unnamed";
  return name;
};

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

const wearAvailabilityLabel = (inWash: boolean): string => {
  if (inWash) return "In the wash — hidden from suggestions";
  return "Available for outfits";
};

const inWashToggleLabel = (inWash: boolean, pending: boolean): string => {
  if (pending) return "Updating…";
  if (inWash) return "Back in rotation";
  return "Send to wash";
};

const washStatusToastFor = (inWash: boolean): string => {
  if (inWash) return "Sent to wash";
  return "Back in rotation";
};
