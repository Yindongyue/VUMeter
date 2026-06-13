export type Lang = 'zh' | 'en'

type TranslationRecord = Record<string, string>

const zh: TranslationRecord = {
  'app.title': 'VU-Meter',
  'app.start': '开始',
  'app.stop': '停止',
  'app.theme': '主题',
  'app.save': '保存',
  'app.export': '导出',
  'app.import': '导入',
  'app.reset': '重置',
  'app.saveLayout': '保存布局',
  'app.importLayout': '导入布局',
  'app.exportLayout': '导出布局',

  // Audio source
  'source.desktop': '桌面音频（捕获）',
  'source.blackhole': 'BlackHole（macOS）',
  'source.notDetected': '（未检测到）',
  'source.windowsHint': '请在系统弹窗中选择「屏幕」并勾选「共享音频」',
  'source.macosHint': '请确保在屏幕录制弹窗中勾选「包含音频」',

  // Panels
  'panel.vumeterLeft': 'VU 电平表 L',
  'panel.vumeterRight': 'VU 电平表 R',
  'panel.led': 'LED 频谱',
  'panel.waveform': '波形图',

  // Theme panel
  'theme.title': '主题设置',
  'theme.presets': '预设主题',
  'theme.custom': '自定义',
  'theme.close': '关闭',

  // Errors — Windows
  'error.win.noAudioTrack': '桌面捕获未包含音频轨道。\n\n在系统弹窗中请选择「屏幕」（而非应用窗口），\n并勾选底部的「共享音频」复选框，\n然后点击「共享」。',
  'error.win.noSources': '未找到可共享的屏幕源。',

  // Errors — macOS
  'error.mac.noAudioTrack': '桌面捕获未包含音频轨道。\n\n请确认在屏幕共享弹窗中勾选了「包含音频」，\n并检查屏幕录制权限：\n系统设置 > 隐私与安全性 > 屏幕录制\n添加并启用此应用后重新启动。',
  'error.mac.noBlackhole': '未找到 BlackHole 虚拟音频设备。\n\n安装 BlackHole 后，在「音频 MIDI 设置」中创建多输出设备。',
  'error.mac.noSources': '未找到屏幕源。请检查屏幕录制权限。',

  // Fallback
  'error.generic.noAudioTrack': '桌面捕获未包含音频轨道。\n\n请在系统弹窗中选择「屏幕」并确保勾选了音频共享选项。',
  'error.generic.noSources': '未找到屏幕源。',
}

const en: TranslationRecord = {
  'app.title': 'VU-Meter',
  'app.start': 'START',
  'app.stop': 'STOP',
  'app.theme': 'Theme',
  'app.save': 'Save',
  'app.export': 'Export',
  'app.import': 'Import',
  'app.reset': 'Reset',
  'app.saveLayout': 'Save Layout',
  'app.importLayout': 'Import Layout',
  'app.exportLayout': 'Export Layout',

  // Audio source
  'source.desktop': 'Desktop Audio (Capture)',
  'source.blackhole': 'BlackHole (macOS)',
  'source.notDetected': ' (not detected)',
  'source.windowsHint': 'In the picker, select a "Screen" and check "Share audio"',
  'source.macosHint': 'In the picker, make sure "Include audio" is checked',

  // Panels
  'panel.vumeterLeft': 'VU METER L',
  'panel.vumeterRight': 'VU METER R',
  'panel.led': 'LED SPECTRUM',
  'panel.waveform': 'WAVEFORM',

  // Theme panel
  'theme.title': 'Theme Settings',
  'theme.presets': 'Presets',
  'theme.custom': 'Custom',
  'theme.close': 'Close',

  // Errors — Windows
  'error.win.noAudioTrack': 'Desktop capture has no audio track.\n\nIn the system picker, select a "Screen" (not a window),\ncheck "Share audio" at the bottom, then click "Share".',
  'error.win.noSources': 'No screen sources found.',

  // Errors — macOS
  'error.mac.noAudioTrack': 'Desktop capture has no audio track.\n\nPlease check "Include audio" in the sharing dialog\nand grant screen recording permission:\nSystem Settings > Privacy & Security > Screen Recording',
  'error.mac.noBlackhole': 'BlackHole virtual audio device not found.\n\nInstall BlackHole and create a multi-output device\nin Audio MIDI Setup.',
  'error.mac.noSources': 'No screen sources found. Check screen recording permission.',

  // Fallback
  'error.generic.noAudioTrack': 'Desktop capture has no audio track.\n\nPlease select a "Screen" in the system picker\nand make sure audio sharing is enabled.',
  'error.generic.noSources': 'No screen sources found.',
}

export const translations: Record<Lang, TranslationRecord> = { zh, en }

/** Detect platform for OS-specific error messages */
export function detectPlatform(): 'win' | 'mac' | 'other' {
  const ua = navigator.userAgent.toLowerCase()
  if (ua.includes('win')) return 'win'
  if (ua.includes('mac')) return 'mac'
  return 'other'
}

/** Get the appropriate error translation key for the current platform */
export function getErrorKey(errorType: 'noAudioTrack' | 'noSources'): string {
  const platform = detectPlatform()
  if (platform === 'win') return `error.win.${errorType}`
  if (platform === 'mac') return `error.mac.${errorType}`
  return `error.generic.${errorType}`
}
