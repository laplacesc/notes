---
title: Claude Code 插件 & 技能 & 工具
date: 2026-06-08 08:00:00
categories:
  - AI
  - Claude Code
tags:
  - claude-code
  - plugins
  - tools
  - skills
titleTag: 推荐
top: true
sticky: 1
description: Claude Code 常用插件与技能的安装配置指南，涵盖 CometixLine（状态栏美化）、Agency Orchestrator（多智能体协作框架）、obsidian-skills、superpowers-zh 中文增强版、UI UX Pro Max、ACP 适配器及 anthropics 官方技能仓库。
permalink: /pages/19d7f4
---

## 📦 npm 全局安装合集

在项目目录中依次执行，快速安装所有 npm 全局工具：

```shell
# 全局安装
npm install -g @cometix/ccline                                          # CometixLine 状态栏美化
npm install -g agency-orchestrator                                       # Agency Orchestrator 多智能体协作
npm install -g @agentclientprotocol/claude-agent-acp@latest              # ACP Adapter
npm install -g uipro-cli && uipro init --ai claude                       # UI UX Pro Max
npm install -g reasonix                                                   # Reasonix（DeepSeek 原生 AI 编码代理）
npm install -g @colbymchenry/codegraph                                   # CodeGraph 代码智能图谱
```

## 🚀 npx 一键安装合集

在项目目录中依次执行，快速添加所有 npx 技能：

```shell
# 注意：以下命令需在项目根目录执行
npx superpowers-zh                                                        # superpowers-zh（中文增强版 20 技能）
npx skills add kepano/obsidian-skills                                     # obsidian-skills
npx skills add anthropics/skills                                          # anthropics 官方技能仓库
```

> [!tip] 部分工具先全局安装后再 npx/使用，参见下方各节详解。

---

## CometixLine — Claude Code 状态栏美化

> **项目地址：** <https://github.com/Haleclipse/CCometixLine>

在 Claude Code 底部状态栏右侧显示美观的提示信息，支持主题自定义和多种显示模式，让终端工作区更具个性。

### 快速安装（推荐）

通过 npm 全局安装（跨平台兼容）：

```shell
# 全局安装
npm install -g @cometix/ccline

# 或使用 yarn
yarn global add @cometix/ccline

# 或使用 pnpm
pnpm add -g @cometix/ccline
```

使用国内镜像源加速下载：

```shell
npm install -g @cometix/ccline --registry https://registry.npmmirror.com
```

安装后：

- ✅ 全局命令 `ccline` 可在任意目录使用
- ⚙️ 按下方指引配置以集成到 Claude Code
- 🎨 运行 `ccline -c` 打开配置面板，选择主题

### 集成 Claude Code

将以下配置添加到 Claude Code 的 `settings.json`：

**方案（npm 全局安装）**

```json
{
  "statusLine": {
    "type": "command",
    "command": "ccline",
    "padding": 0
  }
}
```

> [!tip] 当 npm 全局安装已加入 PATH 环境变量时，可使用此配置。

---

## Agency Orchestrator — 让 AI 角色库真正跑起来

> **项目地址：** <https://github.com/jnMetaCode/agency-agents-zh>

> **💡 一句话概括：** 编排多角色智能体工作流，让 AI 专家像真实团队一样自动协作，几分钟交付完整方案。
>
> [角色库](https://github.com/jnMetaCode/agency-agents-zh) 提供各领域专家角色，[Agency Orchestrator](https://github.com/jnMetaCode/agency-orchestrator) 负责将这些角色编排成 DAG（有向无环图）工作流并按序执行。

全局安装后即可快速体验：

```shell
npm install -g agency-orchestrator
ao compose "帮我写一篇关于 AI Agent 的深度分析文章" --run
```

### MCP Server 模式

配置 Claude Code（`settings.json`）：

```json
{
  "mcpServers": {
    "agency-orchestrator": {
      "command": "npx",
      "args": ["agency-orchestrator", "serve"]
    }
  }
}
```

若上述配置在 Windows 上报错，可使用如下配置

```json
{
  "mcpServers": {
    "agency-orchestrator": {
      "command": "cmd",
      "args": [
        "/c",
        "npx",
        "agency-orchestrator",
        "serve"
      ]
    }
  }
}
```

提供 6 个工具：`run_workflow`、`validate_workflow`、`list_workflows`、`plan_workflow`、`compose_workflow`、`list_roles`。

---

## obsidian-skills

> **项目地址：** <https://github.com/kepano/obsidian-skills>

在 Claude Code 中管理 Obsidian 笔记的技能框架——通过自然语言指令直接操作 vault，搜索、创建、修改笔记，并利用 Obsidian CLI 无缝集成插件、主题开发与调试。

该技能包提供以下能力：

- **笔记管理**：搜索、创建、打开、修改、重命名、删除笔记
- **内容操作**：读取/写入笔记内容，追加文本，替换文本块
- **Vault 元数据**：获取 vault 统计信息、文件树、标签列表、链接图
- **格式处理**：自动处理 Markdown 链接、frontmatter、wiki 链接
- **属性查询**：按 frontmatter 字段筛选笔记（如：找出标签为 `#todo` 的笔记）

### 通过 npx 安装（备选）

适用于未启用插件市场或需手动管理技能的场景：

```bash
npx skills add kepano/obsidian-skills
```

---

## superpowers-zh（AI 编程超能力 · 中文增强版）

> **项目地址：** <https://github.com/jnMetaCode/superpowers-zh>

将 superpowers 框架本地化为中文，提供 20 个实用技能。安装后 AI 助手将遵循设计先于编码、测试先于实现的开发规范。

**包含的 20 个技能：**

| 技能 | 作用 |
|------|------|
| `brainstorming` | 创造工作前探索用户意图、需求和设计 |
| `test-driven-development` | 在编写实现代码之前先写测试 |
| `writing-plans` | 有多步骤任务时先写实现计划 |
| `executing-plans` | 在独立会话中按计划执行 |
| `subagent-driven-development` | 将独立任务分配给子智能体 |
| `dispatching-parallel-agents` | 同时执行 2 个以上的独立任务 |
| `using-git-worktrees` | 使用隔离工作区进行开发 |
| `receiving-code-review` | 收到审查反馈后，严谨分析再实施 |
| `requesting-code-review` | 完成任务后请求代码审查 |
| `finishing-a-development-branch` | 开发完成后的合并/PR/清理决策 |
| `verification-before-completion` | 运行验证命令确认后再声称完成 |
| `systematic-debugging` | 遇到 Bug 时系统化调试 |
| `mcp-builder` | 系统化构建生产级 MCP 工具 |
| `writing-skills` | 创建/编辑/验证新技能 |
| `workflow-runner` | 在会话中直接运行 YAML 工作流 |
| `using-superpowers` | 对话起始时确立技能使用规则 |
| `chinese-documentation` | 中文文档排版规范 |
| `chinese-commit-conventions` | 中文 Commit 约定 |
| `chinese-code-review` | 中文 Review 话术模板 |
| `chinese-git-workflow` | 国内 Git 平台配置参考 |

### npm 安装

```shell
cd /your/project
npx superpowers-zh
```

> [!warning] **重要：不要在主目录（`~`）下运行！** 早期版本会误将 skills 和 `CLAUDE.md` 等引导文件写入 home 目录，污染所有项目。v1.2.1 及以上版本已增加检测机制，会拒绝在老版本中执行。如已误装，可手动删除 `~/.claude/skills/` 下的相关文件清理。

---

## UI UX Pro Max — 专业 UI/UX 设计技能

> **项目地址：** <https://github.com/nextlevelbuilder/ui-ux-pro-max-skill>

一款为 AI 编程助手注入设计智能的技能包，涵盖 **161 条推理规则** 与 **67 种 UI 样式**，帮助在多个平台和框架下构建专业的用户界面。v2.0 新增 **智能设计系统生成器（Design System Generator）**，能够分析项目需求并自动生成完整的设计系统。支持 Claude Code、Cursor、Copilot、Codex 等主流 AI 编码助手。

### 通过 CLI 安装（推荐）

```shell
# 全局安装 CLI 工具
npm install -g uipro-cli

# 进入项目目录
cd /path/to/your/project

# 按需选择 AI 助手安装
uipro init --ai claude      # Claude Code
```

## ACP Adapter — 跨平台 ACP 客户端适配器

> **项目地址：** <https://github.com/agentclientprotocol/claude-agent-acp>

通过 ACP（Agent Client Protocol）协议，让任何兼容 ACP 的客户端都能使用 Claude Agent SDK 的全部能力。核心功能包括：上下文 @- 提及、图片支持、工具调用（含权限请求）、Follow 模式、编辑审查、TODO 列表、交互式/后台终端、自定义 Slash 命令，以及客户端 MCP 服务器管理。

```bash
npm install -g @agentclientprotocol/claude-agent-acp@latest
```

## anthropics/skills — Anthropic 官方技能仓库

> **项目地址：** <https://github.com/anthropics/skills>

Anthropic 官方维护的 Agent Skills 公开仓库，汇集了各类经过验证的 AI 智能体技能。通过 `npx skills add` 命令即可将官方技能集成到 Claude Code 中，涵盖 MCP 构建、代码审查、调试、测试等多种开发场景。这是获取最新官方支持技能的推荐入口。

```bash
npx skills add anthropics/skills
```

## Reasonix — DeepSeek 原生 AI 编码代理

> **项目地址：** <https://github.com/esengine/DeepSeek-Reasonix>

一款专为 DeepSeek 模型打造的终端 AI 编码代理，围绕 **prefix-cache 稳定性**设计以支持长时间运行。v1.0 已用 Go 完全重写，提供更优的性能与稳定性。支持工具调用、TUI 终端交互、DeepSeek R1 模型原生集成。

```bash
npm install -g reasonix
reasonix init      # 在项目目录中初始化（首次配置后，可用 reasonix setup 交互式调整）
```

`reasonix init` 生成项目引导文件后，运行以下命令完成配置并开始使用：

### 快速开始

```bash
reasonix setup                      # 交互式配置向导 → ./reasonix.toml
export DEEPSEEK_API_KEY=sk-...  # 或写入 .env（见 .env.example）
reasonix chat                       # 然后在会话里运行 /init 生成 AGENTS.md（项目记忆）
reasonix run "把 main.go 里的 TODO 实现掉"
reasonix run --model mimo-pro "给这个函数补单元测试"
echo "解释这段代码" | reasonix run
```

---

## CodeGraph — 符号级代码智能图谱

> **项目地址：** <https://github.com/colbymchenry/codegraph>

> **💡 一句话概括：** 预索引的代码知识图谱，100% 本地化。让 AI 编程助手用更少 token、更少工具调用理解任意代码库——符号关系、调用链路、影响分析，一次查询即可获得。

CodeGraph 构建代码的预索引知识图谱，覆盖 **20+ 语言**（TS/JS、Python、Go、Rust、Java、C#、PHP、Ruby、C/C++、Swift、Kotlin、Scala、Dart、Svelte、Vue、Lua 等），提供 **8 个 MCP 工具**供 AI 助手使用。内部使用 Tree-sitter 进行 AST 解析，确保精确的符号定位。

### 安装

**方案一：Shell 一键安装（推荐）**

```shell
curl -fsSL https://codegraph.ai/install.sh | sh
```

**方案二：npm 全局安装**

```shell
npm install -g @colbymchenry/codegraph
```

**方案三：PowerShell（Windows）**

```powershell
powershell -c "irm https://codegraph.ai/install.ps1 | iex"
```

### 自动配置 MCP

安装后运行自动配置命令，CodeGraph 会自动检测并写入 Claude Code、Cursor、Copilot、Windsurf 等主流 AI 编码助手的 MCP 配置：

```shell
codegraph install
```

### 手动配置 MCP Server

若需手动添加，编辑 Claude Code 的 `settings.json`：

```json
{
  "mcpServers": {
    "codegraph": {
      "command": "npx",
      "args": ["@colbymchenry/codegraph", "serve", "--mcp"]
    }
  }
}
```

配置完成后运行 `codegraph init` 在项目目录创建索引。

### 8 个 MCP 工具

| 工具 | 用途 |
|------|------|
| `codegraph_search` | 快速符号搜索（函数、类型、变量等） |
| `codegraph_callers` | 查看哪些地方调用了某个符号 |
| `codegraph_callees` | 查看某个符号调用了哪些其他符号 |
| `codegraph_impact` | 修改某个符号的影响分析 |
| `codegraph_trace` | 追踪两个符号之间的完整调用路径 |
| `codegraph_node` | 获取单个符号的详细信息（含源码） |
| `codegraph_files` | 查看项目文件树及符号统计 |
| `codegraph_context` | 综合性查询：入口点 + 相关符号 + 关键代码一次返回 |

### 基准测试

> ⚡ 实际使用中相比传统方法节省约 **16% 成本**、**47% token 消耗**、**58% 工具调用次数**（基于随机黄金测试集）。

### 初始化索引

在项目根目录运行 `codegraph init` 建立代码索引。以后每次代码变更后运行 `codegraph update` 增量更新，保持图谱最新。
