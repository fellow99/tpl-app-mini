# 001-app-shell 技术方案

> 模块：001-app-shell（微信小程序脚手架）  
> 项目：tpl-app-mini（tpl-workspace微信小程序端）  
> 版本：v1.0  
> 日期：2026-08-12  
> 状态：✅ 已实现（as-built）  
> 对应规格：`spec.md`

---

## 一、技术选型

| 维度 | 选择 | 理由 |
|------|------|------|
| 运行时 | 微信小程序基础库 ≥ 3.0.0 | Skyline 渲染引擎最低版本要求 |
| 渲染引擎 | Skyline（`"renderer": "skyline"`） | 新一代渲染引擎，性能优于 WebView，支持更多 CSS 特性（flex、vh、env()） |
| 组件框架 | glass-easel（`"componentFramework": "glass-easel"`） | 新一代组件系统，`Component()` 构造器模式 |
| 开发语言 | TypeScript（ES2020，strict mode） | 提供类型安全，编译目标 ES2020 兼容微信 JS 引擎 |
| 模块系统 | CommonJS（`"module": "CommonJS"`） | 微信小程序运行时仅支持 CommonJS（即使源码使用 ES import/export，编译器会转换） |
| 样式系统 | WXSS（原生，无预处理器） | 无 postcss/less/sass 处理，保持最简构建链路 |
| 模板系统 | WXML（原生，minify 启用） | 微信小程序原生模板语言 |
| 导航模式 | 自定义导航栏（`"navigationStyle": "custom"`） | 全局关闭原生导航栏，使用自定义 navigation-bar 组件统一管理 |

---

## 二、目录结构

```
miniprogram/
├── app.ts                          # App 入口：App({ onLaunch, globalData })
├── app.json                        # 全局配置：pages、window、renderer、componentFramework
├── app.wxss                        # 全局样式：.container 工具类
├── sitemap.json                    # 站点地图：允许所有页面被微信索引
├── pages/
│   ├── index/                      # 首页（默认启动页）
│   │   ├── index.ts                #   页面逻辑 → Component({ data, methods })
│   │   ├── index.wxml              #   页面模板 → navigation-bar + userinfo + motto
│   │   ├── index.wxss              #   页面样式 → flex 布局 + 头像/昵称/按钮样式
│   │   └── index.json              #   页面配置 → { "usingComponents": { "navigation-bar": "..." } }
│   └── logs/                       # 启动日志页
│       ├── logs.ts                 #   页面逻辑 → Component({ data, lifetimes })
│       ├── logs.wxml               #   页面模板 → navigation-bar + 日志列表
│       ├── logs.wxss               #   页面样式 → .log-item 样式 + safe-area
│       └── logs.json               #   页面配置 → { "usingComponents": { "navigation-bar": "..." } }
├── components/
│   └── navigation-bar/             # 自定义导航栏组件
│       ├── navigation-bar.ts       #   组件逻辑 → Component({ properties, data, lifetimes, methods })
│       ├── navigation-bar.wxml     #   组件模板 → 左（返回/首页/slot） + 中（标题/loading/slot） + 右（slot）
│       ├── navigation-bar.wxss     #   组件样式 → WeUI 风格 + CSS 变量 + 平台适配
│       └── navigation-bar.json     #   组件声明 → { "component": true, "styleIsolation": "apply-shared" }
└── utils/
    └── util.ts                     # 工具函数 → export formatTime(date: Date): string
```

---

## 三、数据模型

### 3.1 App globalData

**文件**：`miniprogram/app.ts:3`

```typescript
App<IAppOption>({
  globalData: {},
  // ...
})
```

**类型定义**（`IAppOption` 由 `miniprogram-api-typings` 提供基础类型，扩展在 typings 目录）：

| 字段 | 类型 | 当前值 | 说明 | 对应 FR |
|------|------|--------|------|--------|
| （空占位） | `{}` | `{}` | 后续模块将在此挂载 `token`、`userInfo`、`isLoggedIn` 等 | FR-001-009 |

**扩展方向**（由后续模块如 002-user-auth 填充）：

```typescript
// 预期扩展类型（当前未实现，仅供参考）
interface IGlobalData {
  token?: string;          // JWT token
  userInfo?: {             // 用户信息
    id: number;
    phone: string;
    nickname: string;
    avatarUrl: string;
  };
  isLoggedIn?: boolean;
}
```

### 3.2 navigation-bar 组件数据模型

**文件**：`miniprogram/components/navigation-bar/navigation-bar.ts`

**Properties（外部属性）**：

| 属性 | 类型 | 默认值 | Observer | 对应 FR |
|------|------|--------|----------|--------|
| extClass | String | `''` | — | FR-001-034 |
| title | String | `''` | — | FR-001-023 |
| background | String | `''` | — | FR-001-025 |
| color | String | `''` | — | FR-001-025 |
| back | Boolean | `true` | — | FR-001-024 |
| loading | Boolean | `false` | — | FR-001-026 |
| homeButton | Boolean | `false` | — | FR-001-027 |
| animated | Boolean | `true` | — | FR-001-029 |
| show | Boolean | `true` | `'_showChange'` | FR-001-028 |
| delta | Number | `1` | — | FR-001-030 |

**内部 Data**：

| 字段 | 类型 | 初始值 | 赋值时机 | 说明 | 对应 FR |
|------|------|--------|---------|------|--------|
| displayStyle | String | `''` | `_showChange` 调用时 | 控制导航栏显示/隐藏的 inline style | FR-001-028/029 |
| ios | Boolean | — | `attached` 时 setData | `res.platform !== 'android'`（用于 CSS class 切换） | FR-001-032 |
| innerPaddingRight | String | — | `attached` 时 setData | `padding-right: Npx`（避开右上方胶囊按钮） | FR-001-031 |
| leftWidth | String | — | `attached` 时 setData | `width: Npx`（左侧区域宽度，与右侧对称） | FR-001-031 |
| safeAreaTop | String | — | `attached` 时 setData | Android/devtools 的安全区域 top 补偿 | FR-001-031 |

### 3.3 pages/index 页面数据模型

**文件**：`miniprogram/pages/index/index.ts:7-16`

| 字段 | 类型 | 初始值 | 对应 FR |
|------|------|--------|--------|
| motto | string | `'Hello World'` | —（模板占位） |
| userInfo.avatarUrl | string | 微信默认头像 URL | FR-001-013 |
| userInfo.nickName | string | `''` | FR-001-013 |
| hasUserInfo | boolean | `false` | FR-001-015 |
| canIUseGetUserProfile | boolean | `wx.canIUse('getUserProfile')` | FR-001-012 |
| canIUseNicknameComp | boolean | `wx.canIUse('input.type.nickname')` | FR-001-012 |

### 3.4 pages/logs 页面数据模型

**文件**：`miniprogram/pages/logs/logs.ts:6-8`

| 字段 | 类型 | 初始值 | 对应 FR |
|------|------|--------|--------|
| logs | `Array<{ date: string; timeStamp: number }>` | `[]` | FR-001-019/020 |

### 3.5 本地存储（Storage）数据模型

| Key | 类型 | 结构 | 读写位置 | 对应 FR |
|-----|------|------|---------|--------|
| `logs` | `number[]` | 启动时间戳数组（毫秒），最新在前 | 写：`app.ts onLaunch` | FR-001-001 |
|  |  |  | 读：`app.ts onLaunch`、`logs.ts attached` | FR-001-019 |

**注意**：`logs` key 是当前唯一的本地存储 key。根据宪法原则 3.4，后续模块需将所有 storage key 统一到 `miniprogram/utils/storage.ts` 中管理（当前尚未实现）。

---

## 四、接口契约

### 4.1 formatTime — 时间格式化

**文件**：`miniprogram/utils/util.ts`  
**导出方式**：`export const formatTime`  
**对应 FR**：FR-001-036 / FR-001-037

```typescript
// 签名
export const formatTime = (date: Date) => string

// 内部实现
const formatNumber = (n: number) => string  // 私有辅助：个位数补零

// 行为
// 输入：new Date(2026, 7, 12, 17, 30, 45)
// 输出："2026/08/12 17:30:45"
```

**调用示例**（logs.ts）：
```typescript
import { formatTime } from '../../utils/util'
// ...
logs: (wx.getStorageSync('logs') || []).map((log: string) => ({
  date: formatTime(new Date(log)),
  timeStamp: log
}))
```

### 4.2 navigation-bar — 组件 API

**文件**：`miniprogram/components/navigation-bar/navigation-bar.ts`  
**对应 FR**：FR-001-021 ~ FR-001-035

#### 4.2.1 属性契约

```typescript
Component({
  options: { multipleSlots: true },
  properties: {
    extClass:    { type: String,  value: '' },
    title:       { type: String,  value: '' },
    background:  { type: String,  value: '' },
    color:       { type: String,  value: '' },
    back:        { type: Boolean, value: true },
    loading:     { type: Boolean, value: false },
    homeButton:  { type: Boolean, value: false },
    animated:    { type: Boolean, value: true },
    show:        { type: Boolean, value: true, observer: '_showChange' },
    delta:       { type: Number,  value: 1 },
  },
  // ...
})
```

#### 4.2.2 事件契约

| 事件名 | detail 类型 | 触发条件 | 对应 FR |
|--------|------------|---------|--------|
| `back` | `{ delta: number }` | 用户点击返回按钮 | FR-001-033 |

```typescript
// 派发方式
this.triggerEvent('back', { delta: data.delta }, {})
```

#### 4.2.3 Slot 契约

| Slot 名称 | 激活条件 | 说明 | 对应 FR |
|-----------|---------|------|--------|
| `left` | `back === false && homeButton === false` | 自定义左侧内容 | FR-001-024 |
| `center` | `title === ''`（空字符串） | 自定义标题区域 | FR-001-023 |
| `right` | 始终渲染 | 自定义右侧内容 | FR-001-035 |

#### 4.2.4 使用示例

**首页（index）- 无返回按钮**：
```xml
<navigation-bar title="Weixin" back="{{false}}" color="black" background="#FFF"></navigation-bar>
```

**日志页（logs）- 有返回按钮**：
```xml
<navigation-bar title="查看启动日志" back="{{true}}" color="black" background="#FFF"></navigation-bar>
```

### 4.3 App 生命周期契约

**文件**：`miniprogram/app.ts`  
**对应 FR**：FR-001-001 / FR-001-002

```typescript
App<IAppOption>({
  globalData: {},
  onLaunch() {
    // 1. 初始化本地存储 (FR-001-001)
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    // 2. 微信登录 (FR-001-002)
    wx.login({
      success: res => {
        console.log(res.code)
        // TODO: 发送 res.code 到后端换取 openId, sessionKey, unionId
      },
    })
  },
})
```

**注**：`wx.login` 成功回调中仅 `console.log(res.code)`，未实现后端 token 交换。这是 002-user-auth 模块的职责范围。

---

## 五、实现策略

### 5.1 Component() 模式统一

**原则**：所有页面必须使用 `Component()` 构造器而非 `Page()` 构造器。这是 glass-easel 组件框架的推荐模式，宪法原则 1.1 强制要求。

**模式模板**：

```typescript
Component({
  // 数据
  data: { /* ... */ },
  // 生命周期（等价于 Page 的 onLoad/onShow 等）
  lifetimes: {
    attached() { /* 组件挂载时 */ }
  },
  // 事件处理方法
  methods: {
    onSomeEvent() { /* ... */ }
  },
})
```

**页面生命周期映射**（`Page()` → `Component()`）：

| Page 生命周期 | Component 生命周期 | 说明 |
|---------------|-------------------|------|
| `onLoad` | `lifetimes.created` | 页面加载，可访问 query 参数但不可 setData |
| `onShow` | `pageLifetimes.show` | 页面显示/切入前台 |
| `onReady` | `lifetimes.ready` | 页面初次渲染完成 |
| `onHide` | `pageLifetimes.hide` | 页面隐藏/切入后台 |
| `onUnload` | `lifetimes.detached` | 页面卸载 |

**注意**：当前 index 页和 logs 页均未实现 `pageLifetimes.show`（等价于 `onShow`）。如果后续需要在每次页面显示时刷新数据（如从其他页面返回后更新状态），需补充此生命周期。

### 5.2 Skyline 渲染引擎适配

**配置位置**：`miniprogram/app.json:11-21`

```json
{
  "renderer": "skyline",
  "rendererOptions": {
    "skyline": {
      "defaultDisplayBlock": true,
      "defaultContentBox": true,
      "tagNameStyleIsolation": "legacy",
      "disableABTest": true,
      "sdkVersionBegin": "3.0.0",
      "sdkVersionEnd": "15.255.255"
    }
  }
}
```

**对 WXSS 的影响**：

| Skyline 特性 | 当前代码使用 | 注意 |
|-------------|------------|------|
| `vh` 单位全支持 | `pages/index/index.wxss:3` — `height: 100vh` | WebView 模式下 `vh` 不完全支持 |
| `display: flex` 全支持 | 所有页面均使用 flex 布局 | Skyline 对 flex 支持优于 WebView |
| `env(safe-area-inset-*)` | `navigation-bar.wxss:20,25` | 用于刘海屏安全区域适配 |
| `box-sizing` | `app.wxss:9` — `box-sizing: border-box` | Skyline 支持所有 CSS 盒模型属性 |
| CSS 变量 | `navigation-bar.wxss:2-5` — `--height`、`--left`、`--weui-FG-0` | 用于平台自适应高度 |

**对 WXML 的约束**：

| 约束 | 说明 |
|------|------|
| 禁止使用 `cover-view` / `cover-image` | Skyline 原生支持任意组件覆盖，无需 cover-view |
| 支持 `scroll-view` type="list" | 当前 `index.wxml:3` 和 `logs.wxml:3` 使用 `type="list"` 启用 Skyline 列表模式 |
| `wx:for` 必须指定 `wx:key` | `logs.wxml:4` 使用 `wx:key="timeStamp"` — Skyline 严格要求 |

### 5.3 自定义导航栏实现

**全局关闭原生导航栏**：`miniprogram/app.json:8` — `"navigationStyle": "custom"`

**组件适配策略**：

1. **获取胶囊按钮位置**：`wx.getMenuButtonBoundingClientRect()` 返回胶囊按钮的 `left`、`top`、`width`、`height`
2. **获取系统信息**：`wx.getSystemInfo()` 返回 `windowWidth`、`safeArea.top`、`platform`
3. **计算布局参数**：
   ```
   innerPaddingRight = windowWidth - rect.left    // 右侧避开胶囊
   leftWidth          = windowWidth - rect.left    // 左侧与右侧对称
   safeAreaTop        = 仅在 Android/devtools 时补偿（iOS 用 CSS env()）
   ```

**平台 CSS 变量**：iOS `--height: 44px`，Android `--height: 48px`（`.android` 类覆盖）

**导航栏显示/隐藏**：
- `animated: true` → 使用 `opacity` + `transition` 动画（0.5s）
- `animated: false` → 直接 `display: none`

### 5.4 TypeScript 编译配置

**文件**：`tsconfig.json`

**关键配置**：

```json
{
  "compilerOptions": {
    "strict": true,
    "target": "ES2020",
    "module": "CommonJS",
    "strictNullChecks": true,
    "noImplicitAny": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "typeRoots": ["./typings"]
  }
}
```

**当前未使用的配置项**（待后续模块启用）：

| 配置项 | 值 | 使用时机 |
|--------|-----|---------|
| ~~`paths`~~ | — | 引入路径别名时配置 |
| ~~`baseUrl`~~ | — | 引入路径别名时配置 |
| `experimentalDecorators` | `true` | 如后续模块使用装饰器（如依赖注入），已预留 |

### 5.5 微信登录流程（当前状态与后续扩展点）

**当前实现**（app.ts:11-16）：

```typescript
wx.login({
  success: res => {
    console.log(res.code)  // ← 仅打印，未发送到后端
  },
})
```

**后续扩展（002-user-auth 模块）**：

```
wx.login() → 获取 code
    │
    ├── wx.request({ url: '/auth/login', data: { code } })
    │       │
    │       ├── 成功 → 存储 token 到 globalData/Storage
    │       └── 失败 → 提示用户重试
```

**扩展点**：
- `app.ts` 中的 `wx.login` success 回调（L12-14）是注入后端登录逻辑的位置
- `globalData` 将挂载 `token`、`userInfo` 等字段
- 需在 `utils/` 下创建 `request.ts`（HTTP 客户端）和 `storage.ts`（本地存储管理）

---

## 六、组件通信模式

### 6.1 当前组件通信方式

```
┌──────────────────────────┐
│  pages/index (父页面)      │
│  ┌──────────────────────┐│
│  │ navigation-bar       ││  ← properties 绑定（title, back, color, background）
│  │ (子组件)              ││  ← slot 注入（当前未使用）
│  │                      ││  ← triggerEvent('back', ...) → 父页面监听
│  └──────────────────────┘│
└──────────────────────────┘
```

**父→子**：通过 WXML 属性绑定传递
```xml
<navigation-bar title="Weixin" back="{{false}}" color="black" background="#FFF"></navigation-bar>
```

**子→父**：通过 `triggerEvent` 派发事件（当前 index 和 logs 页面未监听 back 事件，因 navigation-bar 内部已自动调用 `wx.navigateBack`）

```typescript
// navigation-bar.ts:102
this.triggerEvent('back', { delta: data.delta }, {})
```

### 6.2 页面间通信

| 方式 | 当前使用场景 | 说明 |
|------|------------|------|
| `wx.navigateTo({ url })` | index → logs (bindViewTap) | 携带 query 参数跳转（当前无参数） |
| `wx.getStorageSync` | app.ts 写 → logs.ts 读 | 跨页面共享启动日志数据 |
| `getApp().globalData` | index.ts:3 — `const app = getApp<IAppOption>()` | 获取全局应用实例（当前仅获取实例引用，globalData 为空） |

---

## 七、样式架构

### 7.1 样式层级

```
app.wxss (全局基础样式)
    │
    ├── .container (flex 纵向居中布局)
    │
    └── pages/index/index.wxss (页面级)
        │   page { height: 100vh; display: flex; flex-direction: column; }
        │   .userinfo { ... }
        │   .userinfo-avatar { ... }
        │   ...
        │
        pages/logs/logs.wxss (页面级)
        │   page { height: 100vh; display: flex; flex-direction: column; }
        │   .log-item { ... }
        │
        components/navigation-bar/navigation-bar.wxss (组件级，WeUI 风格)
            .weui-navigation-bar { ... }
            .weui-navigation-bar__inner { ... }
            .weui-navigation-bar__left { ... }
            ...
```

### 7.2 样式隔离策略

| 层级 | 隔离方式 | 说明 |
|------|---------|------|
| app.wxss | 全局 | 所有页面和组件均可继承 |
| 页面 .wxss | 默认隔离 | 页面样式仅对该页面生效 |
| 组件 .wxss | `styleIsolation: "apply-shared"` | 组件样式会受 app.wxss 影响，但不受页面样式影响 |

**navigation-bar 组件配置**（`navigation-bar.json:3`）：
```json
{ "styleIsolation": "apply-shared" }
```
表示组件的样式可以接受全局样式（app.wxss）的影响（如 CSS 变量 `--weui-FG-0`），但不会被页面样式覆盖或污染。

### 7.3 CSS 变量（Custom Properties）

navigation-bar 组件使用 CSS 变量实现平台适配：

| 变量名 | 定义位置 | iOS 值 | Android 值 | 用途 |
|--------|---------|--------|-----------|------|
| `--weui-FG-0` | `.weui-navigation-bar` | `rgba(0,0,0,.9)` | `rgba(0,0,0,.9)` | 前景色（文字/图标颜色） |
| `--height` | `.weui-navigation-bar` | 44px | 48px（`.android` 覆盖） | 导航栏高度 |
| `--left` | `.weui-navigation-bar` | 16px | 16px | 左侧内边距 |

使用 `var(--height)` 在 `height` 和 `padding-top` 计算中（`navigation-bar.wxss:20,25`）。

### 7.4 安全区域适配

导航栏组件使用三种方式适配刘海屏/状态栏：

1. **iOS**：CSS `env(safe-area-inset-top)` 原生支持（`navigation-bar.wxss:20,25`）
2. **Android**：通过 JS 计算 `res.safeArea.top` 生成 inline style 补偿
3. **Devtools**：与 Android 相同的补偿逻辑（因开发者工具模拟器也不支持 `env()` 变量）

页面底部同样使用 `env(safe-area-inset-bottom)` 适配 iPhone X 系列底部指示条（`logs.wxss:15`）。

---

## 八、宪法合规检查

| 宪法原则 | 条款 | 合规状态 | 证据 |
|---------|------|:------:|------|
| 1.1 组件化优先 | 所有页面使用 `Component()` | ✅ | `index.ts`、`logs.ts` 均使用 `Component({...})` |
| 1.2 TypeScript 严格模式 | `strict: true` + 全部子选项 | ✅ | `tsconfig.json` 全开 |
| 1.3 目录约定 | pages / components / utils | ✅ | 遵循标准结构 |
| 2.1 命名规范 | kebab-case 文件名、camelCase 函数 | ✅ | `navigation-bar`、`formatTime`、`bindViewTap` |
| 2.2 组件定义格式 | `Component({ options, properties, data, lifetimes, methods })` | ✅ | navigation-bar 完整实现所有字段 |
| 2.3 样式约定 | rpx 单位、100vh、custom navigation | ✅ | `128rpx`、`100vh`、`navigationStyle: "custom"` |
| 3.1 渲染引擎固定 | Skyline + glass-easel | ✅ | `app.json` 声明 |
| 3.2 无第三方 UI 框架 | 无 WeUI/TDesign 等依赖 | ✅ | 仅使用原生组件（view/image/text/button/input/scroll-view） |
| 4.1 类型安全 | noImplicitAny、strictNullChecks | ⚠️ 部分违规 | `index.ts:24,32` 使用 `e: any`（见 spec.md [NEEDS CLARIFICATION] #3） |
| 4.2 代码清洁度 | noUnusedLocals、noUnusedParameters | ✅ | TypeScript 编译通过 |
| 4.3 错误处理 | 网络请求错误回调、用户操作反馈 | ⚠️ 待完善 | `wx.login` 仅有 success 回调，无 fail 处理 |
| 5.1 认证与授权 | Token 存储、自动携带 | ⬜ 未实现 | 属于 002-user-auth 模块范围 |
| 6.1 文档先行 | spec.md + plan.md | ✅ | 本文档即为证明 |

**违规项处理计划**：
- **`e: any` 类型**：已在 spec.md [NEEDS CLARIFICATION] 中标记，待确认后由 002-user-auth 模块修复（可定义 `WechatEvent<T>` 泛型类型）
- **wx.login 无 fail 回调**：当前模块不负责完整登录流程，fail 处理由 002-user-auth 模块实现
- **homeButton bindtap="home" 无对应方法**：已在 spec.md [NEEDS CLARIFICATION] 中标记

---

## 九、文件清单

| 序号 | 文件路径 | 文件类型 | 核心职责 | 对应 FR |
|:----:|---------|---------|---------|:------:|
| 1 | `miniprogram/app.ts` | TypeScript | App 入口：onLaunch 初始化，globalData 占位 | FR-001-001/002/009 |
| 2 | `miniprogram/app.json` | JSON | 全局配置：页面路由、Skyline、glass-easel、自定义导航 | FR-001-003~007 |
| 3 | `miniprogram/app.wxss` | WXSS | 全局样式：`.container` 工具类 | FR-001-008 |
| 4 | `miniprogram/sitemap.json` | JSON | 站点地图：允许所有页面被微信索引 | — |
| 5 | `miniprogram/pages/index/index.ts` | TypeScript | 首页逻辑：用户头像/昵称获取，Component 模式 | FR-001-010~016 |
| 6 | `miniprogram/pages/index/index.wxml` | WXML | 首页模板：导航栏 + 用户信息 + motto | FR-001-010~016 |
| 7 | `miniprogram/pages/index/index.wxss` | WXSS | 首页样式：flex 布局，头像/昵称/按钮样式 | FR-001-010~016 |
| 8 | `miniprogram/pages/index/index.json` | JSON | 首页配置：引用 navigation-bar 组件 | FR-001-011 |
| 9 | `miniprogram/pages/logs/logs.ts` | TypeScript | 日志页逻辑：读取启动日志、格式化时间、Component 模式 | FR-001-017/019 |
| 10 | `miniprogram/pages/logs/logs.wxml` | WXML | 日志页模板：导航栏 + 日志列表 | FR-001-018/020 |
| 11 | `miniprogram/pages/logs/logs.wxss` | WXSS | 日志页样式：.log-item + safe-area-inset-bottom | — |
| 12 | `miniprogram/pages/logs/logs.json` | JSON | 日志页配置：引用 navigation-bar 组件 | FR-001-018 |
| 13 | `miniprogram/components/navigation-bar/navigation-bar.ts` | TypeScript | 导航栏逻辑：properties、slot、平台适配、返回导航 | FR-001-021~035 |
| 14 | `miniprogram/components/navigation-bar/navigation-bar.wxml` | WXML | 导航栏模板：左中右三区域、slot、条件渲染 | FR-001-023/024/026/027 |
| 15 | `miniprogram/components/navigation-bar/navigation-bar.wxss` | WXSS | 导航栏样式：WeUI 风格、CSS 变量、平台适配、loading 动画 | FR-001-031/032 |
| 16 | `miniprogram/components/navigation-bar/navigation-bar.json` | JSON | 组件声明：component=true、样式隔离 apply-shared | FR-001-021 |
| 17 | `miniprogram/utils/util.ts` | TypeScript | 工具函数：formatTime + formatNumber | FR-001-036/037/038 |
| 18 | `project.config.json` | JSON | 项目配置：编译类型、TypeScript 插件、Skyline 启用 | NFR-001-001 |
| 19 | `tsconfig.json` | JSON | TypeScript 配置：strict 模式、ES2020、CommonJS | NFR-001-002/003 |
| 20 | `package.json` | JSON | 依赖声明：miniprogram-api-typings（仅 devDependency） | NFR-001-006 |

---

## 十、后续模块接入指南

### 10.1 新增页面的标准步骤

1. 在 `miniprogram/pages/` 下创建页面目录（如 `login/`）
2. 创建四个文件：`login.ts`、`login.wxml`、`login.wxss`、`login.json`
3. `login.ts` 使用 `Component({ data, methods, lifetimes })` 模式（不写 `Page()`）
4. `login.json` 引用 navigation-bar 组件：
   ```json
   { "usingComponents": { "navigation-bar": "/components/navigation-bar/navigation-bar" } }
   ```
5. `login.wxml` 顶部添加 `<navigation-bar>` 标签
6. 在 `app.json` 的 `pages` 数组中注册路由（首页放第一位）

### 10.2 新增公共组件的标准步骤

1. 在 `miniprogram/components/` 下创建组件目录
2. 组件 `.json` 必须声明 `{ "component": true }`
3. 根据是否需要接收全局样式设置 `styleIsolation`（`"apply-shared"` 或 `"isolated"`）
4. 如需 slot 支持，在 `options` 中设置 `multipleSlots: true`

### 10.3 新增工具函数的标准步骤

1. 在 `miniprogram/utils/` 下创建新文件（或添加到现有文件）
2. 使用 named export 导出公共函数
3. 确保所有参数和返回值有 TypeScript 类型标注
4. 调用方通过 ES import 引用（编译器会自动转为 CommonJS `require`）

### 10.4 接入 navigation-bar 组件

```xml
<!-- 基础用法：标题 + 返回按钮 -->
<navigation-bar title="页面标题" back="{{true}}" color="black" background="#FFF"></navigation-bar>

<!-- 自定义标题内容（使用 center slot） -->
<navigation-bar back="{{true}}" color="black" background="#FFF">
  <view slot="center">
    <text>自定义标题</text>
  </view>
</navigation-bar>

<!-- 自定义左侧内容（使用 left slot） -->
<navigation-bar title="标题" back="{{false}}" homeButton="{{false}}" color="black" background="#FFF">
  <view slot="left">
    <text>取消</text>
  </view>
</navigation-bar>
```
