# tpl-app-mini

> tpl-workspace — 微信小程序端

[![TypeScript](https://img.shields.io/badge/TypeScript-ES2020-3178C6?logo=typescript)](./tsconfig.json)
[![Skyline](https://img.shields.io/badge/Skyline-Renderer-07C160?logo=wechat)](./miniprogram/app.json)
[![glass-easel](https://img.shields.io/badge/glass--easel-Component-07C160?logo=wechat)](./miniprogram/app.json)
[![WeChat](https://img.shields.io/badge/WeChat-Mini%20Program-07C160?logo=wechat)](./project.config.json)

---

## 项目简介

**tpl-app-mini** 是「tpl-workspace」产品体系的微信小程序端。采用微信原生框架（TypeScript + Skyline 渲染引擎 + glass-easel 组件框架），为用户用户提供轻量级的业务入口。

### tpl-workspace产品体系

```
tpl-workspace/
├── tpl-app-web/          # 用户端 Web 应用 (Vue 3)
├── tpl-app-api/          # 核心业务后端 (Spring Boot 3.x)
├── tpl-manage/           # 管理后台后端 (RuoYi-Vue-Plus)
├── tpl-manage-ui/        # 管理后台前端
├── tpl-app-android/      # Android 客户端
├── tpl-app-harmony/      # 鸿蒙客户端
├── tpl-app-mini/         # 微信小程序 ★ 本仓库
└── docs/                # 产品文档与设计稿
```



**当前阶段**：脚手架已就绪（Skyline + TypeScript + 自定义导航栏），业务功能（用户认证、个人中心）依规格文档逐步实现。

---

## 架构特点

### 微信原生 + Skyline 渲染

tpl-app-mini 采用微信小程序原生开发模式，不引入第三方框架：

```
miniprogram/
├── app.json              # 全局配置（Skyline + glass-easel + 页面路由）
├── app.ts                # 入口逻辑（wx.login 集成、全局状态）
├── app.wxss              # 全局样式
├── pages/                # 页面（每个页面一个目录）
│   ├── index/            #   首页 / 个人中心（登录后入口）
│   └── ...               #   （按模块逐步新增）
├── components/           # 公共组件
│   └── navigation-bar/   #   自定义导航栏（支持 Skyline 安全区域适配）
├── utils/                # 工具函数
│   ├── util.ts           #   时间格式化
│   ├── request.ts        #   HTTP 请求封装（计划中）
│   └── storage.ts        #   本地存储管理（计划中）
└── typings/              # TypeScript 类型声明
```

### 与 Web 前端的关键差异

| 维度 | tpl-app-web (Vue 3) | tpl-app-mini |
|------|-------------------|-------------|
| 运行环境 | 浏览器 | 微信客户端 Skyline |
| 框架 | Vue 3 + Composition API | glass-easel `Component()` |
| 状态管理 | Pinia | `getApp().globalData` + `wx.storage` |
| 路由 | Vue Router | 小程序页面栈（`app.json` pages） |
| HTTP | Axios | `wx.request`（封装为 utils/request.ts） |
| UI | Element Plus | 微信原生组件 |
| 微信登录 | JustAuth OAuth 重定向 | `wx.login()` + code 交换 |

### 工程依赖关系

```
docs/ (产品设计文档)
    │
    ├──▶ tpl-app-mini (微信小程序) ─── wx.request ──▶ tpl-app-api (后端 API)
    │
    └──▶ tpl-app-web (Web 前端，界面设计参考源)
```

---

## 快速开始

```bash
# 1. 安装依赖（仅 TypeScript 类型定义）
cd tpl-app-mini
npm install

# 2. 打开微信开发者工具
#   - 导入项目，选择 tpl-app-mini 目录
#   - AppID: wxChangeMe（占位符，需替换为实际小程序 AppID，或使用测试号）
#   - 确保使用 Nightly 版（支持 Skyline）

# 3. 启动 tpl-app-api 后端（另开终端）
cd ../tpl-app-api
# 按 tpl-app-api/README.md 启动后端服务

# 4. 在微信开发者工具中点击「编译」
#   - Skyline 模拟器预览
#   - 或点击「真机调试」扫码体验
```

> **环境要求**：
> - 微信开发者工具 Nightly 版（支持 Skyline + glass-easel）
> - 微信基础库 ≥ 3.0.0
> - Node.js ≥ 18.x（仅用于 npm 类型定义）

> ⚠️ **重要：AppID 配置**
> `project.config.json` 中的 `appid` 当前为占位符 `wxChangeMe`，**实际项目开发时必须替换为你自己的小程序 AppID**。操作步骤：
> 1. 登录[微信公众平台](https://mp.weixin.qq.com) → 开发管理 → 开发设置，获取 AppID（格式：`wx` + 16 位字符）
> 2. 修改 `project.config.json` 的 `"appid"` 字段为你的真实 AppID
> 3. 若仅本地调试，可在微信开发者工具导入时选择「测试号」，无需手动修改 AppID

---

## 技术栈

| 类别 | 技术 | 说明 |
|------|------|------|
| 平台 | 微信小程序 | 基础库 ≥ 3.0.0 |
| 渲染引擎 | Skyline | 新一代渲染引擎，替代 WebView |
| 组件框架 | glass-easel | 新一代组件系统 |
| 开发语言 | TypeScript | ES2020 target，strict 模式全开 |
| 模块规范 | CommonJS | TypeScript 编译目标 |
| 模板 | WXML | 微信原生模板语言 |
| 样式 | WXSS | CSS 子集扩展，支持 rpx |
| HTTP 客户端 | wx.request | 封装为 utils/request.ts |
| 本地存储 | wx.storage | 封装为 utils/storage.ts |
| 类型定义 | miniprogram-api-typings | ^2.8.3-1 |

完整技术栈说明见 [specs/TECH.md](./specs/TECH.md)。

---

## 项目结构

```
tpl-app-mini/
├── miniprogram/                      # 小程序源码目录
│   ├── app.json                      #   全局配置（渲染引擎、页面路由、窗口样式）
│   ├── app.ts                        #   入口逻辑（App 生命周期、wx.login、全局状态）
│   ├── app.wxss                      #   全局样式
│   ├── components/                   #   公共组件
│   │   └── navigation-bar/           #     自定义导航栏（标题、返回、颜色、加载态）
│   ├── pages/                        #   页面
│   │   ├── index/                    #     首页（当前为模板页，将改造为个人中心）
│   │   └── logs/                     #     启动日志（调试用，后续可移除）
│   ├── utils/                        #   工具函数
│   │   └── util.ts                   #     formatTime() 时间格式化
│   └── sitemap.json                  #   站点地图
├── specs/                            # 📋 规范文档（19 份）
│   ├── README.md                     #   文档索引
│   ├── SPECS_CHECKLIST.md            #   规格完成度追踪
│   ├── STRUCTURE.md                  #   目录结构与路由清单
│   ├── TECH.md                       #   技术选型
│   ├── ARCHITECTURE.md               #   系统架构设计
│   ├── constitution.md               #   宪法原则
│   ├── overall-spec.md               #   整体功能规格
│   ├── overall-plan.md               #   整体技术方案
│   ├── overall-data-model.md         #   数据模型
│   ├── overall-api.md                #   接口模型
│   ├── overall-test-cases.md         #   测试用例索引
│   ├── 001-app-shell/                #   ⭐ 应用脚手架（spec + plan）
│   ├── 002-user-auth/                #   ⭐ 用户注册及登录（spec + plan + test-cases）
│   └── 101-profile/          #   ⭐ 个人中心（spec + plan + test-cases）
├── package.json                      # 依赖配置（miniprogram-api-typings）
├── project.config.json               # 微信开发者工具配置
├── tsconfig.json                     # TypeScript 编译配置（strict 模式）
└── typings/                          # 全局类型声明
```

---

## 功能模块

### 已实现（脚手架）

| 模块 | 说明 | 规格文档 |
|------|------|----------|
| **001-app-shell** | 项目脚手架：App 入口、自定义导航栏、工具函数、Skyline 配置 | [specs/001-app-shell/](./specs/001-app-shell/) |

### 计划实现

| 模块 | 说明 | 规格文档 |
|------|------|----------|
| **002-user-auth** | 用户注册及登录：手机号注册、密码/短信/微信登录、个人信息管理 | [specs/002-user-auth/](./specs/002-user-auth/) |

### 不在本阶段范围

以下功能由 tpl-app-web（Web 前端）承载，小程序端暂不实现：

- 知识图谱、闪卡复习、学情报告

---

## 开发指南

### 新增页面

```bash
# 1. 在 miniprogram/pages/ 下创建页面目录
mkdir miniprogram/pages/my-page
# 创建 my-page.ts, my-page.wxml, my-page.wxss, my-page.json

# 2. 在 app.json 中注册页面路径
# "pages": [
#   "pages/index/index",
#   "pages/my-page/my-page"
# ]

# 3. 使用 Component() 构造器（glass-easel 推荐模式）
# Component({
#   data: { ... },
#   methods: { ... },
#   lifetimes: { attached() { ... } }
# })
```

### 新增组件

```bash
# 1. 在 miniprogram/components/ 下创建组件目录
mkdir miniprogram/components/my-component

# 2. 在页面的 .json 中引用
# { "usingComponents": { "my-component": "/components/my-component/my-component" } }
```

### 页面路由规范

| 页面 | 路径 | 需登录 | 说明 |
|------|------|:------:|------|
| 首页/个人中心 | `pages/index/index` | ✅ | 登录后首页 |
| 登录 | `pages/login/login`（计划中） | ❌ | 密码/短信/微信登录 |
| 注册 | `pages/register/register`（计划中） | ❌ | 手机号注册 |
| 个人中心 | `pages/profile/profile`（计划中） | ✅ | 个人信息管理 |

### 编码规范

- **文件名**：kebab-case（`navigation-bar.ts`、`profile.wxml`）
- **事件处理函数**：camelCase，`on` 前缀（`onChooseAvatar`、`onInputChange`）
- **组件构造**：使用 `Component()` 而非 `Page()`
- **TypeScript**：strict 模式全开，禁止隐式 `any`
- **HTTP 请求**：统一通过 `utils/request.ts` 封装，不直接调用 `wx.request`
- **本地存储**：统一通过 `utils/storage.ts` 管理 key

详细规范见 [specs/constitution.md](./specs/constitution.md)。

---

## 相关文档

### 本工程规范文档

| 文档 | 路径 | 说明 |
|------|------|------|
| 规范文档索引 | [specs/README.md](./specs/README.md) | 全部 19 份规范文档导航 |
| 架构设计 | [specs/ARCHITECTURE.md](./specs/ARCHITECTURE.md) | 系统架构、数据流、部署架构 |
| 技术选型 | [specs/TECH.md](./specs/TECH.md) | 完整技术栈与版本说明 |
| 宪法原则 | [specs/constitution.md](./specs/constitution.md) | 代码库遵循的原则与规范 |
| 目录结构 | [specs/STRUCTURE.md](./specs/STRUCTURE.md) | 源码目录、页面路由、组件清单 |
| 接口模型 | [specs/overall-api.md](./specs/overall-api.md) | 后端 API 与微信平台接口 |
| 应用脚手架 | [specs/001-app-shell/](./specs/001-app-shell/) | 脚手架 spec + plan |
| 用户认证 | [specs/002-user-auth/](./specs/002-user-auth/) | 注册登录 spec + plan + test-cases |
| 个人中心 | [specs/101-profile/](./specs/101-profile/) | 个人中心 spec + plan + test-cases |

### 后端工程文档（tpl-app-api）

| 文档 | 路径 | 说明 |
|------|------|------|
| tpl-app-api README | [../tpl-app-api/README.md](../tpl-app-api/README.md) | 后端项目说明（Spring Boot 3.x） |
| tpl-app-api specs | [../tpl-app-api/specs/README.md](../tpl-app-api/specs/README.md) | 后端规范文档索引 |

### Web 前端参考（tpl-app-web）

| 文档 | 路径 | 说明 |
|------|------|------|
| tpl-app-web README | [../tpl-app-web/README.md](../tpl-app-web/README.md) | Web 前端项目说明（Vue 3） |
| tpl-app-web specs | [../tpl-app-web/specs/README.md](../tpl-app-web/specs/README.md) | Web 前端规范文档索引 |

### 产品与设计文档

| 文档 | 路径 | 说明 |
|------|------|------|
| 产品概念设计 | [../docs/产品概念设计.md](../docs/产品概念设计.md) | tpl-workspace产品整体设计 |
| 数据模型设计 | [../docs/数据模型设计.md](../docs/数据模型设计.md) | 数据库表结构与字典设计 |
| 技术选型 | [../docs/技术选型.md](../docs/技术选型.md) | 整体技术架构选型 |
| 用户模块设计 | [../docs/002-用户注册及登录设计.md](../docs/002-用户注册及登录设计.md) | 用户注册/登录/绑定设计 |
| 个人中心设计 | [../docs/101-个人中心.md](../docs/101-个人中心.md) | 个人中心功能设计 |

---

## License

Proprietary. All rights reserved.
