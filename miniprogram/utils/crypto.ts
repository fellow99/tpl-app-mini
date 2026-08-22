// AES+RSA 加密工具（占位实现）
//
// 说明：AES+RSA 加密传输（FR-002-007 / FR-002-014 / NFR-002-002）依赖与后端
// tpl-app-api 的密钥协商方案，该方案尚未确定（spec.md NC-003 待澄清）。
//
// 原实现依赖 npm 包 crypto-js / jsencrypt，但：
//   1. 小程序端未「构建 npm」，运行时 require('crypto-js') 直接失败；
//   2. jsencrypt 依赖 window/navigator，小程序环境兼容性不佳（plan.md §12 风险项）。
//
// 当前阶段 ENCRYPT_ENABLED = false：请求体以明文 JSON 经 HTTPS 传输。
// 待 NC-003 密钥协商方案确定后，再在此处接入真实 AES+RSA 加密实现。

/** 加密结果 */
export interface EncryptResult {
  /** 加密后的请求体（Base64 字符串） */
  data: string
  /** 附加的请求头 */
  headers: Record<string, string>
}

/** 是否启用加密（NC-003 密钥协商方案确定前保持 false） */
export const ENCRYPT_ENABLED = false

/**
 * 加密请求数据（占位实现）。
 * 加密未启用时，直接以明文 JSON 透传。
 */
export function encryptRequest(data: Record<string, unknown>): EncryptResult {
  // TODO(NC-003)：在此接入 AES+RSA 加密，与后端 ApiDecryptFilter 的 wire 契约一致。
  return { data: JSON.stringify(data), headers: {} }
}
