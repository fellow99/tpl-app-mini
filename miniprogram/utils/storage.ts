// 本地存储统一管理：读写函数
// key 常量统一由主配置文件 miniprogram/config.ts 提供（constitution.md 3.4）

import { STORAGE_KEYS } from '../config'

export const storage = {
  // ---- Token ----
  getToken(): string {
    return wx.getStorageSync(STORAGE_KEYS.TOKEN) || ''
  },
  setToken(token: string): void {
    wx.setStorageSync(STORAGE_KEYS.TOKEN, token)
  },
  removeToken(): void {
    wx.removeStorageSync(STORAGE_KEYS.TOKEN)
  },

  // ---- 用户信息 ----
  getUserInfo(): UserInfo | null {
    const info = wx.getStorageSync(STORAGE_KEYS.USER_INFO)
    return (info || null) as UserInfo | null
  },
  setUserInfo(info: UserInfo): void {
    wx.setStorageSync(STORAGE_KEYS.USER_INFO, info)
  },
  removeUserInfo(): void {
    wx.removeStorageSync(STORAGE_KEYS.USER_INFO)
  },

  // ---- 主题 ----
  getTheme(): string {
    return wx.getStorageSync(STORAGE_KEYS.THEME) || ''
  },
  setTheme(theme: string): void {
    wx.setStorageSync(STORAGE_KEYS.THEME, theme)
  },
  removeTheme(): void {
    wx.removeStorageSync(STORAGE_KEYS.THEME)
  },

  /** 退出登录：清除全部认证相关缓存 */
  clearAuth(): void {
    this.removeToken()
    this.removeUserInfo()
  },
}
