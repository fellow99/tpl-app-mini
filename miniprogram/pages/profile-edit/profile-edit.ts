// 修改信息页：昵称 / email / 生日 + 图形验证码
import { request } from '../../utils/request'
import { storage } from '../../utils/storage'
import { t, translateApiMessage } from '../../utils/i18n'
import { getThemeClass, getNavTheme } from '../../utils/theme'

Component({
  data: {
    nickName: '',
    email: '',
    birthDate: '',
    captchaInput: '',
    captchaImg: '',
    captchaUuid: '',
    captchaEnabled: true,
    captchaError: false,
    isLoading: false,
    // 多语言文案（refreshI18n 填充）
    navTitle: '',
    nicknameLabel: '',
    nicknamePlaceholder: '',
    emailLabel: '',
    emailPlaceholder: '',
    birthdayLabel: '',
    birthdayPlaceholder: '',
    captchaPlaceholder: '',
    captchaLoading: '',
    captchaRetry: '',
    saveText: '',
    // 主题（refreshTheme 填充）
    themeClass: '',
    navBg: '',
    navColor: '',
  },

  lifetimes: {
    attached() {
      this.refreshI18n()
      this.refreshTheme()
      this.loadUserInfo()
      this.fetchCaptcha()
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
        navTitle: t('auth.profile.editInfo'),
        nicknameLabel: t('common.nickname'),
        nicknamePlaceholder: t('auth.profile.nicknamePlaceholder'),
        emailLabel: t('common.email'),
        emailPlaceholder: t('auth.profile.emailPlaceholder'),
        birthdayLabel: t('common.birthday'),
        birthdayPlaceholder: t('auth.profile.birthdayPlaceholder'),
        captchaPlaceholder: t('common.graphicCaptcha'),
        captchaLoading: t('common.loading'),
        captchaRetry: t('common.captcha.retry'),
        saveText: t('auth.profile.save'),
      })
    },

    loadUserInfo() {
      const info = storage.getUserInfo()
      if (info) {
        this.setData({
          nickName: info.nickName || '',
          email: info.email || '',
          birthDate: info.birthDate || '',
        })
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

    onNickNameInput(e: WechatMiniprogram.Input) {
      this.setData({ nickName: e.detail.value })
    },
    onEmailInput(e: WechatMiniprogram.Input) {
      this.setData({ email: e.detail.value })
    },
    onBirthDateChange(e: WechatMiniprogram.PickerChange) {
      this.setData({ birthDate: e.detail.value as string })
    },
    onCaptchaInput(e: WechatMiniprogram.Input) {
      this.setData({ captchaInput: e.detail.value })
    },

    async handleSave() {
      const { nickName, email, birthDate, captchaInput, captchaUuid, captchaEnabled, isLoading } = this.data
      if (isLoading) {
        return
      }
      if (!nickName) {
        wx.showToast({ title: t('message.error.nicknameRequired'), icon: 'none' })
        return
      }
      if (captchaEnabled && !captchaInput) {
        wx.showToast({ title: t('message.error.captchaRequired'), icon: 'none' })
        return
      }
      this.setData({ isLoading: true })
      try {
        const payload: UserProfileRequest = {
          nickName,
          email,
          birthDate,
          code: captchaInput,
          uuid: captchaUuid,
        }
        const res = await request<ApiResponse<null>>({
          url: '/system/user/profile',
          method: 'PUT',
          data: payload,
        })
        if (res.code === 200) {
          wx.showToast({ title: t('message.saveSuccess'), icon: 'success' })
          setTimeout(() => {
            wx.navigateBack()
          }, 1000)
        } else {
          wx.showToast({ title: translateApiMessage(res.msg) || t('message.error.saveFailed'), icon: 'none' })
          this.fetchCaptcha()
        }
      } catch {
        this.fetchCaptcha()
      } finally {
        this.setData({ isLoading: false })
      }
    },
  },
})
