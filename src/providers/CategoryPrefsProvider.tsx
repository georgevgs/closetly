import { createContext, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { CATEGORIES, type Category } from "~/types/items";

const STORAGE_KEY = "closetly:hiddenCategories";

type Ctx = {
  hidden: Set<Category>;
  visible: Category[];
  toggle: (c: Category) => void;
  isHidden: (c: Category) => boolean;
};

const CategoryPrefsContext = createContext<Ctx | null>(null);

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

  const value = useMemo<Ctx>(() => {
    const persist = (next: Set<Category>) => {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
    };
    return {
      hidden,
      visible: CATEGORIES.filter((c) => !hidden.has(c)),
      isHidden: (c) => hidden.has(c),
      toggle: (c) => {
        setHidden((prev) => {
          const next = new Set(prev);
          if (next.has(c)) next.delete(c);
          else next.add(c);
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
  const ctx = useContext(CategoryPrefsContext);
  if (!ctx) throw new Error("useCategoryPrefs must be used inside CategoryPrefsProvider");
  return ctx;
}
