# 宪法原则文档

> 项目：tpl-app-mini（tpl-workspace微信小程序端）
> 生成日期：2026-08-12
> 来源：从现有代码中提取的隐性原则

---

## 一、代码组织原则

### 1.1 组件化优先

**原则**：所有页面和功能模块优先使用 `Component()` 构造器（glass-easel 组件模式），而非传统的 `Page()` 构造器。

**代码证据**：
- `pages/index/index.ts` 使用 `Component({...})` 
- `pages/logs/logs.ts` 使用 `Component({...})`
- `components/navigation-bar/navigation-bar.ts` 使用 `Component({...})`

### 1.2 TypeScript 严格模式

**原则**：TypeScript 编译配置启用全部严格检查，确保类型安全。

**代码证据**：`tsconfig.json` 中 `strict: true`，以及 `noImplicitAny`、`strictNullChecks`、`noUnusedLocals` 等全部启用。

### 1.3 目录约定

**原则**：遵循微信小程序标准目录结构。

| 目录 | 用途 |
|------|------|
| `miniprogram/pages/` | 页面，每个页面一个子目录 |
| `miniprogram/components/` | 公共组件 |
| `miniprogram/utils/` | 工具函数模块 |
| `miniprogram/config.ts` | 主配置文件：全局配置参数单一来源（功能开关、存储 key、环境相关 API 地址等） |
| `miniprogram/` 根目录 | 全局文件（app.ts、app.json、app.wxss） |

---

## 二、编码规范

### 2.1 命名规范

| 类型 | 规范 | 示例 |
|------|------|------|
| 文件名 | kebab-case | `navigation-bar.ts`、`index.wxml` |
| 组件名 | kebab-case（目录名） | `navigation-bar/` |
| 事件处理函数 | camelCase，`bind` 或 `on` 前缀 | `bindViewTap`、`onChooseAvatar`、`onInputChange` |
| 工具函数 | camelCase | `formatTime` |
| 数据属性 | camelCase | `userInfo`、`hasUserInfo` |
| CSS 类名 | kebab-case | `userinfo-avatar`、`nickname-wrapper` |

### 2.2 组件定义格式

```typescript
Component({
  options: { ... },     // 组件选项（如 multipleSlots）
  properties: { ... },  // 外部属性
  data: { ... },        // 内部数据
  lifetimes: { ... },   // 生命周期钩子
  methods: { ... },     // 事件处理方法
})
```

### 2.3 样式约定

- 使用 rpx 作为主要尺寸单位（`128rpx`、`200rpx`）
- 全页面高度使用 `100vh`（Skyline 支持）
- 导航栏采用 `custom` 模式（`navigationStyle: "custom"`）

---

## 三、架构约束

### 3.1 渲染引擎固定

**原则**：必须使用 Skyline 渲染引擎 + glass-easel 组件框架，不得降级为 WebView 模式。

**代码证据**：`app.json` 中 `"renderer": "skyline"`、`"componentFramework": "glass-easel"`。

### 3.2 无第三方 UI 框架

**原则**：不使用第三方 UI 组件库（如 WeUI、TDesign），使用微信原生组件或自定义组件。

**代码证据**：当前无任何 UI 库依赖，仅使用 `<view>`、`<image>`、`<text>`、`<button>`、`<input>`、`<scroll-view>` 等原生组件。

### 3.3 HTTP 请求统一管理

**原则**：所有后端 API 请求应通过统一的请求模块封装，不直接在页面中调用 `wx.request`。

**约定**：后续实现将创建 `miniprogram/utils/request.ts` 作为统一 HTTP 客户端。

### 3.4 本地存储规范

**原则**：本地存储 key 统一管理，使用常量定义，避免散落字符串。

**约定**：后续实现将创建 `miniprogram/utils/storage.ts` 统一管理存储 key 和读写操作。

---

## 四、质量标准

### 4.1 类型安全

- 所有函数参数和返回值必须有明确类型
- 禁止使用 `any` 类型（`noImplicitAny: true`）
- 使用 `miniprogram-api-typings` 确保微信 API 类型正确

### 4.2 代码清洁度

- 未使用的变量和参数报错（`noUnusedLocals`、`noUnusedParameters`）
- 每个函数必须显式 return（`noImplicitReturns`）
- switch case 禁止穿透（`noFallthroughCasesInSwitch`）

### 4.3 错误处理

- 网络请求必须有错误回调处理
- 用户操作失败必须有提示反馈
- 关键操作需有重试机制

---

## 五、安全边界

### 5.1 认证与授权

- 登录后的 Token 存储在微信本地存储
- 每次 `wx.request` 需携带 Token（通过统一请求模块自动附加）
- Token 过期需自动跳转登录页

### 5.2 数据安全

- 敏感数据不在 WXML 中明文展示（如手机号需脱敏）
- 用户头像/昵称获取需用户授权（遵守微信隐私规范）
- 不在客户端存储密码等敏感凭证

### 5.3 网络安全

- 所有 API 请求必须使用 HTTPS
- 生产环境域名需在微信管理后台配置为 request 合法域名

---

## 六、治理规则

### 6.1 文档先行

**原则**：每个功能模块必须先有 `spec.md`（功能规格）和 `plan.md`（技术方案），再进行代码实现。

### 6.2 模块编号规范

| 编号范围 | 分类 |
|----------|------|
| 001-099 | 基础设施与脚手架 |
| 100-199 | 用户端功能模块 |
| 200-299 | 预留扩展 |

### 6.3 变更流程

1. 功能需求 → `spec.md` 定义规格
2. 技术方案 → `plan.md` 输出方案
3. 测试用例 → `test-cases.md`（如涉及 UI 交互）
4. 代码实现
5. 规格文档更新

---

## 七、文档分工治理规则（与父工程对齐）

> 本节遵循父工程宪法 `../../specs/constitution.md` 第四章「文档分工治理规则」定义的文档分工契约。本工程 MUST 遵守以下规则：

1. **模块编号对齐**：本工程模块编号 MUST 与父工程模块编号对齐（同一产品功能跨工程使用一致编号，如 002-user-auth、101-profile）。
2. **父工程侧重需求规格**：产品功能需求的权威定义在父工程 `spec.md`，本工程 `spec.md` 不重复编写需求。
3. **父工程 plan 侧重实现逻辑**：父工程 `plan.md` 描述跨工程实现逻辑，本工程 `plan.md` 不重复。
4. **本工程侧重落地实现**：本工程规范文档 MUST 重点描述功能在本工程的落地实现，核心文档是 `plan.md` 与 `test-cases.md`。
5. **本工程 spec 引用父工程**：本工程 `spec.md` SHOULD 引用父工程对应 `spec.md`，再补充本工程必要的特有规格。
