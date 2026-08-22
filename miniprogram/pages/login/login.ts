// 登录页：密码登录 / 短信验证码登录 / 微信一键登录
import { request } from '../../utils/request'
import { storage } from '../../utils/storage'
import { isValidPhone } from '../../utils/validator'
import { WECHAT_LOGIN_ENABLED } from '../../config'
import { t, translateApiMessage, setLocale, type Locale } from '../../utils/i18n'
import { resolveTheme, setThemeMode, getThemeClass, getNavTheme } from '../../utils/theme'

// 短信验证码倒计时定时器（模块级，登录页仅单实例）
let smsTimer: number | null = null

Component({
  data: {
    loginType: 'password', // 'password' | 'sms'
    // 密码登录表单
    phone: '',
    password: '',
    captchaInput: '',
    passwordVisible: false,
    // 短信登录表单
    smsPhone: '',
    smsCode: '',
    // 公共
    captchaEnabled: true, // 图形验证码开关
    captchaImg: '', // base64 图片
    captchaUuid: '', // 验证码标识
    captchaError: false, // 验证码加载失败标记
    smsCountdown: 0, // 短信发送倒计时（秒）
    sendingSms: false, // 短信验证码发送中
    isLoading: false,
    // 微信一键登录
    showWechatLogin: WECHAT_LOGIN_ENABLED, // 开关常量（config.ts），控制按钮显隐
    needPhoneCode: false, // 后端提示需绑定手机号时置 true，显示 getPhoneNumber 按钮
    // 多语言文案（refreshI18n 填充）
    navTitle: '',
    tabPassword: '',
    tabSms: '',
    phonePlaceholder: '',
    passwordPlaceholder: '',
    smsCodePlaceholder: '',
    captchaPlaceholder: '',
    eyeShow: '',
    eyeHide: '',
    captchaLoading: '',
    captchaRetry: '',
    submitText: '',
    getCodeText: '',
    otherMethodsText: '',
    wechatLoginText: '',
    registerLink: '',
    // 主题（refreshTheme 填充）
    themeClass: '',
    navBg: '',
    navColor: '',
    themeIcon: '',
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
    /** 主题刷新：解析三态写入根节点 class + 导航栏配色 + 切换按钮图标 */
    refreshTheme() {
      const nav = getNavTheme()
      this.setData({
        themeClass: getThemeClass(),
        navBg: nav.background,
        navColor: nav.color,
        themeIcon: resolveTheme() === 'dark' ? '☀️' : '🌙',
      })
    },

    /** 主题切换按钮：light↔dark 显式切换（覆盖 system 默认，FR-005-012） */
    toggleTheme() {
      setThemeMode(resolveTheme() === 'dark' ? 'light' : 'dark')
      this.refreshTheme()
    },

    /** 语言切换：弹出 actionSheet 选择语言，切换后刷新文案 */
    showLanguageSwitch() {
      const langs = ['简体中文', 'English', '繁體中文']
      const codes: Locale[] = ['zh-CN', 'en-US', 'zh-TW']
      wx.showActionSheet({
        itemList: langs,
        success: (res) => {
          const code = codes[res.tapIndex]
          if (code) {
            setLocale(code)
            this.refreshI18n()
          }
        },
      })
    },

    /** 多语言文案刷新：从语料取词写入 data（语言切换后 onShow 生效） */
    refreshI18n() {
      this.setData({
        navTitle: t('auth.login.title'),
        tabPassword: t('auth.login.tab.password'),
        tabSms: t('auth.login.tab.sms'),
        phonePlaceholder: t('auth.login.phonePlaceholder'),
        passwordPlaceholder: t('auth.login.passwordPlaceholder'),
        smsCodePlaceholder: t('auth.login.smsCodePlaceholder'),
        captchaPlaceholder: t('auth.login.captchaPlaceholder'),
        eyeShow: '显示', // TODO(i18n)：语料暂无 common.show 键，暂硬编码
        eyeHide: '隐藏', // TODO(i18n)：语料暂无 common.hide 键，暂硬编码
        captchaLoading: t('common.loading'),
        captchaRetry: t('common.captcha.retry'),
        submitText: t('auth.login.submit'),
        getCodeText: t('common.getCode'),
        otherMethodsText: t('auth.login.otherMethods'),
        wechatLoginText: t('auth.wechat.login'),
        registerLink: t('auth.login.noAccount') + t('auth.login.goRegister'),
      })
    },

    // ---- tab 切换 ----
    switchToPassword() {
      this.setData({ loginType: 'password' })
      this.fetchCaptcha()
    },
    switchToSms() {
      this.setData({ loginType: 'sms' })
      this.fetchCaptcha()
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
        // request 内部已 toast（网络异常等）
        this.setData({ captchaError: true, captchaImg: '' })
      }
    },
    onCaptchaTap() {
      this.fetchCaptcha()
    },

    // ---- 密码登录 ----
    async handlePasswordLogin() {
      const { phone, password, captchaInput, captchaUuid, captchaEnabled, isLoading } = this.data
      if (isLoading) {
        return
      }
      if (!isValidPhone(phone)) {
        wx.showToast({ title: t('message.error.phoneInvalid'), icon: 'none' })
        return
      }
      if (!password) {
        wx.showToast({ title: t('message.error.passwordRequired'), icon: 'none' })
        return
      }
      if (captchaEnabled && !captchaInput) {
        wx.showToast({ title: t('message.error.captchaRequired'), icon: 'none' })
        return
      }

      this.setData({ isLoading: true })
      try {
        const payload: PasswordLoginRequest = {
          grantType: 'password',
          phoneNumber: phone,
          password,
          code: captchaInput,
          uuid: captchaUuid,
        }
        const res = await request<ApiResponse<LoginResponse>>({
          url: '/auth/login',
          method: 'POST',
          data: payload,
          needAuth: false,
        })
        if (res.code === 200) {
          this.handleLoginSuccess(res.data)
        } else {
          wx.showToast({ title: translateApiMessage(res.msg) || t('message.error.loginFailed'), icon: 'none' })
          this.setData({ password: '' })
          this.fetchCaptcha()
        }
      } catch {
        // request 内部已 toast（网络异常 / 401）
        this.fetchCaptcha()
      } finally {
        this.setData({ isLoading: false })
      }
    },

    // ---- 短信登录 ----
    async handleSendSms() {
      const { smsPhone, smsCountdown, sendingSms } = this.data
      if (smsCountdown > 0 || sendingSms) {
        return
      }
      if (!isValidPhone(smsPhone)) {
        wx.showToast({ title: t('message.error.phoneInvalid'), icon: 'none' })
        return
      }
      this.setData({ sendingSms: true })
      try {
        const res = await request<ApiResponse<null>>({
          url: '/resource/sms/code?phoneNumber=' + encodeURIComponent(smsPhone),
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
    async handleSmsLogin() {
      const { smsPhone, smsCode, captchaInput, captchaUuid, captchaEnabled, isLoading } = this.data
      if (isLoading) {
        return
      }
      if (!isValidPhone(smsPhone)) {
        wx.showToast({ title: t('message.error.phoneInvalid'), icon: 'none' })
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
        const payload: SmsLoginRequest = {
          grantType: 'sms',
          phoneNumber: smsPhone,
          smsCode,
          code: captchaInput,
          uuid: captchaUuid,
        }
        const res = await request<ApiResponse<LoginResponse>>({
          url: '/auth/login',
          method: 'POST',
          data: payload,
          needAuth: false,
        })
        if (res.code === 200) {
          this.handleLoginSuccess(res.data)
        } else {
          wx.showToast({ title: translateApiMessage(res.msg) || t('message.error.loginFailed'), icon: 'none' })
          this.setData({ smsCode: '' })
          this.fetchCaptcha()
        }
      } catch {
        // request 内部已 toast
        this.fetchCaptcha()
      } finally {
        this.setData({ isLoading: false })
      }
    },

    // ---- 登录成功公共处理 ----
    async handleLoginSuccess(data: LoginResponse) {
      const app = getApp<IAppOption>()
      storage.setToken(data.access_token)
      app.globalData.token = data.access_token
      app.globalData.isLoggedIn = true

      // 拉取用户信息并缓存
      try {
        const infoRes = await request<ApiResponse<UserInfo>>({ url: '/system/user/getInfo' })
        if (infoRes.code === 200) {
          storage.setUserInfo(infoRes.data)
          app.globalData.userInfo = infoRes.data
        }
      } catch {
        // 用户信息拉取失败不阻塞登录
      }

      // reLaunch 清空页面栈，避免登录页残留在栈中
      wx.reLaunch({ url: '/pages/profile/profile' })
    },

    // ---- 微信一键登录 ----
    handleWechatLogin() {
      const { isLoading, showWechatLogin } = this.data
      if (isLoading || !showWechatLogin) {
        return
      }
      wx.login({
        success: (res) => {
          if (!res.code) {
            wx.showToast({ title: t('message.error.wechatLoginFailed'), icon: 'none' })
            return
          }
          this.doXcxLogin(res.code)
        },
        fail: () => {
          wx.showToast({ title: t('message.error.wechatLoginFailed'), icon: 'none' })
        },
      })
    },

    // 调后端 xcx 登录：xcxCode 换 token；未绑定手机号时引导 getPhoneNumber
    async doXcxLogin(xcxCode: string) {
      this.setData({ isLoading: true })
      try {
        const payload: XcxLoginRequest = {
          grantType: 'xcx',
          clientId: 'mini',
          xcxCode,
        }
        const res = await request<ApiResponse<LoginResponse>>({
          url: '/auth/login',
          method: 'POST',
          data: payload,
          needAuth: false,
        })
        if (res.code === 200) {
          this.handleLoginSuccess(res.data)
        } else if (res.code === 2002) {
          // 2002：首次未绑定，需 getPhoneNumber 授权
          this.setData({ needPhoneCode: true })
          wx.showToast({ title: translateApiMessage(res.msg) || t('message.error.wechatBindPhone'), icon: 'none' })
        } else {
          // 其它错误（微信接口失败、code 无效等）
          wx.showToast({ title: translateApiMessage(res.msg) || t('message.error.loginFailed'), icon: 'none' })
        }
      } catch {
        // request 内部已 toast（网络异常等）
      } finally {
        this.setData({ isLoading: false })
      }
    },

    // getPhoneNumber 回调：e.detail.code 为手机号授权 code（非 wx.login code）。
    // wx.login 的 code 为一次性（首次请求已被后端消费），故此处重新 wx.login 获取新 code
    async onGetPhoneNumber(e: GetPhoneNumberEvent) {
      const { isLoading } = this.data
      if (isLoading) {
        return
      }
      const phoneCode = e.detail.code
      if (!phoneCode) {
        // 用户拒绝授权手机号
        wx.showToast({ title: t('message.error.wechatPhoneAuthRequired'), icon: 'none' })
        return
      }
      this.setData({ isLoading: true })
      wx.login({
        success: (loginRes) => {
          if (!loginRes.code) {
            this.setData({ isLoading: false })
            wx.showToast({ title: t('message.error.wechatLoginFailed'), icon: 'none' })
            return
          }
          this.submitXcxWithPhone(loginRes.code, phoneCode)
        },
        fail: () => {
          this.setData({ isLoading: false })
          wx.showToast({ title: t('message.error.wechatLoginFailed'), icon: 'none' })
        },
      })
    },

    // xcx 登录（携带 phoneCode）：新 wx.login code + getPhoneNumber code
    async submitXcxWithPhone(xcxCode: string, phoneCode: string) {
      try {
        const payload: XcxLoginRequest = {
          grantType: 'xcx',
          clientId: 'mini',
          xcxCode,
          phoneCode,
        }
        const res = await request<ApiResponse<LoginResponse>>({
          url: '/auth/login',
          method: 'POST',
          data: payload,
          needAuth: false,
        })
        if (res.code === 200) {
          this.handleLoginSuccess(res.data)
        } else {
          wx.showToast({ title: translateApiMessage(res.msg) || t('message.error.loginFailed'), icon: 'none' })
          this.setData({ needPhoneCode: false })
        }
      } catch {
        // request 内部已 toast（网络异常等）
      } finally {
        this.setData({ isLoading: false })
      }
    },

    // ---- 输入事件 ----
    onPhoneInput(e: WechatMiniprogram.Input) {
      this.setData({ phone: e.detail.value })
    },
    onPasswordInput(e: WechatMiniprogram.Input) {
      this.setData({ password: e.detail.value })
    },
    onCaptchaInput(e: WechatMiniprogram.Input) {
      this.setData({ captchaInput: e.detail.value })
    },
    onSmsPhoneInput(e: WechatMiniprogram.Input) {
      this.setData({ smsPhone: e.detail.value })
    },
    onSmsCodeInput(e: WechatMiniprogram.Input) {
      this.setData({ smsCode: e.detail.value })
    },
    togglePasswordVisible() {
      this.setData({ passwordVisible: !this.data.passwordVisible })
    },

    // ---- 跳转 ----
    goRegister() {
      wx.navigateTo({ url: '/pages/register/register' })
    },
  },
})
