export interface LayoutItem {
  i: string
  x: number
  y: number
  w: number
  h: number
  minW?: number
  minH?: number
}

export interface AppLayout {
  id: string
  name: string
  items: LayoutItem[]
  cols: number
}

export const DEFAULT_LAYOUT: LayoutItem[] = [
  { i: 'vu-meter', x: 0, y: 0, w: 4, h: 6, minW: 3, minH: 4 },
  { i: 'led-array', x: 4, y: 0, w: 4, h: 6, minW: 3, minH: 4 },
  { i: 'waveform', x: 0, y: 6, w: 12, h: 4, minW: 4, minH: 2 }
]
