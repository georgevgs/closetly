import { View } from "react-native";
import { BottomBar } from "~/components/ui/BottomBar";
import { Button } from "~/components/ui/Button";
import { Text } from "~/components/ui/Text";

type Props = {
  onSave: () => void;
  saving: boolean;
  hint: string | null;
};

export function EditTripBar({ onSave, saving, hint }: Props) {
  const disabled = hint !== null;
  return (
    <BottomBar>
      {hint !== null && (
        <View className="mb-2">
          <Text variant="caption">{hint}</Text>
        </View>
      )}
      <Button
        label="Save changes"
        onPress={onSave}
        loading={saving}
        disabled={disabled}
        size="lg"
      />
    </BottomBar>
  );
}
