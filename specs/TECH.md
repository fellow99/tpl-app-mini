# 技术选型

> 项目：tpl-app-mini（tpl-workspace微信小程序端）
> 生成日期：2026-08-12
> 来源：`package.json`、`tsconfig.json`、`project.config.json`

---

## 一、技术栈概览

| 类别 | 技术 | 版本/说明 |
|------|------|-----------|
| 平台 | 微信小程序 | 基础库 `trial`（最新试用版） |
| 渲染引擎 | Skyline | 微信新一代渲染引擎 |
| 组件框架 | glass-easel | 微信小程序新一代组件系统 |
| 开发语言 | TypeScript | ES2020 target，strict 模式 |
| 模块规范 | CommonJS | TypeScript 编译目标 |
| 样式 | WXSS | 微信小程序样式语言，minify 启用 |
| 模板 | WXML | 微信小程序模板语言，minify 启用 |

---

## 二、详细技术选型

### 2.1 运行时环境

| 技术 | 用途 | 说明 |
|------|------|------|
| 微信小程序基础库 | 运行时 | 最新试用版（`trial`），支持 Skyline + glass-easel |
| Skyline Renderer | 渲染引擎 | 替代 WebView 的新一代渲染引擎，性能更优，支持更多 CSS 特性 |
| glass-easel | 组件框架 | 新一代组件系统，支持 `Component()` 构造器和更灵活的组件通信 |

### 2.2 开发语言

| 技术 | 用途 | 说明 |
|------|------|------|
| TypeScript | 主开发语言 | strict 模式全开，无隐式 any，严格空检查 |
| WXML | 模板语言 | 微信小程序原生模板，数据绑定、条件渲染、列表渲染 |
| WXSS | 样式语言 | CSS 子集扩展，支持 rpx 响应式单位 |

### 2.3 TypeScript 编译配置

| 配置项 | 值 | 说明 |
|--------|-----|------|
| target | ES2020 | 编译目标 ES2020 |
| module | CommonJS | 模块系统 CommonJS |
| strict | true | 严格模式全开 |
| strictNullChecks | true | 严格空检查 |
| noImplicitAny | true | 禁止隐式 any |
| noImplicitReturns | true | 函数所有分支必须有返回值 |
| noImplicitThis | true | 禁止隐式 this |
| noFallthroughCasesInSwitch | true | 禁止 switch case 穿透 |
| noUnusedLocals | true | 禁止未使用的局部变量 |
| noUnusedParameters | true | 禁止未使用的参数 |
| alwaysStrict | true | 始终生成 `"use strict"` |
| strictPropertyInitialization | true | 严格属性初始化检查 |
| experimentalDecorators | true | 实验性装饰器支持 |

### 2.4 Skyline 渲染引擎配置

| 配置项 | 值 | 说明 |
|--------|-----|------|
| defaultDisplayBlock | true | 组件默认 `display: block` |
| defaultContentBox | true | 组件默认 `box-sizing: content-box` |
| tagNameStyleIsolation | legacy | 标签名样式隔离（兼容模式） |
| sdkVersionBegin | 3.0.0 | 最低基础库版本 |
| sdkVersionEnd | 15.255.255 | 最高基础库版本 |

### 2.5 开发依赖

| 依赖 | 版本 | 用途 |
|------|------|------|
| miniprogram-api-typings | ^2.8.3-1 | 微信小程序 API TypeScript 类型定义 |

---

## 三、与配套工程的技术关系

### 3.1 后端 API（tpl-app-api）

| 通信方式 | 说明 |
|----------|------|
| HTTPS | 所有 API 请求使用 HTTPS |
| RESTful API | 遵循 `../docs/` 中定义的 API 规范 |
| 认证方式 | Sa-Token JWT Token，存储在微信本地存储 |
| 数据格式 | JSON |

### 3.2 参考 Web 前端（tpl-app-web）

tpl-app-mini 的界面设计和交互逻辑参考 `tpl-app-web`（Vue 3 + TypeScript + Vite），但技术栈独立：

| 对比维度 | tpl-app-web | tpl-app-mini |
|----------|-----------|-------------|
| 运行环境 | 浏览器 | 微信小程序 Skyline |
| 框架 | Vue 3 + Composition API | glass-easel Component |
| 构建工具 | Vite | 微信开发者工具内置 |
| 样式 | CSS / SCSS | WXSS |
| 模板 | Vue SFC | WXML |
| 状态管理 | Pinia | 全局数据 (`getApp().globalData`) + 页面级 data |
| 路由 | Vue Router 4 | 小程序页面栈（`app.json` pages 配置） |
| HTTP 客户端 | Axios | `wx.request` |
| UI 组件库 | Element Plus | 无（使用小程序原生组件 / WeUI） |

---

## 四、技术约束与限制

### 4.1 微信小程序平台限制

| 限制项 | 说明 |
|--------|------|
| 包大小 | 主包 ≤ 2MB，总包 ≤ 20MB（含分包） |
| 并发请求 | 最多 10 个 `wx.request` 并发 |
| 本地存储 | 单个 key ≤ 1MB，总容量 ≤ 10MB |
| 页面栈 | 最多 10 层 |
| WebSocket | 最多 5 个并发连接 |

### 4.2 Skyline 引擎兼容性

| 注意事项 | 说明 |
|----------|------|
| 基础库版本 | 需 ≥ 3.0.0 |
| CSS 支持 | 不完全兼容 WebView CSS（如不支持 `position: fixed` 的某些行为） |
| 组件兼容 | 部分原生组件在 Skyline 下行为不同 |
| 调试 | 需使用微信开发者工具 Nightly 版或最新正式版 |
