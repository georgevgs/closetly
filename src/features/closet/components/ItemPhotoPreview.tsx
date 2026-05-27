import { intentColors } from "~/lib/designTokens";
import { ActivityIndicator, View } from "react-native";
import { Image } from "expo-image";
import { SymbolView } from "expo-symbols";

import { Text } from "~/components/ui/Text";

type Props = {
  photoUri: string | null;
  trimming?: boolean;
};

export function ItemPhotoPreview({ photoUri, trimming }: Props) {
  if (photoUri) return <FilledPreview photoUri={photoUri} trimming={trimming} />;
  return <EmptyPreview />;
}

function FilledPreview({ photoUri, trimming }: { photoUri: string; trimming?: boolean }) {
  return (
    <View
      className="rounded-xl overflow-hidden bg-line dark:bg-line-dark"
      style={{ aspectRatio: 1 }}
    >
      <Image source={{ uri: photoUri }} style={{ flex: 1 }} contentFit="cover" />
      {trimming && <TrimmingOverlay />}
    </View>
  );
}

function TrimmingOverlay() {
  return (
    <View className="absolute inset-0 items-center justify-center bg-black/30">
      <ActivityIndicator color="#fff" />
      <Text className="text-white mt-2">Removing background…</Text>
    </View>
  );
}

function EmptyPreview() {
  return (
    <View
      className="rounded-xl border-2 border-dashed border-line dark:border-line-dark items-center justify-center"
      style={{ aspectRatio: 1 }}
    >
      <SymbolView name="camera" size={32} tintColor={intentColors.placeholder} />
      <Text variant="caption" className="mt-2">
        Add a photo of the piece
      </Text>
    </View>
  );
}
