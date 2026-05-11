import { Pressable, TextInput, View } from "react-native";
import { SymbolView } from "expo-symbols";

type Props = {
  value: string;
  onChange: (next: string) => void;
};

export function SearchField({ value, onChange }: Props) {
  const showClear = value.length > 0;

  return (
    <View className="flex-1 h-10 px-4 rounded-full border border-line dark:border-line-dark flex-row items-center">
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder="Search by name or brand"
        placeholderTextColor="#a8a29e"
        className="flex-1 text-ink dark:text-ink-dark"
        returnKeyType="search"
      />
      {showClear && (
        <Pressable
          onPress={() => onChange("")}
          accessibilityRole="button"
          accessibilityLabel="Clear search"
          hitSlop={8}
        >
          <SymbolView name="xmark.circle.fill" size={16} tintColor="#a8a29e" />
        </Pressable>
      )}
    </View>
  );
}
