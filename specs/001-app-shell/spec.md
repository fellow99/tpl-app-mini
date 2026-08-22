# 001-app-shell 功能规格说明书

> 模块：001-app-shell（微信小程序脚手架）
> 项目：tpl-app-mini（tpl-workspace微信小程序端）
> 版本：v1.0
> 日期：2026-08-12
> 状态：✅ 已实现（as-built）

---

## 一、模块概述

### 1.1 模块定位

001-app-shell 是 tpl-app-mini 微信小程序的**基础设施层模块**，为所有上层功能模块提供运行时骨架和公共能力。它定义了小程序的全局配置、启动流程、页面路由框架，并提供了两个可复用的公共资产：自定义导航栏组件（navigation-bar）和时间格式化工具函数（formatTime）。

### 1.2 为什么需要这个模块

在微信小程序中，下列基础设施必须在启动时完成配置：

1. **渲染引擎绑定**：项目选择 Skyline 新一代渲染引擎 + glass-easel 组件框架，这是全局性决策，必须在一开始就锁定
2. **自定义导航栏**：全局启用 `navigationStyle: "custom"` 后，系统不再绘制原生导航栏，所有页面需要统一使用自定义导航栏组件以保持一致的视觉体验
3. **启动初始化**：App 启动时需要初始化本地存储、执行微信登录流程，为后续业务模块提供用户身份上下文
4. **开发规范锚定**：通过示例页面（index、logs）展示 Component() 模式、TypeScript 写法、文件组织方式，作为后续模块的模板参考

### 1.3 在整体系统中的地位

```
001-app-shell（基础设施）
    │
    ├──▶ 002-user-auth（用户认证）—— 依赖 app 全局数据和启动初始化
    │        │
    │        └──▶ 101-profile（个人中心）
    │
    └──▶ 所有模块共享 navigation-bar 组件和 utils 工具函数
```

该模块无上游依赖，是系统中唯一无依赖的模块。所有后续模块都直接或间接依赖它。

---

## 二、用户故事

以下用户故事从**开发者视角**描述——即使用此脚手架进行后续模块开发的工程师。

| 编号 | 用户故事 | 优先级 |
|------|---------|:------:|
| US-001 | 作为开发者，我希望小程序启动时自动初始化本地存储和登录流程，以便后续业务模块可以获取用户身份上下文 | P0 |
| US-002 | 作为开发者，我希望全局使用 Skyline 渲染引擎和 glass-easel 组件框架，以便利用新一代引擎的性能优势和组件能力 | P0 |
| US-003 | 作为开发者，我希望有一个可复用的自定义导航栏组件，以便在所有页面中保持一致的导航体验，无需重复编写导航栏代码 | P0 |
| US-004 | 作为开发者，我希望有一个统一的时间格式化工具函数，以便在多个页面中标准化展示时间数据 | P1 |
| US-005 | 作为开发者，我希望示例页面（首页和日志页）展示正确的 Component() 写法和目录组织方式，以便作为后续开发的模板参考 | P1 |

---

## 三、功能需求

### 3.1 App 入口与全局配置

| 编号 | 需求描述 | 优先级 |
|------|---------|:------:|
| FR-001-001 | App 启动时（onLaunch）MUST 初始化本地存储：读取历史启动日志数组（key: `logs`），若不存在则初始化为空数组，然后将当前时间戳（`Date.now()`）插入数组头部并写回本地存储 | P0 |
| FR-001-002 | App 启动时（onLaunch）MUST 调用 `wx.login()` 获取临时登录凭证（code），为后续与后端交换 token 做准备。当前阶段仅将 code 打印到控制台（`console.log`），后续由 002-user-auth 模块完善 | P0 |
| FR-001-003 | 全局配置文件（app.json）MUST 声明 Skyline 渲染引擎（`"renderer": "skyline"`）和 glass-easel 组件框架（`"componentFramework": "glass-easel"`） | P0 |
| FR-001-004 | 全局配置 MUST 设置 `"navigationStyle": "custom"` 以启用自定义导航栏模式，所有页面均不使用原生导航栏 | P0 |
| FR-001-005 | 全局配置 MUST 声明当前所有页面路由（`pages` 数组），首页 `pages/index/index` 为第一个元素（即默认启动页） | P0 |
| FR-001-006 | 全局配置 SHOULD 启用 Skyline 专属选项：`defaultDisplayBlock: true`（组件默认 block 布局）、`defaultContentBox: true`（默认 content-box 盒模型）、`tagNameStyleIsolation: "legacy"`（标签名样式隔离兼容模式） | P0 |
| FR-001-007 | 全局配置 SHOULD 启用 `lazyCodeLoading: "requiredComponents"` 以开启按需注入，减小首屏代码注入量 | P1 |
| FR-001-008 | 全局样式（app.wxss）MUST 提供 `.container` 工具类：100% 高度、flex 纵向布局、居中对齐、200rpx 上下内边距 | P1 |
| FR-001-009 | 全局 `globalData` 对象 MUST 初始化为空对象 `{}`，作为后续模块挂载全局共享数据的占位容器 | P0 |

### 3.2 首页（index）

| 编号 | 需求描述 | 优先级 |
|------|---------|:------:|
| FR-001-010 | 首页 MUST 使用 `Component()` 构造器（glass-easel 组件模式）而非 `Page()` 构造器 | P0 |
| FR-001-011 | 首页 MUST 集成 navigation-bar 组件，显示标题 "Weixin"，无返回按钮（`back="{{false}}"`），黑色文字、白色背景 | P1 |
| FR-001-012 | 首页 MUST 检测当前基础库是否支持 `getUserProfile` API（通过 `wx.canIUse('getUserProfile')`）和 nickname 输入组件（通过 `wx.canIUse('input.type.nickname')`），据此渲染不同的用户信息获取 UI | P0 |
| FR-001-013 | 当基础库支持 nickname 组件且用户尚未设置信息时，首页 MUST 渲染「选择头像」按钮（`open-type="chooseAvatar"`）和 nickname 输入框（`type="nickname"`），用户操作后更新 `userInfo` 数据 | P0 |
| FR-001-014 | 当基础库支持 `getUserProfile` 且用户尚未设置信息时，首页 MUST 渲染「获取头像昵称」按钮，点击后调用 `wx.getUserProfile()` 弹窗授权 | P0 |
| FR-001-015 | 当用户已完成信息设置（`hasUserInfo === true`）时，首页 MUST 显示用户头像和昵称，点击头像跳转至 logs 页面（`wx.navigateTo`） | P1 |
| FR-001-016 | 当基础库版本过低不支持任何用户信息获取方式时，首页 SHOULD 显示版本过低提示文本 | P2 |

### 3.3 启动日志页（logs）

| 编号 | 需求描述 | 优先级 |
|------|---------|:------:|
| FR-001-017 | 日志页 MUST 使用 `Component()` 构造器（glass-easel 组件模式）而非 `Page()` 构造器 | P0 |
| FR-001-018 | 日志页 MUST 集成 navigation-bar 组件，显示标题 "查看启动日志"，显示返回按钮（`back="{{true}}"`），黑色文字、白色背景 | P1 |
| FR-001-019 | 日志页在 `lifetimes.attached()` 生命周期 MUST 从本地存储读取 `logs` 数组，对每条时间戳调用 `formatTime()` 转换为可读日期字符串，通过 `setData` 渲染列表 | P0 |
| FR-001-020 | 日志列表 MUST 使用 `wx:for` 渲染，以 `timeStamp` 作为唯一 key（`wx:key`），每项显示序号加格式化日期 | P1 |

### 3.4 自定义导航栏组件（navigation-bar）

| 编号 | 需求描述 | 优先级 |
|------|---------|:------:|
| FR-001-021 | navigation-bar 组件 MUST 使用 `Component()` 定义，声明 `"component": true`，样式隔离策略为 `"apply-shared"` | P0 |
| FR-001-022 | 组件 MUST 支持 `multipleSlots: true`，允许调用方通过 slot 插入自定义内容 | P1 |
| FR-001-023 | 组件 MUST 提供 `title` 属性（`String` 类型）用于设置导航栏标题文本；当 title 为空时 MUST 展示 center slot 供调用方注入自定义标题内容 | P0 |
| FR-001-024 | 组件 MUST 提供 `back` 属性（`Boolean` 类型，默认 `true`）用于控制返回按钮的显示；当 `back` 和 `homeButton` 均为 `false` 时 MUST 展示 left slot 供调用方注入自定义左侧内容 | P0 |
| FR-001-025 | 组件 MUST 提供 `color` 属性（`String` 类型）用于设置文字颜色，`background` 属性（`String` 类型）用于设置背景色，均通过内联 style 应用至导航栏根节点 | P1 |
| FR-001-026 | 组件 MUST 提供 `loading` 属性（`Boolean` 类型，默认 `false`）控制加载动画的显示；loading 为 `true` 时在标题区域渲染旋转加载图标 | P2 |
| FR-001-027 | 组件 MUST 提供 `homeButton` 属性（`Boolean` 类型，默认 `false`）控制返回首页按钮的显示 | P2 |
| FR-001-028 | 组件 MUST 提供 `show` 属性（`Boolean` 类型，默认 `true`）控制导航栏的显示/隐藏，支持 `observer: '_showChange'` 监听变化 | P1 |
| FR-001-029 | 组件 MUST 提供 `animated` 属性（`Boolean` 类型，默认 `true`）控制显示/隐藏时是否使用 opacity 过渡动画（0.5s transition）；当 `animated` 为 `false` 时，隐藏使用 `display: none` | P1 |
| FR-001-030 | 组件 MUST 提供 `delta` 属性（`Number` 类型，默认 `1`）指定返回按钮点击时的返回页面深度 | P1 |
| FR-001-031 | 组件在 `lifetimes.attached()` 生命周期 MUST 调用 `wx.getMenuButtonBoundingClientRect()` 获取胶囊按钮位置，调用 `wx.getSystemInfo()` 获取系统信息（窗口宽度、安全区域、平台类型），据此计算导航栏布局参数（`innerPaddingRight`、`leftWidth`、`safeAreaTop`），适配不同设备和平台 | P0 |
| FR-001-032 | 组件 MUST 根据平台类型（`res.platform`）设置 CSS 变量 `--height`：iOS 为 44px，Android 为 48px | P0 |
| FR-001-033 | 返回按钮点击时 MUST 调用 `wx.navigateBack({ delta })` 返回上一页，同时 `triggerEvent('back', { delta })` 向父组件派发 back 事件 | P0 |
| FR-001-034 | 组件 MUST 提供 `extClass` 属性（`String` 类型）供调用方追加外部 CSS 类名 | P2 |
| FR-001-035 | right slot MUST 始终渲染，供调用方在导航栏右侧注入自定义内容（如搜索、更多按钮） | P2 |

### 3.5 工具函数（utils）

| 编号 | 需求描述 | 优先级 |
|------|---------|:------:|
| FR-001-036 | 模块 MUST 导出一个 `formatTime(date: Date): string` 函数，将 Date 对象格式化为 `yyyy/MM/dd hh:mm:ss` 格式的字符串 | P0 |
| FR-001-037 | `formatTime` 内部 MUST 对月、日、时、分、秒执行补零操作（`formatNumber` 辅助函数），确保始终输出两位数字（如 `01` 而非 `1`） | P1 |
| FR-001-038 | `formatNumber` 函数 SHOULD 为模块私有（不 export），仅作为 `formatTime` 的内部实现细节 | P2 |

---

## 四、非功能性需求

| 编号 | 需求描述 | 类别 |
|------|---------|------|
| NFR-001-001 | 全局 MUST 启用 Skyline 渲染引擎，基础库版本区间为 3.0.0 ~ 15.255.255，不得降级为 WebView 模式 | 兼容性 |
| NFR-001-002 | TypeScript 编译 MUST 启用 strict 模式，包括 `strictNullChecks`、`noImplicitAny`、`noUnusedLocals`、`noUnusedParameters`、`noImplicitReturns` 等全部子选项 | 代码质量 |
| NFR-001-003 | 所有页面和组件 MUST 使用 ES2020 目标编译（`target: "ES2020"`）和 CommonJS 模块系统（`module: "CommonJS"`） | 兼容性 |
| NFR-001-004 | 导航栏组件 MUST 兼容 iOS 和 Android 双平台，通过 `wx.getSystemInfo()` 动态计算安全区域和胶囊按钮偏移 | 兼容性 |
| NFR-001-005 | 导航栏组件 MUST 兼容微信开发者工具（devtools 平台），安全区域处理逻辑需与真机保持一致 | 兼容性 |
| NFR-001-006 | 小程序包体积 SHOULD 尽量精简，当前仅依赖 `miniprogram-api-typings`（devDependency），无运行时依赖 | 性能 |
| NFR-001-007 | WXSS 样式 SHOULD 优先使用 rpx 响应式单位和 `env(safe-area-inset-*)` 安全区域变量，确保在不同屏幕尺寸和刘海屏设备上正常显示 | 用户体验 |
| NFR-001-008 | 按需注入（`lazyCodeLoading: "requiredComponents"`）SHOULD 启用，减少首屏不必要的代码注入 | 性能 |

---

## 五、关键实体

### 5.1 App globalData

全局数据容器，初始化为空对象 `{}`。后续模块（如 002-user-auth）会将用户 token、用户信息等挂载到该对象上。

| 字段 | 类型 | 当前值 | 说明 |
|------|------|--------|------|
| （空） | `{}` | `{}` | 占位容器，后续模块扩展 |

### 5.2 navigation-bar 组件

可复用的自定义导航栏，模拟微信原生导航栏的外观和行为，支持标题、返回按钮、加载状态、slot 扩展。

**组件标识**：`/components/navigation-bar/navigation-bar`

**属性清单**：

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| extClass | String | `''` | 外部追加 CSS 类名 |
| title | String | `''` | 导航栏标题 |
| background | String | `''` | 背景色（CSS 色值） |
| color | String | `''` | 文字颜色（CSS 色值） |
| back | Boolean | `true` | 是否显示返回按钮 |
| loading | Boolean | `false` | 是否显示加载动画 |
| homeButton | Boolean | `false` | 是否显示返回首页按钮 |
| animated | Boolean | `true` | 显示/隐藏时是否使用动画 |
| show | Boolean | `true` | 是否显示导航栏 |
| delta | Number | `1` | 返回的页面深度 |

**Slots**：

| Slot 名 | 触发条件 | 说明 |
|---------|---------|------|
| left | `back` 和 `homeButton` 均为 `false` | 自定义左侧区域 |
| center | `title` 为空 | 自定义标题区域 |
| right | 始终渲染 | 自定义右侧区域 |

**事件**：

| 事件名 | 参数 | 说明 |
|--------|------|------|
| back | `{ delta: number }` | 返回按钮被点击时触发 |

**内部数据**（computed at attached）：

| 字段 | 来源 | 说明 |
|------|------|------|
| ios | `res.platform !== 'android'` | 是否为 iOS（控制 CSS 变量） |
| innerPaddingRight | `res.windowWidth - rect.left` | 右侧内边距（避开胶囊按钮） |
| leftWidth | `res.windowWidth - rect.left` | 左侧宽度（与右侧对称） |
| safeAreaTop | 平台相关计算 | 安全区域顶部偏移（Android/devtools 处理） |
| displayStyle | `_showChange` 计算 | 控制导航栏显示/隐藏的 style 字符串 |

### 5.3 formatTime 工具函数

| 属性 | 值 |
|------|-----|
| 所在文件 | `miniprogram/utils/util.ts` |
| 导出方式 | named export: `export const formatTime` |
| 签名 | `(date: Date) => string` |
| 输入 | JavaScript Date 对象 |
| 输出 | 格式化字符串，如 `"2026/08/12 17:30:45"` |
| 内部辅助 | `formatNumber(n: number): string` — 个位数补零 |

### 5.4 pages/index 数据模型

| 字段 | 类型 | 初始值 | 说明 |
|------|------|--------|------|
| motto | string | `'Hello World'` | 展示文本 |
| userInfo.avatarUrl | string | 微信默认头像 URL | 用户头像地址 |
| userInfo.nickName | string | `''` | 用户昵称 |
| hasUserInfo | boolean | `false` | 是否已获取用户信息 |
| canIUseGetUserProfile | boolean | wx.canIUse 返回值 | 基础库是否支持 getUserProfile |
| canIUseNicknameComp | boolean | wx.canIUse 返回值 | 基础库是否支持 nickname 输入组件 |

### 5.5 pages/logs 数据模型

| 字段 | 类型 | 初始值 | 说明 |
|------|------|--------|------|
| logs | Array\<{date: string, timeStamp: number}\> | `[]` | 启动时间日志，每项含格式化的 date 和原始 timeStamp |

---

## 六、验收场景

### 6.1 App 启动初始化

**场景 AS-001：正常启动**
- **Given** 小程序首次启动（本地无 `logs` 数据）
- **When** `App.onLaunch()` 执行
- **Then** `wx.getStorageSync('logs')` 返回 `[]`，当前时间戳被插入数组头部并写入本地存储；`wx.login()` 被调用，code 打印至控制台

**场景 AS-002：非首次启动**
- **Given** 小程序已启动过多次，本地存储存在 `logs` 数组（含历史时间戳）
- **When** `App.onLaunch()` 执行
- **Then** 历史 logs 被读取，当前时间戳被插入数组头部，更新后的数组写回本地存储

### 6.2 首页用户信息获取

**场景 AS-003：新版基础库 — 用户未设置信息**
- **Given** 基础库支持 `input.type.nickname`（`canIUseNicknameComp === true`），且用户尚未设置信息（`hasUserInfo === false`）
- **When** 首页渲染
- **Then** 显示「选择头像」按钮（`open-type="chooseAvatar"`）和 nickname 输入框；不显示 `getUserProfile` 按钮

**场景 AS-004：新版基础库 — 用户选择头像**
- **Given** 用户在头像选择界面选中新头像
- **When** `onChooseAvatar` 事件处理函数执行
- **Then** `userInfo.avatarUrl` 更新为所选头像地址；若 nickName 也已填写且头像非默认头像，则 `hasUserInfo` 设为 `true`

**场景 AS-005：新版基础库 — 用户输入昵称**
- **Given** 用户在 nickname 输入框中输入昵称
- **When** `onInputChange` 事件处理函数执行
- **Then** `userInfo.nickName` 更新为输入值；若 avatarUrl 也已设置且非默认头像，则 `hasUserInfo` 设为 `true`

**场景 AS-006：旧版基础库 — getUserProfile 授权**
- **Given** 基础库支持 `getUserProfile`（`canIUseGetUserProfile === true`）且用户尚未设置信息
- **When** 用户点击「获取头像昵称」按钮 → 授权弹窗确认
- **Then** `wx.getUserProfile` success 回调中 `userInfo` 和 `hasUserInfo` 被更新

**场景 AS-007：用户已完成信息设置**
- **Given** `hasUserInfo === true`
- **When** 首页渲染
- **Then** 显示用户头像和昵称；点击头像跳转至 logs 页面

**场景 AS-008：基础库版本过低**
- **Given** 基础库既不支持 `getUserProfile` 也不支持 nickname 组件
- **When** 首页渲染
- **Then** 显示「请使用2.10.4及以上版本基础库」提示

### 6.3 启动日志页

**场景 AS-009：日志页加载**
- **Given** App 已启动过 3 次（本地存储有 3 条日志）
- **When** 日志页 `lifetimes.attached()` 执行
- **Then** `logs` 数组包含 3 项，每项含 `date`（格式化字符串）和 `timeStamp`（原始时间戳），列表按时间倒序渲染

### 6.4 自定义导航栏

**场景 AS-010：iOS 设备渲染**
- **Given** 当前在 iOS 设备上运行
- **When** navigation-bar `attached()` 执行
- **Then** iOS 类名被应用（`--height: 44px`），安全区域顶部使用 CSS `env(safe-area-inset-top)` 变量

**场景 AS-011：Android 设备渲染**
- **Given** 当前在 Android 设备上运行
- **When** navigation-bar `attached()` 执行
- **Then** android 类名被应用（`--height: 48px`），`safeAreaTop` 内联样式覆盖安全区域偏移

**场景 AS-012：返回按钮点击**
- **Given** 导航栏 `back === true`，当前页面栈深度为 2
- **When** 用户点击返回按钮
- **Then** `wx.navigateBack({ delta: 1 })` 被调用；`triggerEvent('back', { delta: 1 })` 向父组件派发事件

**场景 AS-013：导航栏显示/隐藏动画**
- **Given** `animated === true`，`show` 由 `true` 变为 `false`
- **When** `_showChange(false)` 执行
- **Then** `displayStyle` 设置为 `"opacity: 0; transition:opacity 0.5s;"`，导航栏以淡出动画隐藏

**场景 AS-014：导航栏无动画切换**
- **Given** `animated === false`，`show` 由 `true` 变为 `false`
- **When** `_showChange(false)` 执行
- **Then** `displayStyle` 设置为 `"display: none"`，导航栏立即隐藏

**场景 AS-015：title 为空 — center slot**
- **Given** 调用方不传 `title` 属性（或传空字符串），并在 `<navigation-bar>` 内部提供 `slot="center"` 的内容
- **When** 组件渲染
- **Then** center slot 内容被渲染，默认标题文本不显示

**场景 AS-016：back 和 homeButton 均为 false — left slot**
- **Given** 调用方设置 `back="{{false}}"` 且 `homeButton="{{false}}"`，并提供 `slot="left"` 的自定义内容
- **When** 组件渲染
- **Then** left slot 内容被渲染，返回和首页按钮均不显示

### 6.5 工具函数

**场景 AS-017：formatTime 正常格式化**
- **Given** 一个 Date 对象 `new Date(2026, 7, 12, 17, 30, 45)`（注：月份 0-based）
- **When** `formatTime(date)` 被调用
- **Then** 返回字符串 `"2026/08/12 17:30:45"`

**场景 AS-018：formatTime 补零**
- **Given** 一个 Date 对象 `new Date(2026, 0, 5, 3, 7, 9)`
- **When** `formatTime(date)` 被调用
- **Then** 返回字符串 `"2026/01/05 03:07:09"`（月和日补零至两位）

---

## 七、依赖关系

### 7.1 上游依赖

无。001-app-shell 是基础设施层模块，不依赖任何其他模块。

### 7.2 下游依赖（使用本模块的模块）

| 模块编号 | 模块名称 | 依赖方式 |
|----------|---------|---------|
| 002 | user-auth | 引用 navigation-bar 组件、formatTime 函数；依赖 app.ts 启动初始化 |
| 101 | profile | 引用 navigation-bar 组件；依赖 app.ts 全局数据 |
| all | 所有模块 | 可引用 navigation-bar 组件和 utils 中的公共函数 |

### 7.3 外部依赖

| 依赖 | 版本 | 类型 | 用途 |
|------|------|------|------|
| miniprogram-api-typings | ^2.8.3-1 | devDependency | 微信小程序 API 的 TypeScript 类型定义 |
| 微信基础库 | ≥ 3.0.0（Skyline） | 运行时 | 小程序运行的底层平台 |
| 微信开发者工具 | 最新版 | 开发工具 | IDE、编译、预览、调试 |

---

## 八、待澄清事项

1. **[NEEDS CLARIFICATION]** `app.json` 中 `"style": "v2"` 的配置在 Skyline + glass-easel 框架下是否仍然生效？Skyline 官方文档建议使用 v2 样式还是移除该配置？
   - **现状**：保留 `"style": "v2"`
   - **影响**：如 v2 在 Skyline 下无效，可移除以减少配置冗余

2. **[NEEDS CLARIFICATION]** navigation-bar 组件的 `homeButton` 属性绑定了 `bindtap="home"` 事件，但 `methods` 中未定义对应的 `home()` 方法。这是预留扩展还是遗漏？
   - **现状**：WXML 中存在 `bindtap="home"`，`.ts` 中无对应方法 → 点击首页按钮无任何响应
   - **影响**：如为预期行为（预留接口），建议在注释中说明；否则需补充 `home()` 方法实现跳转逻辑

3. **[NEEDS CLARIFICATION]** `index.ts` 的 `onChooseAvatar` 和 `onInputChange` 方法参数使用了 `e: any` 类型，这与项目宪法「禁止 any 类型」原则冲突。是故意为之（微信 API 类型不完整导致）还是需要定义具体的类型接口？
   - **现状**：`e: any` 用于事件参数类型
   - **影响**：如不修复，后续模块可能沿袭此模式，降低类型安全水平

---

## 九、文件清单

| 文件 | 类型 | 说明 |
|------|------|------|
| `miniprogram/app.ts` | 入口 | App 构造器，onLaunch 生命周期 |
| `miniprogram/app.json` | 配置 | 全局配置（页面路由、窗口、渲染引擎、组件框架） |
| `miniprogram/app.wxss` | 样式 | 全局样式（.container 工具类） |
| `miniprogram/pages/index/index.ts` | 页面 | 首页逻辑（用户信息获取） |
| `miniprogram/pages/index/index.wxml` | 模板 | 首页布局 |
| `miniprogram/pages/index/index.wxss` | 样式 | 首页样式 |
| `miniprogram/pages/index/index.json` | 配置 | 首页配置（引用 navigation-bar） |
| `miniprogram/pages/logs/logs.ts` | 页面 | 日志页逻辑 |
| `miniprogram/pages/logs/logs.wxml` | 模板 | 日志页布局 |
| `miniprogram/pages/logs/logs.wxss` | 样式 | 日志页样式 |
| `miniprogram/pages/logs/logs.json` | 配置 | 日志页配置（引用 navigation-bar） |
| `miniprogram/components/navigation-bar/navigation-bar.ts` | 组件 | 自定义导航栏逻辑 |
| `miniprogram/components/navigation-bar/navigation-bar.wxml` | 模板 | 导航栏布局 |
| `miniprogram/components/navigation-bar/navigation-bar.wxss` | 样式 | 导航栏样式（WeUI 风格） |
| `miniprogram/components/navigation-bar/navigation-bar.json` | 配置 | 组件声明 |
| `miniprogram/utils/util.ts` | 工具 | formatTime 函数 |
| `miniprogram/sitemap.json` | 配置 | 站点地图（允许所有页面被索引） |
| `project.config.json` | 配置 | 项目配置（编译类型、TypeScript 插件、Skyline） |
| `tsconfig.json` | 配置 | TypeScript 编译配置（strict 模式） |
| `package.json` | 配置 | 依赖声明（miniprogram-api-typings） |
