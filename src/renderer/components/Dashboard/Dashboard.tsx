import React, { useCallback, useEffect, useRef, useState } from 'react'
import GridLayout, { WidthProvider } from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import VUMeter from '../VUMeter/VUMeter'
import LEDArray from '../LEDArray/LEDArray'
import Waveform from '../Waveform/Waveform'
import { useLayoutStore } from '../../store/useLayoutStore'
import { useI18n } from '../../i18n/useI18n'
import { LayoutItem } from '../../types/layout'

const ResponsiveGridLayout = WidthProvider(GridLayout)

const componentMap: Record<string, React.FC> = {
  'vu-meter': VUMeter,
  'led-array': LEDArray,
  'waveform': Waveform
}

const Dashboard: React.FC = () => {
  const currentLayout = useLayoutStore(s => s.currentLayout)
  const setLayout = useLayoutStore(s => s.setLayout)
  const { t } = useI18n()
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(1200)

  // Track container width with ResizeObserver for real-time responsiveness
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
    'vu-meter': t('panel.vumeter'),
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

  // Use container width minus padding, with a fallback
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
        compactType="vertical"
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
            <div key={item.i} style={{
              background: 'rgba(255,255,255,0.03)',
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.08)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <div
                className="drag-handle"
                style={{
                  padding: '4px 10px',
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'rgba(255,255,255,0.4)',
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                  cursor: 'grab',
                  userSelect: 'none',
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                  background: 'rgba(255,255,255,0.02)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexShrink: 0
                }}
              >
                <span>{label}</span>
                <span style={{ fontSize: 10, opacity: 0.5 }}>⋮⋮</span>
              </div>
              <div style={{ flex: 1, minHeight: 0 }}>
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
