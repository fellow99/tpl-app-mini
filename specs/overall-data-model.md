# 数据模型

> 项目：tpl-app-mini（tpl-workspace微信小程序端）
> 版本：v1.0
> 日期：2026-08-12

---

## 一、前端数据结构

### 1.1 全局数据（app.globalData）

```typescript
interface IAppOption {
  globalData: {
    /** 登录 token（JWT） */
    token: string;
    /** 用户信息 */
    userInfo: UserInfo | null;
    /** 是否已登录 */
    isLoggedIn: boolean;
  };
}

interface UserInfo {
  userId: number;
  userName: string;
  nickName: string;
  phoneNumber: string;
  avatar: string;
  birthDate?: string;       // YYYY-MM-DD
}
```

### 1.2 本地存储（wx.storage）

| Key | 类型 | 说明 |
|-----|------|------|
| `token` | `string` | 登录 JWT Token |
| `userInfo` | `UserInfo` | 用户信息对象 |
| `logs` | `string[]` | 启动日志（已有，后续可移除） |

---

## 二、后端数据模型（tpl-app-api）

> 以下为 `tpl-app-api` 的数据模型，小程序端通过 API 接口获取。

### 2.1 用户视图（tpl_user_view）

| 字段 | 类型 | 说明 |
|------|------|------|
| `user_id` | `BIGINT` | 用户 ID |
| `user_name` | `VARCHAR(30)` | 用户名 |
| `nick_name` | `VARCHAR(30)` | 昵称 |
| `phone_number` | `VARCHAR(11)` | 手机号 |
| `password` | `VARCHAR(100)` | BCrypt 加密密码 |
| `avatar` | `VARCHAR(200)` | 头像路径 |
| `status` | `CHAR(1)` | 状态（0=正常, 1=停用） |
| `del_flag` | `CHAR(1)` | 删除标记 |
| `login_ip` | `VARCHAR(128)` | 最后登录 IP |
| `login_date` | `DATETIME` | 最后登录时间 |
| `create_time` | `DATETIME` | 创建时间 |
| `birth_date` | `DATE` | 出生日期（选填） |

> 详细表结构参见 `../docs/数据模型设计.md`

---

## 三、API 请求/响应模型

### 3.1 登录请求

```typescript
// 密码登录
interface PasswordLoginRequest {
  clientId: string;       // 'mini'
  grantType: 'password';
  username: string;       // 手机号
  password: string;
  code: string;           // 图形验证码
  uuid: string;           // 验证码标识
}

// 微信登录
interface WechatLoginRequest {
  clientId: string;
  grantType: 'xcx';
  xcxCode: string;        // wx.login 返回的 code
}

// 登录响应
interface LoginResponse {
  access_token: string;
  expire_in: number;      // 过期时间（秒）
  client_id: string;
}
```

### 3.2 注册请求

```typescript
interface RegisterRequest {
  username: string;       // 用户名
  password: string;
  phoneNumber?: string;   // 手机号（选填）
  code: string;           // 图形验证码
  uuid: string;           // 验证码标识
}
```

### 3.3 个人中心响应

```typescript
// 用户信息（对应后端 UserInfoVO）
```

---

## 四、状态机

### 4.1 登录状态

```
  未登录 ──[登录成功]──▶ 已登录
  已登录 ──[退出/Token过期]──▶ 未登录
```

### 4.2 页面访问状态

```
App启动
  │
  ├── 有 Token ──▶ 校验 Token 有效性
  │                    ├── 有效 ──▶ 进入首页（个人中心）
  │                    └── 过期 ──▶ 跳转登录页
  │
  └── 无 Token ──▶ 跳转登录页
```
