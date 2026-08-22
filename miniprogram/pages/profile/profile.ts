// 个人中心：展示用户信息 + 修改信息/修改密码入口按钮（切换编辑页）
import { request } from '../../utils/request'
import { storage } from '../../utils/storage'
import { maskPhone } from '../../utils/validator'
import { t, translateApiMessage, getLocale, setLocale, LOCALES, Locale } from '../../utils/i18n'
import { getThemeMode, setThemeMode, getThemeClass, getNavTheme, ThemeMode } from '../../utils/theme'

/** 语言选项展示名（自识别，语料暂无 language.* 键，暂硬编码） */
const LANGUAGE_NAMES: Record<Locale, string> = {
  'zh-CN': '简体中文',
  'en-US': 'English',
  'zh-TW': '繁體中文',
}

/** 主题三态展示名（语料暂无 theme.* 键，暂硬编码） */
const THEME_MODE_NAMES: Record<ThemeMode, string> = {
  light: '浅色',
  dark: '深色',
  system: '跟随系统',
}

/** 主题三态选择顺序（与 actionSheet itemList 对齐） */
const THEME_MODE_ORDER: ThemeMode[] = ['light', 'dark', 'system']

Component({
  data: {
    userInfo: null as UserInfo | null,
    maskedPhone: '',
    // 多语言文案（refreshI18n 填充）
    navTitle: '',
    nicknameLabel: '',
    phoneLabel: '',
    emailLabel: '',
    birthdayLabel: '',
    editInfoText: '',
    changePasswordText: '',
    logoutText: '',
    logoutModalTitle: '提示', // TODO(i18n)：语料无通用「提示」模态标题键，暂硬编码
    logoutModalContent: '',
    languageCellText: '语言 / Language', // TODO(i18n)：语料无 language.* 键，双语占位
    themeCellText: '主题 / Theme', // TODO(i18n)：语料无 theme.* 键，双语占位
    // 主题（refreshTheme 填充）
    themeClass: '',
    navBg: '',
    navColor: '',
  },

  lifetimes: {
    attached() {
      this.refreshI18n()
      this.refreshTheme()
      this.checkLoginAndLoad()
    },
  },

  pageLifetimes: {
    // 从「修改信息」页返回后刷新，保证展示与提交结果一致
    show() {
      this.refreshI18n()
      this.refreshTheme()
      if (getApp<IAppOption>().globalData.isLoggedIn) {
        this.fetchUserProfile()
      }
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
        navTitle: t('auth.profile.title'),
        nicknameLabel: t('common.nickname'),
        phoneLabel: t('common.phone'),
        emailLabel: t('common.email'),
        birthdayLabel: t('common.birthday'),
        editInfoText: t('auth.profile.editInfo'),
        changePasswordText: t('auth.profile.changePassword'),
        logoutText: t('auth.profile.logout'),
        logoutModalContent: t('auth.profile.logoutConfirm'),
      })
    },

    /** 语言切换入口：actionSheet 选择后 setLocale 并刷新 */
    handleChangeLanguage() {
      const itemList = LOCALES.map((l) => LANGUAGE_NAMES[l])
      wx.showActionSheet({
        itemList,
        success: (res) => {
          const lang = LOCALES[res.tapIndex]
          if (lang && lang !== getLocale()) {
            setLocale(lang)
            this.refreshI18n()
            this.fetchUserProfile()
          }
        },
      })
    },

    /** 主题切换入口：actionSheet 三态选择（浅色/深色/跟随系统）后 setThemeMode 并刷新 */
    handleChangeTheme() {
      const itemList = THEME_MODE_ORDER.map((m) => THEME_MODE_NAMES[m])
      wx.showActionSheet({
        itemList,
        success: (res) => {
          const mode = THEME_MODE_ORDER[res.tapIndex]
          if (mode && mode !== getThemeMode()) {
            setThemeMode(mode)
            this.refreshTheme()
          }
        },
      })
    },

    checkLoginAndLoad() {
      const app = getApp<IAppOption>()
      if (!app.globalData.isLoggedIn) {
        wx.redirectTo({ url: '/pages/login/login' })
        return
      }
      this.fetchUserProfile()
    },

    async fetchUserProfile() {
      try {
        const res = await request<ApiResponse<UserInfo>>({ url: '/system/user/getInfo' })
        if (res.code === 200) {
          this.applyUserInfo(res.data)
        } else {
          wx.showToast({ title: translateApiMessage(res.msg) || t('message.error.fetchUserInfoFailed'), icon: 'none' })
        }
      } catch {
        // request 内部已 toast / 401 已跳转登录
      }
    },

    applyUserInfo(info: UserInfo) {
      storage.setUserInfo(info)
      getApp<IAppOption>().globalData.userInfo = info
      this.setData({
        userInfo: info,
        maskedPhone: maskPhone(info.phoneNumber),
      })
    },

    // ---- 跳转编辑页 ----
    goEditProfile() {
      wx.navigateTo({ url: '/pages/profile-edit/profile-edit' })
    },
    goChangePassword() {
      wx.navigateTo({ url: '/pages/change-password/change-password' })
    },

    // ---- 退出登录 ----
    handleLogout() {
      wx.showModal({
        title: this.data.logoutModalTitle,
        content: this.data.logoutModalContent,
        success: (res) => {
          if (res.confirm) {
            this.doLogout()
          }
        },
      })
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
