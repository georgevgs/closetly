import { View } from "react-native";
import { BottomBar } from "~/components/ui/BottomBar";
import { Button } from "~/components/ui/Button";
import { Text } from "~/components/ui/Text";

type Props = {
  onSave: () => void;
  saving: boolean;
  disabled: boolean;
  hint: string | null;
  itemCount: number;
};

export function SaveTripBar({ onSave, saving, disabled, hint, itemCount }: Props) {
  return (
    <BottomBar>
      <View className="flex-row items-center justify-between mb-2">
        <Text variant="caption">{capsuleSummary(itemCount)}</Text>
        {hint !== null && <Text variant="caption">{hint}</Text>}
      </View>
      <Button
        label="Save trip"
        onPress={onSave}
        loading={saving}
        disabled={disabled}
        size="lg"
      />
    </BottomBar>
  );
}

const capsuleSummary = (itemCount: number): string => {
  if (itemCount === 0) return "No pieces yet";
  if (itemCount === 1) return "1 piece in capsule";
  return `${itemCount} pieces in capsule`;
};
