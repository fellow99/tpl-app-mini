# 项目目录结构

> 项目：tpl-app-mini（tpl-workspace微信小程序端）
> 生成日期：2026-08-12

---

## 一、顶层目录结构

```
tpl-app-mini/
├── .codegraph/                    # Codegraph 知识图谱索引
├── .git/                          # Git 版本控制
├── .gitignore                     # Git 忽略规则
├── miniprogram/                   # 小程序源码目录
│   ├── app.json                   # 小程序全局配置
│   ├── app.ts                     # 小程序入口逻辑
│   ├── app.wxss                   # 小程序全局样式
│   ├── components/                # 公共组件
│   │   └── navigation-bar/        # 自定义导航栏组件
│   ├── pages/                     # 页面目录
│   │   ├── index/                 # 首页
│   │   └── logs/                  # 启动日志页
│   ├── sitemap.json               # 站点地图配置
│   └── utils/                     # 工具函数
│       └── util.ts                # 时间格式化等工具
├── package.json                   # 依赖配置（TypeScript 类型定义）
├── project.config.json            # 微信开发者工具项目配置
├── project.private.config.json    # 微信开发者工具私有配置
├── README.md                      # 项目说明
├── specs/                         # 规格文档目录 ⬅️
├── tsconfig.json                  # TypeScript 编译配置
└── typings/                       # TypeScript 类型声明
    ├── index.d.ts                 # 全局类型声明
    └── types/                     # 类型定义
```

---

## 二、页面路由清单

| 路由路径 | 页面文件 | 说明 | 导航栏 |
|----------|---------|------|:------:|
| `pages/index/index` | `miniprogram/pages/index/index.ts` | 应用首页，展示用户信息和欢迎语 | 自定义导航栏（无返回） |
| `pages/logs/logs` | `miniprogram/pages/logs/logs.ts` | 启动日志页，展示历史启动时间 | 自定义导航栏（有返回） |

---

## 三、组件清单

| 组件名称 | 路径 | 类型 | 说明 |
|----------|------|------|------|
| navigation-bar | `miniprogram/components/navigation-bar/` | 全局公共组件 | 自定义导航栏，支持标题、返回、背景色、加载状态 |

### navigation-bar 属性

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| title | String | `''` | 导航栏标题 |
| back | Boolean | `true` | 是否显示返回按钮 |
| color | String | `''` | 标题和图标颜色 |
| background | String | `''` | 导航栏背景色 |
| loading | Boolean | `false` | 是否显示加载动画 |
| homeButton | Boolean | `false` | 是否显示首页按钮 |
| animated | Boolean | `true` | 是否启用显示/隐藏动画 |
| show | Boolean | `true` | 是否显示导航栏 |
| delta | Number | `1` | 返回按钮跳转的页面深度 |

---

## 四、工具函数清单

| 函数 | 文件 | 说明 |
|------|------|------|
| `formatTime(date)` | `miniprogram/utils/util.ts` | 将 Date 对象格式化为 `yyyy/MM/dd HH:mm:ss` |

---

## 五、全局配置摘要

### app.json 关键配置

| 配置项 | 值 | 说明 |
|--------|-----|------|
| renderer | `skyline` | 使用 Skyline 渲染引擎 |
| componentFramework | `glass-easel` | 使用 glass-easel 组件框架 |
| navigationStyle | `custom` | 自定义导航栏样式 |
| style | `v2` | 使用新版组件样式 |
| lazyCodeLoading | `requiredComponents` | 按需注入组件代码 |

### project.config.json 关键配置

| 配置项 | 值 | 说明 |
|--------|-----|------|
| compileType | `miniprogram` | 项目类型：小程序 |
| miniprogramRoot | `miniprogram/` | 小程序源码根目录 |
| skylineRenderEnable | `true` | 启用 Skyline 渲染 |
| useCompilerPlugins | `["typescript"]` | 启用 TypeScript 编译插件 |
| appid | `wxChangeMe` | 小程序 AppID（占位符，实际项目需替换） |

---

## 六、配套工程引用

| 工程 | 路径 | 关系 |
|------|------|------|
| tpl-app-api | `../tpl-app-api/` | 配套后端 API 服务 |
| tpl-app-web | `../tpl-app-web/` | 配套 Web 前端（主要参考源） |
| docs | `../docs/` | 产品文档与设计稿 |
