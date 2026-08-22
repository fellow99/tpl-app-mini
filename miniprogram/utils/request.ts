// 统一 HTTP 请求封装
// - 自动携带 Token（Authorization: Bearer <token>）
// - 401 拦截：清除本地 Token，跳转登录页
// - 统一错误 toast
//
// 注意：AES+RSA 加密（FR-002-007 / NFR-002-002）待 NC-003 密钥协商方案确定后，
// 在 utils/crypto.ts 中实现并在本处接入（设置 isEncrypt 头 + 加密 body）。

import { storage } from './storage'
import { ENCRYPT_ENABLED, encryptRequest } from './crypto'
import { BASE_URL } from '../config'
import { t, translateApiMessage } from './i18n'

/** 请求超时时间（毫秒） */
const REQUEST_TIMEOUT = 10000

/** 401 处理进行中标记：避免多个并发请求同时触发重复 toast 与跳转 */
let handling401 = false

export interface RequestOptions {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  data?: WechatMiniprogram.IAnyObject
  /** 是否需要携带 Token（默认 true） */
  needAuth?: boolean
}

export function request<T>(options: RequestOptions): Promise<T> {
  const { url, method = 'GET', data, needAuth = true } = options

  return new Promise<T>((resolve, reject) => {
    const token = storage.getToken()
    const header: WechatMiniprogram.IAnyObject = {
      'Content-Type': 'application/json',
    }
    if (needAuth && token) {
      // 统一裸 token（无 "Bearer " 前缀）：后端 Sa-Token 未配置 token-prefix
      header.Authorization = token
    }

    // 加密请求体（AES+RSA 待 NC-003 密钥协商方案确定后启用，当前 ENCRYPT_ENABLED=false 透传）
    let payload: string | WechatMiniprogram.IAnyObject | undefined = data
    if (ENCRYPT_ENABLED && data) {
      const encrypted = encryptRequest(data)
      payload = encrypted.data
      Object.assign(header, encrypted.headers)
    }

    wx.request({
      url: BASE_URL + url,
      method,
      data: payload,
      header,
      timeout: REQUEST_TIMEOUT,
      success(res) {
        // Token 过期 / 未登录
        if (res.statusCode === 401) {
          storage.clearAuth()
          const app = getApp<IAppOption>()
          app.globalData.token = ''
          app.globalData.userInfo = null
          app.globalData.isLoggedIn = false
          if (!handling401) {
            handling401 = true
            wx.showToast({ title: t('message.error.unauthorized'), icon: 'none', duration: 2000 })
            setTimeout(() => {
              wx.redirectTo({ url: '/pages/login/login' })
              handling401 = false
            }, 2000)
          }
          reject(new Error('Token expired'))
          return
        }

        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data as T)
        } else {
          const msg = extractErrorMsg(res.data)
          wx.showToast({ title: translateApiMessage(msg), icon: 'none' })
          reject(new Error(msg))
        }
      },
      fail() {
        wx.showToast({ title: t('message.error.network'), icon: 'none' })
        reject(new Error('Network error'))
      },
    })
  })
}

/** 从错误响应中提取可展示的错误信息（返回 i18n key，由调用方翻译） */
function extractErrorMsg(data: string | WechatMiniprogram.IAnyObject | ArrayBuffer): string {
  if (data && typeof data === 'object') {
    const msg = (data as { msg?: unknown }).msg
    if (typeof msg === 'string' && msg) {
      return msg
    }
  }
  return 'message.error.serverBusy'
}
