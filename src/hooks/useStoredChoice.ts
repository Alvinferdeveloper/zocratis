import { useCallback, useEffect, useState } from "react";
import { readStoredPreference, writeStoredPreference } from "@/lib/stored-preference";

// One of a fixed set of options, remembered in this browser; stored values no longer in the set fall back.
export const useStoredChoice = <T extends string>(key: string, options: readonly T[], fallback: T) => {
  const [value, setValue] = useState<T>(fallback);

  useEffect(() => {
    const stored = readStoredPreference(key);
    setValue(options.includes(stored as T) ? (stored as T) : fallback);
    // The options are a constant list; re-reading only when the key changes.
  }, [key, fallback]);

  const choose = useCallback(
    (next: T) => {
      setValue(next);
      writeStoredPreference(key, next);
    },
    [key]
  );

  return [value, choose] as const;
};
