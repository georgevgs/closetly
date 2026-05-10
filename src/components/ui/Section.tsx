import { View } from "react-native";
import { Text } from "./Text";

export function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <View className="mt-8">
      <View className="px-6 mb-3">
        <Text variant="headline">{title}</Text>
        {subtitle && (
          <Text variant="caption" className="mt-0.5">
            {subtitle}
          </Text>
        )}
      </View>
      {children}
    </View>
  );
}
