import { Pressable, View } from "react-native";
import { SymbolView } from "expo-symbols";
import ReanimatedSwipeable from "react-native-gesture-handler/ReanimatedSwipeable";

import { Text } from "./Text";
import { intentColors } from "../../lib/designTokens";

type Props = {
  onDelete: () => void;
  accessibilityLabel?: string;
  children: React.ReactNode;
};

export function SwipeToDelete({ onDelete, accessibilityLabel, children }: Props) {
  return (
    <ReanimatedSwipeable
      friction={1.8}
      rightThreshold={48}
      renderRightActions={() => (
        <DeleteAction
          onPress={onDelete}
          accessibilityLabel={accessibilityLabel ?? "Delete"}
        />
      )}
    >
      {children}
    </ReanimatedSwipeable>
  );
}

function DeleteAction({
  onPress,
  accessibilityLabel,
}: {
  onPress: () => void;
  accessibilityLabel: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={{
        width: 88,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: intentColors.destructive,
        borderRadius: 12,
        marginLeft: 8,
      }}
    >
      <View style={{ alignItems: "center", gap: 4 }}>
        <SymbolView name="trash" size={20} tintColor="#ffffff" />
        <Text variant="caption" className="text-white">
          Delete
        </Text>
      </View>
    </Pressable>
  );
}
