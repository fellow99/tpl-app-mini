# 规格文档索引

**项目名称：** tpl-app-mini（tpl-workspace微信小程序端）
**版本：** v1.0
**技术栈：** TypeScript + Skyline Renderer + glass-easel（微信小程序原生框架）
**文档生成时间：** 2026-08-12
**最后更新：** 2026-08-12

---

## 一、文档总览

| 层级 | 分类 | 文档数量 | 说明 |
|------|------|:------:|------|
| 整体 | 项目级顶层文档 | 6 | 架构、技术、宪法等全局文档 |
| 整体 | 整体规格文档 | 5 | overall-* 系列文档 |
| 模块 | 基础设施与脚手架 | 2 | 001-app-shell（spec + plan） |
| 模块 | 用户端功能模块 | 6 | 002-user-auth + 101-profile |
| **合计** | **3 目录 / 18 文件** | | |

---

## 二、项目级顶层文档

全局性的架构、技术、宪法等文档，定义项目基线和开发准则。

| 文档 | 路径 | 说明 |
|------|------|------|
| **方案总纲** | [ARCHITECTURE.md](./ARCHITECTURE.md) | 系统整体架构设计，层次图、模块依赖、数据流 |
| **技术选型** | [TECH.md](./TECH.md) | 核心技术栈选型理由、版本、依赖说明 |
| **宪法原则** | [constitution.md](./constitution.md) | 项目开发原则、编码规范、治理规则 |
| **项目结构** | [STRUCTURE.md](./STRUCTURE.md) | 源码目录结构、页面路由清单、组件清单 |
| **检查清单** | [SPECS_CHECKLIST.md](./SPECS_CHECKLIST.md) | 规格文档完成度追踪（19 个文件全部 ✅） |

### 整体规格文档

描述跨模块的全局规格、方案和数据模型。

| 文档 | 路径 | 说明 |
|------|------|------|
| **整体规格** | [overall-spec.md](./overall-spec.md) | 系统级功能规格：用户故事、功能需求、验收标准 |
| **整体方案** | [overall-plan.md](./overall-plan.md) | 系统级技术方案：实施策略、组件架构、认证流程 |
| **数据模型** | [overall-data-model.md](./overall-data-model.md) | 全局数据实体定义、API 请求/响应模型、状态机 |
| **接口模型** | [overall-api.md](./overall-api.md) | 全局 API 规范：后端接口、微信平台接口、内部通信 |
| **测试用例索引** | [overall-test-cases.md](./overall-test-cases.md) | 全模块测试用例索引总览 |

---

## 三、基础设施与脚手架（001-099）

### 001 — 应用脚手架（app-shell）

> 微信小程序基础设施层，提供运行时骨架、自定义导航栏组件、工具函数等基础能力，为所有上层业务模块提供支撑。

| 文档 | 链接 | 说明 |
|------|------|------|
| 功能规格 | [001-app-shell/spec.md](./001-app-shell/spec.md) | 脚手架功能规格（38 条功能需求） |
| 技术方案 | [001-app-shell/plan.md](./001-app-shell/plan.md) | 脚手架技术实现方案（Component 模式、Skyline 适配、导航栏设计） |

---

## 四、用户端功能模块（100-199）

### 002 — 用户注册及登录（user-auth）

> 用户身份认证模块，支持手机号注册、密码登录、短信验证码登录、微信一键登录，以及个人信息管理。

| 文档 | 链接 | 说明 |
|------|------|------|
| 功能规格 | [002-user-auth/spec.md](./002-user-auth/spec.md) | 用户认证功能规格（28 条功能需求、26 个验收场景） |
| 技术方案 | [002-user-auth/plan.md](./002-user-auth/plan.md) | 用户认证技术方案（9 个 API 调用、3 个页面设计、Token 生命周期） |
| 测试用例 | [002-user-auth/test-cases.md](./002-user-auth/test-cases.md) | 用户认证测试用例（36 条，P0:12, P1:17, P2:7） |

### 101 — 个人中心（profile）


| 文档 | 链接 | 说明 |
|------|------|------|
| 功能规格 | [101-profile/spec.md](./101-profile/spec.md) | 个人中心功能规格（6 条功能需求、9 个验收场景） |
| 技术方案 | [101-profile/plan.md](./101-profile/plan.md) | 个人中心技术方案（单页面设计、Component 模式、下拉刷新） |
| 测试用例 | [101-profile/test-cases.md](./101-profile/test-cases.md) | 个人中心测试用例（12 条，P0:4, P1:4, P2:3, P3:1） |

---

## 五、模块编号一览

| 编号 | 模块名 | 英文名 | 分类 | 状态 |
|------|--------|--------|------|:----:|
| 001 | 应用脚手架 | app-shell | 基础设施 | ✅ 已实现 |
| 002 | 用户注册及登录 | user-auth | 用户功能 | ⬜ 待实现 |
| 003-100 | 预留编号 | — | 基础设施 | — |
| 101 | 个人中心 | profile | 用户功能 | ⬜ 待实现 |
| 102-199 | 预留编号 | — | 用户功能 | — |

---

## 六、模块文档结构规范

每个模块目录 `NNN-name/` 下包含以下标准文档：

| 文件 | 命名 | 说明 |
|------|------|------|
| 功能规格 | `spec.md` | 定义模块的功能需求、用户故事、验收标准（技术无关） |
| 技术方案 | `plan.md` | 模块的技术实现方案、架构决策、组件设计（实现相关） |
| 测试用例 | `test-cases.md` | 模块 UI 功能测试用例（仅含 UI 交互的模块） |

---

## 七、配套工程

| 工程 | 路径 | 关系 | 规格文档 |
|------|------|------|---------|
| tpl-app-api | `../tpl-app-api/` | 后端 API 服务 | 参见其 specs/ 目录 |
| tpl-app-web | `../tpl-app-web/` | Web 前端（主要参考源） | 参见其 specs/ 目录 |
| docs | `../docs/` | 产品文档与设计稿 | 设计文档参考 |

---

## 八、快速导航

| 目标读者 | 推荐阅读顺序 |
|---------|-------------|
| **新加入开发者** | constitution.md → STRUCTURE.md → overall-spec.md → 001-app-shell/spec.md |
| **架构师 / Tech Lead** | ARCHITECTURE.md → TECH.md → overall-plan.md → overall-api.md |
| **前端开发** | STRUCTURE.md → 002-user-auth/plan.md → 101-profile/plan.md |
| **后端开发** | overall-api.md → overall-data-model.md → 002-user-auth/spec.md |
| **测试 / QA** | overall-test-cases.md → 002-user-auth/test-cases.md → 101-profile/test-cases.md |
| **产品经理** | overall-spec.md → 002-user-auth/spec.md → 101-profile/spec.md |

---

## 九、父工程规范文档（tpl-workspace 产品线）

tpl-workspace产品线级规范文档位于父工程 `../../specs/`，用于理解本工程在整体产品中的定位与约束。

| 文档 | 链接 | 说明 |
|------|------|------|
| 父工程规范索引 | [../../specs/README.md](../../specs/README.md) | 产品线级规范文档索引（22 份） |
| 整体架构 | [../../specs/ARCHITECTURE.md](../../specs/ARCHITECTURE.md) | 产品线整体架构、子工程依赖关系、部署拓扑 |
| 宪法原则 | [../../specs/constitution.md](../../specs/constitution.md) | 产品线级开发原则（10 条） |
| 整体规格 | [../../specs/overall-spec.md](../../specs/overall-spec.md) | 系统级功能规格（6 大产品模块） |

---

**文档维护者：** tpl-app-mini 开发团队
