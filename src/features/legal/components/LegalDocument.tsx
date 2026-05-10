import { ScrollView, View } from "react-native";

import { Screen } from "~/components/ui/Screen";
import { Text } from "~/components/ui/Text";

import type { LegalDocumentContent, LegalParagraph, LegalSection } from "../types";

type LegalDocumentProps = {
  content: LegalDocumentContent;
};

export function LegalDocument({ content }: LegalDocumentProps) {
  return (
    <Screen edges={["left", "right"]}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 24 }}>
        <Text variant="display">{content.title}</Text>
        <Text variant="caption" className="mt-2">
          Effective date: {content.effectiveDate}
        </Text>

        <View className="mt-6 gap-4">
          {content.intro.map((paragraph, paragraphIndex) => (
            <Paragraph key={`intro-${paragraphIndex}`} text={paragraph} />
          ))}
        </View>

        <View className="mt-2">
          {content.sections.map((section) => (
            <SectionBlock key={section.heading} section={section} />
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}

function SectionBlock({ section }: { section: LegalSection }) {
  return (
    <View className="mt-8">
      <Text variant="headline">{section.heading}</Text>
      <View className="mt-3 gap-3">
        {section.body.map((paragraph, paragraphIndex) => (
          <Paragraph key={paragraphIndex} text={paragraph} />
        ))}
      </View>
    </View>
  );
}

function Paragraph({ text }: { text: LegalParagraph }) {
  return (
    <Text variant="body" className="leading-6">
      {text}
    </Text>
  );
}
