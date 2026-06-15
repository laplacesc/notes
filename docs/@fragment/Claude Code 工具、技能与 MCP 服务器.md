---
title: Claude Code 工具、技能与 MCP 服务器
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
description: Claude Code 常用工具与技能的安装配置指南。分为四大类：Tools（CometixLine 状态栏）、Agent（Reasonix 编码代理、Hermes Agent 自我进化代理）、Skills（superpowers-zh、obsidian-skills、anthropics/skills、UI UX Pro Max）、MCP Servers（Agency Orchestrator、CodeGraph、Context7、Open-WebSearch）。
permalink: /pages/19d7f4
---

## 📦 安装合集

### 🛠️ Tools

```shell
npm install -g @cometix/ccline                                            # CometixLine 状态栏美化
```

### 🤖 Agent

```shell
npm install -g reasonix@next                                              # Reasonix（DeepSeek 原生 AI 编码代理）
curl -fsSL https://hermes-agent.nousresearch.com/install.sh | bash        # Hermes Agent（自我进化 AI 编码代理）
```

### 🧩 Skills

```shell
npx superpowers-zh                                                        # superpowers-zh（中文增强版 20 技能）
npx skills add kepano/obsidian-skills                                     # obsidian-skills
npx skills add anthropics/skills                                          # anthropics 官方技能仓库
npx uipro-cli init --ai claude                                            # UI UX Pro Max（161 推理规则 + 67 UI 样式）
```

### 🔌 MCP Servers

```shell
# 以下为 settings.json 中 mcpServers 的 command / args 值
npx agency-orchestrator serve                                             # Agency Orchestrator（6 工具）
npx @colbymchenry/codegraph serve --mcp                                   # CodeGraph（8 工具）
npx -y @upstash/context7-mcp                                              # Context7（2 工具）
npx -y open-websearch@latest                                              # Open-WebSearch（6 工具）
```

---

## 🛠️ Tools

### CometixLine — Claude Code 状态栏美化

> **项目地址：** <https://github.com/Haleclipse/CCometixLine>

Rust 编写的高性能 Claude Code 状态栏工具，在终端底部右侧显示美观的状态信息，支持 Git 集成、用量追踪、交互式 TUI 配置。

**主要特性：**

- **Git 集成**：显示当前分支及状态（新增/修改/冲突文件数）
- **工具调用跟踪**：实时显示工具调用次数、token 消耗、耗时
- **上下文窗口**：显示当前上下文占用百分比
- **主题系统**：内置多种主题，`ccline -c` 打开交互式 TUI 配置面板
- **Context Warning Disabler**：免除烦人的上下文警告
- 支持 Nerd Font 终端以获得最佳图标显示

**安装（全局）：**

```shell
npm install -g @cometix/ccline

# 或使用 yarn / pnpm
yarn global add @cometix/ccline
pnpm add -g @cometix/ccline

# 国内镜像源
npm install -g @cometix/ccline --registry https://registry.npmmirror.com
```

**集成 Claude Code（`settings.json`）：**

```json
{
  "statusLine": {
    "type": "command",
    "command": "~/.claude/ccline/ccline",
    "padding": 0
  }
}
```

> 若 npm 全局安装已加入 PATH，也可使用 `"command": "ccline"`。

**使用：**

```bash
ccline -c                # 打开交互式 TUI 配置面板
ccline --theme <name>    # 直接切换主题
```

> **前提条件：** Git 1.5+，推荐使用 Nerd Font 终端。

---

## 🤖 Agent

### Reasonix — DeepSeek 原生 AI 编码代理

> **项目地址：** <https://github.com/esengine/DeepSeek-Reasonix>

Go 重写的终端 AI 编码代理，专为 DeepSeek 模型打造，围绕 **prefix-cache 稳定性**设计以支持长时间运行。单 Go 二进制，配置驱动（reasonix.toml），插件式 MCP 子进程管理。

**主要特性：**

- **多模型支持**：DeepSeek flash / pro、MiMo 等
- **配置驱动**：`reasonix.toml` 集中管理所有配置
- **插件式 MCP**：通过子进程管理 MCP 服务器
- **单二进制分发**：Go 编译，部署简单
- **交互式 TUI**：`reasonix chat` 进入对话模式

**安装：**

```bash
npm install -g reasonix
# 或 Homebrew
brew install esengine/reasonix/reasonix
```

**快速开始：**

```bash
reasonix setup                      # 交互式配置向导 → ./reasonix.toml
export DEEPSEEK_API_KEY=sk-...
reasonix chat                       # 进入对话，/init 生成 AGENTS.md
reasonix run "把 main.go 里的 TODO 实现掉"
reasonix run --model mimo-pro "给这个函数补单元测试"
echo "解释这段代码" | reasonix run
```

---

### Hermes Agent — 自我进化的 AI 编码代理

> **项目地址：** <https://github.com/NousResearch/hermes-agent>
>
> **官网：** <https://hermes-agent.nousresearch.com>

NousResearch 出品，自我改进型 AI 编码代理。内置学习循环、技能自动创建、持久记忆、跨会话用户建模、MCP 集成、定时自动化、并行子代理等能力。支持 Claude Code、Codex CLI、OpenClaw 等多种 AI 编程工具集成。

**主要特性：**

- **自我进化**：内置学习循环，从每次交互中持续改进
- **技能自动创建**：自动从对话中提取并创建可复用技能
- **持久记忆**：跨会话记忆，用户建模与偏好学习
- **MCP 集成**：原生支持 MCP 服务器，扩展工具能力
- **定时自动化**：内置 cron 调度，支持定时任务与自动化工作流
- **并行子代理**：可同时调度多个子代理并行执行任务
- **多通道接入**：终端 TUI、Telegram/Discord/Slack/WhatsApp/Signal 网关
- **跨平台部署**：本地 / Docker / SSH / 无服务器（Daytona / Modal）

**安装：**

```bash
curl -fsSL https://hermes-agent.nousresearch.com/install.sh | bash
```

**快速开始：**

```bash
hermes              # 进入交互对话
hermes model        # 选择 LLM 模型
hermes setup        # 完整配置向导
hermes gateway      # 启动消息网关
```

---

## 🧩 Skills

### superpowers-zh（AI 编程超能力 · 中文增强版）

> **项目地址：** <https://github.com/jnMetaCode/superpowers-zh>

superpowers 完整汉化 + 6 个中国特色原创技能，支持 **18 款 AI 编程工具**（Claude Code、Cursor、Windsurf、Gemini CLI、Codex CLI、Copilot CLI、Hermes Agent、Kiro、Trae 等）。

**安装：**

```shell
cd /your/project
npx superpowers-zh
```

> [!warning] **不要在主目录（`~`）下运行！** 早期版本会误将 skills 和 `CLAUDE.md` 写入 home 目录。v1.2.1+ 已增加检测机制。

**包含的 20 个技能：**

| 来源 | 技能 | 作用 |
|------|------|------|
| 翻译自 upstream | `brainstorming` | 创造性工作前探索用户意图与设计 |
| 翻译自 upstream | `writing-plans` | 多步骤任务先写实现计划 |
| 翻译自 upstream | `executing-plans` | 在独立会话中按计划执行 |
| 翻译自 upstream | `test-driven-development` | 实现前先写测试 |
| 翻译自 upstream | `systematic-debugging` | 遇到 Bug 时系统化调试 |
| 翻译自 upstream | `requesting-code-review` | 完成任务后请求代码审查 |
| 翻译自 upstream | `receiving-code-review` | 审查反馈后严谨分析再实施 |
| 翻译自 upstream | `verification-before-completion` | 运行验证确认后再声称完成 |
| 翻译自 upstream | `dispatching-parallel-agents` | 同时执行 2+ 独立任务 |
| 翻译自 upstream | `subagent-driven-development` | 将独立任务分配给子智能体 |
| 翻译自 upstream | `using-git-worktrees` | 隔离工作区开发 |
| 翻译自 upstream | `finishing-a-development-branch` | 开发完成后的合并 / PR / 清理决策 |
| 翻译自 upstream | `writing-skills` | 创建 / 编辑 / 验证新技能 |
| 翻译自 upstream | `using-superpowers` | 对话起始时确立技能使用规则 |
| 中国特色 | `chinese-documentation` | 中文文档排版规范 |
| 中国特色 | `chinese-commit-conventions` | 中文 Commit 约定与 changelog 配置 |
| 中国特色 | `chinese-code-review` | 中文 Review 话术模板 |
| 中国特色 | `chinese-git-workflow` | 国内 Git 平台配置参考 |
| 中国特色 | `mcp-builder` | 系统化构建生产级 MCP 工具 |
| 中国特色 | `workflow-runner` | 在会话中运行 YAML 工作流 |

---

### obsidian-skills

> **项目地址：** <https://github.com/kepano/obsidian-skills>

Obsidian Agent Skills — 让 AI 助手直接操作 Obsidian vault，通过 Obsidian CLI 无缝集成插件、主题开发与调试。

**安装：**

```bash
npx skills add kepano/obsidian-skills
```

**5 个技能：**

| 技能 | 用途 |
|------|------|
| `obsidian-markdown` | 创建/编辑 Obsidian Flavored Markdown（wikilinks、embeds、callouts、properties） |
| `obsidian-bases` | 创建/编辑 Obsidian Bases（.base 文件，views、filters、formulas） |
| `json-canvas` | 创建/编辑 JSON Canvas（.canvas 文件，nodes、edges、groups） |
| `obsidian-cli` | 通过 Obsidian CLI 交互（含插件/主题开发与调试） |
| `defuddle` | 从网页提取纯净 Markdown，去除杂讯节省 token |

---

### anthropics/skills — Anthropic 官方技能仓库

> **项目地址：** <https://github.com/anthropics/skills>

Anthropic 官方维护的 Agent Skills 公开仓库，汇集各类经过验证的 AI 智能体技能。涵盖 MCP 构建、代码审查、调试、测试等多种开发场景。

**安装：**

```bash
npx skills add anthropics/skills
```

---

### UI UX Pro Max — 专业 UI/UX 设计技能

> **项目地址：** <https://github.com/nextlevelbuilder/ui-ux-pro-max-skill>

为 AI 编程助手注入设计智能的技能包，涵盖 **161 条推理规则** 与 **67 种 UI 样式**，帮助在多个平台和框架下构建专业用户界面。v2.0 新增 **智能设计系统生成器（Design System Generator）**，可分析项目需求并自动生成完整设计系统。

支持 Claude Code、Cursor、Copilot、Codex 等主流 AI 编码助手。

**安装：**

```shell
cd /path/to/your/project
npx uipro-cli init --ai claude      # Claude Code
```

---

## 🔌 MCP Servers

### Agency Orchestrator — 多智能体协作框架

> **项目地址：** <https://github.com/jnMetaCode/agency-orchestrator>

编排多角色智能体工作流，让 AI 专家像真实团队一样自动协作。**211+ 专业角色**，零代码 YAML 工作流，支持 **10 种 LLM**（其中 7 种免 API key）。

**MCP 配置（`settings.json`）：**

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

**6 个 MCP 工具：**

| 工具 | 用途 |
|------|------|
| `run_workflow` | 执行 YAML 工作流 |
| `validate_workflow` | 校验工作流 YAML |
| `list_workflows` | 列出所有可用工作流 |
| `plan_workflow` | 查看 DAG 执行计划 |
| `compose_workflow` | AI 智能编排工作流 |
| `list_roles` | 列出所有可用角色 |

---

### CodeGraph — 符号级代码智能图谱

> **项目地址：** <https://github.com/colbymchenry/codegraph>

预索引的代码知识图谱，100% 本地化。让 AI 编程助手用更少 token、更少工具调用理解任意代码库——相比传统方法节省约 **16% 成本**、**58% 工具调用次数**。支持 **20+ 语言**（TS/JS、Python、Go、Rust、Java、C#、PHP、Ruby、C/C++、Swift、Kotlin、Scala、Vue、Svelte 等）。

**安装：**

```shell
# macOS / Linux 一键安装
curl -fsSL https://codegraph.ai/install.sh | sh

# Windows PowerShell
powershell -c "irm https://codegraph.ai/install.ps1 | iex"
```

**MCP 手动配置（`settings.json`）：**

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

**初始化索引：**

```shell
codegraph install       # 自动配置 AI 编辑器 MCP
codegraph init -i       # 项目初始化并建立索引
codegraph update        # 代码变更后增量更新
```

**8 个 MCP 工具：**

| 工具 | 用途 |
|------|------|
| `codegraph_context` | 综合性查询：入口点 + 相关符号 + 关键代码一次返回 |
| `codegraph_search` | 按名称搜索符号（函数、类型、接口等） |
| `codegraph_callers` | 查看哪些地方调用了某个符号 |
| `codegraph_callees` | 查看某个符号调用了哪些其他符号 |
| `codegraph_impact` | 修改某个符号的影响分析 |
| `codegraph_node` | 获取单个符号的详细信息（含源码） |
| `codegraph_files` | 查看项目文件树及符号统计 |
| `codegraph_explore` | 批量查询多个相关符号的源码 |

---

### Context7 — AI 实时库文档上下文

> **项目地址：** <https://github.com/upstash/context7>

为 AI 编码助手提供最新、版本精准的库文档与代码示例，消除「幻觉」——让助手看到真实 API，而非训练数据的过时记忆。覆盖 **2000+ 库**（React、Next.js、Tailwind CSS、Prisma、tRPC 等）。

**快速安装（OAuth 自动配置）：**

```shell
npx ctx7 setup                          # 自动注册 MCP + 安装 Agent Skill
npx ctx7 setup --claude                 # 指定 Claude Code
npx ctx7 setup --cursor                 # 指定 Cursor
npx ctx7 setup --opencode               # 指定 OpenCode
```

**MCP 手动配置（`settings.json`，API Key 方式）：**

```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp"],
      "env": {
        "CONTEXT7_API_KEY": "YOUR_API_KEY"
      }
    }
  }
}
```

> API Key 从 [context7.com/dashboard](https://context7.com/dashboard) 获取，免费供个人使用。

**2 个 MCP 工具：**

| 工具 | 用途 |
|------|------|
| `resolve-library-id` | 将库名称解析为 Context7 库 ID |
| `query-docs` | 查询指定库的最新文档与代码示例 |

**常用命令：**

```shell
npx ctx7 library react                        # 搜索 React 相关文档库
npx ctx7 docs /facebook/react "useEffect"     # 查询指定文档
npx ctx7 login                                # 登录认证
npx ctx7 whoami                               # 查看当前认证用户
```

---

### Open-WebSearch — 免费多引擎网页搜索

> **项目地址：** <https://github.com/aas-ee/open-websearch>

开源免费的多引擎网页搜索 MCP 服务器，**无需 API Key**。纯 JavaScript 实现（Node.js，500+ stars）。

**MCP 配置（`settings.json`）：**

```json
{
  "mcpServers": {
    "web-search": {
      "command": "npx",
      "args": ["-y", "open-websearch@latest"],
      "env": {
        "MODE": "stdio",
        "DEFAULT_SEARCH_ENGINE": "bing",
        "ALLOWED_SEARCH_ENGINES": "bing,duckduckgo,baidu,sogou,brave,exa,csdn,juejin,startpage"
      }
    }
  }
}
```

> 如需代理访问受限搜索引擎，添加 `"USE_PROXY": "true"` 和 `"PROXY_URL": "http://127.0.0.1:7890"`。

**6 个 MCP 工具：**

| 工具 | 用途 |
|------|------|
| `search` | 多引擎联合网页搜索（指定引擎和返回条数） |
| `fetchWebContent` | 抓取任意公开 HTTP(S) 页面 / Markdown 内容 |
| `fetchCsdnArticle` | 抓取 CSDN 博客全文 |
| `fetchGithubReadme` | 抓取 GitHub 仓库 README |
| `fetchJuejinArticle` | 抓取掘金文章全文 |
| `fetchLinuxDoArticle` | 抓取 Linux.do 论坛文章 |

### 本地部署（Docker SSE 模式）

通过 Docker 部署 open-web-search 容器，以 SSE（Server-Sent Events）端点暴露 MCP 工具：

```shell
docker run -d --name web-search -p 3000:3000 \
  -e ENABLE_CORS=true \
  -e CORS_ORIGIN=* \
  ghcr.io/aas-ee/open-web-search:latest
```

**环境变量：**

| 变量 | 默认值 | 可选值 | 说明 |
|------|--------|--------|------|
| `ENABLE_CORS` | `false` | `true`, `false` | 启用 CORS |
| `CORS_ORIGIN` | `*` | 任意有效 origin | CORS 跨域来源 |
| `DEFAULT_SEARCH_ENGINE` | `bing` | `bing`, `duckduckgo`, `exa`, `brave`, `baidu`, `csdn`, `juejin`, `startpage`, `sogou` | 默认搜索引擎 |
| `USE_PROXY` | `false` | `true`, `false` | 启用 HTTP 代理 |
| `PROXY_URL` | `http://127.0.0.1:7890` | 任意有效 URL | 代理服务器地址 |
| `FAKE_IP_CIDRS` | 空 | 逗号分隔的 CIDR 列表 | 将指定 CIDR 内的 DNS 应答视为伪造 IP 结果，不拦截为私有网络 DNS |
| `PORT` | `3000` | `1-65535` | 服务端口 |

**Reasonix 插件配置**（`reasonix.toml`）：

```toml
[[plugins]]
name    = "web-search"
type    = "http"
url     = "http://localhost:3000/mcp"
```
