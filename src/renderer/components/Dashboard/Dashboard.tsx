import React, { useCallback, useEffect, useRef, useState } from 'react'
import GridLayout, { WidthProvider } from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import VUMeterLeft from '../VUMeter/VUMeterLeft'
import VUMeterRight from '../VUMeter/VUMeterRight'
import LEDArray from '../LEDArray/LEDArray'
import Waveform from '../Waveform/Waveform'
import { useLayoutStore } from '../../store/useLayoutStore'
import { useI18n } from '../../i18n/useI18n'
import { LayoutItem } from '../../types/layout'

const ResponsiveGridLayout = WidthProvider(GridLayout)

const componentMap: Record<string, React.FC> = {
  'vu-meter-left': VUMeterLeft,
  'vu-meter-right': VUMeterRight,
  'led-array': LEDArray,
  'waveform': Waveform
}

const Dashboard: React.FC = () => {
  const currentLayout = useLayoutStore(s => s.currentLayout)
  const setLayout = useLayoutStore(s => s.setLayout)
  const { t } = useI18n()
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(1200)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        const w = entry.contentRect.width
        if (w > 0) setContainerWidth(w)
      }
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const componentLabels: Record<string, string> = {
    'vu-meter-left': t('panel.vumeterLeft'),
    'vu-meter-right': t('panel.vumeterRight'),
    'led-array': t('panel.led'),
    'waveform': t('panel.waveform')
  }

  const handleLayoutChange = useCallback((layout: GridLayout.Layout[]) => {
    const items: LayoutItem[] = layout.map(item => ({
      i: item.i,
      x: item.x,
      y: item.y,
      w: item.w,
      h: item.h
    }))
    setLayout(items)
  }, [setLayout])

  const gridWidth = containerWidth > 0 ? containerWidth - 16 : 1200

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%', padding: 8, overflow: 'auto' }}
    >
      <ResponsiveGridLayout
        className="layout"
        layout={currentLayout.map(item => ({ ...item, static: false }))}
        cols={12}
        rowHeight={40}
        width={gridWidth}
        onLayoutChange={handleLayoutChange}
        draggableHandle=".drag-handle"
        // REMOVED: compactType — it snaps panels back, blocking drag/resize
        isResizable={true}
        isDraggable={true}
        margin={[8, 8]}
        useCSSTransforms={true}
        resizeHandles={['se']}
      >
        {currentLayout.map(item => {
          const Component = componentMap[item.i]
          const label = componentLabels[item.i] || item.i
          if (!Component) return null

          return (
            <div key={item.i} className="panel-wrapper">
              {/* Header bar — drag handle */}
              <div
                className="drag-handle"
                style={{
                  padding: '4px 12px',
                  fontSize: 10,
                  fontWeight: 600,
                  color: 'oklch(1 0 0 / 0.55)',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  cursor: 'grab',
                  userSelect: 'none',
                  borderBottom: '1px solid oklch(1 0 0 / 0.06)',
                  background: 'oklch(1 0 0 / 0.02)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexShrink: 0,
                  minHeight: 28,
                  zIndex: 1
                }}
              >
                <span>{label}</span>
                <span style={{ fontSize: 9, opacity: 0.5 }} aria-hidden="true">⋮⋮</span>
              </div>

              {/* Canvas content — fills remaining space */}
              <div style={{
                flex: 1,
                minHeight: 0,
                overflow: 'hidden',
                background: 'oklch(1 0 0 / 0.03)',
                borderRadius: '0 0 8px 8px',
                border: '1px solid oklch(1 0 0 / 0.08)',
                borderTop: 'none'
              }}>
                <Component />
              </div>
            </div>
          )
        })}
      </ResponsiveGridLayout>
    </div>
  )
}

export default Dashboard
