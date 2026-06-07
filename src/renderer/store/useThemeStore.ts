import { create } from 'zustand'
import { ColorTheme, PRESET_THEMES } from '../types/theme'

interface ThemeState {
  currentTheme: ColorTheme
  presets: ColorTheme[]
  customThemes: ColorTheme[]

  setTheme: (theme: ColorTheme) => void
  applyPreset: (id: string) => void
  setColor: (key: keyof ColorTheme, value: string) => void
  saveCustomTheme: (theme: ColorTheme) => void
  deleteCustomTheme: (id: string) => void
  resetToPreset: () => void
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  currentTheme: PRESET_THEMES[0],
  presets: PRESET_THEMES,
  customThemes: [],

  setTheme: (theme) => set({ currentTheme: theme }),

  applyPreset: (id) => {
    const preset = PRESET_THEMES.find(t => t.id === id)
    if (preset) {
      set({ currentTheme: { ...preset } })
    }
  },

  setColor: (key, value) => {
    set(state => ({
      currentTheme: { ...state.currentTheme, [key]: value }
    }))
  },

  saveCustomTheme: (theme) => {
    set(state => ({
      customThemes: [...state.customThemes.filter(t => t.id !== theme.id), theme]
    }))
  },

  deleteCustomTheme: (id) => {
    set(state => ({
      customThemes: state.customThemes.filter(t => t.id !== id)
    }))
  },

  resetToPreset: () => {
    const preset = PRESET_THEMES.find(t => t.id === get().currentTheme.id)
    if (preset) {
      set({ currentTheme: { ...preset } })
    }
  }
}))
