/// <reference path="./types/index.d.ts" />

type IAppOption = {
  globalData: {
    /** 登录 token（JWT） */
    token: string
    /** 用户信息 */
    userInfo: UserInfo | null
    /** 是否已登录 */
    isLoggedIn: boolean
  }
}
