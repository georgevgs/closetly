import { createContext, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { CATEGORIES, type Category } from "~/types/items";

const STORAGE_KEY = "closetly:hiddenCategories";

type CategoryPrefsContextValue = {
  hidden: Set<Category>;
  visible: Category[];
  toggle: (category: Category) => void;
  isHidden: (category: Category) => boolean;
};

const CategoryPrefsContext = createContext<CategoryPrefsContextValue | null>(null);

function isCategory(value: string): value is Category {
  return (CATEGORIES as readonly string[]).includes(value);
}

export function CategoryPrefsProvider({ children }: { children: React.ReactNode }) {
  const [hidden, setHidden] = useState<Set<Category>>(new Set());

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (!raw) return;
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setHidden(new Set(parsed.filter(isCategory)));
        }
      } catch {
        // ignore malformed value
      }
    });
  }, []);

  const value = useMemo<CategoryPrefsContextValue>(() => {
    const persist = (next: Set<Category>) => {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
    };
    return {
      hidden,
      visible: CATEGORIES.filter((category) => !hidden.has(category)),
      isHidden: (category) => hidden.has(category),
      toggle: (category) => {
        setHidden((previous) => {
          const next = new Set(previous);
          if (next.has(category)) next.delete(category);
          else next.add(category);
          persist(next);
          return next;
        });
      },
    };
  }, [hidden]);

  return (
    <CategoryPrefsContext.Provider value={value}>
      {children}
    </CategoryPrefsContext.Provider>
  );
}

export function useCategoryPrefs() {
  const context = useContext(CategoryPrefsContext);
  if (!context) {
    throw new Error("useCategoryPrefs must be used inside CategoryPrefsProvider");
  }
  return context;
}
