export type Lang = 'zh' | 'en'

type TranslationRecord = Record<string, string>

const zh: TranslationRecord = {
  'app.title': 'UVMeter',
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
  'source.blackhole': 'BlackHole',
  'source.notDetected': '（未检测到）',

  // Panels
  'panel.vumeter': 'VU 电平表',
  'panel.led': 'LED 频谱',
  'panel.waveform': '波形图',

  // Theme panel
  'theme.title': '主题设置',
  'theme.presets': '预设主题',
  'theme.custom': '自定义',
  'theme.close': '关闭',

  // Errors
  'error.noAudioTrack': '桌面捕获未包含音频轨道。\n\n请授予屏幕录制权限：\n系统设置 > 隐私与安全性 > 屏幕录制\n添加并启用此应用，然后重新启动。',
  'error.noBlackhole': '未找到 BlackHole 虚拟音频设备。\n\n安装 BlackHole 后，在音频 MIDI 设置中创建多输出设备。',
  'error.noSources': '未找到屏幕源。请检查屏幕录制权限。',
}

const en: TranslationRecord = {
  'app.title': 'UVMeter',
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
  'source.desktop': 'Desktop Audio (Capturer)',
  'source.blackhole': 'BlackHole',
  'source.notDetected': ' (not detected)',

  // Panels
  'panel.vumeter': 'VU METER',
  'panel.led': 'LED SPECTRUM',
  'panel.waveform': 'WAVEFORM',

  // Theme panel
  'theme.title': 'Theme Settings',
  'theme.presets': 'Presets',
  'theme.custom': 'Custom',
  'theme.close': 'Close',

  // Errors
  'error.noAudioTrack': 'No audio track in desktop capture.\n\nPlease grant screen recording permission:\nSystem Settings > Privacy & Security > Screen Recording\nAdd and enable this app, then restart.',
  'error.noBlackhole': 'BlackHole virtual audio device not found.\n\nInstall BlackHole and create a multi-output device in Audio MIDI Setup.',
  'error.noSources': 'No screen sources found. Please check screen recording permission.',
}

export const translations: Record<Lang, TranslationRecord> = { zh, en }
