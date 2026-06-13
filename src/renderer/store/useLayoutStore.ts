import { create } from 'zustand'
import { LayoutItem, AppLayout, DEFAULT_LAYOUT } from '../types/layout'

/**
 * Migrate old layouts (with a single 'vu-meter' panel) into two stereo VU meters.
 */
function migrateLayout(layout: LayoutItem[]): LayoutItem[] {
  const vuIndex = layout.findIndex(item => item.i === 'vu-meter')
  if (vuIndex === -1) return layout

  const vuItem = layout[vuIndex]
  const leftW = Math.floor(vuItem.w / 2)
  const rightW = vuItem.w - leftW
  const minW = vuItem.minW || 3

  const newItems = layout
    .filter(item => item.i !== 'vu-meter')
    .slice()

  newItems.splice(vuIndex, 0,
    { i: 'vu-meter-left', x: vuItem.x, y: vuItem.y, w: leftW, h: vuItem.h, minW, minH: vuItem.minH },
    { i: 'vu-meter-right', x: vuItem.x + leftW, y: vuItem.y, w: rightW, h: vuItem.h, minW, minH: vuItem.minH }
  )

  return newItems
}

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
  currentLayout: migrateLayout(DEFAULT_LAYOUT),
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
      set({ currentLayout: migrateLayout([...layout.items]) })
    }
  },

  deleteLayout: (id) => {
    set(state => ({
      savedLayouts: state.savedLayouts.filter(l => l.id !== id)
    }))
  },

  setIsEditing: (editing) => set({ isEditing: editing }),

  resetLayout: () => set({ currentLayout: migrateLayout(DEFAULT_LAYOUT) })
}))
