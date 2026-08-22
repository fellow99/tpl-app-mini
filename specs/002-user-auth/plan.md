# 002-user-auth — 技术方案

> 项目：tpl-app-mini（tpl-workspace微信小程序端）
> 模块：用户注册与登录
> 版本：v1.0
> 日期：2026-08-12
> 状态：⬜ 待实现

---

## 1. 技术上下文

### 1.1 运行环境

| 维度 | 说明 |
|------|------|
| 宿主 | 微信客户端（iOS / Android） |
| 基础库 | ≥ 3.0.0 |
| 渲染引擎 | Skyline |
| 组件框架 | glass-easel（`Component()` 构造器） |
| 开发语言 | TypeScript |
| 包管理 | npm（仅用于 `miniprogram-api-typings` 类型定义） |

### 1.2 关键差异：tpl-app-web (Vue 3) vs tpl-app-mini

| 维度 | tpl-app-web | tpl-app-mini |
|------|-----------|-------------|
| 页面构造 | Vue SFC (`<template>` + `<script setup>`) | `Component({...})` + WXML 模板 |
| 路由 | Vue Router (`router.push`) | 小程序页面栈（`wx.navigateTo` / `wx.redirectTo`） |
| 状态管理 | Pinia `useUserStore()` | `getApp().globalData` + `wx.storage` |
| HTTP 客户端 | Axios（拦截器、加密中间件） | `wx.request`（通过 `utils/request.ts` 封装） |
| 表单绑定 | `v-model` 双向绑定 | `bindinput` 事件 + `setData` |
| 条件渲染 | `v-if` / `v-show` | `wx:if` / `hidden` |
| 列表渲染 | `v-for` | `wx:for` |
| 事件处理 | `@click="handler"` | `bind:tap="handler"` |
| 微信登录 | JustAuth OAuth 重定向 | `wx.login()` → code → 后端换 token |
| 头像选择 | 文件上传组件 | `<button open-type="chooseAvatar">` |
| 昵称输入 | 普通 input | `<input type="nickname">` |
| 加密方案 | JSEncrypt + CryptoJS（同 RuoYi-UI） | 需在微信小程序中适配 AES+RSA 加密库 |

---

## 2. 宪法合规检查

| 宪法原则 | 状态 | 说明 |
|----------|:----:|------|
| 组件化优先（Component 构造器） | ✅ | 所有页面使用 `Component()`，非 `Page()` |
| TypeScript 严格模式 | ✅ | 所有函数参数和返回值有明确类型，禁止 `any` |
| 目录约定 | ✅ | `pages/login/`、`pages/register/`、`pages/profile/` |
| Skyline + glass-easel 固定 | ✅ | 使用原生组件，不降级 |
| 无第三方 UI 框架 | ✅ | 仅使用原生 `<view>`、`<button>`、`<input>`、`<scroll-view>` 等 |
| HTTP 请求统一管理 | ✅ | 通过 `utils/request.ts` 封装，页面不直接调用 `wx.request` |
| 本地存储规范 | ✅ | 通过 `utils/storage.ts` 统一管理 key |
| 命名规范 | ✅ | kebab-case 文件名、camelCase 变量 |
| 文档先行 | ✅ | 先出 spec.md + plan.md + test-cases.md，再实现 |
| 安全边界（Token/HTTPS/加密） | ✅ | Token 自动携带、401 跳转、AES+RSA 加密 |

---

## 3. 数据模型

### 3.1 TypeScript 接口定义

所有接口定义放在 `miniprogram/typings/auth.d.ts`：

```typescript
// ============================================================
// 用户信息
// ============================================================
interface UserInfo {
  userId: number;
  userName: string;
  nickName: string;
  phoneNumber: string;   // 脱敏后显示，如 138****8000
  avatar: string;         // 头像 URL
  birthDate?: string;     // YYYY-MM-DD，选填
}

// ============================================================
// 登录请求
// ============================================================
interface PasswordLoginRequest {
  clientId: 'mini';
  grantType: 'password';
  username: string;       // 手机号
  password: string;
  code: string;           // 图形验证码
  uuid: string;           // 验证码唯一标识
}

interface SmsLoginRequest {
  clientId: 'mini';
  grantType: 'sms';
  phoneNumber: string;
  smsCode: string;
}

interface XcxLoginRequest {
  clientId: 'mini';
  grantType: 'xcx';
  xcxCode: string;        // wx.login() 返回的临时 code
}

type LoginRequest = PasswordLoginRequest | SmsLoginRequest | XcxLoginRequest;

// ============================================================
// 注册请求
// ============================================================
interface RegisterRequest {
  username: string;
  password: string;
  phoneNumber?: string;   // 选填
  code: string;           // 图形验证码
  uuid: string;
}

// ============================================================
// API 响应
// ============================================================
interface ApiResponse<T> {
  code: number;           // 200 = 成功
  msg: string;
  data: T;
}

interface LoginResponse {
  access_token: string;
  expire_in: number;      // 过期时间（秒）
  client_id: string;
}

interface CaptchaResponse {
  uuid: string;
  img: string;            // base64 图片
}

interface SmsCodeResponse {
  msg: string;            // "发送成功" or error
}

interface UserProfileRequest {
  nickName?: string;
  avatar?: string;
}

interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

// ============================================================
// 全局 App 数据类型
// ============================================================
interface IAppOption {
  globalData: {
    token: string;
    userInfo: UserInfo | null;
    isLoggedIn: boolean;
  };
}
```

### 3.2 存储规范

所有 key 通过 `utils/storage.ts` 常量管理：

```typescript
// utils/storage.ts
const STORAGE_KEYS = {
  TOKEN: 'token',
  USER_INFO: 'user_info',
} as const;
```

存储内容：

| Key | 类型 | 读写时机 |
|-----|------|---------|
| `token` | `string` | 登录成功 → `set`；退出/401 → `remove` |
| `user_info` | `UserInfo` | 登录成功/修改个人信息 → `set`；退出 → `remove` |

---

## 4. 接口契约

### 4.1 本模块调用的后端 API

| 方法 | 路径 | 说明 | 加密 | 需 Token | 对应 FR |
|------|------|------|:----:|:--------:|:--------:|
| `GET` | `/auth/code` | 获取图形验证码 | ❌ | ❌ | FR-002-002 |
| `POST` | `/auth/register` | 用户注册 | ✅ | ❌ | FR-002-001 |
| `POST` | `/auth/login` (grantType=password) | 密码登录 | ✅ | ❌ | FR-002-011 |
| `POST` | `/auth/login` (grantType=sms) | 短信登录 | ✅ | ❌ | FR-002-012 |
| `POST` | `/auth/login` (grantType=xcx) | 微信登录 | ❌ | ❌ | FR-002-013 |
| `GET` | `/resource/sms/code` | 发送短信验证码 | ❌ | ❌ | FR-002-018 |
| `GET` | `/system/user/getInfo` | 获取个人信息 | ❌ | ✅ | FR-002-023 |
| `PUT` | `/system/user/profile` | 修改个人信息 | ❌ | ✅ | FR-002-024~026 |
| `PUT` | `/system/user/password` | 修改密码 | ❌ | ✅ | FR-002-027 |
| `POST` | `/auth/logout` | 退出登录 | ❌ | ✅ | FR-002-022 |

### 4.2 请求头约定

```typescript
// 需加密的请求（登录/注册）
headers: {
  'Content-Type': 'application/json',
  'isEncrypt': 'true',       // 启用 AES+RSA 加密
  'clientid': 'mini',        // 客户端标识
}

// 需认证的请求
headers: {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`,
}
```

### 4.3 AES+RSA 加密实现

```typescript
// utils/crypto.ts（设计草案）
// 加密流程与 RuoYi-Vue-Plus-UI 一致：
// 1. GET /auth/code 时后端同时返回 RSA 公钥（在响应头或 body 中）
// 2. 客户端生成随机 AES key
// 3. 用 AES key 加密请求 body（CBC 模式）
// 4. 用 RSA 公钥加密 AES key
// 5. 请求头中携带加密后的 AES key
// 
// 注意：微信小程序中 crypto-js 可直接使用，但 JSEncrypt 等 RSA 库需确认兼容性
// 如小程序环境 R` 库兼容性不佳，可改用 wx.request 的 enableHttp2 或与服务端协商替代方案
```

---

## 5. 文件结构

```
miniprogram/
├── pages/
│   ├── login/
│   │   ├── login.ts        # 登录页逻辑
│   │   ├── login.wxml       # 登录页模板
│   │   ├── login.wxss       # 登录页样式
│   │   └── login.json       # 登录页配置（引用 navigation-bar）
│   ├── register/
│   │   ├── register.ts
│   │   ├── register.wxml
│   │   ├── register.wxss
│   │   └── register.json
│   └── profile/
│       ├── profile.ts
│       ├── profile.wxml
│       ├── profile.wxss
│       └── profile.json
├── utils/
│   ├── request.ts           # HTTP 请求封装（已存在基础版本，需增强）
│   ├── storage.ts           # 本地存储管理
│   ├── crypto.ts            # AES+RSA 加密工具
│   └── validator.ts         # 表单校验工具（手机号、密码强度）
├── typings/
│   └── auth.d.ts            # 认证相关类型定义
└── app.ts                   # 增强：onLaunch 中 Token 校验逻辑
```

### 5.1 新增/修改文件清单

| 文件 | 操作 | 说明 |
|------|:----:|------|
| `typings/auth.d.ts` | 新增 | 认证模块全部 TS 类型 |
| `utils/storage.ts` | 新增 | 本地存储 key 常量 + 读写函数 |
| `utils/validator.ts` | 新增 | 手机号正则、密码强度范围校验 |
| `utils/crypto.ts` | 新增 | AES+RSA 加密工具 |
| `utils/request.ts` | 修改 | 增强：自动携带 Token、401 拦截、加密判断 |
| `pages/login/login.*` | 新增 | 登录页四件套 |
| `pages/register/register.*` | 新增 | 注册页四件套 |
| `pages/profile/profile.*` | 新增 | 个人中心四件套 |
| `app.ts` | 修改 | 增强 `onLaunch` 的 Token 校验逻辑 |
| `app.json` | 修改 | 新增页面路径配置 |

---

## 6. 页面设计

### 6.1 登录页（pages/login/login）

#### 组件树

```
login（Component）
├── navigation-bar                  # 复用组件（title="登录"）
├── view.login-container
│   ├── view.tab-switch             # 密码登录 / 短信登录 切换标签
│   │   ├── text[tab="password"]
│   │   └── text[tab="sms"]
│   │
│   ├── view.form-password（wx:if="{{loginType === 'password'}}")
│   │   ├── input[type="number"]    # 手机号输入
│   │   ├── input[type="password"]  # 密码输入（可切换显示/隐藏）
│   │   ├── view.captcha-row
│   │   │   ├── input               # 图形验证码输入
│   │   │   └── image[src=captchaImg]  # 验证码图片（点击刷新）
│   │   └── button                  # "登录"按钮
│   │
│   ├── view.form-sms（wx:else）
│   │   ├── input[type="number"]    # 手机号输入
│   │   ├── view.sms-row
│   │   │   ├── input               # 短信验证码输入
│   │   │   └── button[获取验证码]    # 发送按钮（60s 倒计时）
│   │   └── button                  # "登录"按钮
│   │
│   ├── view.wechat-login-separator  # "———— 其他登录方式 ————"
│   ├── button.wechat-login-btn      # 微信一键登录按钮（open-type="", bindtap handleWechatLogin）
│   └── navigator.to_register        # "没有账号？立即注册"链接
```

#### 数据

```typescript
Component({
  data: {
    loginType: 'password' as 'password' | 'sms',
    // 密码登录表单
    phone: '',
    password: '',
    captchaInput: '',
    // 短信登录表单
    smsPhone: '',
    smsCode: '',
    // 公共
    captchaImg: '',       // base64 图片
    captchaUuid: '',      // 验证码标识
    smsCountdown: 0,       // 短信发送倒计时（秒）
    isLoading: false,
  },
});
```

#### 关键方法

```typescript
methods: {
  // 切换登录方式 tab
  switchTab(e: WechatMiniprogram.CustomEvent): void,
  // 获取图形验证码
  fetchCaptcha(): Promise<void>,
  // 密码登录
  handlePasswordLogin(): Promise<void>,
  // 发送短信验证码
  handleSendSms(): Promise<void>,
  // 短信登录
  handleSmsLogin(): Promise<void>,
  // 微信一键登录
  handleWechatLogin(): Promise<void>,
  // 手机号格式校验
  validatePhone(phone: string): boolean,
  // 清除错误状态
  clearError(): void,
}
```

### 6.2 注册页（pages/register/register）

#### 组件树

```
register（Component）
├── navigation-bar                  # 复用组件（title="注册"）
├── view.register-container
│   ├── input[type="text"]          # 用户名
│   ├── input[type="number"]        # 手机号（选填，placeholder="选填")
│   ├── input[type="password"]      # 密码
│   ├── input[type="password"]      # 确认密码
│   ├── view.captcha-row
│   │   ├── input                   # 图形验证码
│   │   └── image                   # 验证码图片
│   └── button                      # "注册"按钮
│
└── view.login-link                 # "已有账号？去登录"链接
```

#### 数据

```typescript
Component({
  data: {
    username: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    captchaInput: '',
    captchaImg: '',
    captchaUuid: '',
    isLoading: false,
  },
});
```

#### 关键方法

```typescript
methods: {
  fetchCaptcha(): Promise<void>,
  handleRegister(): Promise<void>,
  validateForm(): boolean,  // 全字段校验
  navigateToLogin(): void,
}
```

### 6.3 个人中心（pages/profile/profile）

#### 组件树

```
profile（Component）
├── navigation-bar                  # 复用组件（title="个人中心"）
├── view.profile-card               # 用户信息卡片
│   ├── button[open-type="chooseAvatar"]  # 头像选择
│   │   └── image[src=avatar]       # 当前头像
│   ├── view.info-item
│   │   ├── text                    # "昵称"
│   │   └── input[type="nickname"]  # 微信昵称输入
│   ├── view.info-item
│   │   ├── text                    # "手机号"
│   │   └── text                    # 脱敏手机号（138****8000）
│   └── view.info-item
│
├── view.action-list                # 操作列表
│   ├── cell[修改密码]               # 跳转密码修改弹窗/页面
│   └── cell[退出登录]               # 弹窗确认后退出
│
└── view.change-password-popup（modal）
    ├── input[password, placeholder="旧密码"]
    ├── input[password, placeholder="新密码"]
    ├── input[password, placeholder="确认新密码"]
    └── button[确认修改]
```

#### 数据

```typescript
Component({
  data: {
    userInfo: null as UserInfo | null,
    nickNameInput: '',
    // 修改密码弹窗
    showPasswordModal: false,
    oldPassword: '',
    newPassword: '',
    confirmNewPassword: '',
    isSaving: false,
  },
});
```

#### 关键方法

```typescript
methods: {
  fetchUserProfile(): Promise<void>,
  handleChooseAvatar(e: WechatMiniprogram.CustomEvent): Promise<void>, // 选择头像后上传并保存
  handleNickNameBlur(e: WechatMiniprogram.CustomEvent): Promise<void>,
  saveProfile(): Promise<void>,
  showChangePassword(): void,
  hideChangePassword(): void,
  handleChangePassword(): Promise<void>,
  handleLogout(): void,  // 确认弹窗 → 清除 storage → wx.redirectTo login
}
```

---

## 7. 认证流程

### 7.1 微信登录流程

```
用户点击"微信登录"
        │
        ▼
wx.login({ success: (res) => code })
        │
        ├─ 失败 ──▶ wx.showToast("微信登录失败，请稍后再试")
        │
        ▼ 成功
POST /auth/login
  body: { clientId: "mini", grantType: "xcx", xcxCode: code }
        │
        ├─ HTTP 200 + code=200 ──▶ 登录成功
        │   ├── storage.setToken(data.access_token)
        │   ├── GET /system/user/getInfo → storage.setUserInfo()
        │   └── wx.redirectTo({ url: '/pages/index/index' })
        │
        ├─ HTTP 200 + code=xxx ──▶ [新用户/未注册]
        │   ├── 系统已自动创建用户（后端行为）
        │   └── 前端收到 token → 继续登录流程
        │
        └─ HTTP 4xx/5xx ──▶ wx.showToast(error msg)
```

### 7.2 Token 自动携带 & 过期处理

```
utils/request.ts：
  function request<T>(options):
    1. 从 storage.getToken() 获取 token
    2. 如果有 token 且 needAuth !== false → headers.Authorization = `Bearer ${token}`
    3. 调用 wx.request()
    4. 如果 res.statusCode === 401：
       a. storage.removeToken() + storage.removeUserInfo()
       b. wx.showToast("登录已过期，请重新登录")
       c. wx.redirectTo({ url: '/pages/login/login' })
       d. reject("Token expired")
    5. 其他错误 → reject + wx.showToast
```

### 7.3 App 启动 Token 校验

```
app.onLaunch():
  1. const token = storage.getToken()
  2. if (!token) → 不处理（由首页 onShow 判断跳转登录）
  3. if (token):
     a. GET /system/user/getInfo（校验 Token 有效性）
     b. 成功 → 更新 globalData.userInfo, globalData.isLoggedIn = true
     c. 401 → storage.removeToken()，标记 isLoggedIn = false
```

### 7.4 导航守卫（简易实现）

由于微信小程序无全局路由守卫，在各需登录页面 `onShow` / `attached` 中检查：

```typescript
// 在每个需登录页面中：
lifetimes: {
  attached() {
    const app = getApp<IAppOption>();
    if (!app.globalData.isLoggedIn) {
      wx.redirectTo({ url: '/pages/login/login' });
    }
  }
}
```

---

## 8. 关键算法

### 8.1 表单校验规则

```typescript
// utils/validator.ts

/** 手机号校验：中国大陆手机号 1 开头 11 位 */
export function isValidPhone(phone: string): boolean {
  return /^1[3-9]\d{9}$/.test(phone);
}

/** 密码强度校验：≥ 6 位，必须包含字母和数字 */
export function isValidPassword(password: string): { valid: boolean; message: string } {
  if (password.length < 6) {
    return { valid: false, message: '密码长度不能少于 6 位' };
  }
  if (!/[a-zA-Z]/.test(password)) {
    return { valid: false, message: '密码必须包含字母' };
  }
  if (!/\d/.test(password)) {
    return { valid: false, message: '密码必须包含数字' };
  }
  return { valid: true, message: '' };
}

}

/** 用户名校验：4-20 位字母数字下划线 */
export function isValidUsername(username: string): boolean {
  return /^[a-zA-Z0-9_]{4,20}$/.test(username);
}
```

### 8.2 短信验证码倒计时

```typescript
let timer: number | null = null;

function startSmsCountdown(that: ComponentInstance): void {
  that.setData({ smsCountdown: 60 });
  timer = setInterval(() => {
    const count = that.data.smsCountdown - 1;
    if (count <= 0) {
      clearInterval(timer!);
      timer = null;
    }
    that.setData({ smsCountdown: Math.max(0, count) });
  }, 1000);
}

// 在 detached 生命周期中清理定时器
lifetimes: {
  detached() {
    if (timer) { clearInterval(timer); timer = null; }
  }
}
```

### 8.3 AES+RSA 加密流程

```
请求加密流程：
1. 调用 GET /auth/code → 获取 { uuid, img, publicKey? }
2. 生成随机 AES key（16 字节）
3. AES-CBC 加密请求 body → 得到 encryptedBody
4. RSA 公钥加密 AES key → 得到 encryptedKey
5. 构造请求头：
   headers: {
     'isEncrypt': 'true',
     'encryptKey': base64(encryptedKey)
   }
6. 请求体替换为 base64(encryptedBody)
```

> 详细加密实现参照 RuoYi-Vue-Plus-UI 的 `encrypt.js`，需在微信小程序中适配。

### 8.4 Token 过期处理

```
// utils/request.ts 中的拦截逻辑
function handleResponse(res: WechatMiniprogram.RequestSuccessCallbackResult): void {
  if (res.statusCode === 401) {
    storage.removeToken();
    storage.removeUserInfo();
    getApp<IAppOption>().globalData.isLoggedIn = false;
    wx.showToast({ title: '登录已过期，请重新登录', icon: 'none', duration: 2000 });
    // 延迟跳转，确保 toast 显示
    setTimeout(() => {
      wx.redirectTo({ url: '/pages/login/login' });
    }, 2000);
    return;
  }
  // ...
}
```

---

## 9. 错误处理策略

| 错误类型 | 前端处理 |
|---------|---------|
| 网络不可用（`wx.request fail`） | `wx.showToast({ title: '网络异常，请检查网络连接', icon: 'none' })` |
| HTTP 401（Token 过期） | 清除 storage → 延迟 2s 跳转登录页 |
| HTTP 400（参数校验失败） | 显示后端返回的 `msg` 字段 |
| HTTP 500（服务器错误） | `wx.showToast({ title: '服务器繁忙，请稍后再试', icon: 'none' })` |
| 图形验证码过期 | 点击验证码图片 → 重新调用 `GET /auth/code` |
| 短信发送失败 | 显示具体失败原因，重置倒计时按钮 |
| `wx.login` 失败 | 提示"微信登录失败，请稍后重试"，不阻塞其他登录方式 |
| forms 前端校验失败 | 失焦时红色边框 + 错误文案提示 |

---

## 10. 实现步骤

| 阶段 | 任务 | 输出 | 预估工时 |
|:----:|------|------|:------:|
| 1 | 创建 TypeScript 类型定义 | `typings/auth.d.ts` | 0.5h |
| 2 | 实现 `utils/validator.ts`（表单校验） | 校验工具函数 | 0.5h |
| 3 | 实现 `utils/storage.ts`（存储管理） | storage 模块 | 0.5h |
| 4 | 增强 `utils/request.ts`（Token 自动携带、401 拦截） | 增强 request 模块 | 1h |
| 5 | 实现 `pages/login/login`（登录页） | 登录页面四件套 | 3h |
| 6 | 实现 `pages/register/register`（注册页） | 注册页面四件套 | 2h |
| 7 | 实现 `pages/profile/profile`（个人中心） | 个人中心四件套 | 2h |
| 8 | 增强 `app.ts`（onLaunch Token 校验） | App 启动逻辑 | 0.5h |
| 9 | 更新 `app.json`（pages 配置） | 路由注册 | 0.2h |
| 10 | 真机测试 + 联调 | 全部功能验证 | 2h |
| **合计** | | | **≈ 12h** |

---

## 11. 跨引用对照

| spec.md FR ID | 本 plan 对应实现 |
|:--------------|:----------------|
| FR-002-001 ~ FR-002-010（注册） | `pages/register/` + `utils/validator.ts` + `POST /auth/register` |
| FR-002-011 ~ FR-002-018（登录） | `pages/login/` + `POST /auth/login`（三种 grantType） |
| FR-002-019 ~ FR-002-022（Token） | `utils/request.ts`（401 拦截）+ `app.ts`（onLaunch 校验）+ `utils/storage.ts` |
| FR-002-023 ~ FR-002-028（个人信息） | `pages/profile/` + `GET/PUT /system/user/*` |
| NFR-002-001 ~ NFR-002-006（安全） | `utils/crypto.ts`（AES+RSA）、HTTPS、脱敏展示 |
| NFR-002-007 ~ NFR-002-009（性能） | 小资源、无冗余请求、loading 态 |
| NFR-002-010 ~ NFR-002-014（UX） | Form blur 校验、loading 态、toast 提示 |
| NFR-002-015 ~ NFR-002-016（兼容性） | Skyline + 基础库 ≥ 3.0.0 |

---

## 12. 风险与对策

| 风险 | 影响 | 对策 |
|------|------|------|
| 微信小程序中 AES+RSA 加密库兼容性 | 高 | 预研 `crypto-js` + 小程序可用的 RSA 库（如 `wxmp-rsa`）；若不可行，与服务端协商降级为纯 HTTPS + body hash 方案 |
| `wx.login` 返回的 code 有效期仅 5 分钟 | 中 | 点击微信登录时即调用，减少 code 等待时间；若失败提示用户重试 |
| 基础库 3.0.0 以下用户的兼容 | 低 | 基础库 3.0.0 覆盖率 > 98%，且小程序后台可设置最低基础库版本 |
| 后端接口未就绪 | 中 | 前端先 mock 数据联调，待后端完成后切换真实接口 |

---

## 13. 微信一键登录实现补充

> 详见父工程 [../../specs/002-user-auth/plan.md](../../specs/002-user-auth/plan.md) §9 与 `docs/002-用户注册及登录设计-微信登录集成.md`（§8.4）。

- 新增：`miniprogram/utils/config.ts`（`WECHAT_LOGIN_ENABLED = true`）。
- 流程：`handleWechatLogin()` → `wx.login()` → `POST /auth/login {grantType:'xcx', clientId:'mini', xcxCode}`；未绑定返回业务码 2002 → `getPhoneNumber` 授权 → 重新 `wx.login`（code 一次性）→ 提交 `{xcxCode, phoneCode}` → 建号/绑定。
- 注意：`wx.login` code 与 `getPhoneNumber` code 是两种一次性 code；`session_key` 仅服务端保存。
