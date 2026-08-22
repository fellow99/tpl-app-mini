// 注册页：手机注册（手机号即用户名 + 密码 + 短信验证码 + 图形验证码）
import { request } from '../../utils/request'
import { storage } from '../../utils/storage'
import { isValidPassword, isValidPhone } from '../../utils/validator'
import { t, translateApiMessage } from '../../utils/i18n'
import { getThemeClass, getNavTheme } from '../../utils/theme'

let smsTimer: number | null = null

Component({
  data: {
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    smsCode: '',
    smsCountdown: 0,
    sendingSms: false,
    captchaInput: '',
    captchaImg: '',
    captchaUuid: '',
    captchaEnabled: true,
    captchaError: false,
    isLoading: false,
    // 字段错误提示
    phoneNumberError: '',
    passwordError: '',
    confirmPasswordError: '',
    // 多语言文案（refreshI18n 填充）
    navTitle: '',
    phonePlaceholder: '',
    passwordPlaceholder: '',
    confirmPasswordPlaceholder: '',
    smsCodePlaceholder: '',
    captchaPlaceholder: '',
    captchaLoading: '',
    captchaRetry: '',
    getCodeText: '',
    submitText: '',
    goLoginLink: '',
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

    /** 多语言文案刷新（语言切换后 onShow 生效） */
    refreshI18n() {
      this.setData({
        navTitle: t('auth.register.title'),
        phonePlaceholder: t('auth.register.phonePlaceholder'),
        passwordPlaceholder: t('auth.register.passwordPlaceholder'),
        confirmPasswordPlaceholder: t('auth.register.confirmPasswordPlaceholder'),
        smsCodePlaceholder: t('common.smsCode'),
        captchaPlaceholder: t('common.graphicCaptcha'),
        captchaLoading: t('common.loading'),
        captchaRetry: t('common.captcha.retry'),
        getCodeText: t('common.getCode'),
        submitText: t('auth.register.submit'),
        goLoginLink: t('auth.register.hasAccount') + t('auth.register.goLogin'),
      })
    },

    // ---- 图形验证码 ----
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
        } else {
          wx.showToast({ title: translateApiMessage(res.msg) || t('common.loadFailed'), icon: 'none' })
          this.setData({ captchaError: true, captchaImg: '' })
        }
      } catch {
        this.setData({ captchaError: true, captchaImg: '' })
      }
    },
    onCaptchaTap() {
      this.fetchCaptcha()
    },

    // ---- 短信验证码 ----
    async handleSendSms() {
      const { phoneNumber, smsCountdown, sendingSms } = this.data
      if (smsCountdown > 0 || sendingSms) {
        return
      }
      if (!isValidPhone(phoneNumber)) {
        this.setData({ phoneNumberError: t('message.error.phoneInvalid') })
        return
      }
      this.setData({ sendingSms: true, phoneNumberError: '' })
      try {
        const res = await request<ApiResponse<null>>({
          url: '/resource/sms/code?phoneNumber=' + encodeURIComponent(phoneNumber),
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

    // ---- 输入事件 + 失焦校验 ----
    onPhoneNumberInput(e: WechatMiniprogram.Input) {
      this.setData({ phoneNumber: e.detail.value, phoneNumberError: '' })
    },
    onPhoneNumberBlur(e: WechatMiniprogram.InputBlur) {
      const phone = e.detail.value
      if (phone && !isValidPhone(phone)) {
        this.setData({ phoneNumberError: t('message.error.phoneInvalid') })
      }
    },
    onSmsCodeInput(e: WechatMiniprogram.Input) {
      this.setData({ smsCode: e.detail.value })
    },
    onPasswordInput(e: WechatMiniprogram.Input) {
      this.setData({ password: e.detail.value, passwordError: '' })
    },
    onPasswordBlur(e: WechatMiniprogram.InputBlur) {
      const password = e.detail.value
      const result = isValidPassword(password)
      if (password && !result.valid) {
        this.setData({ passwordError: result.message })
      }
    },
    onConfirmPasswordInput(e: WechatMiniprogram.Input) {
      this.setData({ confirmPassword: e.detail.value, confirmPasswordError: '' })
    },
    onConfirmPasswordBlur(e: WechatMiniprogram.InputBlur) {
      const confirmPassword = e.detail.value
      if (confirmPassword && confirmPassword !== this.data.password) {
        this.setData({ confirmPasswordError: t('message.error.passwordMismatch') })
      }
    },
    onCaptchaInput(e: WechatMiniprogram.Input) {
      this.setData({ captchaInput: e.detail.value })
    },

    // ---- 全字段校验 ----
    validateForm(): boolean {
      const { phoneNumber, password, confirmPassword, smsCode, captchaInput, captchaEnabled } = this.data

      if (!isValidPhone(phoneNumber)) {
        this.setData({ phoneNumberError: t('message.error.phoneInvalid') })
        return false
      }
      const pwdResult = isValidPassword(password)
      if (!pwdResult.valid) {
        this.setData({ passwordError: pwdResult.message })
        return false
      }
      if (password !== confirmPassword) {
        this.setData({ confirmPasswordError: t('message.error.passwordMismatch') })
        return false
      }
      if (!smsCode) {
        wx.showToast({ title: t('message.error.smsCodeRequired'), icon: 'none' })
        return false
      }
      if (captchaEnabled && !captchaInput) {
        wx.showToast({ title: t('message.error.captchaRequired'), icon: 'none' })
        return false
      }
      return true
    },

    // ---- 注册 ----
    async handleRegister() {
      const { isLoading } = this.data
      if (isLoading) {
        return
      }
      if (!this.validateForm()) {
        return
      }

      const { phoneNumber, password, smsCode, captchaInput, captchaUuid } = this.data
      this.setData({ isLoading: true })
      try {
        const payload: RegisterRequest = {
          phoneNumber,
          password,
          smsCode,
          code: captchaInput,
          uuid: captchaUuid,
        }
        const res = await request<ApiResponse<LoginResponse>>({
          url: '/auth/register',
          method: 'POST',
          data: payload,
          needAuth: false,
        })
        if (res.code === 200) {
          // 注册即登录成功：保存 token，进入个人中心
          const app = getApp<IAppOption>()
          storage.setToken(res.data.access_token)
          app.globalData.token = res.data.access_token
          app.globalData.isLoggedIn = true
          wx.showToast({ title: t('message.registerSuccess'), icon: 'success' })
          setTimeout(() => {
            wx.reLaunch({ url: '/pages/profile/profile' })
          }, 1000)
        } else {
          wx.showToast({ title: translateApiMessage(res.msg) || t('message.error.registerFailed'), icon: 'none' })
          this.fetchCaptcha()
        }
      } catch {
        this.fetchCaptcha()
      } finally {
        this.setData({ isLoading: false })
      }
    },

    goLogin() {
      wx.redirectTo({ url: '/pages/login/login' })
    },
  },
})
