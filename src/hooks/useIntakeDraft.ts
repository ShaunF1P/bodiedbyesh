"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export interface IntakeDraftState<T> {
  formData: T;
  updateFormData: (updater: Partial<T> | ((prev: T) => T)) => void;
  setFormData: React.Dispatch<React.SetStateAction<T>>;
  hasDraftRestored: boolean;
  draftTimestamp: string | null;
  isSaving: boolean;
  clearDraft: () => void;
  dismissRestoredBanner: () => void;
}

interface DraftPayload<T> {
  data: T;
  updatedAt: string;
}

/**
 * Type-safe client-side draft auto-save and restore hook.
 * Uses isolated localStorage keys, 500ms debounced persistence,
 * and SSR hydration safety.
 */
export function useIntakeDraft<T>(track: string, initialValues: T): IntakeDraftState<T> {
  const storageKey = `draft_intake_${track}`;
  const [formData, setFormData] = useState<T>(initialValues);
  const [hasDraftRestored, setHasDraftRestored] = useState(false);
  const [draftTimestamp, setDraftTimestamp] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitializedRef = useRef(false);

  // 1. Restore draft on initial client mount
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const raw = localStorage.getItem(storageKey);
        if (raw) {
          const parsed = JSON.parse(raw) as DraftPayload<T>;
          if (parsed && parsed.data && parsed.updatedAt) {
            setFormData(parsed.data);
            setDraftTimestamp(parsed.updatedAt);
            setHasDraftRestored(true);
          }
        }
      }
    } catch (err) {
      console.warn(`[useIntakeDraft] Failed to restore intake draft for key ${storageKey}`, err);
    } finally {
      isInitializedRef.current = true;
    }
  }, [storageKey]);

  // 2. Debounced auto-save (500ms delay)
  const updateFormData = useCallback(
    (updater: Partial<T> | ((prev: T) => T)) => {
      setFormData((prev) => {
        const next = typeof updater === "function" ? (updater as (prev: T) => T)(prev) : { ...prev, ...updater };

        setIsSaving(true);
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
        }

        saveTimeoutRef.current = setTimeout(() => {
          try {
            if (typeof window !== "undefined") {
              const payload: DraftPayload<T> = {
                data: next,
                updatedAt: new Date().toISOString(),
              };
              localStorage.setItem(storageKey, JSON.stringify(payload));
            }
          } catch (err) {
            console.warn(`[useIntakeDraft] Failed to persist intake draft for key ${storageKey}`, err);
          } finally {
            setIsSaving(false);
          }
        }, 500);

        return next;
      });
    },
    [storageKey]
  );

  // 3. Clear draft from localStorage and reset to initialValues
  const clearDraft = useCallback(() => {
    try {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      if (typeof window !== "undefined") {
        localStorage.removeItem(storageKey);
      }
      setFormData(initialValues);
      setHasDraftRestored(false);
      setDraftTimestamp(null);
      setIsSaving(false);
    } catch (err) {
      console.warn(`[useIntakeDraft] Failed to clear intake draft for key ${storageKey}`, err);
    }
  }, [storageKey, initialValues]);

  const dismissRestoredBanner = useCallback(() => {
    setHasDraftRestored(false);
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return {
    formData,
    updateFormData,
    setFormData,
    hasDraftRestored,
    draftTimestamp,
    isSaving,
    clearDraft,
    dismissRestoredBanner,
  };
}
