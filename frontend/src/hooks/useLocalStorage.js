import { useState, useEffect } from "react";

export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const saved = localStorage.getItem(key);
      if (saved !== null) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn("LocalStorage read error", e);
    }
    return typeof initialValue === "function" ? initialValue() : initialValue;
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn("LocalStorage write error", e);
    }
  }, [key, value]);

  return [value, setValue];
}
