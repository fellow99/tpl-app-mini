# AGENTS.md — tpl-app-mini（微信小程序端）

> 本文件为本子工程（`tpl-app-mini/`）的 AI Agent 工作规范，是父工程 `tpl-workspace/AGENTS.md` 在本工程的具体化。
> 所有规范均基于本工程实际存在的技能、README 与 specs 编写。

---

## 一、项目简介

tpl-app-mini 是「tpl-workspace」产品体系的**微信小程序端**，采用**微信原生框架
（TypeScript + Skyline 渲染引擎 + glass-easel 组件框架）**，不引入第三方框架，
为用户提供轻量级业务入口。脚手架已就绪，业务功能（用户认证、个人中心）依规格逐步实现。

## 二、技术栈

| 层级 | 技术 |
|------|------|
| 语言 | TypeScript (ES2020) |
| 渲染 | Skyline Renderer |
| 组件 | glass-easel |
| 框架 | 微信小程序原生 |

## 三、代码结构

```
miniprogram/
├── app.json              # 全局配置（Skyline + glass-easel + 页面路由）
├── app.ts                # 入口逻辑（wx.login 集成、全局状态）
├── app.wxss              # 全局样式
├── pages/                # 页面（index/ 首页、个人中心等）
├── components/           # 公共组件（navigation-bar/ 自定义导航栏）
└── utils/                # 工具（util.ts 时间格式化、request.ts HTTP 封装）
```

## 四、规格文档（specs）

`specs/` 下存放规格：`001-app-shell`、`002-user-auth`、`004-i18n`、`005-theme` 及系统文档
（`ARCHITECTURE.md`、`STRUCTURE.md`、`TECH.md`、`constitution.md`）。

## 五、常用开发命令

使用微信开发者工具导入本项目目录进行预览/调试/上传；命令行相关见 `README.md`。

## 六、代码库探索规范（codegraph）

本工程已配置 codegraph 代码地图（`.codegraph/` 索引），并在 git `post-commit` 钩子中
自动增量更新（`codegraph sync`）。

- **提交后**无需手动操作，索引自动与 HEAD 保持同步。
- **探索代码**优先使用 codegraph，而非 grep/Read 循环：
  - `codegraph status` — 检查索引状态
  - `codegraph context "<任务>"` — 生成任务相关代码简报
  - `codegraph query <符号>` — 查找符号定义
  - `codegraph callers <符号>` / `codegraph callees <符号>` — 调用关系
  - `codegraph impact <符号>` — 变更影响范围
  - `codegraph files --filter <目录>` — 索引文件树
- 索引过期（切换分支/外部 pull）时手动 `codegraph sync` 增量更新。
- `codegraph` 查询不到时先 `sync` 再重查；确属 codegraph 不支持的语法（如 `.wxml`/`.wxss`/部分 TS 特性）才回退 grep。

> 索引目录 `.codegraph/` 已在 `.gitignore` 排除，不入库。

## 七、Git 提交规范

遵循父工程 `tpl-workspace/AGENTS.md` 的 Conventional Commits 规范，提交前加载 `git-commit` 技能。

## 八、开发流程与技能

- 小程序开发遵循父工程开发流程（`specs-based-devflow`、`requesting-code-review`、`systematic-debugging`）。
- 代码库探索一律走 **codegraph**（见第六节）。

---

> 维护者：fellow99 · 属「tpl-workspace 多端业务应用框架」
