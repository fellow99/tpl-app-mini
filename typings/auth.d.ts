// ============================================================
// 认证与用户中心全局类型定义（重新对齐 002-user-auth）
// 所有类型以全局方式声明（无 import/export），各 .ts 模块可直接引用
// ============================================================

/** 用户信息（对应后端 getInfo / UserInfoVO，不含 password） */
type UserInfo = {
  userId: number
  userName: string
  nickName: string
  phoneNumber: string
  email: string
  birthDate?: string
}

/** 统一接口返回结构 */
type ApiResponse<T> = {
  code: number
  msg: string
  data: T
}

/** 密码登录请求 */
type PasswordLoginRequest = {
  grantType: 'password'
  phoneNumber: string
  password: string
  code: string
  uuid: string
}

/** 短信验证码登录请求 */
type SmsLoginRequest = {
  grantType: 'sms'
  phoneNumber: string
  smsCode: string
  code: string
  uuid: string
}

/** 登录请求（密码 / 短信） */
type LoginRequest = PasswordLoginRequest | SmsLoginRequest

/** 微信小程序一键登录请求（grantType=xcx） */
type XcxLoginRequest = {
  grantType: 'xcx'
  clientId: string
  /** wx.login() 返回的临时 code（5 分钟有效、一次性） */
  xcxCode: string
  /** getPhoneNumber 回调返回的 code（首次绑定手机号时必填，与 xcxCode 不同） */
  phoneCode?: string
}

/** getPhoneNumber 回调事件（新方式：code 换手机号，基础库 2.21.2+） */
type GetPhoneNumberEvent = {
  detail: {
    errMsg: string
    /** getPhoneNumber 授权 code（一次性，非 wx.login code） */
    code?: string
    errno?: number
  }
}

/** 注册请求（手机注册，手机号即用户名） */
type RegisterRequest = {
  phoneNumber: string
  password: string
  smsCode: string
  code: string
  uuid: string
}

/** 登录响应（仅 token） */
type LoginResponse = {
  access_token: string
}

/** 图形验证码响应 */
type CaptchaResponse = {
  captchaEnabled: boolean
  uuid: string
  img: string
}

/** 修改个人信息请求 */
type UserProfileRequest = {
  nickName: string
  email: string
  birthDate: string
  code: string
  uuid: string
}

/** 修改密码请求 */
type ChangePasswordRequest = {
  oldPassword: string
  newPassword: string
  confirmPassword: string
  smsCode: string
  code: string
  uuid: string
}
