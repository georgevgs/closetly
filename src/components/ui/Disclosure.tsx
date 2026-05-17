import { useState } from "react";
import { Pressable, View } from "react-native";
import { SymbolView } from "expo-symbols";

import { Text } from "./Text";

type DisclosureProps = {
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
};

export const Disclosure = ({
  title,
  subtitle,
  defaultOpen = false,
  children,
}: DisclosureProps) => {
  const [open, setOpen] = useState(defaultOpen);
  const toggle = () => setOpen((previous) => !previous);

  return (
    <View>
      <Pressable
        onPress={toggle}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        className="flex-row items-center justify-between py-2"
      >
        <View className="flex-1">
          <Text variant="headline">{title}</Text>
          {subtitle && (
            <Text variant="caption" className="mt-0.5">
              {subtitle}
            </Text>
          )}
        </View>
        <SymbolView name={chevronNameFor(open)} size={14} tintColor="#a8a29e" />
      </Pressable>
      {open && <View className="gap-6 mt-2">{children}</View>}
    </View>
  );
};

const chevronNameFor = (isOpen: boolean): "chevron.up" | "chevron.down" => {
  if (isOpen) return "chevron.up";
  return "chevron.down";
};
