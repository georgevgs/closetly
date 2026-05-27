import { View } from "react-native";
import { Skeleton } from "~/components/ui/Skeleton";
import { radii, spacing } from "~/lib/designTokens";

export function ItemDetailSkeleton() {
  return (
    <View style={{ padding: 16, gap: spacing.stackMd }}>
      <Skeleton height={320} borderRadius={radii.row} />
      <View style={{ gap: 8 }}>
        <Skeleton height={14} width={"30%"} />
        <Skeleton height={28} width={"70%"} />
      </View>
      <View style={{ gap: 8 }}>
        <Skeleton height={14} width={"20%"} />
        <View style={{ flexDirection: "row", gap: 12 }}>
          <Skeleton height={40} width={40} borderRadius={radii.pill} />
          <Skeleton height={40} width={40} borderRadius={radii.pill} />
          <Skeleton height={40} width={40} borderRadius={radii.pill} />
        </View>
      </View>
      <View style={{ gap: 8 }}>
        <Skeleton height={14} width={"20%"} />
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          <Skeleton height={28} width={70} borderRadius={radii.pill} />
          <Skeleton height={28} width={86} borderRadius={radii.pill} />
          <Skeleton height={28} width={60} borderRadius={radii.pill} />
          <Skeleton height={28} width={74} borderRadius={radii.pill} />
        </View>
      </View>
    </View>
  );
}
