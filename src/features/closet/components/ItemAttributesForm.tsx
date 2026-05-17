import { ReactNode } from "react";
import { TextInput, View } from "react-native";

import { Pill } from "~/components/ui/Pill";
import { Section } from "~/features/closet/components/Section";
import {
  STYLES,
  SEASONS,
  PATTERNS,
  OCCASIONS,
  type Formality,
  type Occasion,
  type Pattern,
  type Season,
  type Silhouette,
  type Style,
  type Warmth,
} from "~/types/items";

const FORMALITY_LEVELS: Formality[] = [1, 2, 3, 4, 5];
const WARMTH_LEVELS: Warmth[] = [0, 1, 2, 3, 4];

type Fit = Silhouette["fit"];
const FITS: Fit[] = ["slim", "regular", "relaxed", "oversized"];

type FitConfig = {
  value: Fit | null;
  onTap: (option: Fit) => void;
};

type SeasonsConfig = {
  subtitle?: string;
  accessory?: ReactNode;
};

export type ItemAttributesFormProps = {
  styles: Set<Style>;
  onChangeStyles: (next: Set<Style>) => void;
  pattern: Pattern;
  onChangePattern: (next: Pattern) => void;
  seasons: Set<Season>;
  onChangeSeasons: (next: Set<Season>) => void;
  seasonsConfig?: SeasonsConfig;
  formality: Formality;
  onChangeFormality: (next: Formality) => void;
  warmth: Warmth;
  onChangeWarmth: (next: Warmth) => void;
  occasions: Set<Occasion>;
  onChangeOccasions: (next: Set<Occasion>) => void;
  priceText: string;
  onChangePriceText: (next: string) => void;
  currencyText: string;
  onChangeCurrencyText: (next: string) => void;
  purchasedOnText: string;
  onChangePurchasedOnText: (next: string) => void;
  fit?: FitConfig;
};

export function ItemAttributesForm(props: ItemAttributesFormProps) {
  return (
    <>
      <StyleSection styles={props.styles} onChange={props.onChangeStyles} />
      <PatternSection pattern={props.pattern} onChange={props.onChangePattern} />
      <SeasonsSection
        seasons={props.seasons}
        onChange={props.onChangeSeasons}
        config={props.seasonsConfig}
      />
      <FormalitySection
        formality={props.formality}
        onChange={props.onChangeFormality}
      />
      <WarmthSection warmth={props.warmth} onChange={props.onChangeWarmth} />
      {props.fit && <FitSection fit={props.fit} />}
      <OccasionsSection
        occasions={props.occasions}
        onChange={props.onChangeOccasions}
      />
      <PriceSection
        priceText={props.priceText}
        onChangePriceText={props.onChangePriceText}
        currencyText={props.currencyText}
        onChangeCurrencyText={props.onChangeCurrencyText}
      />
      <PurchasedOnSection
        purchasedOnText={props.purchasedOnText}
        onChange={props.onChangePurchasedOnText}
      />
    </>
  );
}

const toggle = <T,>(set: Set<T>, value: T): Set<T> => {
  const next = new Set(set);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
};

function StyleSection({
  styles,
  onChange,
}: {
  styles: Set<Style>;
  onChange: (next: Set<Style>) => void;
}) {
  return (
    <Section title="Style" subtitle="Pick all that apply">
      <View className="flex-row flex-wrap gap-2">
        {STYLES.map((option) => (
          <Pill
            key={option}
            label={option}
            selected={styles.has(option)}
            onPress={() => onChange(toggle(styles, option))}
          />
        ))}
      </View>
    </Section>
  );
}

function PatternSection({
  pattern,
  onChange,
}: {
  pattern: Pattern;
  onChange: (next: Pattern) => void;
}) {
  return (
    <Section title="Pattern">
      <View className="flex-row flex-wrap gap-2">
        {PATTERNS.map((option) => (
          <Pill
            key={option}
            label={option}
            selected={pattern === option}
            onPress={() => onChange(option)}
          />
        ))}
      </View>
    </Section>
  );
}

function SeasonsSection({
  seasons,
  onChange,
  config,
}: {
  seasons: Set<Season>;
  onChange: (next: Set<Season>) => void;
  config?: SeasonsConfig;
}) {
  return (
    <Section title="Seasons" subtitle={config?.subtitle}>
      <View className="flex-row flex-wrap gap-2">
        {SEASONS.map((option) => (
          <Pill
            key={option}
            label={option}
            selected={seasons.has(option)}
            onPress={() => onChange(toggle(seasons, option))}
          />
        ))}
      </View>
      {config?.accessory}
    </Section>
  );
}

function FormalitySection({
  formality,
  onChange,
}: {
  formality: Formality;
  onChange: (next: Formality) => void;
}) {
  return (
    <Section title="Formality" subtitle="1 = loungewear · 5 = black tie">
      <View className="flex-row gap-2">
        {FORMALITY_LEVELS.map((level) => (
          <Pill
            key={level}
            label={String(level)}
            selected={formality === level}
            onPress={() => onChange(level)}
          />
        ))}
      </View>
    </Section>
  );
}

function WarmthSection({
  warmth,
  onChange,
}: {
  warmth: Warmth;
  onChange: (next: Warmth) => void;
}) {
  return (
    <Section title="Warmth" subtitle="0 = bare · 4 = parka">
      <View className="flex-row gap-2">
        {WARMTH_LEVELS.map((level) => (
          <Pill
            key={level}
            label={String(level)}
            selected={warmth === level}
            onPress={() => onChange(level)}
          />
        ))}
      </View>
    </Section>
  );
}

function FitSection({ fit }: { fit: FitConfig }) {
  return (
    <Section title="Fit" subtitle="How does it sit on the body? Tap again to clear.">
      <View className="flex-row flex-wrap gap-2">
        {FITS.map((option) => (
          <Pill
            key={option}
            label={option}
            selected={fit.value === option}
            onPress={() => fit.onTap(option)}
          />
        ))}
      </View>
    </Section>
  );
}

function OccasionsSection({
  occasions,
  onChange,
}: {
  occasions: Set<Occasion>;
  onChange: (next: Set<Occasion>) => void;
}) {
  return (
    <Section title="Occasions" subtitle="When you'd reach for this piece">
      <View className="flex-row flex-wrap gap-2">
        {OCCASIONS.map((option) => (
          <Pill
            key={option}
            label={option}
            selected={occasions.has(option)}
            onPress={() => onChange(toggle(occasions, option))}
          />
        ))}
      </View>
    </Section>
  );
}

function PriceSection({
  priceText,
  onChangePriceText,
  currencyText,
  onChangeCurrencyText,
}: {
  priceText: string;
  onChangePriceText: (next: string) => void;
  currencyText: string;
  onChangeCurrencyText: (next: string) => void;
}) {
  return (
    <Section title="Price" subtitle="Used for cost-per-wear">
      <View className="flex-row gap-2">
        <TextInput
          value={priceText}
          onChangeText={onChangePriceText}
          keyboardType="decimal-pad"
          placeholder="0.00"
          placeholderTextColor="#a8a29e"
          className="flex-1 h-12 px-4 rounded-lg border border-line dark:border-line-dark text-ink dark:text-ink-dark"
        />
        <TextInput
          value={currencyText}
          onChangeText={onChangeCurrencyText}
          autoCapitalize="characters"
          maxLength={3}
          placeholder="USD"
          placeholderTextColor="#a8a29e"
          className="w-24 h-12 px-4 rounded-lg border border-line dark:border-line-dark text-ink dark:text-ink-dark"
        />
      </View>
    </Section>
  );
}

function PurchasedOnSection({
  purchasedOnText,
  onChange,
}: {
  purchasedOnText: string;
  onChange: (next: string) => void;
}) {
  return (
    <Section title="Purchased on" subtitle="YYYY-MM-DD">
      <TextInput
        value={purchasedOnText}
        onChangeText={onChange}
        placeholder="2026-05-10"
        placeholderTextColor="#a8a29e"
        keyboardType="numbers-and-punctuation"
        className="h-12 px-4 rounded-lg border border-line dark:border-line-dark text-ink dark:text-ink-dark"
      />
    </Section>
  );
}
