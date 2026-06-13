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
  { i: 'vu-meter-left', x: 0, y: 0, w: 6, h: 6, minW: 4, minH: 4 },
  { i: 'vu-meter-right', x: 6, y: 0, w: 6, h: 6, minW: 4, minH: 4 },
  { i: 'led-array', x: 0, y: 6, w: 6, h: 4, minW: 3, minH: 2 },
  { i: 'waveform', x: 6, y: 6, w: 6, h: 4, minW: 3, minH: 2 }
]
