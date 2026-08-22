// 多语言工具（tpl-app-mini）
//
// - getLocale()：读本地存储 'language'，缺省回退到系统语言并归一化
// - setLocale()：写存储
// - t()：按当前语料取词，未命中回退原 key（或 zh-CN 兜底）
// - translateApiMessage()：后端 R.msg（i18n key）→ 前端译文
//
// 语料模块见 miniprogram/i18n/{zh-CN,en-US,zh-TW}.ts（由父工程 i18n/ 同步生成）。

import zhCN from '../i18n/zh-CN'
import enUS from '../i18n/en-US'
import zhTW from '../i18n/zh-TW'
import { STORAGE_KEYS } from '../config'

/** 支持的语言（与语料目录 / 存储值一致） */
export type Locale = 'zh-CN' | 'en-US' | 'zh-TW'

/** 全部支持语言 */
export const LOCALES: Locale[] = ['zh-CN', 'en-US', 'zh-TW']

/** 语料对象：locale → 扁平 key → 文案 */
const MESSAGES: Record<Locale, Record<string, string>> = {
  'zh-CN': zhCN as Record<string, string>,
  'en-US': enUS as Record<string, string>,
  'zh-TW': zhTW as Record<string, string>,
}

/** 占位符插值参数类型 */
export type I18nArgs = Record<string, string | number>

function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as string[]).includes(value)
}

/**
 * 归一化系统语言为受支持的 locale。
 * wx.getSystemInfoSync().language 形如 'zh_CN' / 'zh-Hans-CN' / 'en' / 'zh_TW' 等。
 */
function normalizeSystemLocale(lang: string): Locale {
  const l = lang.toLowerCase()
  if (l.startsWith('zh') && (l.includes('tw') || l.includes('hk') || l.includes('mo') || l.includes('hant'))) {
    return 'zh-TW'
  }
  if (l.startsWith('zh')) {
    return 'zh-CN'
  }
  if (l.startsWith('en')) {
    return 'en-US'
  }
  return 'zh-CN'
}

/** 读取当前语言（本地存储优先，缺省跟随系统语言） */
export function getLocale(): Locale {
  const stored = wx.getStorageSync(STORAGE_KEYS.LANGUAGE)
  if (isLocale(stored)) {
    return stored
  }
  let systemLang = 'zh-CN'
  try {
    systemLang = wx.getSystemInfoSync().language || 'zh-CN'
  } catch {
    // getSystemInfoSync 失败时使用默认 zh-CN
  }
  return normalizeSystemLocale(systemLang)
}

/**
 * 切换语言：写存储。
 * 各页面通过 onShow 重新调用 t() 刷新自身文案；导航栏标题由页面 data 传入 t() 结果。
 */
export function setLocale(lang: Locale): void {
  wx.setStorageSync(STORAGE_KEYS.LANGUAGE, lang)
}

/** 占位符插值：{name} → args[name] */
function interpolate(template: string, args?: I18nArgs): string {
  if (!args) {
    return template
  }
  return template.replace(/\{(\w+)\}/g, (match, name: string) => {
    const value = args[name]
    return value === undefined || value === null ? match : String(value)
  })
}

/**
 * 取词：命中当前语料返回文案，否则回退 zh-CN，再否则回退原 key。
 * 支持 {name} 占位符（args 对象按名替换）。
 */
export function t(key: string, args?: I18nArgs): string {
  const current = MESSAGES[getLocale()]
  let template = current[key]
  if (typeof template !== 'string') {
    // zh-CN 为事实源兜底（三语言 key 一致时不会走到）
    template = MESSAGES['zh-CN'][key]
  }
  if (typeof template !== 'string') {
    return key
  }
  return interpolate(template, args)
}

/**
 * 后端 R.msg（i18n key）→ 前端译文。
 * 与 t 同逻辑；msg 为空时返回空串（调用方自行兜底）。
 */
export function translateApiMessage(msg?: string, args?: I18nArgs): string {
  if (!msg) {
    return ''
  }
  return t(msg, args)
}
