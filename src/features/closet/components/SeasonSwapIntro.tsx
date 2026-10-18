import { ScrollView, View } from "react-native";

import { Text } from "~/components/ui/Text";
import { Pill } from "~/components/ui/Pill";
import { spacing } from "~/lib/designTokens";
import { SEASONS, type Season } from "~/types/items";

type Props = {
  calendarSeason: Season;
  tempC: number | null;
  keepOutSeasons: ReadonlySet<Season>;
  onToggleSeason: (season: Season) => void;
};

export function SeasonSwapIntro({
  calendarSeason,
  tempC,
  keepOutSeasons,
  onToggleSeason,
}: Props) {
  return (
    <View style={{ paddingHorizontal: spacing.screenX, paddingTop: spacing.screenY }}>
      <Text variant="caption" className="uppercase tracking-widest">
        {conditionsLine(calendarSeason, tempC)}
      </Text>
      <Text variant="title" className="mt-1">
        Swap your closet for the season
      </Text>
      <Text variant="caption" className="mt-2">
        Stored pieces stay in Closetly under Stored but are left out of outfit ideas.
        Pieces without season tags are never moved.
      </Text>
      <Text variant="label" className="mt-5 mb-2">
        Keep out
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: spacing.groupGap }}
      >
        {SEASONS.map((season) => (
          <Pill
            key={season}
            label={season}
            selected={keepOutSeasons.has(season)}
            onPress={() => onToggleSeason(season)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const conditionsLine = (calendarSeason: Season, tempC: number | null): string => {
  const seasonText = `It's ${calendarSeason}`;
  if (tempC === null) return seasonText;
  return `${seasonText} · ${Math.round(tempC)}°C outside`;
};
