import { create } from 'zustand'
import { LayoutItem, AppLayout, DEFAULT_LAYOUT } from '../types/layout'

interface LayoutState {
  currentLayout: LayoutItem[]
  savedLayouts: AppLayout[]
  isEditing: boolean

  setLayout: (layout: LayoutItem[]) => void
  saveLayout: (name: string) => void
  loadLayout: (id: string) => void
  deleteLayout: (id: string) => void
  setIsEditing: (editing: boolean) => void
  resetLayout: () => void
}

export const useLayoutStore = create<LayoutState>((set, get) => ({
  currentLayout: DEFAULT_LAYOUT,
  savedLayouts: [],
  isEditing: false,

  setLayout: (layout) => set({ currentLayout: layout }),

  saveLayout: (name) => {
    const { currentLayout } = get()
    const newLayout: AppLayout = {
      id: `layout-${Date.now()}`,
      name,
      items: [...currentLayout],
      cols: 12
    }
    set(state => ({
      savedLayouts: [...state.savedLayouts, newLayout]
    }))
  },

  loadLayout: (id) => {
    const layout = get().savedLayouts.find(l => l.id === id)
    if (layout) {
      set({ currentLayout: [...layout.items] })
    }
  },

  deleteLayout: (id) => {
    set(state => ({
      savedLayouts: state.savedLayouts.filter(l => l.id !== id)
    }))
  },

  setIsEditing: (editing) => set({ isEditing: editing }),

  resetLayout: () => set({ currentLayout: DEFAULT_LAYOUT })
}))
