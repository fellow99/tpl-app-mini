# 005-theme：功能规格文档

> 项目：tpl-app-mini（tpl-workspace微信小程序端）
> 模块：主题皮肤支持
> 版本：v1.0
> 日期：2026-08-18
> 状态：✅ 已实现
> 父工程规格引用：需求基准见 [../../../specs/005-theme/spec.md](../../../specs/005-theme/spec.md)（FR-005-001 ~ FR-005-019）与样式变量事实源 [../../../specs/005-theme/var.md](../../../specs/005-theme/var.md)，本文档仅补充本工程（微信小程序端）特有落地规格

---

## 1. 模块概述

### 1.1 目的

为「tpl-workspace」微信小程序端接入主题皮肤能力：建立与父工程 `var.md` 对齐的 WXSS 颜色变量，实现「亮 + 暗」两套固定皮肤与「浅色 / 深色 / 跟随系统」三态切换，提供**登录页右上角圆形 emoji 切换按钮**与**个人中心「切换主题」入口**，并将品牌主色从微信绿 `#07c160` 统一为靛青 `#3B5998`。

### 1.2 解决的问题

| 问题 | 解决方案 |
|------|---------|
| 颜色散落硬编码，品牌色矛盾（tabBar `#3B5998` 与页面主色 `#07c160` 不一致） | 收敛为 `app.wxss` CSS 变量，全站主色统一靛青 `#3B5998` |
| 无主题切换能力，夜间/护眼场景体验差 | 三态主题 + 登录页/个人中心双入口切换 |
| 系统深浅色不联动 | `darkmode` + `theme.json` + `@media (prefers-color-scheme: dark)` 自动跟随 |
| 微信绿语义错位 | 收敛为 `--color-wechat`，仅用于微信登录按钮 |

### 1.3 范围

**在范围内：**

- `app.wxss` 颜色变量定义（default + dark 两套，对齐父工程 `var.md`）
- `theme.json` + `app.json`（`darkmode` / `themeLocation` / tabBar `@` 变量）
- `utils/theme.ts` 三态主题工具
- `config.ts` / `utils/storage.ts` 主题持久化 key
- `app.ts` onLaunch 三态解析 + 系统主题变化联动
- 登录页右上角圆形 emoji 按钮、个人中心「切换主题」
- 全站品牌/中性色迁移到 CSS 变量

**不在范围内（本模块不实现）：**

- 颜色单一事实源维护（由父工程 `specs/005-theme/var.md` 负责）
- tpl-app-web / tpl-app-android / tpl-app-harmony 各端实现
- tpl-manage-ui（沿用 RVP 体系，主色 `#409EFF`，本轮不改动）
- 后端（无主题需求）
- 用户自定义主题色（仅两套固定皮肤）

---

## 2. 用户故事

| 编号 | 故事 | 优先级 |
|:-----|------|:------:|
| US-001 | 作为用户，我可在登录页右上角点击圆形按钮，一键切换亮色/暗色主题 | P0 |
| US-002 | 作为用户，登录后可在个人中心「切换语言」下找到「切换主题」，随时切换浅色/深色/跟随系统 | P0 |
| US-003 | 作为用户，切换主题后刷新页面或重启小程序，主题选择仍被保留 | P0 |
| US-004 | 作为用户，首次使用未手动选择时，主题默认跟随系统深浅色 | P0 |
| US-005 | 作为用户，系统深浅色变化时，小程序实时联动（未手动覆盖时） | P1 |
| US-006 | 作为开发者，页面主色统一为靛青 `#3B5998`，微信绿仅用于微信登录按钮 | P1 |

---

## 3. 功能需求

> 需求基准：父工程 [../../../specs/005-theme/spec.md](../../../specs/005-theme/spec.md) 的 FR-005-001 ~ FR-005-019（var.md 事实源、三态切换、登录页按钮、个人中心入口、品牌色统一、范围约束）。本节编号 FR-005-101 起，为本工程特有落地规格。

### 3.1 颜色变量

| ID | 需求 | RFC 2119 |
|:---|------|:--------:|
| FR-005-101 | `app.wxss` MUST 以 `page`（及 `.theme-light`）选择器定义亮色（default）CSS 变量，以 `@media (prefers-color-scheme: dark)` 与 `.theme-dark` 定义暗色（dark）变量，两套取值 MUST 对齐父工程 `var.md` §3~§7 | MUST |
| FR-005-102 | 品牌主色 MUST 全站统一为 `var(--color-primary)`（`#3B5998`，暗色 `#5B7DB1`）；微信绿 MUST 收敛为 `--color-wechat`（`#07C160`）且仅用于微信登录按钮 | MUST |
| FR-005-103 | 各页面 WXSS 中硬编码颜色 MUST 迁移为 CSS 变量（`--color-primary` / `--color-bg` / `--color-surface` / `--color-text` / `--color-text-secondary` / `--color-border` / `--color-disabled` / `--color-danger` 等），不再散落字面色值 | MUST |

### 3.2 主题状态与持久化

| ID | 需求 | RFC 2119 |
|:---|------|:--------:|
| FR-005-104 | `config.ts` `STORAGE_KEYS` MUST 新增 `THEME: 'theme'`；`utils/storage.ts` MUST 提供 `getTheme` / `setTheme` / `removeTheme` | MUST |
| FR-005-105 | `utils/theme.ts` MUST 支持三态 `ThemeMode = 'light' \| 'dark' \| 'system'`，默认 `system`；`resolveTheme()` MUST 将 `system` 解析为 `wx.getSystemInfoSync().theme`（`light`/`dark`） | MUST |
| FR-005-106 | 主题选择 MUST 本地持久化到 `wx.storage`（key `theme`），不涉及后端 | MUST |
| FR-005-107 | `system` 态 MUST 跟随系统深浅色，系统深浅色变化时通过 `wx.onThemeChange` 实时联动 tabBar / 导航栏配色 | MUST |

### 3.3 主题切换生效

| ID | 需求 | RFC 2119 |
|:---|------|:--------:|
| FR-005-108 | 主题切换 MUST 即时生效，无需整页刷新或重启；`applyTheme()` MUST 联动 `wx.setTabBarStyle`（color / selectedColor / backgroundColor / borderStyle）与 `wx.setNavigationBarColor`（backgroundColor / frontColor） | MUST |
| FR-005-109 | 页面根节点 MUST 依据 `getThemeClass()` 挂 `theme-light` / `theme-dark` class（`system` 态为空，交由 `@media` 跟随系统）；自定义 `navigation-bar` 组件 MUST 通过 `getNavTheme()` 绑定背景/前景色 | MUST |

### 3.4 登录页切换按钮

| ID | 需求 | RFC 2119 |
|:---|------|:--------:|
| FR-005-110 | 登录页右上角（导航栏 right 插槽）MUST 放置圆形 emoji 切换按钮，点击在 light↔dark 之间显式切换（覆盖 `system` 默认） | MUST |
| FR-005-111 | 按钮 MUST 反映当前生效主题：亮色显示 `🌙`，暗色显示 `☀️` | MUST |
| FR-005-112 | 按钮 MUST 不遮挡登录表单、不影响登录主流程，且具备最小点击区域（≥ 88rpx = 44px） | MUST |

### 3.5 个人中心「切换主题」

| ID | 需求 | RFC 2119 |
|:---|------|:--------:|
| FR-005-113 | 个人中心「切换语言」下 MUST 新增「切换主题」入口，提供三态选择（浅色 / 深色 / 跟随系统） | MUST |
| FR-005-114 | 「切换主题」MUST 与登录页按钮共享同一主题状态与持久化键（`STORAGE_KEYS.THEME`），切换后两处入口同步一致 | MUST |

---

## 4. 关键契约

### 4.1 主题状态模型（引用父工程 §4.1）

| 状态 | 值 | 语义 |
|------|-----|------|
| 浅色 | `light` | 强制亮色皮肤 |
| 深色 | `dark` | 强制暗色皮肤 |
| 跟随系统 | `system`（默认） | 跟随系统深浅色，动态解析 |

> 登录页按钮为两态显式切换（light↔dark）；`system` 为首次使用默认值，由「切换主题」入口提供三态选择。

### 4.2 变量落点（引用父工程 §4.3）

| 项 | 说明 |
|----|------|
| CSS 变量落点 | `app.wxss`（`page` / `.theme-light` 挂 default，`@media` + `.theme-dark` 挂 dark） |
| 系统 UI 深色 | `app.json` `darkmode: true` + `themeLocation: "theme.json"`，window/tabBar 以 `@` 引用变量 |
| 持久化键 | `theme`（`STORAGE_KEYS.THEME`，wx.storage） |

### 4.3 主题联动配色（与 theme.json 对齐）

| 生效主题 | 导航栏背景/前景 | tabBar 背景 | tabBar 未选/选中 |
|---------|----------------|------------|-----------------|
| light | `#FFFFFF` / `#000000` | `#FFFFFF` | `#6E6A65` / `#3B5998` |
| dark | `#26282B` / `#FFFFFF` | `#26282B` | `#A8A29A` / `#5B7DB1` |

---

## 5. 验收场景

| 编号 | 场景 | Given | When | Then |
|:-----|------|-------|------|-----|
| AC-001 | 登录页一键切换 | 登录页（亮色） | 点击右上角按钮 | 主题切换为暗色、按钮由 `🌙` 变 `☀️`，全程无刷新 |
| AC-002 | 个人中心切换 | 已登录 | 个人中心点击「切换主题」选「深色」 | 主题切换为暗色，与登录页状态一致 |
| AC-003 | 持久化 | 已切换为暗色 | 重启小程序 | 仍为暗色（`wx.getStorageSync('theme') === 'dark'`） |
| AC-004 | 系统跟随 | 未手动选择（`system`）、系统为深色 | 启动小程序 | 自动展示暗色皮肤 |
| AC-005 | 系统变化实时联动 | 未手动选择（`system`） | 系统深浅色切换 | 页面与 tabBar 实时联动，无需重启 |
| AC-006 | 两入口同步 | 登录页切为暗色 | 登录进入个人中心 | 显示为暗色且「切换主题」状态正确 |
| AC-007 | 品牌色一致 | 任一页面主按钮 | 观察主色 | 均为靛青 `#3B5998`；微信登录按钮为微信绿 `#07C160` |

---

## 6. 非功能需求

| ID | 需求 | RFC 2119 |
|:---|------|:--------:|
| NFR-005-001 | 颜色定义 MUST 单一来源（父工程 `var.md` 一处维护，本端手工映射为 WXSS 变量） | MUST |
| NFR-005-002 | 主题切换 MUST 即时生效、无白屏、无闪烁 | MUST |
| NFR-005-003 | `wx.setTabBarStyle` / `wx.setNavigationBarColor` 调用 MUST 包裹 try/catch（无 tabBar / custom 导航栏下容错） | MUST |
| NFR-005-004 | 暗色皮肤 MUST 遵循 DESIGN.md「反色但保留靛青/金曦品牌识别度」原则（主色提亮为 `#5B7DB1`） | SHOULD |

---

## 7. 依赖

### 7.1 上游依赖

| 依赖 | 说明 |
|------|------|
| 父工程 `specs/005-theme/var.md` | 颜色单一事实源（角色命名 + default/dark 两套取值） |
| 父工程 `DESIGN.md` | 「破茧」设计系统色板 |
| 微信基础库 ≥ 2.11.0 | `darkmode` / `theme.json` / `wx.onThemeChange` / `getSystemInfoSync().theme` 支持 |

### 7.2 内部模块

| 依赖 | 说明 |
|------|------|
| 001-app-shell | `config.ts`（`STORAGE_KEYS`）、`utils/storage.ts`、`app.json`（tabBar）、`components/navigation-bar` |
| 002-user-auth | 登录/注册/个人中心等页面主题 class + 颜色迁移 |
| 101-profile | 个人中心页面主题 class + 颜色迁移 |

---

## 8. 术语表

| 术语 | 英文 | 说明 |
|------|------|------|
| 三态主题 | Tri-state Theme | `light` / `dark` / `system` 三种偏好状态 |
| 生效主题 | Resolved Theme | `system` 解析后最终呈现的 `light` / `dark` |
| 皮肤 | Skin | 「破茧亮色」与「护眼暗色」两套固定取值集合 |
| CSS 变量 | CSS Custom Property | WXSS 中 `--color-*`，本端主题切换的落点 |
| darkmode | DarkMode | 微信小程序深色模式开关，`app.json` 配置项 |
| 联动 | Linking | 主题变化时同步更新 tabBar / 导航栏等系统 UI |
