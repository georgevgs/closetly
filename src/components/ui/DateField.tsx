import { useState } from "react";
import { Modal, Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Text } from "./Text";
import { PressableScale } from "./PressableScale";

export type DateFieldProps = {
  label: string;
  value: Date;
  onChange: (next: Date) => void;
  minimumDate?: Date;
  maximumDate?: Date;
};

export function DateField({
  label,
  value,
  onChange,
  minimumDate,
  maximumDate,
}: DateFieldProps) {
  const [pickerVisible, setPickerVisible] = useState(false);
  const [draft, setDraft] = useState(value);

  const openPicker = () => {
    setDraft(value);
    setPickerVisible(true);
  };

  const confirmPicker = () => {
    setPickerVisible(false);
    onChange(draft);
  };

  const dismissPicker = () => {
    setPickerVisible(false);
  };

  return (
    <View className="flex-1">
      <Text variant="label" className="mb-1">
        {label}
      </Text>
      <PressableScale
        onPress={openPicker}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${formatDisplay(value)}`}
        className="h-12 px-4 rounded-lg border border-line dark:border-line-dark justify-center"
      >
        <Text variant="body">{formatDisplay(value)}</Text>
      </PressableScale>
      <PickerSheet
        visible={pickerVisible}
        label={label}
        draft={draft}
        minimumDate={minimumDate}
        maximumDate={maximumDate}
        onChangeDraft={setDraft}
        onConfirm={confirmPicker}
        onDismiss={dismissPicker}
      />
    </View>
  );
}

function PickerSheet({
  visible,
  label,
  draft,
  minimumDate,
  maximumDate,
  onChangeDraft,
  onConfirm,
  onDismiss,
}: {
  visible: boolean;
  label: string;
  draft: Date;
  minimumDate?: Date;
  maximumDate?: Date;
  onChangeDraft: (next: Date) => void;
  onConfirm: () => void;
  onDismiss: () => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onDismiss}
    >
      <View style={{ flex: 1, justifyContent: "flex-end" }}>
        <Pressable
          onPress={onDismiss}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.4)",
          }}
        />
        <View
          className="bg-canvas dark:bg-canvas-dark rounded-t-2xl"
          style={{ paddingBottom: insets.bottom }}
        >
          <SheetHeader
            label={label}
            onCancel={onDismiss}
            onConfirm={onConfirm}
          />
          <DateTimePicker
            value={draft}
            mode="date"
            display="spinner"
            minimumDate={minimumDate}
            maximumDate={maximumDate}
            onChange={(_event, selected) => {
              if (selected) onChangeDraft(selected);
            }}
          />
        </View>
      </View>
    </Modal>
  );
}

function SheetHeader({
  label,
  onCancel,
  onConfirm,
}: {
  label: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <View className="flex-row items-center justify-between px-4 py-3 border-b border-line dark:border-line-dark">
      <Pressable onPress={onCancel} hitSlop={12} accessibilityRole="button">
        <Text variant="body">Cancel</Text>
      </Pressable>
      <Text variant="headline">{label}</Text>
      <Pressable onPress={onConfirm} hitSlop={12} accessibilityRole="button">
        <Text variant="body" className="font-semibold">
          Done
        </Text>
      </Pressable>
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
