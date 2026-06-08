import { useState, useCallback } from "react";

const STORAGE_KEY = "calc_onboarding_v1";

interface OnboardingState {
  welcomeDismissed: boolean;
  firstResultCelebrated: boolean;
  decorHintSeen: boolean;
  insulationHintSeen: boolean;
  saveHintSeen: boolean;
  exportHintSeen: boolean;
  pricingHintSeen: boolean;
}

function loadState(): OnboardingState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as OnboardingState;
  } catch {
    /* ignore corrupt data */
  }
  return {
    welcomeDismissed: false,
    firstResultCelebrated: false,
    decorHintSeen: false,
    insulationHintSeen: false,
    saveHintSeen: false,
    exportHintSeen: false,
    pricingHintSeen: false,
  };
}

function saveState(s: OnboardingState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    /* storage full or unavailable */
  }
}

export function useCalculatorOnboarding() {
  const [state, setState] = useState<OnboardingState>(loadState);

  const update = useCallback((patch: Partial<OnboardingState>) => {
    setState((prev) => {
      const next = { ...prev, ...patch };
      saveState(next);
      return next;
    });
  }, []);

  const dismissWelcome = useCallback(() => update({ welcomeDismissed: true }), [update]);
  const markFirstResultCelebrated = useCallback(() => update({ firstResultCelebrated: true }), [update]);
  const dismissDecorHint = useCallback(() => update({ decorHintSeen: true }), [update]);
  const dismissInsulationHint = useCallback(() => update({ insulationHintSeen: true }), [update]);
  const dismissSaveHint = useCallback(() => update({ saveHintSeen: true }), [update]);
  const dismissExportHint = useCallback(() => update({ exportHintSeen: true }), [update]);
  const dismissPricingHint = useCallback(() => update({ pricingHintSeen: true }), [update]);

  const isNewUser = !state.welcomeDismissed && !state.firstResultCelebrated;

  return {
    state,
    isNewUser,
    dismissWelcome,
    markFirstResultCelebrated,
    dismissDecorHint,
    dismissInsulationHint,
    dismissSaveHint,
    dismissExportHint,
    dismissPricingHint,
  };
}
