# 整体技术方案

> 项目：tpl-app-mini（tpl-workspace微信小程序端）
> 版本：v1.0
> 日期：2026-08-12

---

## 一、技术上下文

### 1.1 运行环境

| 维度 | 说明 |
|------|------|
| 宿主 | 微信客户端（iOS / Android） |
| 基础库 | ≥ 3.0.0（支持 Skyline + glass-easel） |
| 渲染引擎 | Skyline（非 WebView） |
| 组件框架 | glass-easel |
| 开发语言 | TypeScript 4.x+ → ES2020 |
| 包管理 | npm（仅用于类型定义） |

### 1.2 关键依赖

| 依赖 | 版本 | 用途 |
|------|------|------|
| miniprogram-api-typings | ^2.8.3-1 | 微信小程序 API TypeScript 类型定义 |

### 1.3 配套服务

| 服务 | 地址 | 说明 |
|------|------|------|
| tpl-app-api | 待配置 | REST API 后端（Spring Boot 3.x + Sa-Token） |
| 微信开放平台 | api.weixin.qq.com | 微信登录、用户信息获取 |

---

## 二、宪法合规检查

| 宪法原则 | 状态 | 说明 |
|----------|:----:|------|
| 组件化优先（Component 构造器） | ✅ 合规 | 所有页面和组件使用 `Component()` |
| TypeScript 严格模式 | ✅ 合规 | tsconfig 全部 strict 选项启用 |
| 目录约定 | ✅ 合规 | 遵循微信小程序标准目录结构 |
| Skyline + glass-easel 固定 | ✅ 合规 | `app.json` 已配置 |
| 无第三方 UI 框架 | ✅ 合规 | 当前无 UI 库依赖 |
| HTTP 请求统一管理 | ⚠️ 待实现 | 当前直接使用 `wx.request`，需封装 |
| 命名规范 | ✅ 合规 | 遵循 kebab-case 文件名、camelCase 变量 |
| 文档先行 | ⚠️ 部分 | 当前正进行规范文档编写 |

---

## 三、实施策略

### 3.1 实施优先级

```
阶段 1：基础设施
  ├── HTTP 请求封装（utils/request.ts）
  ├── 本地存储管理（utils/storage.ts）
  ├── 全局样式和主题
  └── 页面路由骨架

阶段 2：用户认证
  ├── 登录页（pages/login/login）
  ├── 注册页（pages/register/register）
  ├── 个人中心（pages/profile/profile）
  └── Token 管理 + 请求拦截

阶段 3：个人中心
  ├── 个人中心首页（pages/profile/profile）
```

### 3.2 文件结构规划

```
miniprogram/
├── app.json
├── app.ts
├── app.wxss
├── components/
│   └── navigation-bar/          # 已有
├── pages/
│   ├── index/                   # 已有（将改造为个人中心入口）
│   ├── logs/                    # 已有（可能移除）
│   ├── login/                   # 新增 - 登录页
│   ├── register/                # 新增 - 注册页
│   ├── profile/                 # 新增 - 个人中心
│   └── profile/         # 新增 - 个人中心
├── utils/
│   ├── util.ts                  # 已有
│   ├── request.ts               # 新增 - HTTP 请求封装
│   └── storage.ts               # 新增 - 本地存储管理
└── typings/
    └── index.d.ts               # 已有
```

### 3.3 路由规划

| 页面路径 | 页面名称 | 需登录 | 说明 |
|----------|---------|:------:|------|
| `pages/index/index` | 首页/个人中心 | ✅ | 登录后首页 |
| `pages/login/login` | 登录页 | ❌ | 密码/短信/微信登录 |
| `pages/register/register` | 注册页 | ❌ | 手机号注册 |
| `pages/profile/profile` | 个人中心 | ✅ | 个人信息管理 |

---

## 四、横切关注点

### 4.1 HTTP 请求封装

创建一个统一的 `request.ts` 模块：

```typescript
// utils/request.ts (设计草案)
const BASE_URL = 'https://api.example.com'; // 生产环境配置

interface RequestOptions {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  data?: any;
  needAuth?: boolean; // 是否需要携带 Token
}

function request<T>(options: RequestOptions): Promise<T> {
  return new Promise((resolve, reject) => {
    const token = wx.getStorageSync('token');
    wx.request({
      url: BASE_URL + options.url,
      method: options.method || 'GET',
      data: options.data,
      header: {
        'Content-Type': 'application/json',
        ...(options.needAuth !== false && token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      success(res) {
        if (res.statusCode === 401) {
          // Token 过期，跳转登录
          wx.removeStorageSync('token');
          wx.navigateTo({ url: '/pages/login/login' });
          reject(new Error('Token expired'));
          return;
        }
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data as T);
        } else {
          reject(new Error(`Request failed: ${res.statusCode}`));
        }
      },
      fail(err) {
        wx.showToast({ title: '网络异常', icon: 'none' });
        reject(err);
      },
    });
  });
}
```

### 4.2 认证流程

```
┌─────────────┐                 ┌──────────────┐
│ 小程序端      │                 │  tpl-app-api  │
├─────────────┤                 ├──────────────┤
│             │                 │              │
│ 密码登录：   │  POST /auth/login               │
│ 输入手机号   │ ──────────────▶│ 校验密码      │
│ + 密码      │ ◀──────────────│ 返回 JWT      │
│             │                 │              │
│ 微信登录：   │  wx.login()    │              │
│ 获取 code   │ ──────────────▶│ code 换 token │
│             │ ◀──────────────│ 返回 JWT      │
│             │                 │              │
│ 后续请求：   │  携带 Bearer token             │
│             │ ──────────────▶│ 校验 token    │
│             │ ◀──────────────│ 返回数据      │
└─────────────┘                 └──────────────┘
```

### 4.3 本地存储管理

```typescript
// utils/storage.ts (设计草案)
const STORAGE_KEYS = {
  TOKEN: 'token',
  USER_INFO: 'userInfo',
} as const;

export const storage = {
  getToken(): string { return wx.getStorageSync(STORAGE_KEYS.TOKEN) || ''; },
  setToken(token: string): void { wx.setStorageSync(STORAGE_KEYS.TOKEN, token); },
  removeToken(): void { wx.removeStorageSync(STORAGE_KEYS.TOKEN); },

  getUserInfo<T>(): T | null { return wx.getStorageSync(STORAGE_KEYS.USER_INFO) || null; },
  setUserInfo<T>(info: T): void { wx.setStorageSync(STORAGE_KEYS.USER_INFO, info); },
  removeUserInfo(): void { wx.removeStorageSync(STORAGE_KEYS.USER_INFO); },

};
```

### 4.4 全局状态管理

不使用 Pinia 等第三方状态库，通过以下方式管理状态：

```typescript
// app.ts 全局数据
App<IAppOption>({
  globalData: {
    token: '',           // 登录 token
    userInfo: null,      // 用户信息
    isLoggedIn: false,   // 登录状态
  },
  // ...
});
```

---

## 五、测试策略

### 5.1 测试层级

| 层级 | 方法 | 覆盖范围 |
|------|------|---------|
| 单元测试 | 无（小程序端暂不引入测试框架） | - |
| 功能测试 | 测试用例文档 `test-cases.md` | 每个功能模块 |
| 手动验收 | 微信开发者工具 + 真机测试 | 全部页面和交互 |

### 5.2 测试用例覆盖

每个涉及 UI 交互的功能模块须提供 `test-cases.md`：

- `002-user-auth/test-cases.md`：注册、登录、个人信息管理

---

## 六、部署策略

### 6.1 开发环境

- IDE：微信开发者工具（Nightly 版推荐）
- 后端：tpl-app-api 本地开发环境
- 调试：Skyline 模拟器 + 真机预览

### 6.2 生产发布

1. 代码通过审核
2. 微信开发者工具 → 上传代码
3. 微信公众平台 → 开发管理 → 提交审核
4. 审核通过 → 发布上线
5. 配置合法域名（request 域名、uploadFile 域名）
