# 004-i18n：功能规格文档

> 项目：tpl-app-mini（tpl-workspace微信小程序端）
> 模块：多语言国际化
> 版本：v1.0
> 日期：2026-08-18
> 状态：✅ 已实现
> 父工程规格引用：需求基准见 [../../../specs/004-i18n/spec.md](../../../specs/004-i18n/spec.md)（FR-004-001 ~ FR-004-020），本文档仅补充本工程（微信小程序端）特有规格

---

## 1. 模块概述

### 1.1 目的

为「tpl-workspace」微信小程序端接入多语言国际化能力：界面文案、后端提示、tabBar 导航文案随当前语言切换，语料来源于父工程 `i18n/` 单一事实源，由同步脚本生成小程序端语料模块。

### 1.2 解决的问题

| 问题 | 解决方案 |
|------|---------|
| 页面文案硬编码中文，语言不可切换 | 各页迁移为 `t(key)` 调用，按当前语言取词 |
| 后端返回真实文案，改文案需重新发布后端 | 后端 `R.msg` 改为返回 i18n key，前端 `translateApiMessage` 翻译 |
| 语料散落各端、易漂移 | 语料由父工程 `i18n/scripts/sync-i18n.mjs` 生成 `miniprogram/i18n/*.ts` |
| tabBar 文案在 `app.json` 静态配置、无法运行时切换 | `applyTabBarLocale()` 用 `wx.setTabBarItem` 逐项重写 |
| 语料缺失导致白屏 | `t()` 未命中回退 zh-CN，再回退原 key，绝不抛异常 |

### 1.3 范围

**在范围内：**

- 语料模块 `miniprogram/i18n/{zh-CN,en-US,zh-TW}.ts`（sync 生成）
- `utils/i18n.ts` 取词工具（`getLocale` / `setLocale` / `t` / `translateApiMessage` / `applyTabBarLocale`）
- `utils/request.ts` 后端 key 翻译接入
- 各 pages 硬编码中文迁移为 `t()`
- tabBar 运行时文案重写
- 系统语言跟随与本地持久化

**不在范围内（本模块不实现）：**

- 语料的维护与事实源（由父工程 `i18n/` 负责）
- 语料生成与校验脚本（由父工程 `i18n/scripts/` 负责）
- 后端 `R.msg` key 化改造（由 tpl-app-api 负责）
- 运行时语料热更新（后续可选增强）
- tpl-manage / tpl-manage-ui（本轮不改动）

---

## 2. 用户故事

| 编号 | 故事 | 优先级 |
|:-----|------|:------:|
| US-001 | 作为用户，我可切换小程序语言为中文/英文/繁体，界面与后端提示随之切换 | P0 |
| US-002 | 作为用户，小程序默认跟随系统语言，无需手动设置即可看到对应语言界面 | P0 |
| US-003 | 作为用户，我的语言选择在下次启动时仍然生效 | P1 |
| US-004 | 作为后端开发者，后端提示以 key 返回，前端自动翻译成对应语言文案 | P0 |
| US-005 | 作为用户，即使某条文案缺失翻译，界面也不白屏，而是显示原 key | P1 |

---

## 3. 功能需求

> 需求基准：父工程 [../../../specs/004-i18n/spec.md](../../../specs/004-i18n/spec.md) 的 FR-004-001 ~ FR-004-020（语料事实源、同步管道、后端返回 key、各前端接入、数据字典、范围约束）。本节编号 FR-004-101 起，为本工程特有落地规格。

### 3.1 语料模块

| ID | 需求 | RFC 2119 |
|:---|------|:--------:|
| FR-004-101 | 本工程 MUST 提供 `miniprogram/i18n/{zh-CN,en-US,zh-TW}.ts` 三份语料模块，由父工程 `i18n/scripts/sync-i18n.mjs` 生成，导出扁平点号 key 文案对象（合并 `common` + `app` 域），文件标记 Auto-generated、禁止手动编辑 | MUST |

### 3.2 取词工具

| ID | 需求 | RFC 2119 |
|:---|------|:--------:|
| FR-004-104 | 本工程 MUST 提供 `utils/i18n.ts` 的 `t(key, args?)` 取词函数，按当前语言返回文案 | MUST |
| FR-004-105 | `t()` MUST 在未命中当前语料时先回退 zh-CN（事实源），再回退原 key，全程不抛异常、不影响主流程 | MUST |
| FR-004-106 | `t(key, args?)` MUST 支持 `{name}` 占位符插值，args 对象按名替换；参数缺失时保留原占位符 | MUST |
| FR-004-107 | 本工程 MUST 提供 `translateApiMessage(msg, args?)`，将后端 `R.msg`（i18n key）翻译为当前语言文案；msg 为空时返回空串 | MUST |

### 3.3 语言管理

| ID | 需求 | RFC 2119 |
|:---|------|:--------:|
| FR-004-108 | `getLocale()` MUST 优先读取本地存储 `language`，缺省回退 `wx.getSystemInfoSync().language` 并归一化为 `zh-CN` / `en-US` / `zh-TW` 之一 | MUST |
| FR-004-109 | `setLocale(lang)` MUST 将语言偏好持久化到本地存储（`STORAGE_KEYS.LANGUAGE`）并触发 tabBar 文案重写 | MUST |
| FR-004-110 | 语言切换 MUST 遵循「默认跟随系统，应用内可手动切换并本地持久化」 | MUST |

### 3.4 tabBar 与请求集成

| ID | 需求 | RFC 2119 |
|:---|------|:--------:|
| FR-004-111 | tabBar 文案 MUST 通过 `applyTabBarLocale()` 逐项调用 `wx.setTabBarItem` 运行时重写（个人中心 → `profile.title`、个人中心 → `auth.profile.title`） | MUST |
| FR-004-112 | `utils/request.ts` MUST 对后端 `R.msg`（i18n key）经 `translateApiMessage(msg)` 翻译后再 `showToast`；401 提示 `message.error.unauthorized`、网络异常提示 `message.error.network` | MUST |

---

## 4. 关键契约

### 4.1 语言标识与归一化

| 系统语言（`wx.getSystemInfoSync().language`） | 归一化结果 |
|------|------|
| `zh_CN`、`zh-Hans-CN`、其他 `zh*` | `zh-CN` |
| `zh_TW`、`zh-HK`、`zh-MO`、`zh-Hant*` | `zh-TW` |
| `en`、其他 `en*` | `en-US` |
| 其余语言 | `zh-CN`（兜底） |

### 4.2 语料落点

| 文件 | 生成方式 | 内容 |
|------|---------|------|
| `miniprogram/i18n/zh-CN.ts` | sync 生成 | 简体中文扁平对象（事实源） |
| `miniprogram/i18n/en-US.ts` | sync 生成 | 英文扁平对象 |
| `miniprogram/i18n/zh-TW.ts` | sync 生成 | 繁体中文扁平对象 |

### 4.3 后端 key 契约（引用父工程 §4.2）

| 场景 | R.msg | 参数 |
|------|-------|------|
| 失败提示 | `message.error.loginFailed` | 无 |
| 未授权 | `message.error.unauthorized` | 无 |

---

## 5. 验收场景

| 编号 | 场景 | Given | When | Then |
|:-----|------|-------|------|-----|
| AC-001 | 系统语言跟随 | 系统语言为简体中文、本地无 `language` 存储 | 启动小程序 | 界面显示简体中文 |
| AC-002 | 系统语言归一化 | 系统语言为英文 `en` | 启动小程序 | 界面显示英文 |
| AC-003 | 应用内切换 | 当前简体中文 | 切换语言为英文 | 界面与 tabBar 文案切换为英文 |
| AC-004 | 语言持久化 | 已切换为繁体中文 | 重启小程序 | 界面仍为繁体中文 |
| AC-005 | 后端 key 翻译 | 后端返回 `R.msg="message.error.loginFailed"` | 请求失败 | toast 显示当前语言对应文案 |
| AC-006 | 语料缺失兜底 | 语料无某 key | 翻译该 key | 显示原 key，不白屏 |
| AC-007 | 占位符插值 | `common.resendCountdown="{countdown}s 后重发"` | `t(key, {countdown: 45})` | 显示 `45s 后重发` |
| AC-008 | tabBar 文案切换 | 切换语言 | 重写 tabBar | 底部两项文案随之切换 |

---

## 6. 非功能需求

| ID | 需求 | RFC 2119 |
|:---|------|:--------:|
| NFR-004-001 | `t()` / `translateApiMessage()` MUST 不抛异常，语料缺失时回退原 key | MUST |
| NFR-004-002 | 语料文件 MUST UTF-8 编码 | MUST |
| NFR-004-003 | 取词函数 SHOULD 保持 O(1) 查询（扁平对象直接索引） | SHOULD |
| NFR-004-004 | 语言切换 SHOULD 无需重启小程序即时生效（页面 onShow 重取文案） | SHOULD |

---

## 7. 依赖

### 7.1 上游依赖

| 依赖 | 说明 |
|------|------|
| 父工程 `i18n/` | 语料事实源 + `sync-i18n.mjs` 生成脚本 + `verify-i18n.mjs` 校验脚本 |
| tpl-app-api | 后端 `R.msg` 返回 i18n key |

### 7.2 内部模块

| 依赖 | 说明 |
|------|------|
| 001-app-shell | `utils/request.ts`（HTTP 封装）、`config.ts`（`STORAGE_KEYS.LANGUAGE`）、`app.json`（tabBar 配置） |
| 002-user-auth | 注册/登录/个人中心页面文案迁移 |
| 101-profile | 个人中心页面文案迁移 |

---

## 8. 术语表

| 术语 | 英文 | 说明 |
|------|------|------|
| 语料 | Corpus / Messages | 多语言文案集合，扁平点号 key → 文案 |
| 事实源 | Source of Truth | 父工程 `i18n/` 目录，全产品线语料唯一维护点 |
| 归一化 | Normalize | 将系统语言映射为受支持的 locale |
| 插值 | Interpolation | 将 `{name}` 占位符替换为实际参数值 |
| 兜底 | Fallback | 语料未命中时回退 zh-CN 或原 key |
| 扁平点号 key | Flat Dotted Key | 如 `auth.login.title`，无嵌套对象 |
