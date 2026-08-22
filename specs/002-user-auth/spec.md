# 002-user-auth — 功能规格文档

> 项目：tpl-app-mini（tpl-workspace微信小程序端）
> 模块：用户注册与登录
> 版本：v1.0
> 日期：2026-08-16
> 状态：✅ 已实现
> 父工程规格引用：需求基准见 [../../specs/002-user-auth/spec.md](../../specs/002-user-auth/spec.md)，本文档仅补充本工程（微信小程序端）特有规格

---

## 1. 模块概述

### 1.1 目的


### 1.2 解决的问题

| 问题 | 解决方案 |
|------|---------|
| 用户首次使用需建立身份 | 手机号注册选择，写入 `sys_user` + `tpl_user_profile` |
| 已注册用户需频繁登录 | 支持密码登录、短信验证码登录、微信一键登录三种方式 |
| 微信生态内降低登录摩擦 | 通过 `wx.login()` 获取 code，后端换取 token，无需手动输入账号密码 |
| Token 需跨页面持久化 | 存储在 `wx.storage`，统一请求模块自动携带，过期自动跳转登录页 |

### 1.3 范围

**在范围内：**

- 手机号注册（用户名 + 密码 + 图形验证码）
- 密码登录（手机号 + 密码 + 图形验证码）
- 短信验证码登录（手机号 + 短信验证码）
- 微信小程序登录（`wx.login` → code → `POST /auth/login` grantType=xcx）
- Token 存储与自动携带
- Token 过期自动跳转登录页
- 个人信息查看（昵称、头像、手机号脱敏）
- 个人信息修改（昵称、头像）
- 密码修改（需旧密码验证）
- 登录/注册请求 AES+RSA 加密传输

**不在范围内（本模块不实现）：**

- 用户角色与权限管理（系统仅用户一种角色，无 RBAC）
- 多租户支持（tpl-workspace无多租户场景）
- 邮箱验证码登录
- 微信绑定/解绑管理（后续模块实现）
- 用户注销/账号删除
- 第三方社交账号绑定（如 QQ、微博）

---

## 2. 用户故事

| 编号 | 故事 | 优先级 |
|:-----|------|:------:|
| US-002 | 作为已注册用户，我可以通过手机号 + 密码登录系统 | P0 |
| US-003 | 作为已注册用户，我可以通过手机号 + 短信验证码登录系统 | P0 |
| US-004 | 作为用户，我可以通过微信一键登录，无需手动输入账号密码 | P0 |
| US-005 | 作为登录用户，我可以查看自己的个人资料（昵称、头像、手机号） | P1 |
| US-006 | 作为登录用户，我可以修改昵称和头像 | P1 |
| US-008 | 作为登录用户，我可以修改密码（需旧密码验证） | P1 |
| US-009 | 作为登录用户，在 Token 过期后系统会自动引导我重新登录 | P0 |

---

## 3. 功能需求

### 3.1 注册

| ID | 需求 | RFC 2119 |
|:---|------|:--------:|
| FR-002-001 | 系统 MUST 提供手机号注册功能，用户须填写用户名、密码，手机号为选填 | MUST |
| FR-002-002 | 系统 MUST 在注册前校验图形验证码（`GET /auth/code`），防止机器人注册 | MUST |
| FR-002-003 | 系统 MUST 在注册前检查用户名唯一性，重复时给出明确提示 | MUST |
| FR-002-004 | 系统 MUST 在注册前检查手机号唯一性（如填写），重复时给出明确提示 | MUST |
| FR-002-006 | 系统 MUST 校验密码强度：长度 ≥ 6 位，包含字母和数字 | MUST |
| FR-002-007 | 注册请求 MUST 使用 AES+RSA 加密传输，与 tpl-app-api 加密通道一致 | MUST |
| FR-002-008 | 注册成功后 MUST 自动跳转至登录页，并提示"注册成功，请登录" | MUST |
| FR-002-009 | 当管理员关闭注册开关（`sys_config` 键 `sys.account.registerUser`）时，注册功能 MUST 不可用并给出提示 | MUST |
| FR-002-010 | 注册表单 SHOULD 在用户失焦时实时校验字段格式，减少提交错误 | SHOULD |

### 3.2 登录

| ID | 需求 | RFC 2119 |
|:---|------|:--------:|
| FR-002-011 | 系统 MUST 支持密码登录：用户输入手机号 + 密码 + 图形验证码，后端校验通过后签发 Token | MUST |
| FR-002-012 | 系统 MUST 支持短信验证码登录：用户输入手机号 → 获取短信验证码 → 输入验证码 → 后端校验通过后签发 Token | MUST |
| FR-002-013 | 系统 MUST 支持微信一键登录：调用 `wx.login()` 获取临时 code → 发送至 `POST /auth/login`（grantType=xcx），后端通过微信开放平台 code2session 换 openid → 签发 Token | MUST |
| FR-002-014 | 登录请求 MUST 使用 AES+RSA 加密传输（密码登录），微信登录 code 不加密 | MUST |
| FR-002-015 | 登录成功后 MUST 将 Token 存储到 `wx.storage`，并设置登录态标记 | MUST |
| FR-002-016 | 登录成功后 MUST 跳转至首页（个人中心） | MUST |
| FR-002-017 | 连续登录失败 SHOULD 触发临时锁定（由后端 Redis 计数器控制），前端提示"登录失败次数过多，请稍后再试" | SHOULD |
| FR-002-018 | 短信验证码发送后 MUST 在 60 秒内禁止重复发送，前端按钮置灰并显示倒计时 | MUST |

### 3.3 Token 管理

| ID | 需求 | RFC 2119 |
|:---|------|:--------:|
| FR-002-019 | 所有需认证的 API 请求 MUST 自动携带 Token（通过 `utils/request.ts` 统一附加 `Authorization: Bearer <token>` 请求头） | MUST |
| FR-002-020 | 收到 HTTP 401 响应时，系统 MUST 清除本地 Token，跳转至登录页 | MUST |
| FR-002-021 | App 启动时（`app.onLaunch`）MUST 检查本地 Token 是否存在，存在则校验有效性，不存在则跳转登录页 | MUST |
| FR-002-022 | 用户手动退出登录时 MUST 清除本地 Token 和用户信息缓存 | MUST |

### 3.4 个人信息管理

| ID | 需求 | RFC 2119 |
|:---|------|:--------:|
| FR-002-023 | 登录用户 MUST 可查看个人资料（昵称、头像、手机号脱敏显示） | MUST |
| FR-002-024 | 登录用户 SHOULD 可修改昵称（使用微信 `input type="nickname"` 组件） | SHOULD |
| FR-002-025 | 登录用户 SHOULD 可修改头像（使用微信 `button open-type="chooseAvatar"` 组件） | SHOULD |
| FR-002-027 | 登录用户 SHOULD 可修改密码，需输入旧密码 + 新密码 + 确认新密码 | SHOULD |
| FR-002-028 | 个人信息修改成功后 MUST 刷新本地缓存和 `app.globalData` 中的用户信息 | MUST |

---

## 4. 关键实体

### 4.1 UserInfo

小程序端使用的用户信息结构：

| 字段 | 类型 | 说明 |
|------|------|------|
| `userId` | `number` | 用户 ID（来自 `sys_user.user_id`） |
| `userName` | `string` | 用户名（登录账号） |
| `nickName` | `string` | 昵称 |
| `phoneNumber` | `string` | 手机号（脱敏显示，如 `138****8000`） |
| `avatar` | `string` | 头像 URL |
| `birthDate` | `string?` | 出生日期（YYYY-MM-DD，选填） |

### 4.2 LoginRequest

| 字段 | 密码登录 | 短信登录 | 微信登录 |
|------|:-------:|:-------:|:-------:|
| `clientId` | `'mini'` | `'mini'` | `'mini'` |
| `grantType` | `'password'` | `'sms'` | `'xcx'` |
| `username` | 手机号 | — | — |
| `password` | 密码 | — | — |
| `phoneNumber` | — | 手机号 | — |
| `smsCode` | — | 验证码 | — |
| `xcxCode` | — | — | `wx.login()` 返回的 code |
| `code` | 图形验证码 | — | — |
| `uuid` | 验证码标识 | — | — |

### 4.3 RegisterRequest

| 字段 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| `username` | `string` | ✅ | 用户名（登录账号） |
| `password` | `string` | ✅ | 密码（≥ 6 位，含字母和数字） |
| `phoneNumber` | `string` | ❌ | 手机号（选填） |
| `code` | `string` | ✅ | 图形验证码 |
| `uuid` | `string` | ✅ | 验证码唯一标识 |

### 4.4 Token

| 字段 | 类型 | 说明 |
|------|------|------|
| `access_token` | `string` | Sa-Token 签发的 JWT Token |
| `expire_in` | `number` | 过期时间（秒），通常 7200（2 小时） |
| `client_id` | `string` | 客户端标识（`'mini'`） |

### 4.5 实体关系

```
LoginRequest──login()──▶ LoginResponse (Token)
RegisterRequest──register()──▶ void ──▶ 引导至登录页
Token──attach──▶ wx.request header ──▶ tpl-app-api 鉴权
Token──expired──▶ HTTP 401 ──▶ 跳转登录页
```

---

## 5. 验收场景

### 5.1 注册

| 编号 | 场景 | 前置条件 | Given | When | Then |
|:-----|------|---------|-------|------|-----|
| AC-001 | 正常注册 | 注册开关开启，用户名/手机号未占用 | 用户在注册页填写完整有效信息 | 点击"注册"按钮 | 注册成功，跳转登录页，提示"注册成功，请登录" |
| AC-002 | 用户名已存在 | 目标用户名已被注册 | 用户输入已存在的用户名 | 提交注册 | 提示"用户名已存在" |
| AC-003 | 手机号已注册 | 目标手机号已被注册 | 用户输入已存在的手机号 | 提交注册 | 提示"手机号已被注册" |
| AC-004 | 验证码错误 | — | 用户输入错误的图形验证码 | 提交注册 | 提示"验证码错误" |
| AC-005 | 注册开关关闭 | 管理员关闭注册 | 用户访问注册页 | — | 显示"注册功能暂未开放" |
| AC-007 | 密码强度不足 | — | 用户输入纯数字密码 | 失焦 | 提示"密码需包含字母和数字" |

### 5.2 密码登录

| 编号 | 场景 | 前置条件 | Given | When | Then |
|:-----|------|---------|-------|------|-----|
| AC-008 | 正常登录 | 用户已注册 | 用户输入正确手机号 + 密码 + 验证码 | 点击"登录" | 登录成功，存储 Token，跳转首页 |
| AC-009 | 密码错误 | 用户已注册 | 用户输入正确手机号 + 错误密码 | 点击"登录" | 提示"密码错误" |
| AC-010 | 用户不存在 | — | 用户输入未注册的手机号 | 点击"登录" | 提示"用户不存在" |
| AC-011 | 验证码错误 | — | 用户输入错误图形验证码 | 提交 | 提示"验证码错误" |

### 5.3 短信验证码登录

| 编号 | 场景 | 前置条件 | Given | When | Then |
|:-----|------|---------|-------|------|-----|
| AC-012 | 发送验证码 | 手机号已注册 | 用户输入已注册手机号 | 点击"获取验证码" | 发送成功，按钮置灰并显示 60 秒倒计时 |
| AC-013 | 验证码登录成功 | 已获取有效验证码 | 用户输入正确验证码 | 点击"登录" | 登录成功，跳转首页 |
| AC-014 | 验证码错误 | 已获取验证码 | 用户输入错误验证码 | 点击"登录" | 提示"验证码错误" |
| AC-015 | 发送频率限制 | 上次发送不足 60 秒 | 用户点击"获取验证码" | 点击 | 按钮置灰，剩余倒计时不可点击 |

### 5.4 微信登录

| 编号 | 场景 | 前置条件 | Given | When | Then |
|:-----|------|---------|-------|------|-----|
| AC-016 | 微信一键登录（已绑定） | 用户已绑定微信 | 用户点击"微信登录"按钮 | `wx.login()` 获取 code → 发送后端 | 登录成功，跳转首页 |
| AC-018 | wx.login 失败 | 微信服务异常 | 用户点击"微信登录" | `wx.login()` 调用失败 | 提示"微信登录失败，请稍后再试" |

### 5.5 个人信息管理

| 编号 | 场景 | 前置条件 | Given | When | Then |
|:-----|------|---------|-------|------|-----|
| AC-019 | 查看个人信息 | 已登录 | 用户进入个人中心页面 | — | 显示昵称、头像、手机号（脱敏） |
| AC-021 | 修改密码（成功） | 已登录，旧密码正确 | 用户输入正确旧密码 + 有效新密码 + 确认密码 | 提交 | 修改成功，提示"密码修改成功，请重新登录"，清除 Token 跳转登录页 |
| AC-022 | 修改密码（旧密码错误） | 已登录 | 用户输入错误旧密码 | 提交 | 提示"旧密码错误" |

### 5.6 Token 管理

| 编号 | 场景 | 前置条件 | Given | When | Then |
|:-----|------|---------|-------|------|-----|
| AC-023 | Token 过期自动跳转 | Token 已过期 | 用户发起需认证的请求 | 后端返回 HTTP 401 | 清除本地 Token，跳转登录页，提示"登录已过期，请重新登录" |
| AC-024 | 退出登录 | 已登录 | 用户点击"退出登录" | 确认退出 | 清除 Token 和用户信息，跳转登录页 |
| AC-025 | App 启动时已登录 | 本地有有效 Token | App 启动 | `onLaunch` 检查 Token 有效 | 直接进入首页 |
| AC-026 | App 启动时未登录 | 本地无 Token | App 启动 | `onLaunch` 检查 | 跳转登录页 |

---

## 6. 非功能性需求

### 6.1 安全性

| ID | 需求 | RFC 2119 |
|:---|------|:--------:|
| NFR-002-001 | 所有 API 请求 MUST 使用 HTTPS | MUST |
| NFR-002-002 | 密码登录和注册请求 MUST 使用 AES+RSA 加密传输（与 tpl-app-api 加密通道一致） | MUST |
| NFR-002-003 | 客户端 MUST NOT 存储用户明文密码 | MUST |
| NFR-002-004 | Token MUST 存储在安全的本地存储中（`wx.storage`，隔离于其他小程序） | MUST |
| NFR-002-005 | 手机号码在 UI 展示时 MUST 脱敏处理（如 `138****8000`） | MUST |
| NFR-002-006 | 敏感操作（修改密码、退出登录）SHOULD 有二次确认 | SHOULD |

### 6.2 性能

| ID | 需求 | RFC 2119 |
|:---|------|:--------:|
| NFR-002-007 | 登录页首屏渲染时间 SHOULD 在 1 秒以内 | SHOULD |
| NFR-002-008 | 登录 API 请求 SHOULD 在 3 秒内返回结果 | SHOULD |
| NFR-002-009 | 图形验证码图片 SHOULD 在 1 秒内加载完成 | SHOULD |

### 6.3 用户体验

| ID | 需求 | RFC 2119 |
|:---|------|:--------:|
| NFR-002-010 | 所有表单提交 SHOULD 有 loading 状态反馈（按钮置灰 + 加载动画） | SHOULD |
| NFR-002-011 | 网络错误 SHOULD 显示友好 toast 提示，不展示原始错误信息 | SHOULD |
| NFR-002-012 | 表单字段 SHOULD 支持失焦实时校验（blur 事件触发） | SHOULD |
| NFR-002-013 | 密码输入框 SHOULD 提供显示/隐藏切换（eye icon） | SHOULD |
| NFR-002-014 | 登录页 SHOULD 支持底部 tab 切换密码登录 / 短信登录 | SHOULD |

### 6.4 兼容性

| ID | 需求 | RFC 2119 |
|:---|------|:--------:|
| NFR-002-015 | 系统 MUST 兼容微信基础库 ≥ 3.0.0 | MUST |
| NFR-002-016 | 系统 MUST 在 iOS 和 Android 微信客户端上正常运行 | MUST |

---

## 7. 依赖

### 7.1 外部服务

| 依赖 | 说明 | 关键接口 |
|------|------|---------|
| tpl-app-api | 后端 REST API（Spring Boot 3.x + Sa-Token） | `/auth/register`、`/auth/login`、`/auth/code`、`/resource/sms/code`、`/system/user/getInfo`、`/system/user/profile`、`/system/user/password`、`/auth/logout` |
| 微信开放平台 | 微信登录凭证校验 | `wx.login()` → code → 后端 code2session |
| 微信客户端 | 运行时环境（基础库 ≥ 3.0.0） | `wx.request`、`wx.setStorageSync`、`wx.navigateTo` |

### 7.2 内部模块

| 依赖 | 说明 |
|------|------|
| 001-app-shell | `utils/request.ts`（HTTP 封装）、`utils/storage.ts`（本地存储）、`components/navigation-bar`（导航栏） |
| app 入口 | `app.onLaunch` 中的 Token 校验逻辑，`app.globalData` 中的全局登录态 |

### 7.3 后续模块依赖本模块

| 模块 | 依赖说明 |
|------|---------|

---

## 8. 待澄清事项

| 编号 | 问题 | 影响范围 |
|:-----|------|---------|
| [NEEDS CLARIFICATION] NC-002 | 头像上传的实现方式：是小程序端直传 MinIO 后提交 URL，还是通过后端上传接口中转？ | FR-002-025 |
| [NEEDS CLARIFICATION] NC-003 | AES+RSA 加密的密钥协商流程——小程序端如何首次获取 RSA 公钥？是硬编码在客户端还是通过 API 动态获取？ | FR-002-007、FR-002-014、NFR-002-002 |

---

## 9. 术语表

| 术语 | 英文 | 说明 |
|------|------|------|
| 微信小程序 | WeChat Mini Program | 微信生态内的轻量级应用 |
| Token | Token | Sa-Token 签发的 JWT 访问令牌 |
| 图形验证码 | Captcha | 4 位字母数字组合图片，防机器人 |
| 短信验证码 | SMS Code | 4 位数字，有效期 5 分钟 |
| 微信登录 | WeChat Login | 通过 `wx.login()` 获取临时 code，后端换取 openid 完成认证 |
| 脱敏 | Mask / Desensitize | 手机号隐藏中间 4 位（如 `138****8000`） |
| 注册开关 | Register Switch | `sys_config` 表中 `sys.account.registerUser` 键控制 |
| 学段 | Stage | PRIMARY（小学 G1-G6）、MIDDLE（初中 G7-G9）、HIGH（高中 G10-G12） |

---

## 微信登录集成（补充说明）

> 需求基准见父工程 [../../specs/002-user-auth/spec.md](../../specs/002-user-auth/spec.md) §11，技术设计见 `docs/002-用户注册及登录设计-微信登录集成.md`（§8.4）。

### 首次登录流程（新 openid 自动建号）

```
点击「微信一键登录」
  → wx.login() 获取临时 code
  → POST /auth/login { grantType:'xcx', clientId:'mini', xcxCode }
  ├─ 后端 code2session → openid 已绑定 → 直接登录（返回 token）
  └─ 未绑定 → 返回业务码 2002「需手机号」
        → 弹出 getPhoneNumber 授权按钮
        → 用户授权 → e.detail.code（phoneCode，非 wx.login code）
        → 重新 wx.login() 获取新 code（wx.login code 为一次性，不可复用）
        → POST /auth/login { grantType:'xcx', clientId:'mini', xcxCode, phoneCode }
        → 登录成功
```

### 关键约束

- `wx.login` code 与 `getPhoneNumber` code 是**两种不同的一次性 code**，不可混用。
- `wx.login` code 被后端消费后失效，二次请求必须重新 `wx.login`。
- `session_key` 仅服务端保存，绝不下发前端。
- 禁止程序化调用 `wx.getPhoneNumber`，必须用 `<button open-type="getPhoneNumber">` 触发。

### 编译开关

- `WECHAT_LOGIN_ENABLED`（`miniprogram/utils/config.ts` 常量，默认 `true`）：控制「微信一键登录」按钮显隐。

---

## 无密码账号（微信一键登录自动建号）

微信一键登录自动建号的账号无密码（`sys_user.password` 为空），小程序端处理：

- **密码登录**：不允许空密码（无密码账号无法密码登录）。
- **修改密码页**：调用 `GET /system/user/isEmptyPassword`；若为无密码账号，隐藏「当前密码」输入框，提交时当前密码传空字符串。

## 验证码开关（禁用验证码）

- tpl-app-api 提供图形验证码开关配置项 captcha.enable。
- captcha.enable: false（禁用）时：后端跳过验证码校验、GET /auth/code 返回 captchaEnabled: false、本端隐藏图形验证码表单项并禁用相关功能。
- 详见父工程需求基准 specs/002-user-auth/spec.md §10。