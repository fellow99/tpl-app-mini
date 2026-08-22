// app.ts
import { storage } from './utils/storage'
import { request } from './utils/request'
import { getLocale } from './utils/i18n'
import { applyTheme } from './utils/theme'

App<IAppOption>({
  globalData: {
    token: '',
    userInfo: null,
    isLoggedIn: false,
  },
  onLaunch() {
    // 多语言初始化：读取语言偏好
    getLocale()

    // 主题初始化：解析三态（system 读系统深浅色）+ 联动导航栏颜色
    applyTheme()

    // 系统深浅色变化实时联动（system 态跟随系统；强制态无影响）
    wx.onThemeChange(() => {
      applyTheme()
    })

    // 展示本地存储能力（001-app-shell 保留）
    const logs: number[] = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    // 登录态初始化：从本地存储恢复 token 与用户信息
    const token = storage.getToken()
    if (token) {
      this.globalData.token = token
      this.globalData.userInfo = storage.getUserInfo()
      this.globalData.isLoggedIn = true
      // 校验 Token 有效性（FR-002-021）
      request<ApiResponse<UserInfo>>({ url: '/system/user/getInfo' })
        .then((res) => {
          if (res.code === 200) {
            this.globalData.userInfo = res.data
            this.globalData.isLoggedIn = true
            storage.setUserInfo(res.data)
          }
        })
        .catch(() => {
          // 401 或网络异常：request 模块内部已 toast 并跳转登录页
        })
    }
  },
})
