// 本工程主配置文件：存放各种全局配置参数（单一来源）。
// - 功能开关、本地存储 key、环境相关 API 地址等集中于此
// - 目录约定见 specs/constitution.md §1.3

/** 微信一键登录开关：控制登录页「微信一键登录」按钮显隐 */
export const WECHAT_LOGIN_ENABLED = true

/** 本地存储 key 统一管理，避免散落字符串（constitution.md §3.4） */
export const STORAGE_KEYS = {
  TOKEN: 'token',
  USER_INFO: 'user_info',
  LANGUAGE: 'language',
  THEME: 'theme',
} as const

/**
 * 后端基础地址：按运行环境区分（单一来源，全站接口统一使用）。
 * - 正式版（release）：公网地址 https://www.example.com
 * - 开发版/体验版（develop/trial）：内网地址 http://127.0.0.1:38088
 * 注：正式版需在微信后台将 https://www.example.com 配置为 request 合法域名。
 */
export const BASE_URL = getBaseUrl()

/** 按小程序运行环境返回 API 基础地址 */
export function getBaseUrl(): string {
  const envVersion = wx.getAccountInfoSync().miniProgram.envVersion
  return envVersion === 'release'
    ? 'https://www.example.com'
    : 'http://127.0.0.1:38088'
}
