# 接口模型

> 项目：tpl-app-mini（tpl-workspace微信小程序端）
> 版本：v1.0
> 日期：2026-08-12

---

## 一、后端 API 接口（tpl-app-api）

> 以下接口由 `tpl-app-api` 提供，小程序端作为消费方调用。
> 详细 API 设计参见 `../docs/` 中的设计文档。

### 1.1 公开接口（无需 Token）

| 方法 | 路径 | 说明 | 加密 |
|------|------|------|:----:|
| POST | `/auth/register` | 用户注册 | ✅ AES+RSA |
| POST | `/auth/login` | 统一登录（通过 grantType 区分密码/短信/微信） | ✅ AES+RSA |
| GET | `/auth/code` | 获取图形验证码 | - |
| GET | `/resource/sms/code` | 发送短信验证码 | - |

### 1.2 需认证接口（需 Token）

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/auth/logout` | 登出 |
| GET | `/system/user/getInfo` | 获取当前用户信息 |
| PUT | `/system/user/password` | 修改密码 |

---

## 二、接口调用方说明

### 2.1 tpl-app-mini 调用的接口

| 接口 | 模块 | 调用场景 |
|------|------|---------|
| `POST /auth/register` | 002-user-auth | 注册页提交注册 |
| `POST /auth/login` (grantType=password) | 002-user-auth | 密码登录 |
| `POST /auth/login` (grantType=sms) | 002-user-auth | 短信验证码登录 |
| `POST /auth/login` (grantType=xcx) | 002-user-auth | 微信小程序登录 |
| `GET /auth/code` | 002-user-auth | 获取图形验证码 |
| `GET /resource/sms/code` | 002-user-auth | 获取短信验证码 |
| `GET /system/user/getInfo` | 002-user-auth | 获取个人信息 |
| `PUT /system/user/profile` | 002-user-auth | 修改个人信息 |
| `PUT /system/user/password` | 002-user-auth | 修改密码 |
| `POST /auth/logout` | 002-user-auth | 退出登录 |

### 2.2 接口返回格式

所有接口遵循 RuoYi-Vue-Plus 统一返回格式：

```typescript
// 成功响应
interface ApiResponse<T> {
  code: number;       // 200 = 成功
  msg: string;        // 消息
  data: T;            // 数据
}

// 错误响应
interface ApiErrorResponse {
  code: number;       // 非 200
  msg: string;        // 错误消息
}
```

---

## 三、微信平台接口

### 3.1 微信登录

小程序端调用微信提供的 API：

| 方法 | 说明 |
|------|------|
| `wx.login()` | 获取临时登录凭证 code |
| `wx.getUserProfile()` | 获取用户头像昵称（需用户授权） |
| `wx.getUserInfo()` | 获取用户信息（已废弃，改为头像昵称填写能力） |

登录流程：
```
小程序端                        tpl-app-api                      微信服务器
  │                                │                               │
  │ wx.login()                     │                               │
  │──────────────────────────────────────────────────────────────▶│
  │ ◀── code ─────────────────────────────────────────────────────│
  │                                │                               │
  │ POST /auth/login (xcxCode)     │                               │
  │───────────────────────────────▶│                               │
  │                                │ code2session(code)            │
  │                                │──────────────────────────────▶│
  │                                │ ◀── openid, session_key ──────│
  │                                │                               │
  │                                │ 签发 JWT Token                │
  │ ◀── { access_token } ─────────│                               │
  │                                │                               │
```

### 3.2 微信隐私接口

根据微信最新隐私规范，获取用户信息需：

- **头像**：使用 `<button open-type="chooseAvatar">` 让用户选择
- **昵称**：使用 `<input type="nickname">` 让用户填写
- **手机号**：使用 `<button open-type="getPhoneNumber">` 获取加密手机号

---

## 四、小程序端内部接口

### 4.1 页面间通信

| 方式 | 使用场景 |
|------|---------|
| `wx.navigateTo({ url, ... })` | 页面跳转并传参 |
| `wx.navigateBack()` | 返回上一页 |
| `getApp().globalData` | 跨页面共享全局数据 |
| `wx.getStorageSync/setStorageSync` | 持久化数据共享 |

### 4.2 组件通信

| 方式 | 使用场景 |
|------|---------|
| `properties` | 父组件向子组件传值 |
| `triggerEvent` | 子组件向父组件通知事件 |
| `this.selectComponent` | 父组件获取子组件实例 |
