// 主题皮肤工具（tpl-app-mini）
//
// 三态主题：light（浅色）/ dark（深色）/ system（跟随系统，默认）
// - getThemeMode()：读本地存储 'theme'，缺省 'system'
// - setThemeMode(mode)：写存储 + 应用主题
// - resolveTheme()：解析三态为生效的 light/dark（system 读 wx.getSystemInfoSync().theme）
// - applyTheme()：联动原生导航栏颜色（wx.setNavigationBarColor）
// - getThemeClass()：返回页面根节点主题 class（theme-light / theme-dark；system 态返回空串交 @media 处理）
// - getNavTheme()：返回当前生效主题的导航栏配色，供自定义 navigation-bar 组件绑定
//
// CSS 变量落点见 app.wxss（对齐父工程 specs/005-theme/var.md）。

import { storage } from './storage'

/** 三态主题模式 */
export type ThemeMode = 'light' | 'dark' | 'system'

/** 解析后的生效主题 */
export type ResolvedTheme = 'light' | 'dark'

const THEME_MODES: ThemeMode[] = ['light', 'dark', 'system']

/** 生效主题下导航栏配色（与 var.md §6 及 theme.json 对齐） */
const THEME_PALETTE: Record<
  ResolvedTheme,
  {
    navBackground: string
    navFront: string
  }
> = {
  light: {
    navBackground: '#FFFFFF',
    navFront: '#000000',
  },
  dark: {
    navBackground: '#26282B',
    navFront: '#FFFFFF',
  },
}

function isThemeMode(value: unknown): value is ThemeMode {
  return typeof value === 'string' && (THEME_MODES as string[]).includes(value)
}

/** 读系统深浅色（darkmode 开启后 wx.getSystemInfoSync().theme 返回 light/dark） */
export function getSystemTheme(): ResolvedTheme {
  try {
    return wx.getSystemInfoSync().theme === 'dark' ? 'dark' : 'light'
  } catch {
    // getSystemInfoSync 失败时默认亮色
    return 'light'
  }
}

/** 读主题偏好（本地存储优先，缺省 system） */
export function getThemeMode(): ThemeMode {
  const stored = storage.getTheme()
  return isThemeMode(stored) ? stored : 'system'
}

/** 解析三态为生效主题：system → 系统深浅色；light/dark → 强制 */
export function resolveTheme(): ResolvedTheme {
  const mode = getThemeMode()
  return mode === 'system' ? getSystemTheme() : mode
}

/** 页面根节点主题 class：system 态返回空串（交 @media 跟随系统）；强制态返回对应 class */
export function getThemeClass(): string {
  const mode = getThemeMode()
  if (mode === 'system') {
    return ''
  }
  return mode === 'dark' ? 'theme-dark' : 'theme-light'
}

/** 当前生效主题的导航栏配色（供自定义 navigation-bar 组件绑定 background/color） */
export function getNavTheme(): { background: string; color: string } {
  const p = THEME_PALETTE[resolveTheme()]
  return { background: p.navBackground, color: p.navFront }
}

/** 联动系统 UI 配色：原生导航栏（custom 导航栏下 setNavigationBarColor 为 no-op，try/catch 兜底） */
export function applyTheme(): void {
  const p = THEME_PALETTE[resolveTheme()]
  try {
    wx.setNavigationBarColor({
      backgroundColor: p.navBackground,
      frontColor: p.navFront,
    })
  } catch {
    // navigationStyle: custom 下无原生导航栏，忽略
  }
}

/** 切换主题：写存储 + 应用（各页面通过 onShow 的 refreshTheme 刷新自身 class 与导航栏） */
export function setThemeMode(mode: ThemeMode): void {
  storage.setTheme(mode)
  applyTheme()
}
