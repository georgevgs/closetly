import { View } from "react-native";
import { Skeleton } from "~/components/ui/Skeleton";
import { radii, spacing } from "~/lib/designTokens";

export function TripDetailSkeleton() {
  return (
    <View
      style={{
        paddingHorizontal: spacing.screenX,
        paddingTop: spacing.screenY,
        gap: spacing.stackMd,
      }}
    >
      <Skeleton height={150} borderRadius={radii.card} />
      <Skeleton height={120} borderRadius={radii.card} />
      <View style={{ gap: spacing.rowGap }}>
        <Skeleton height={56} borderRadius={radii.row} />
        <Skeleton height={56} borderRadius={radii.row} />
        <Skeleton height={56} borderRadius={radii.row} />
      </View>
    </View>
  );
}
