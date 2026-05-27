import { View } from "react-native";
import { Skeleton } from "~/components/ui/Skeleton";
import { radii, spacing } from "~/lib/designTokens";

const PLACEHOLDER_ROW_COUNT = 4;

export function ClosetGridSkeleton({ topPadding }: { topPadding: number }) {
  return (
    <View
      style={{
        flex: 1,
        paddingTop: topPadding,
        paddingHorizontal: spacing.screenX - 4,
      }}
    >
      {Array.from({ length: PLACEHOLDER_ROW_COUNT }).map((_unused, rowIndex) => (
        <View key={rowIndex} style={{ flexDirection: "row" }}>
          <SkeletonTile />
          <SkeletonTile />
        </View>
      ))}
    </View>
  );
}

function SkeletonTile() {
  return (
    <View style={{ flex: 1, padding: 4 }}>
      <Skeleton height={160} borderRadius={radii.row} />
    </View>
  );
}
