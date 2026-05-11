import { View } from "react-native";
import { BottomBar } from "~/components/ui/BottomBar";
import { Button } from "~/components/ui/Button";
import { Text } from "~/components/ui/Text";

type Props = {
  itemCount: number;
  saving: boolean;
  wearing: boolean;
  onSave: () => void;
  onWear: () => void;
};

export function OutfitActionBar({
  itemCount,
  saving,
  wearing,
  onSave,
  onWear,
}: Props) {
  const blockedReason = blockedReasonFor(itemCount);
  const disabled = blockedReason !== null;

  return (
    <BottomBar className="px-4">
      <View className="flex-row items-center justify-between mb-2">
        <Text variant="caption">{summaryLabel(itemCount)}</Text>
        {blockedReason !== null && <Text variant="caption">{blockedReason}</Text>}
      </View>
      <View className="flex-row gap-2">
        <Button
          label="Save"
          variant="secondary"
          className="flex-1"
          onPress={onSave}
          loading={saving}
          disabled={disabled || wearing}
        />
        <Button
          label="Wear today"
          className="flex-1"
          onPress={onWear}
          loading={wearing}
          disabled={disabled || saving}
        />
      </View>
    </BottomBar>
  );
}

const blockedReasonFor = (itemCount: number): string | null => {
  if (itemCount === 0) return "Pick a piece to start";
  if (itemCount === 1) return "Pick at least 2 pieces";
  return null;
};

const summaryLabel = (itemCount: number): string => {
  if (itemCount === 0) return "Empty outfit";
  if (itemCount === 1) return "1 piece";
  return `${itemCount} pieces`;
};
