import { useMemo, useState } from "react";
import { View, ScrollView, TextInput } from "react-native";

import { Screen } from "~/components/ui/Screen";
import { Text } from "~/components/ui/Text";
import { Pill } from "~/components/ui/Pill";
import { Button } from "~/components/ui/Button";
import { ItemCard } from "~/features/closet/components/ItemCard";
import { useAuth } from "~/features/auth/context";
import { useSignedItems } from "~/features/closet/hooks/useSignedItems";
import { buildCapsule } from "~/features/trips/capsule";
import { SEASONS, type Season } from "~/types/items";

export default function TripsScreen() {
  const { session } = useAuth();
  const { data: items } = useSignedItems(session?.user.id);
  const [days, setDays] = useState("5");
  const [tempMin, setTempMin] = useState("12");
  const [tempMax, setTempMax] = useState("22");
  const [seasons, setSeasons] = useState<Set<Season>>(new Set(["spring", "autumn"]));
  const [generated, setGenerated] = useState(false);

  const capsule = useMemo(() => {
    if (!items || !generated) return null;
    return buildCapsule({
      closet: items,
      days: Number(days) || 1,
      tempMinC: Number(tempMin) || 0,
      tempMaxC: Number(tempMax) || 25,
      seasons: [...seasons],
    });
  }, [items, generated, days, tempMin, tempMax, seasons]);

  function toggle(s: Season) {
    const next = new Set(seasons);
    if (next.has(s)) next.delete(s);
    else next.add(s);
    setSeasons(next);
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 60 }}>
        <View className="pt-4">
          <Text variant="display">Trips</Text>
          <Text variant="caption" className="mt-1">
            Pack a capsule that mixes and matches.
          </Text>
        </View>

        <View className="mt-6 gap-4">
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Text variant="label" className="mb-1">
                Days
              </Text>
              <TextInput
                value={days}
                onChangeText={setDays}
                keyboardType="number-pad"
                className="h-12 px-4 rounded-lg border border-line dark:border-line-dark text-ink dark:text-ink-dark"
              />
            </View>
            <View className="flex-1">
              <Text variant="label" className="mb-1">
                Min °C
              </Text>
              <TextInput
                value={tempMin}
                onChangeText={setTempMin}
                keyboardType="numbers-and-punctuation"
                className="h-12 px-4 rounded-lg border border-line dark:border-line-dark text-ink dark:text-ink-dark"
              />
            </View>
            <View className="flex-1">
              <Text variant="label" className="mb-1">
                Max °C
              </Text>
              <TextInput
                value={tempMax}
                onChangeText={setTempMax}
                keyboardType="numbers-and-punctuation"
                className="h-12 px-4 rounded-lg border border-line dark:border-line-dark text-ink dark:text-ink-dark"
              />
            </View>
          </View>

          <View>
            <Text variant="label" className="mb-2">
              Seasons
            </Text>
            <View className="flex-row gap-2">
              {SEASONS.map((s) => (
                <Pill
                  key={s}
                  label={s}
                  selected={seasons.has(s)}
                  onPress={() => toggle(s)}
                />
              ))}
            </View>
          </View>

          <Button label="Build capsule" onPress={() => setGenerated(true)} />
        </View>

        {capsule && (
          <View className="mt-8 gap-4">
            <View className="rounded-xl border border-line dark:border-line-dark p-4">
              <Text variant="caption" className="uppercase tracking-widest">
                Possible outfits
              </Text>
              <Text variant="title">{capsule.combinations}</Text>
              <Text variant="caption" className="mt-1">
                from {capsule.items.length} pieces
              </Text>
            </View>

            {Object.entries(capsule.byCategory).map(([cat, list]) =>
              list.length === 0 ? null : (
                <View key={cat}>
                  <Text variant="label" className="mb-2">
                    {cat} ({list.length})
                  </Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ gap: 8 }}
                  >
                    {list.map((item) => (
                      <View key={item.id} style={{ width: 110 }}>
                        <ItemCard item={item} />
                      </View>
                    ))}
                  </ScrollView>
                </View>
              )
            )}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}
