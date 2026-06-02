import { useState, useEffect } from 'react';

const STORAGE_KEY = 'transleitor_settings';

const defaultSettings = {
  theme: 'dark',
  customChips: [],
};

export function useSettings() {
  const [settings, setSettings] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? { ...defaultSettings, ...JSON.parse(stored) } : defaultSettings;
    } catch {
      return defaultSettings;
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    const root = document.documentElement;
    if (settings.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [settings]);

  const setTheme = (theme) => setSettings(s => ({ ...s, theme }));

  const addCustomChip = (chip) => {
    const trimmed = chip.trim();
    if (!trimmed || settings.customChips.includes(trimmed)) return;
    setSettings(s => ({ ...s, customChips: [...s.customChips, trimmed] }));
  };

  const removeCustomChip = (chip) => {
    setSettings(s => ({ ...s, customChips: s.customChips.filter(c => c !== chip) }));
  };

  return { settings, setTheme, addCustomChip, removeCustomChip };
}