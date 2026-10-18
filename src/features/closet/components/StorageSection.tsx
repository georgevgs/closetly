import { View } from "react-native";

import { Text } from "~/components/ui/Text";
import { Button } from "~/components/ui/Button";
import type { Item } from "~/types/items";

type Props = {
  item: Item;
  updating: boolean;
  onToggleStored: () => void;
};

export function StorageSection({ item, updating, onToggleStored }: Props) {
  return (
    <View>
      <Text variant="label" className="mb-2">
        Season
      </Text>
      <View className="flex-row items-center justify-between">
        <Text variant="body" className="flex-1 mr-3">
          {storageStatusLabel(item.storedAt)}
        </Text>
        <Button
          label={storageToggleLabel(item.storedAt, updating)}
          variant="secondary"
          onPress={onToggleStored}
          disabled={updating}
        />
      </View>
    </View>
  );
}

const storageStatusLabel = (storedAt: string | null): string => {
  if (storedAt === null) return "In your closet";
  return `In storage since ${shortDate(storedAt)}`;
};

const storageToggleLabel = (storedAt: string | null, updating: boolean): string => {
  if (updating) return "Updating…";
  if (storedAt === null) return "Store away";
  return "Bring back";
};

const shortDate = (isoTimestamp: string): string => {
  return new Date(isoTimestamp).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  });
};
