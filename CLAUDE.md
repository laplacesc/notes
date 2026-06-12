# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## 项目概述

个人知识库与笔记网站，使用 VitePress + vitepress-theme-teek 构建，部署于 GitHub Pages。文章在 Obsidian 中编辑，通过 Obsidian Git 插件同步。当前由 Reasonix 驱动开发，使用 codegraph 做代码智能分析。

- **站点名称**: 不理之山の笔记
- **域名基址**: https://laplacesc.github.io/notes/
- **基础路径**: `/notes/`
- **语言**: zh-CN
- **包管理器**: pnpm（workspace 禁用 parcel 和 esbuild 构建）
- **Node**: ^24（CI 中指定）
- **代码智能**: codegraph（`.codegraph/` 目录，33 个文件已索引）

## 命令

```bash
pnpm docs:dev       # 启动本地开发服务器（热更新）
pnpm docs:build     # 构建生产版本 → docs/.vitepress/dist/
pnpm docs:preview   # 本地预览构建产物
```

> 项目无测试套件（纯内容站点）——更改后运行 `pnpm docs:build` 验证构建通过即可。

## 提交规范

使用 Conventional Commits 格式，scope 遵循中文/英文混写：

| 类型 | 示例 | 用途 |
|------|------|------|
| `docs` | `docs(文章):` | 文章内容变更 |
| `feat` | `feat(skill):` | 新功能 |
| `fix` | `fix(search):` | 修复 |
| `chore` | `chore(deps):` | 杂项（配置、依赖等） |
| `style` | `style(theme):` | 仅样式/格式变更 |

## 项目结构

```
docs/
├── 01.AI/                  # AI 分类笔记
│   └── 11.Claude Code/
├── 02.前端/                # 前端分类笔记
│   └── 21.VitePress/
├── 03.网络/                # 网络分类笔记
│   └── 30.Clash/
├── 04.后端/                # 后端分类笔记
│   └── 11.图表嵌入/
├── @fragment/              # 页面碎片（Git 备忘清单等）
├── @pages/                 # 系统页面（归档、分类、标签、关于）
│   ├── archivesPage.md     # 归档页
│   └── personalPage.md     # 关于页
├── .vitepress/
│   ├── config.ts           # VitePress 主配置（继承 teekConfig）
│   ├── teekConfig.ts       # Teek 主题配置（Banner、博主、文章封面、代码高亮等）
│   ├── teekConfig.template.ts  # Teek 完整配置参考模板
│   ├── theme/
│   │   ├── index.ts        # 主题入口，导入 Teek + 自定义样式/字体
│   │   ├── my-fonts.css    # 霞鹜文楷字体绑定
│   │   ├── styles/         # 自定义 SCSS 样式
│   │   └── components/     # 自定义 Vue 组件（404、CalendarCard 等）
│   └── dist/               # 构建产物（.gitignored）
├── public/
│   ├── site/               # 站点图片资源
│   └── wallpaper/          # 壁纸资源
├── index.md                # 首页（自定义 hero 样式 + Vue 脚本）
└── superpowers/            # 设计/计划文档（被 linter 忽略）
```

## 架构要点

### VitePress 配置分层
- `config.ts` 继承 `teekConfig`，定义站点元信息（title, base: "/notes/", lang: "zh-CN", nav, search: local, sitemap, editLink）
- `teekConfig.ts` 驱动博客特性：Banner 轮播/打字效果、博主卡片、文章分类/标签、首页卡片排序、文章分享、归档统计、代码块复制
- Teek 的 `autoFrontmatter` 插件自动为文章生成 permalink、categories、coverImg
- `vitepress-plugin-llms` 插件集成，生成 llms.txt

### 主题自定义
- 入口 `docs/.vitepress/theme/index.ts`：导入 Teek 全套样式 + 自定义组件（`TeekLayoutProvider` 包装布局）
- 字体：霞鹜文楷（`lxgw-wenkai-webfont`），通过 `my-fonts.css` 绑定到 `--vp-font-family-base` 和 `--vp-font-family-mono`
- 自定义样式：`styles/code-bg.scss`（代码块背景）、`styles/iframe.scss`（iframe 样式）
- 组件：`404.vue`、`CalendarCard.vue`、`ContributeChart.vue`、`TeekLayoutProvider.vue`

### 文章 frontmatter
通过 `autoFrontmatter` 插件自动补全 permalink、categories、coverImg。手动设置的常用字段：

```yaml
---
title: 文章标题
date: 2026-06-05 23:52:41
categories: [AI, Claude Code]
tags: [wsl, claude-code]
titleTag: 推荐        # 可选：文章标签角标
top: true             # 可选：置顶
sticky: 1             # 可选：排序优先级
description: 摘要
coverImg: URL         # 封面图（autoFrontmatter 可自动生成）
permalink: /pages/58be6f  # 永久链接（autoFrontmatter 可自动生成）
---
```

### Obsidian 集成
- 使用 Markdown 链接格式（`useMarkdownLinks: true`）
- 文章在 Obsidian 中编辑，通过 `obsidian-git` 插件推送到 GitHub
- 全局配置 `newLinkFormat: "relative"`，链接为相对路径
- 不启用 `readableLineLength`
- 图片上传：通过外部图床（`picx-images-hosting`）引用

### 部署
GitHub Actions (`.github/workflows/deploy.yml`)：
- 触发条件：`main` 分支推送
- 流程：pnpm install → pnpm docs:build → upload-pages-artifact → deploy-pages
- 产物路径：`docs/.vitepress/dist`

### 开发工具栈
- **Reasonix**：智能代理框架（`.reasonix/` 配置，skills-lock.json 管理已安装技能）
- **codegraph**：符号级代码智能（`.codegraph/`），优先用 codegraph 工具而非 grep 做代码搜索
- **Agency Orchestrator MCP**：多智能体工作流编排（`npx agency-orchestrator serve`），提供 6 个工具（compose_workflow、run_workflow、validate_workflow、plan_workflow、list_workflows、list_roles）
- **Obsidian 插件 agent-client**：会话持久化（sessions 目录 gitignored）
- **Claude Worktrees**：`.claude/worktrees/` 用于隔离功能开发

## Conventions

- **文件命名**：中文文件名，空格分隔（如 `WSL 使用 Claude Code 指南.md`）
- **frontmatter 日期**：格式 `YYYY-MM-DD HH:mm:ss`（24 小时制）
- **permalink**：统一用 `/pages/<hex>` 格式（autoFrontmatter 自动生成）
- **图片**：引用外部图床 URL，相对路径图片放 `public/site/` 或 `public/wallpaper/`
- **代码块**：行号开启，VitePress markdown 容器使用中文 label（提示/警告/危险/信息）
- **目录忽略**：`superpowers/` 目录被 srcExclude、autoFrontmatter、sidebar 等多处忽略
- **无测试** 本项目是内容站点，无测试文件 —— 用 `pnpm docs:build` 验证构建无误即可

## Notes

（可在此处添加快速备注）

<!-- superpowers-zh:begin (do not edit between these markers) -->
# Superpowers-ZH 中文增强版

本项目已安装 superpowers-zh 技能框架（20 个 skills）。

## 核心规则

1. **收到任务时，先检查是否有匹配的 skill** — 哪怕只有 1% 的可能性也要检查
2. **设计先于编码** — 收到功能需求时，先用 brainstorming skill 做需求分析
3. **测试先于实现** — 写代码前先写测试（TDD）
4. **验证先于完成** — 声称完成前必须运行验证命令

## 可用 Skills

Skills 位于 `.claude/skills/` 目录，每个 skill 有独立的 `SKILL.md` 文件。

- **brainstorming**: 在任何创造性工作之前必须使用此技能——创建功能、构建组件、添加功能或修改行为。在实现之前先探索用户意图、需求和设计。
- **chinese-code-review**: 中文 review 沟通参考——话术模板、分级标注（必须修复/建议修改/仅供参考）、国内团队常见反模式应对。仅在用户显式 /chinese-code-review 时调用，不要根据上下文自动触发。
- **chinese-commit-conventions**: 中文 commit 与 changelog 配置参考——Conventional Commits 中文适配、commitlint/husky/commitizen 中文模板、conventional-changelog 中文配置。仅在用户显式 /chinese-commit-conventions 时调用，不要根据上下文自动触发。
- **chinese-documentation**: 中文文档排版参考——中英文空格、全半角标点、术语保留、链接格式、中文文案排版指北约定。仅在用户显式 /chinese-documentation 时调用，不要根据上下文自动触发。
- **chinese-git-workflow**: 国内 Git 平台配置参考——Gitee、Coding.net、极狐 GitLab、CNB 的 SSH/HTTPS/凭据/CI 接入差异与镜像同步配置。仅在用户显式 /chinese-git-workflow 时调用，不要根据上下文自动触发。
- **dispatching-parallel-agents**: 当面对 2 个以上可以独立进行、无共享状态或顺序依赖的任务时使用
- **executing-plans**: 当你有一份书面实现计划需要在单独的会话中执行，并设有审查检查点时使用
- **finishing-a-development-branch**: 当实现完成、所有测试通过、需要决定如何集成工作时使用——通过提供合并、PR 或清理等结构化选项来引导开发工作的收尾
- **mcp-builder**: MCP 服务器构建方法论 — 系统化构建生产级 MCP 工具，让 AI 助手连接外部能力
- **receiving-code-review**: 收到代码审查反馈后、实施建议之前使用，尤其当反馈不明确或技术上有疑问时——需要技术严谨性和验证，而非敷衍附和或盲目执行
- **requesting-code-review**: 完成任务、实现重要功能或合并前使用，用于验证工作成果是否符合要求
- **subagent-driven-development**: 当在当前会话中执行包含独立任务的实现计划时使用
- **systematic-debugging**: 遇到任何 bug、测试失败或异常行为时使用，在提出修复方案之前执行
- **test-driven-development**: 在实现任何功能或修复 bug 时使用，在编写实现代码之前
- **using-git-worktrees**: 当需要开始与当前工作区隔离的功能开发，或在执行实现计划之前使用——通过原生工具或 git worktree 回退机制确保隔离工作区存在
- **using-superpowers**: 在开始任何对话时使用——确立如何查找和使用技能，要求在任何响应（包括澄清性问题）之前调用 Skill 工具
- **verification-before-completion**: 在宣称工作完成、已修复或测试通过之前使用，在提交或创建 PR 之前——必须运行验证命令并确认输出后才能声称成功；始终用证据支撑断言
- **workflow-runner**: 在 Claude Code / OpenClaw / Cursor 中直接运行 agency-orchestrator YAML 工作流——无需 API key，使用当前会话的 LLM 作为执行引擎。当用户提供 .yaml 工作流文件或要求多角色协作完成任务时触发。
- **writing-plans**: 当你有规格说明或需求用于多步骤任务时使用，在动手写代码之前
- **writing-skills**: 当创建新技能、编辑现有技能或在部署前验证技能是否有效时使用

## 如何使用

当任务匹配某个 skill 时，使用 `Skill` 工具加载对应 skill 并严格遵循其流程。绝不要用 Read 工具读取 SKILL.md 文件。

如果你认为哪怕只有 1% 的可能性某个 skill 适用于你正在做的事情，你必须调用该 skill 检查。
<!-- superpowers-zh:end -->
