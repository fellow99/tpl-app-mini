# 005-theme：技术方案

> 项目：tpl-app-mini（tpl-workspace微信小程序端）
> 模块：主题皮肤支持
> 版本：v1.0
> 日期：2026-08-18
> 状态：✅ 已实现
> 父工程方案引用：跨工程聚合方案见 [../../../specs/005-theme/plan.md](../../../specs/005-theme/plan.md)，本文档聚焦本工程落地实现

---

## 1. 技术上下文

### 1.1 运行环境

| 维度 | 说明 |
|------|------|
| 宿主 | 微信客户端（iOS / Android） |
| 基础库 | ≥ 3.0.0（darkmode 需 ≥ 2.11.0） |
| 渲染引擎 | Skyline |
| 组件框架 | glass-easel（`Component()` 构造器） |
| 开发语言 | TypeScript（CommonJS 编译目标） |
| 颜色事实源 | 父工程 `specs/005-theme/var.md` |

### 1.2 关键差异：tpl-app-web（CSS `[data-theme]`） vs tpl-app-mini

| 维度 | tpl-app-web | tpl-app-mini |
|------|-----------|-------------|
| 变量落点 | `:root` / `[data-theme="dark"]` | `app.wxss` 的 `page` / `.theme-light` / `@media` / `.theme-dark` |
| 系统深色 | `matchMedia('(prefers-color-scheme: dark)')` | `darkmode: true` + `theme.json` + `@media` |
| 持久化 | localStorage `theme` | `wx.storage` `theme` |
| 系统主题读取 | `matchMedia` | `wx.getSystemInfoSync().theme` |
| 系统 UI 联动 | — | `wx.setTabBarStyle` / `wx.setNavigationBarColor` |

> 微信小程序无官方「强制指定深浅色」API（`darkmode` 仅跟随系统），手动强制 light/dark 通过根节点 `theme-light` / `theme-dark` class 覆盖 CSS 变量实现。

---

## 2. 宪法合规检查

| 宪法原则 | 状态 | 说明 |
|----------|:----:|------|
| 组件化优先（Component 构造器） | ✅ | 不改页面构造方式，仅加 `refreshTheme()` 方法 |
| TypeScript 严格模式 | ✅ | `ThemeMode` / `ResolvedTheme` 类型明确，无 `any` |
| 目录约定 | ✅ | 主题工具放 `miniprogram/utils/theme.ts`，变量落 `app.wxss` |
| 主配置单一来源 | ✅ | `STORAGE_KEYS.THEME` 集中在 `config.ts` |
| Skyline + glass-easel 固定 | ✅ | 不引入第三方框架/UI 库，仅微信原生 API |
| 本地存储规范 | ✅ | 主题 key 通过 `STORAGE_KEYS` 常量管理 |
| 文档先行 | ✅ | 先出 spec.md + plan.md + test-cases.md |
| 模块编号对齐（父工程 5.1） | ✅ | 编号 `005` 与父工程一致 |

---

## 3. 主题数据流

```
app.onLaunch
   └─ applyTheme()
        ├─ resolveTheme()：getThemeMode() → storage('theme')，缺省 'system'
        │    └─ system → wx.getSystemInfoSync().theme（'light'|'dark'）
        ├─ wx.setTabBarStyle({ color, selectedColor, backgroundColor, borderStyle })
        └─ wx.setNavigationBarColor({ backgroundColor, frontColor })
   └─ wx.onThemeChange(() => applyTheme())   // system 态实时跟随系统

页面渲染 / onShow
   └─ refreshTheme()
        ├─ getThemeClass() → ''（system）/ 'theme-light' / 'theme-dark'  挂根节点
        └─ getNavTheme() → { background, color }  绑定自定义 navigation-bar

用户切换（登录页按钮 / 个人中心「切换主题」）
   └─ setThemeMode(mode)
        ├─ storage.setTheme(mode)
        ├─ applyTheme()（tabBar / 导航栏联动）
        └─ 页面 refreshTheme()（class + 导航栏 + 按钮图标）
```

---

## 4. 核心模块设计

### 4.1 `miniprogram/utils/theme.ts`

全部导出项：

| 导出 | 类型 | 说明 |
|------|------|------|
| `ThemeMode` | type | `'light' \| 'dark' \| 'system'` |
| `ResolvedTheme` | type | `'light' \| 'dark'` |
| `getSystemTheme()` | `() => ResolvedTheme` | 读 `wx.getSystemInfoSync().theme` |
| `getThemeMode()` | `() => ThemeMode` | 读本地存储偏好，缺省 `system` |
| `resolveTheme()` | `() => ResolvedTheme` | 三态 → 生效 light/dark |
| `getThemeClass()` | `() => string` | `''` / `'theme-light'` / `'theme-dark'` |
| `getNavTheme()` | `() => { background, color }` | 导航栏配色（供 navigation-bar 绑定） |
| `applyTheme()` | `() => void` | 联动 tabBar + 原生导航栏 |
| `setThemeMode(mode)` | `(mode: ThemeMode) => void` | 写存储 + 应用 |

#### 4.1.1 三态解析

```typescript
export function getThemeMode(): ThemeMode {
  const stored = storage.getTheme()
  return isThemeMode(stored) ? stored : 'system'
}

export function resolveTheme(): ResolvedTheme {
  const mode = getThemeMode()
  return mode === 'system' ? getSystemTheme() : mode
}
```

#### 4.1.2 主题 class（手动强制 vs 系统跟随）

```typescript
export function getThemeClass(): string {
  const mode = getThemeMode()
  if (mode === 'system') return ''          // 交 @media 跟随系统，系统变化即时生效
  return mode === 'dark' ? 'theme-dark' : 'theme-light'
}
```

`system` 态不挂 class，避免系统深浅色中途变化时残留旧 class；强制态挂显式 class，覆盖 `@media` 系统深色。

#### 4.1.3 联动配色

```typescript
const THEME_PALETTE: Record<ResolvedTheme, {...}> = {
  light: { navBackground: '#FFFFFF', navFront: '#000000', tabBackground: '#FFFFFF',
           tabColor: '#6E6A65', tabSelectedColor: '#3B5998', tabBorderStyle: 'black' },
  dark:  { navBackground: '#26282B', navFront: '#FFFFFF', tabBackground: '#26282B',
           tabColor: '#A8A29A', tabSelectedColor: '#5B7DB1', tabBorderStyle: 'white' },
}

export function applyTheme(): void {
  const p = THEME_PALETTE[resolveTheme()]
  try { wx.setTabBarStyle({ color: p.tabColor, selectedColor: p.tabSelectedColor,
        backgroundColor: p.tabBackground, borderStyle: p.tabBorderStyle }) } catch {}
  try { wx.setNavigationBarColor({ backgroundColor: p.navBackground, frontColor: p.navFront }) } catch {}
}
```

### 4.2 `miniprogram/app.wxss`（CSS 变量落点）

```
page, .theme-light {  /* 亮色 default */  --color-primary: #3B5998; ... }
@media (prefers-color-scheme: dark) { page { /* 暗色 dark */ } }
.theme-dark { /* 暗色 dark（手动强制） */ }
page { background: var(--color-bg); color: var(--color-text); }
```

变量清单对齐父工程 `var.md`：品牌色 4 项、中性色 6 项、扩展色 3 项（`--color-wechat` / `--color-placeholder` / `--color-divider`）、衍生色 1 项（`--color-primary-disabled`，靛青禁用态）。

### 4.3 `miniprogram/theme.json` + `app.json`

```json
// theme.json
{
  "light": { "navBgColor": "#FFFFFF", "navTxtStyle": "black", "bgColor": "#F7F5F0",
             "bgTxtStyle": "light", "tabFontColor": "#6E6A65", "tabSelectedColor": "#3B5998",
             "tabBgColor": "#FFFFFF", "tabBorderStyle": "black" },
  "dark":  { "navBgColor": "#26282B", "navTxtStyle": "white", "bgColor": "#1A1C1E",
             "bgTxtStyle": "dark", "tabFontColor": "#A8A29A", "tabSelectedColor": "#5B7DB1",
             "tabBgColor": "#26282B", "tabBorderStyle": "white" }
}
```

`app.json` 变更：`"darkmode": true` + `"themeLocation": "theme.json"`；`window` / `tabBar` 颜色项以 `@navTxtStyle` / `@bgColor` / `@tabFontColor` 等变量引用，框架自动按系统主题取值。`darkmode: true` 同时使 `wx.getSystemInfoSync().theme` 生效（否则为 `undefined`）。

### 4.4 `config.ts` / `utils/storage.ts`

```typescript
// config.ts
export const STORAGE_KEYS = { ..., LANGUAGE: 'language', THEME: 'theme' } as const

// storage.ts
getTheme(): string { return wx.getStorageSync(STORAGE_KEYS.THEME) || '' },
setTheme(theme: string): void { wx.setStorageSync(STORAGE_KEYS.THEME, theme) },
removeTheme(): void { wx.removeStorageSync(STORAGE_KEYS.THEME) },
```

主题为本地偏好，`clearAuth()`（退出登录）不清除主题。

### 4.5 `miniprogram/app.ts`（启动初始化）

```typescript
onLaunch() {
  getLocale(); applyTabBarLocale()
  applyTheme()                       // 三态解析 + tabBar/导航栏联动
  wx.onThemeChange(() => applyTheme())  // system 态系统变化实时联动
  // ... 登录态初始化
}
```

### 4.6 登录页按钮（`pages/login`）

- WXML：导航栏 `right` 插槽放 `<view slot="right" class="theme-toggle" bindtap="toggleTheme">{{themeIcon}}</view>`。
- TS：`refreshTheme()` 设 `themeIcon = resolveTheme() === 'dark' ? '☀️' : '🌙'`；`toggleTheme()` 调 `setThemeMode(resolveTheme() === 'dark' ? 'light' : 'dark')` 后 `refreshTheme()`。
- WXSS：`.theme-toggle` 圆形（`border-radius: 50%`）、88rpx（44px）点击区域、背景 `var(--color-disabled)`。

### 4.7 个人中心「切换主题」（`pages/profile`）

- WXML：「切换语言」cell 下新增 `<view class="action-cell" bindtap="handleChangeTheme">{{themeCellText}}</view>`。
- TS：`handleChangeTheme()` 用 `wx.showActionSheet` 提供三态（浅色/深色/跟随系统），选中后 `setThemeMode(mode)` + `refreshTheme()`，与登录页共享 `STORAGE_KEYS.THEME`。

---

## 5. 文件结构

```
miniprogram/
├── theme.json               # 新增：light/dark 系统 UI 变量（darkmode 跟随系统）
├── app.json                 # 修改：darkmode + themeLocation + tabBar/window @变量
├── app.wxss                 # 修改：CSS 变量（default + dark 两套）
├── config.ts                # 修改：STORAGE_KEYS.THEME
├── app.ts                   # 修改：onLaunch applyTheme + onThemeChange
├── utils/
│   ├── theme.ts             # 新增：三态主题工具
│   └── storage.ts           # 修改：getTheme/setTheme/removeTheme
└── pages/
    ├── login/               # 修改：emoji 按钮 + 主题 class + 颜色迁移
    ├── profile/             # 修改：「切换主题」+ 主题 class + 颜色迁移
    ├── register/            # 修改：主题 class + 颜色迁移
    ├── profile/     # 修改：主题 class + 颜色迁移
    ├── change-password/     # 修改：主题 class + 颜色迁移
    └── profile-edit/        # 修改：主题 class + 颜色迁移
```

### 5.1 新增/修改文件清单

| 文件 | 操作 | 说明 |
|------|:----:|------|
| `miniprogram/theme.json` | 新增 | light/dark nav+tab+背景变量 |
| `miniprogram/utils/theme.ts` | 新增 | 三态主题工具 |
| `miniprogram/app.json` | 修改 | `darkmode` + `themeLocation` + `@` 变量引用 |
| `miniprogram/app.wxss` | 修改 | CSS 变量 default + dark 两套 |
| `miniprogram/config.ts` | 修改 | `STORAGE_KEYS.THEME` |
| `miniprogram/utils/storage.ts` | 修改 | `getTheme` / `setTheme` / `removeTheme` |
| `miniprogram/app.ts` | 修改 | onLaunch 三态解析 + 系统联动 |
| 各 pages `*.ts` / `*.wxml` / `*.wxss` | 修改 | 主题 class + 导航栏配色绑定 + 颜色迁移 |

---

## 6. 页面迁移要点

| 页面 | 迁移内容 |
|------|---------|
| `pages/login` | 右上角 emoji 按钮；`#07c160` → `var(--color-primary)`；微信登录按钮 → `var(--color-wechat)` |
| `pages/profile` | 「切换主题」入口；`#07c160` → `var(--color-primary)`；卡片/文字/边框 → 变量 |
| `pages/register` | `#07c160` → `var(--color-primary)`；输入框/文字 → 变量 |
| `pages/profile` | 加载动画/重试按钮 → `var(--color-primary)`；背景/文字 → 变量 |
| `pages/change-password` | 提交按钮 → `var(--color-primary)`；输入框/文字 → 变量 |
| `pages/profile-edit` | 提交按钮 → `var(--color-primary)`；输入框/文字 → 变量 |

迁移规则：

- 每个页面 `data` 增加 `themeClass` / `navBg` / `navColor`，`refreshTheme()` 在 `attached` 与 `pageLifetimes.show` 调用（与 i18n `refreshI18n` 并列）。
- WXML 根 `scroll-view` 挂 `{{themeClass}}`，`navigation-bar` 绑 `color="{{navColor}}" background="{{navBg}}"`。
- 原 `#9be6bd`（微信绿禁用态）→ `var(--color-primary-disabled)`（靛青禁用态）。

---

## 7. 主题切换流程

### 7.1 默认跟随系统

```
app.onLaunch
   └─ applyTheme() → resolveTheme()
        ├─ storage('theme') 存在且合法 → light/dark 强制
        └─ 否则 system → wx.getSystemInfoSync().theme → light/dark
```

### 7.2 登录页两态切换

```
登录页按钮 toggleTheme()
   └─ resolveTheme() 当前 dark ? setThemeMode('light') : setThemeMode('dark')
        └─ storage.setTheme + applyTheme() + refreshTheme()（图标/class/导航栏）
```

### 7.3 个人中心三态选择

```
handleChangeTheme() → wx.showActionSheet(['浅色','深色','跟随系统'])
   └─ 选中 → setThemeMode(mode) → storage + applyTheme() + refreshTheme()
```

### 7.4 系统变化实时联动

```
wx.onThemeChange(() => applyTheme())
   └─ system 态：tabBar 颜色按新系统主题重设；页面 CSS 由 @media 自动切换
   └─ 强制态：applyTheme 结果不变（强制值优先）
```

---

## 8. 关键算法

### 8.1 三态解析矩阵

| 存储 `theme` | 系统主题 | 生效主题 | 根节点 class |
|-------------|---------|---------|-------------|
| `system`（缺省） | light | light | `''`（@media 跟随） |
| `system`（缺省） | dark | dark | `''`（@media 跟随） |
| `light` | 任意 | light | `theme-light` |
| `dark` | 任意 | dark | `theme-dark` |

### 8.2 按钮图标映射

| 生效主题 | 按钮图标 | 点击后 |
|---------|---------|-------|
| light | `🌙` | 切 dark |
| dark | `☀️` | 切 light |

### 8.3 品牌色迁移矩阵

| 原值 | 新值 | 用途 |
|------|------|------|
| `#07c160`（页面主按钮/链接/选中态） | `var(--color-primary)` `#3B5998` | 全站主色 |
| `#07c160`（微信登录按钮） | `var(--color-wechat)` `#07C160` | 仅微信登录 |
| `#9be6bd`（禁用态） | `var(--color-primary-disabled)` | 主按钮禁用 |
| `#fa5151`（危险色） | `var(--color-danger)` | 退出/删除 |
| `#f5f5f5`（输入框底） | `var(--color-disabled)` | 字段背景 |
| `#fff`（卡片/输入） | `var(--color-surface)` | 卡片表面 |
| `#333` / `#999` | `var(--color-text)` / `var(--color-text-secondary)` | 正文/次要 |

---

## 9. 错误处理策略

| 场景 | 处理 |
|------|------|
| `wx.getSystemInfoSync()` 抛异常 | catch 后回退 `light` |
| `wx.setTabBarStyle` 抛异常（无 tabBar / 未就绪） | try/catch 忽略 |
| `wx.setNavigationBarColor`（custom 导航栏 no-op） | try/catch 忽略 |
| 存储值非法（非 light/dark/system） | `getThemeMode()` 回退 `system` |
| 系统深浅色中途变化 | `wx.onThemeChange` 重设 tabBar；CSS 由 `@media` 即时切换 |

---

## 10. 实现步骤

| 阶段 | 任务 | 输出 |
|:----:|------|------|
| 1 | `app.wxss` CSS 变量（default + dark 两套） | 变量落点 |
| 2 | `theme.json` + `app.json`（darkmode + themeLocation + @变量） | 系统深色基线 |
| 3 | `config.ts` / `storage.ts` 主题持久化 | `STORAGE_KEYS.THEME` + getTheme/setTheme |
| 4 | `utils/theme.ts` 三态工具 | resolveTheme/applyTheme/getThemeClass/getNavTheme |
| 5 | `app.ts` onLaunch + onThemeChange | 启动解析 + 系统联动 |
| 6 | 登录页 emoji 按钮 + 个人中心「切换主题」 | 双入口 |
| 7 | 各页面主题 class + 品牌/中性色迁移 | 全站一致性 |

---

## 11. 跨引用对照

| spec.md FR ID | 本 plan 对应实现 |
|:--------------|:----------------|
| FR-005-101 ~ FR-005-103（颜色变量） | `app.wxss` + 各页 WXSS 变量迁移 |
| FR-005-104 ~ FR-005-107（状态与持久化） | `config.ts` / `storage.ts` / `utils/theme.ts` / `app.ts` |
| FR-005-108 ~ FR-005-109（切换生效） | `applyTheme()` + `getThemeClass()` + `getNavTheme()` |
| FR-005-110 ~ FR-005-112（登录页按钮） | `pages/login` 的 `theme-toggle` + `toggleTheme()` |
| FR-005-113 ~ FR-005-114（个人中心入口） | `pages/profile` 的 `handleChangeTheme()` |

父工程 FR-005-005（品牌色统一）、FR-005-007 ~ FR-005-010（三态/持久化/系统跟随/即时生效）对应本工程整体落地。

---

## 12. 风险与对策

| 风险 | 影响 | 对策 |
|------|------|------|
| `navigationStyle: custom` 下原生导航栏配置不生效 | 低 | 自定义 `navigation-bar` 组件改用 `getNavTheme()` 绑定背景/前景色 |
| 手动强制态下 `page` 元素背景无法挂 class | 低 | 根 `scroll-view` 挂 class 且自身 `background: var(--color-bg)`，填充视口 |
| 输入框占位符在暗色下对比度偏低 | 低 | 默认占位色；后续可用 `placeholder-class` + 变量优化 |
| 强制态切换后未回到某页面的旧 class 残留 | 低 | 每页 `onShow` 统一 `refreshTheme()` |
