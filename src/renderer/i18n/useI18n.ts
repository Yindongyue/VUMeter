import { create } from 'zustand'
import { Lang, translations } from './translations'

interface I18nState {
  lang: Lang
  setLang: (lang: Lang) => void
  t: (key: string) => string
}

export const useI18n = create<I18nState>((set, get) => ({
  lang: 'zh',

  setLang: (lang: Lang) => set({ lang }),

  t: (key: string): string => {
    const { lang } = get()
    return translations[lang][key] ?? key
  },
}))
