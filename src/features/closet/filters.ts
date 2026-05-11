import type { Item, Style, Season, Pattern, Occasion } from "~/types/items";

export type ClosetFilters = {
  searchText: string;
  styles: Set<Style>;
  seasons: Set<Season>;
  patterns: Set<Pattern>;
  occasions: Set<Occasion>;
};

export type TagGroup = "styles" | "seasons" | "patterns" | "occasions";

export type ActiveTag = {
  group: TagGroup;
  value: string;
};

export const emptyClosetFilters = (): ClosetFilters => ({
  searchText: "",
  styles: new Set(),
  seasons: new Set(),
  patterns: new Set(),
  occasions: new Set(),
});

export const tagFilterCount = (filters: ClosetFilters): number => {
  return (
    filters.styles.size +
    filters.seasons.size +
    filters.patterns.size +
    filters.occasions.size
  );
};

export const listActiveTags = (filters: ClosetFilters): ActiveTag[] => {
  const tags: ActiveTag[] = [];
  for (const value of filters.styles) tags.push({ group: "styles", value });
  for (const value of filters.seasons) tags.push({ group: "seasons", value });
  for (const value of filters.patterns) tags.push({ group: "patterns", value });
  for (const value of filters.occasions) tags.push({ group: "occasions", value });
  return tags;
};

export const removeActiveTag = (
  filters: ClosetFilters,
  tag: ActiveTag,
): ClosetFilters => {
  const nextSet = new Set(filters[tag.group]);
  nextSet.delete(tag.value as never);
  return { ...filters, [tag.group]: nextSet };
};

export const applyClosetFilters = (
  items: Item[],
  filters: ClosetFilters,
): Item[] => {
  const needle = filters.searchText.trim().toLowerCase();
  return items.filter((item) => matchesAllFilters(item, filters, needle));
};

const matchesAllFilters = (
  item: Item,
  filters: ClosetFilters,
  needle: string,
): boolean => {
  if (!matchesSearch(item, needle)) return false;
  if (!matchesAnyTag(item.styles, filters.styles)) return false;
  if (!matchesAnyTag(item.seasons, filters.seasons)) return false;
  if (!matchesPattern(item.pattern, filters.patterns)) return false;
  if (!matchesAnyTag(item.occasions, filters.occasions)) return false;
  return true;
};

const matchesSearch = (item: Item, needle: string): boolean => {
  if (needle.length === 0) return true;
  if (item.name && item.name.toLowerCase().includes(needle)) return true;
  if (item.brand && item.brand.toLowerCase().includes(needle)) return true;
  return false;
};

const matchesAnyTag = <Tag,>(itemTags: Tag[], filterTags: Set<Tag>): boolean => {
  if (filterTags.size === 0) return true;
  return itemTags.some((tag) => filterTags.has(tag));
};

const matchesPattern = (
  pattern: Pattern,
  filterPatterns: Set<Pattern>,
): boolean => {
  if (filterPatterns.size === 0) return true;
  return filterPatterns.has(pattern);
};
