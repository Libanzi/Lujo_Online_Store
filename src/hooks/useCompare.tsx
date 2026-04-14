import { useState, useEffect } from "react";

const COMPARE_STORAGE_KEY = "compare-products";
const MAX_COMPARE_ITEMS = 4;

export function useCompare() {
  const [compareItems, setCompareItems] = useState<string[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(COMPARE_STORAGE_KEY);
    if (stored) {
      try {
        setCompareItems(JSON.parse(stored));
      } catch (e) {
        console.error("Error loading compare items:", e);
      }
    }
  }, []);

  const saveToStorage = (items: string[]) => {
    localStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify(items));
    setCompareItems(items);
  };

  const addToCompare = (productId: string) => {
    if (compareItems.includes(productId)) {
      return false;
    }
    if (compareItems.length >= MAX_COMPARE_ITEMS) {
      return false;
    }
    const newItems = [...compareItems, productId];
    saveToStorage(newItems);
    return true;
  };

  const removeFromCompare = (productId: string) => {
    const newItems = compareItems.filter(id => id !== productId);
    saveToStorage(newItems);
  };

  const clearCompare = () => {
    saveToStorage([]);
  };

  const isInCompare = (productId: string) => {
    return compareItems.includes(productId);
  };

  return {
    compareItems,
    addToCompare,
    removeFromCompare,
    clearCompare,
    isInCompare,
    count: compareItems.length,
    maxItems: MAX_COMPARE_ITEMS,
  };
}
