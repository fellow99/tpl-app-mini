declare module 'crypto-js' {
  interface WordArray {
    words: number[]
    sigBytes: number
  }
  interface CipherParams {
    toString(): string
  }
  const CryptoJS: {
    enc: {
      Utf8: { parse(str: string): WordArray }
      Base64: { stringify(wa: WordArray): string }
    }
    AES: {
      encrypt(
        message: string,
        key: WordArray,
        cfg?: { mode?: unknown; padding?: unknown },
      ): CipherParams
    }
    mode: { ECB: unknown }
    pad: { Pkcs7: unknown }
  }
  export default CryptoJS
}

declare module 'jsencrypt' {
  export default class JSEncrypt {
    constructor(options?: { default_key_size?: string })
    setPublicKey(pubkey: string): void
    encrypt(plaintext: string): string | false
  }
}
