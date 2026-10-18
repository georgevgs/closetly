import { View } from "react-native";

import { Card } from "~/components/ui/Card";
import { Text } from "~/components/ui/Text";
import { spacing } from "~/lib/designTokens";

export function SeasonSwapEmptyState() {
  return (
    <View style={{ paddingHorizontal: spacing.screenX, marginTop: spacing.stackMd }}>
      <Card padding="lg">
        <Text variant="headline" className="mb-1">
          Nothing to swap
        </Text>
        <Text variant="caption">
          Your closet already matches these seasons. Tag pieces with seasons when you
          edit them so Closetly knows what to pack away next time.
        </Text>
      </Card>
    </View>
  );
}
