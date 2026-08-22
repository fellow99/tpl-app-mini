// 表单校验工具
import { t } from './i18n'

/** 手机号校验：中国大陆手机号 1 开头 11 位 */
export function isValidPhone(phone: string): boolean {
  return /^1[3-9]\d{9}$/.test(phone)
}

/** 密码强度校验：≥ 6 位，必须包含字母和数字 */
export function isValidPassword(password: string): { valid: boolean; message: string } {
  if (password.length < 6) {
    return { valid: false, message: t('message.error.passwordTooShort') }
  }
  if (!/[a-zA-Z]/.test(password)) {
    return { valid: false, message: t('message.error.passwordNeedLetter') }
  }
  if (!/\d/.test(password)) {
    return { valid: false, message: t('message.error.passwordNeedDigit') }
  }
  return { valid: true, message: '' }
}

/** 用户名校验：4-20 位字母数字下划线 */
export function isValidUsername(username: string): boolean {
  return /^[a-zA-Z0-9_]{4,20}$/.test(username)
}

/** 手机号脱敏：13800138000 -> 138****8000 */
export function maskPhone(phone: string): string {
  if (!phone || phone.length < 7) {
    return phone
  }
  return phone.slice(0, 3) + '****' + phone.slice(-4)
}
