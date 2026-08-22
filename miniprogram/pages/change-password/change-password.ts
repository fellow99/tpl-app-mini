// 修改密码页：当前密码 / 新密码 / 确认新密码 + 短信验证码 + 图形验证码
import { request } from '../../utils/request'
import { storage } from '../../utils/storage'
import { isValidPassword } from '../../utils/validator'
import { t, translateApiMessage } from '../../utils/i18n'
import { getThemeClass, getNavTheme } from '../../utils/theme'

let smsTimer: number | null = null

Component({
  data: {
    oldPassword: '',
    newPassword: '',
    confirmNewPassword: '',
    smsCode: '',
    smsCountdown: 0,
    sendingSms: false,
    captchaInput: '',
    captchaImg: '',
    captchaUuid: '',
    captchaEnabled: true,
    captchaError: false,
    isLoading: false,
    isEmptyPassword: false,
    // 多语言文案（refreshI18n 填充）
    navTitle: '',
    oldPasswordLabel: '',
    oldPasswordPlaceholder: '',
    newPasswordLabel: '',
    newPasswordPlaceholder: '',
    confirmNewPasswordLabel: '',
    confirmNewPasswordPlaceholder: '',
    smsCodePlaceholder: '',
    captchaPlaceholder: '',
    captchaLoading: '',
    captchaRetry: '',
    getCodeText: '',
    submitText: '',
    // 主题（refreshTheme 填充）
    themeClass: '',
    navBg: '',
    navColor: '',
  },

  lifetimes: {
    attached() {
      this.refreshI18n()
      this.refreshTheme()
      this.fetchCaptcha()
      this.loadIsEmptyPassword()
    },
    detached() {
      if (smsTimer !== null) {
        clearInterval(smsTimer)
        smsTimer = null
      }
    },
  },

  pageLifetimes: {
    show() {
      this.refreshI18n()
      this.refreshTheme()
    },
  },

  methods: {
    /** 主题刷新：解析三态写入根节点 class + 导航栏配色 */
    refreshTheme() {
      const nav = getNavTheme()
      this.setData({
        themeClass: getThemeClass(),
        navBg: nav.background,
        navColor: nav.color,
      })
    },

    /** 多语言文案刷新 */
    refreshI18n() {
      this.setData({
        navTitle: t('auth.profile.changePassword'),
        oldPasswordLabel: t('common.oldPassword'),
        oldPasswordPlaceholder: t('message.error.currentPasswordRequired'),
        newPasswordLabel: t('common.newPassword'),
        // TODO(i18n)：语料无「≥6位，含字母和数字」占位键，暂复用注册页密码占位
        newPasswordPlaceholder: t('auth.register.passwordPlaceholder'),
        // TODO(i18n)：语料无「确认新密码/再次输入新密码」键，暂用 common.confirmPassword
        confirmNewPasswordLabel: t('common.confirmPassword'),
        confirmNewPasswordPlaceholder: t('common.confirmPassword'),
        smsCodePlaceholder: t('common.smsCode'),
        captchaPlaceholder: t('common.graphicCaptcha'),
        captchaLoading: t('common.loading'),
        captchaRetry: t('common.captcha.retry'),
        getCodeText: t('common.getCode'),
        submitText: t('auth.profile.submit'),
      })
    },

    async loadIsEmptyPassword() {
      try {
        const res = await request<ApiResponse<boolean>>({
          url: '/system/user/isEmptyPassword',
          method: 'GET',
        })
        if (res.code === 200) {
          this.setData({ isEmptyPassword: res.data })
        }
      } catch {
        this.setData({ isEmptyPassword: false })
      }
    },

    async fetchCaptcha() {
      try {
        const res = await request<ApiResponse<CaptchaResponse>>({
          url: '/auth/code',
          method: 'GET',
          needAuth: false,
        })
        if (res.code === 200) {
          const enabled = res.data.captchaEnabled
          const img = res.data.img || ''
          this.setData({
            captchaEnabled: enabled,
            captchaUuid: enabled ? res.data.uuid : '',
            captchaImg: enabled ? (img.startsWith('data:') ? img : 'data:image/png;base64,' + img) : '',
            captchaInput: '',
            captchaError: false,
          })
        }
      } catch {
        this.setData({ captchaError: true, captchaImg: '' })
      }
    },
    onCaptchaTap() {
      this.fetchCaptcha()
    },

    onOldPasswordInput(e: WechatMiniprogram.Input) {
      this.setData({ oldPassword: e.detail.value })
    },
    onNewPasswordInput(e: WechatMiniprogram.Input) {
      this.setData({ newPassword: e.detail.value })
    },
    onConfirmNewPasswordInput(e: WechatMiniprogram.Input) {
      this.setData({ confirmNewPassword: e.detail.value })
    },
    onSmsCodeInput(e: WechatMiniprogram.Input) {
      this.setData({ smsCode: e.detail.value })
    },
    onCaptchaInput(e: WechatMiniprogram.Input) {
      this.setData({ captchaInput: e.detail.value })
    },

    async handleSendSms() {
      const info = storage.getUserInfo()
      const phone = (info && info.phoneNumber) || ''
      if (!phone) {
        wx.showToast({ title: t('message.error.phoneEmptyForSms'), icon: 'none' })
        return
      }
      if (this.data.smsCountdown > 0 || this.data.sendingSms) {
        return
      }
      this.setData({ sendingSms: true })
      try {
        const res = await request<ApiResponse<null>>({
          url: '/resource/sms/code?phoneNumber=' + encodeURIComponent(phone),
          method: 'GET',
          needAuth: false,
        })
        if (res.code === 200) {
          wx.showToast({ title: t('message.smsSent'), icon: 'none' })
          this.startSmsCountdown()
        } else {
          wx.showToast({ title: translateApiMessage(res.msg) || t('message.error.sendCodeFailed'), icon: 'none' })
        }
      } catch {
        // request 内部已 toast
      } finally {
        this.setData({ sendingSms: false })
      }
    },
    startSmsCountdown() {
      this.setData({ smsCountdown: 60 })
      smsTimer = setInterval(() => {
        const count = this.data.smsCountdown - 1
        if (count <= 0) {
          if (smsTimer !== null) {
            clearInterval(smsTimer)
            smsTimer = null
          }
          this.setData({ smsCountdown: 0 })
        } else {
          this.setData({ smsCountdown: count })
        }
      }, 1000)
    },

    async handleSubmit() {
      const { oldPassword, newPassword, confirmNewPassword, smsCode, captchaInput, captchaUuid, captchaEnabled, isLoading, isEmptyPassword } = this.data
      if (isLoading) {
        return
      }
      if (!isEmptyPassword && !oldPassword) {
        wx.showToast({ title: t('message.error.currentPasswordRequired'), icon: 'none' })
        return
      }
      const pwdResult = isValidPassword(newPassword)
      if (!pwdResult.valid) {
        wx.showToast({ title: pwdResult.message, icon: 'none' })
        return
      }
      if (newPassword !== confirmNewPassword) {
        wx.showToast({ title: t('message.error.passwordMismatch'), icon: 'none' })
        return
      }
      if (!smsCode) {
        wx.showToast({ title: t('message.error.smsCodeRequired'), icon: 'none' })
        return
      }
      if (captchaEnabled && !captchaInput) {
        wx.showToast({ title: t('message.error.captchaRequired'), icon: 'none' })
        return
      }

      this.setData({ isLoading: true })
      try {
        const payload: ChangePasswordRequest = {
          oldPassword,
          newPassword,
          confirmPassword: confirmNewPassword,
          smsCode,
          code: captchaInput,
          uuid: captchaUuid,
        }
        const res = await request<ApiResponse<null>>({
          url: '/system/user/password',
          method: 'PUT',
          data: payload,
        })
        if (res.code === 200) {
          wx.showToast({ title: t('message.passwordChangedRelogin'), icon: 'none' })
          this.doLogout()
        } else {
          wx.showToast({ title: translateApiMessage(res.msg) || t('message.error.updateFailed'), icon: 'none' })
          this.fetchCaptcha()
        }
      } catch {
        this.fetchCaptcha()
      } finally {
        this.setData({ isLoading: false })
      }
    },

    async doLogout() {
      try {
        await request<ApiResponse<null>>({ url: '/auth/logout', method: 'POST' })
      } catch {
        // 退出接口失败不阻塞本地登出
      }
      storage.clearAuth()
      const app = getApp<IAppOption>()
      app.globalData.token = ''
      app.globalData.userInfo = null
      app.globalData.isLoggedIn = false
      wx.redirectTo({ url: '/pages/login/login' })
    },
  },
})
