import { useState } from "react";
import { Platform, Pressable, View } from "react-native";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { Text } from "./Text";

export type DateFieldProps = {
  label: string;
  value: Date;
  onChange: (next: Date) => void;
  minimumDate?: Date;
  maximumDate?: Date;
};

// Branches by platform so each side gets its native idiom: iOS shows the
// inline compact picker (tap reveals the wheel popover); Android keeps the
// modal dialog hidden until the field is tapped.
export function DateField(props: DateFieldProps) {
  if (Platform.OS === "ios") return <IOSDateField {...props} />;
  return <AndroidDateField {...props} />;
}

function IOSDateField({ label, value, onChange, minimumDate, maximumDate }: DateFieldProps) {
  return (
    <View className="flex-1">
      <Text variant="label" className="mb-1">
        {label}
      </Text>
      <View className="h-12 px-3 rounded-lg border border-line dark:border-line-dark flex-row items-center justify-between">
        <Text variant="caption">{label}</Text>
        <DateTimePicker
          value={value}
          mode="date"
          display="compact"
          minimumDate={minimumDate}
          maximumDate={maximumDate}
          onChange={(_event, selected) => {
            if (selected) onChange(selected);
          }}
        />
      </View>
    </View>
  );
}

function AndroidDateField({
  label,
  value,
  onChange,
  minimumDate,
  maximumDate,
}: DateFieldProps) {
  const [pickerVisible, setPickerVisible] = useState(false);

  const handlePickerEvent = (event: DateTimePickerEvent, selected?: Date) => {
    setPickerVisible(false);
    if (event.type !== "set") return;
    if (!selected) return;
    onChange(selected);
  };

  return (
    <View className="flex-1">
      <Text variant="label" className="mb-1">
        {label}
      </Text>
      <Pressable
        onPress={() => setPickerVisible(true)}
        className="h-12 px-4 rounded-lg border border-line dark:border-line-dark justify-center"
      >
        <Text variant="body">{formatDisplay(value)}</Text>
      </Pressable>
      {pickerVisible && (
        <DateTimePicker
          value={value}
          mode="date"
          display="default"
          minimumDate={minimumDate}
          maximumDate={maximumDate}
          onChange={handlePickerEvent}
        />
      )}
    </View>
  );
}

const formatDisplay = (date: Date): string => {
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};
