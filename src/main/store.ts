import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import { app } from 'electron'

interface PersistedData {
  windowBounds: { width: number; height: number; x?: number; y?: number }
  layout: Record<string, unknown>
  theme: Record<string, unknown>
  layouts: unknown[]
  themes: unknown[]
}

const configDir = join(app.getPath('userData'), 'config')
const configPath = join(configDir, 'vu-meter-config.json')

const defaults: PersistedData = {
  windowBounds: { width: 1200, height: 800 },
  layout: {},
  theme: {},
  layouts: [],
  themes: []
}

let cache: PersistedData | null = null

function load(): PersistedData {
  if (cache) return cache
  try {
    if (existsSync(configPath)) {
      const raw = readFileSync(configPath, 'utf-8')
      cache = { ...defaults, ...JSON.parse(raw) }
      return cache!
    }
  } catch {
    // Corrupt file, start fresh
  }
  cache = { ...defaults }
  return cache
}

function save(): void {
  if (!existsSync(configDir)) {
    mkdirSync(configDir, { recursive: true })
  }
  writeFileSync(configPath, JSON.stringify(cache ?? defaults, null, 2), 'utf-8')
}

// Initialize
load()

export function getStoredWindowBounds(): { width: number; height: number; x?: number; y?: number } {
  return load().windowBounds
}

export function setStoredWindowBounds(bounds: { width: number; height: number; x?: number; y?: number }): void {
  const data = load()
  data.windowBounds = bounds
  cache = data
  save()
}

export function getConfig(key: keyof PersistedData): unknown {
  return load()[key]
}

export function setConfig(key: keyof PersistedData, value: unknown): void {
  const data = load()
  ;(data as Record<string, unknown>)[key] = value
  cache = data
  save()
}
