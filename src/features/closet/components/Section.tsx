import { View } from "react-native";
import { Text } from "~/components/ui/Text";

type Props = {
  title: string;
  subtitle?: string;
  accessory?: React.ReactNode;
  children: React.ReactNode;
};

export function Section({ title, subtitle, accessory, children }: Props) {
  return (
    <View>
      <View className="flex-row items-center justify-between mb-1">
        <Text variant="label">{title}</Text>
        {accessory}
      </View>
      <SubtitleSlot subtitle={subtitle} />
      {children}
    </View>
  );
}

function SubtitleSlot({ subtitle }: { subtitle: string | undefined }) {
  if (subtitle) {
    return (
      <Text variant="caption" className="mb-3">
        {subtitle}
      </Text>
    );
  }
  return <View className="mb-2" />;
}
