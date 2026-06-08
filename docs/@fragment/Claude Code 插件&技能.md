---
title: Claude Code 插件 & 技能
date: 2026-06-08 08:00:00
categories:
  - AI
  - Claude Code
tags:
  - claude-code
  - plugins
  - tools
  - skills
description: >-
  Claude Code 常用插件与技能的安装配置指南，涵盖 CCometixLine（状态栏美化）、Agency
  Orchestrator（多智能体协作框架）、obsidian-skills、superpowers-zh 中文增强版、UI UX Pro
  Max 及 ACP 适配器等。
permalink: /pages/19d7f4
---

## CCometixLine — Claude Code 状态栏美化

> **项目地址：** <https://github.com/Haleclipse/CCometixLine>

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

**跨平台通用（推荐）**

```json
{
  "statusLine": {
    "type": "command",
    "command": "~/.claude/ccline/ccline",
    "padding": 0
  }
}
```

> **Windows 用户注意：** 从 Claude Code v2.1.47+ 开始，Windows 已支持 Unix 风格路径解析。`~` 符号会自动展开为用户主目录。**请勿使用 `%USERPROFILE%`**，该变量在 v2.1.47+ 中不再可靠。
>
> - 推荐写法：`~/.claude/ccline/ccline`（跨平台通用）
> - 备选方案：`"ccline"`（需 npm 全局安装）

**后备方案（npm 全局安装）**

```json
{
  "statusLine": {
    "type": "command",
    "command": "ccline",
    "padding": 0
  }
}
```

> 当 npm 全局安装已加入 PATH 环境变量时，可使用此配置。

### 更新

```shell
npm update -g @cometix/ccline
```

---

## Agency Orchestrator — 让 AI 角色库真正跑起来

> **项目地址：** <https://github.com/jnMetaCode/agency-agents-zh>

> **💡 一句话概括：** 编排多角色智能体工作流，让 AI 专家像真实团队一样自动协作，几分钟交付完整方案。
>
> [角色库](https://github.com/jnMetaCode/agency-agents-zh) 提供各领域专家角色，[Agency Orchestrator](https://github.com/jnMetaCode/agency-orchestrator) 负责将这些角色编排成 DAG（有向无环图）工作流并按序执行。

```shell
npm install -g agency-orchestrator
ao compose "帮我写一篇关于 AI Agent 的深度分析文章" --run
```

### CLI 命令

```shell
ao demo                              # 零配置体验多智能体协作
ao init                              # （可选）复制 211 个中文角色到本地以便编辑
ao init --lang en                    # （可选）复制 170+ 个英文角色到本地以便编辑
ao init --workflow                    # 交互式创建工作流
ao compose "一句话描述"                # AI 智能编排工作流
ao compose "一句话描述" --run          # 编排并立即执行
ao run <workflow.yaml> [选项]          # 执行工作流
ao validate <workflow.yaml>           # 校验（不执行）
ao plan <workflow.yaml>               # 查看执行计划（DAG）
ao explain <workflow.yaml>            # 用自然语言解释执行计划
ao roles                             # 列出所有角色
ao serve                             # 启动 MCP Server（供 Claude Code / Cursor 调用）
```

|参数|说明|
|---|---|
|`--input key=value`|传入输入变量|
|`--input key=@file`|从文件读取变量值|
|`--output dir`|输出目录（默认 `ao-output/`）|
|`--resume <dir\|last>`|从上次运行恢复（加载已完成步骤的输出）|
|`--from <step-id>`|配合 `--resume`，从指定步骤重新执行|
|`--feedback "意见"`|对话式返工：把修改意见交给 `--from` 指定的专家，让它带着「上一版产出 + 你的意见」在原稿基础上修改（不指定 `--resume` 时默认对上一次运行返工）|
|`--watch`|实时终端进度显示|
|`--quiet`|静默模式|

### MCP Server 模式

AI 编程工具（Claude Code、Cursor 等）可通过 MCP 协议直接调用工作流操作，无需手动集成：

```shell
ao serve              # 启动 MCP stdio 服务器
ao serve --verbose    # 带调试日志
```

配置 Claude Code（`settings.json`）：

> [!tip]
> CC-Switch（插件管理界面）中直接配置 `settings.json` 的 MCP Server 项可能不生效。改用 CC-Switch 右上角的「MCP 服务器管理」功能后成功生效。

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

配置 Cursor（`.cursor/mcp.json`）：

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

提供 6 个工具：`run_workflow`、`validate_workflow`、`list_workflows`、`plan_workflow`、`compose_workflow`、`list_roles`。

---

## obsidian-skills — Obsidian 的 AI 协作技能框架

> **项目地址：** <https://github.com/kepano/obsidian-skills>

在 Claude Code 中管理 Obsidian 笔记的技能框架——通过自然语言指令直接操作 vault，搜索、创建、修改笔记，并利用 Obsidian CLI 无缝集成插件、主题开发与调试。

### 通过 Claude Code 插件市场安装

```bash
/plugin marketplace add kepano/obsidian-skills
/plugin install obsidian@obsidian-skills
```

### 通过 npx 安装（备选）

适用于未启用插件市场或需手动管理技能的场景：

```bash
# 使用 SSH
npx skills add git@github.com:kepano/obsidian-skills.git

# 或使用 HTTPS
npx skills add https://github.com/kepano/obsidian-skills
```

---

## superpowers-zh（AI 编程超能力 · 中文增强版）

> **项目地址：** <https://github.com/jnMetaCode/superpowers-zh>

将 superpowers 框架本地化为中文，提供 20 个实用技能（brainstorming、TDD、代码审查、调试方法论等）。安装后 AI 助手将遵循设计先于编码、测试先于实现的开发规范。

### npm 安装

```shell
cd /your/project
npx superpowers-zh
```

> ⚠️ **重要：不要在主目录（`~`）下运行！** 早期版本会误将 skills 和 `CLAUDE.md` 等引导文件写入 home 目录，污染所有项目。v1.2.1 及以上版本已增加检测机制，会拒绝在老版本中执行。如已误装，可手动删除 `~/.claude/skills/` 下的相关文件清理。

---

## UI UX Pro Max — 专业 UI/UX 设计技能

> **项目地址：** <https://github.com/nextlevelbuilder/ui-ux-pro-max-skill>

### 通过 Claude Code 插件市场安装

在 Claude Code 中直接运行两条命令：

```bash
/plugin marketplace add nextlevelbuilder/ui-ux-pro-max-skill
/plugin install ui-ux-pro-max@ui-ux-pro-max-skill
```

### 通过 CLI 安装（推荐）

```shell
# 全局安装 CLI 工具
npm install -g uipro-cli

# 进入项目目录
cd /path/to/your/project

# 按需选择 AI 助手安装
uipro init --ai claude      # Claude Code
uipro init --ai cursor      # Cursor
uipro init --ai windsurf    # Windsurf
uipro init --ai antigravity # Antigravity
uipro init --ai copilot     # GitHub Copilot
uipro init --ai kiro        # Kiro
uipro init --ai codex       # Codex CLI
uipro init --ai qoder       # Qoder
uipro init --ai roocode     # Roo Code
uipro init --ai gemini      # Gemini CLI
uipro init --ai trae        # Trae
uipro init --ai opencode    # OpenCode
uipro init --ai continue    # Continue
uipro init --ai codebuddy   # CodeBuddy
uipro init --ai droid       # Droid (Factory)
uipro init --ai kilocode    # KiloCode
uipro init --ai warp        # Warp
uipro init --ai augment     # Augment
uipro init --ai all         # 安装到所有支持的 AI 助手
```

### 全局安装（对所有项目生效）

```shell
uipro init --ai claude --global   # 安装到 ~/.claude/skills/
uipro init --ai cursor --global   # 安装到 ~/.cursor/skills/
```

### 其他 CLI 命令

```shell
uipro versions              # 查看可用的版本列表
uipro update                # 更新到最新版本
uipro init --offline        # 跳过 GitHub 下载，使用本地缓存资源
uipro uninstall             # 卸载技能（自动检测平台）
uipro uninstall --ai claude # 卸载指定平台的技能
uipro uninstall --global    # 卸载全局安装的技能
```

## ACP Adapter — 在 Claude Code 中使用 Claude Agent SDK

> **项目地址：** <https://github.com/agentclientprotocol/claude-agent-acp>

ACP（Agent Client Protocol）适配器让 Claude Code 能够连接并使用基于 [Claude Agent SDK](https://github.com/agentclientprotocol/claude-agent-acp) 构建的 AI 智能体。

### 安装

```bash
# 全局安装适配器
npm install -g @agentclientprotocol/claude-agent-acp@latest
```

### 使用

安装后，Claude Code 可通过 ACP 协议连接并调用遵循 [Claude Agent SDK](https://github.com/agentclientprotocol/claude-agent-acp) 构建的远程或本地智能体，实现跨工具的智能体协作。

---

> **📝 持续更新** — 随着 Claude Code 生态的发展，本文档将持续收录更多实用插件与技能工具。
