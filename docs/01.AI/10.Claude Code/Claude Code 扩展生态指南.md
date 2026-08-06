---
title: Claude Code 扩展生态指南
date: 2026-08-06 08:00:00
tags:
  - claude-code
  - plugin
  - mcp
  - agent-skills
description: 梳理 Claude Code 的 marketplace、MCP、Agent Skills 与独立安装器，并介绍常用扩展的安装、验证、选型和安全边界。
permalink: /pages/8bec34
categories:
  - AI
  - Claude Code
---

> Claude Code 扩展不只有“插件”这一种形态。Marketplace、MCP、Agent Skills 与独立安装器解决的问题不同，也拥有不同的权限边界。本文先说明公共流程，再介绍七个常用扩展和五个 MCP，帮助你按需求选择最小组合。
>
> 本文信息核实于 **2026 年 8 月 6 日**。命令和项目入口可能变化，操作前请用本机 `claude plugin --help`、`claude mcp --help`、交互式会话中的 `/plugin` 与 `/mcp`，以及项目当前 README 再次复核。

## 先说结论

1. **添加 marketplace 只是注册来源，不会自动安装插件。** 注册后还要安装 manifest 声明的插件。
2. Marketplace 插件、MCP、Agent Skills 和独立安装器不可互换；一个项目也可能提供多个入口。
3. MCP 分为本地进程和远程服务。两者都会扩大数据访问面，“本地运行”也不等于没有权限风险。
4. 不要无差别安装。先明确需求，以 `local` scope 和最小工具集试用，验证后再扩大作用域。
5. 项目 README 没给最终用户安装步骤时，应如实保留资料缺口，不能把推导命令写成官方推荐。

## 认识四种扩展形态

### 原生 marketplace 插件

Marketplace 是 Claude Code 的插件目录。标准流程是：

```text
注册 marketplace → 查看 manifest 中的插件 → 安装插件 → 重启或新建会话 → 验证
```

来源 URL 可以被克隆，不代表仓库就是有效 marketplace。安装标识 `<plugin>@<marketplace>` 必须来自项目 manifest 或 `/plugin`，不能根据仓库名猜测。

### MCP 服务

[MCP（Model Context Protocol）](https://modelcontextprotocol.io/) 把浏览器、文档检索、网络搜索和代码索引等工具连接到 Claude Code。本地 `stdio` 服务会以当前用户权限启动进程；远程 HTTP 服务会收到查询、URL 或相关上下文。

Marketplace 管理插件包，MCP 管理工具连接。若同一项目同时提供插件与 MCP，通常只选择一种入口，避免工具重复注册。

### Agent Skills

Agent Skills 通常由 `SKILL.md`、参考资料和脚本组成，为 Claude Code 提供某个领域的操作方法。Skill 可以由 marketplace 管理，也可以放在项目约定目录中；“符合 Agent Skills 规范”不等于“可以把仓库当作 marketplace”。

### 独立 CLI 或安装脚本

独立安装器可能写入 skills、agents、commands、hooks、配置、符号链接或运行时文件。执行前应审查目标路径、覆盖行为、依赖、卸载方式和权限范围；团队环境还应固定已审查版本并记录回滚步骤。

## 前置检查

先确认基础命令可用：

```bash
claude --version
claude plugin --help
claude plugin marketplace --help
claude mcp --help
claude mcp add --help
git --version
node --version
```

没有适用于所有项目的统一 Node.js 最低版本：`openai/codex-plugin-cc` 要求 Node.js 18.18 或更高，Chrome DevTools MCP 要求 Node.js LTS，Tavily 本地服务要求 Node.js v20 或更高，UI UX Pro Max 的搜索脚本要求 Python 3。以每个项目的当前 README 为准。

在公司仓库、生产后台、日常浏览器 profile 或敏感源码环境中使用扩展前，还要确认组织是否允许第三方进程、网络请求、浏览器控制、源码索引、Hook 和密钥访问。

## Claude Code marketplace 与插件

### 作用域与标准流程

Claude Code 的 marketplace 和插件命令支持 `local`、`project` 与 `user` scope：

| Scope | 范围 | 适用场景 |
|---|---|---|
| `local` | 当前用户、当前项目，不共享 | 首次试用第三方扩展的首选 |
| `project` | 当前项目，可随项目配置共享 | 团队已审查来源与配置后使用 |
| `user` | 当前用户的全部项目 | 确实需要跨项目使用的个人工具 |

以下占位符都必须替换为项目 README、manifest 或 `/plugin` 显示的实际值：

```bash
claude plugin marketplace add <source> --scope local
claude plugin install <plugin>@<marketplace> --scope local
```

在交互式会话运行 `/plugin`，可浏览 marketplace、确认真实插件标识并检查安装状态。安装后按 README 要求重启 Claude Code 或新建会话，再用一个非敏感、可回滚的最小任务验证。

### 七个常用扩展

下面的命令均在 **2026 年 8 月 6 日**重新对照了项目当前 README。按需选择，不要整组安装。

#### Chrome DevTools MCP

项目地址：[Chrome DevTools MCP](https://github.com/ChromeDevTools/chrome-devtools-mcp)

- **定位与场景**：提供页面自动化、控制台、网络和性能分析，适合复现前端问题与检查页面行为。
- **官方 Claude Code 入口**：README 同时提供 MCP-only 与“插件（MCP + Skills）”入口。插件流程为：

  ```text
  /plugin marketplace add ChromeDevTools/chrome-devtools-mcp
  /plugin install chrome-devtools-mcp@chrome-devtools-plugins
  ```

- **前置与验证**：需要 Node.js LTS 和可用的 Chrome。重启后用 `/skills` 和 `/mcp` 检查，再在无敏感登录态页面执行最小操作。
- **安全边界**：它可看到页面内容、控制台、请求与性能数据。若已配置旧 MCP，先确认并移除重复入口；首次使用不要连接包含敏感会话的浏览器环境。

#### Matt Pocock Skills 简体中文本地化

项目地址：[mattpocock-skills-zh-CN](https://github.com/vinvcn/mattpocock-skills-zh-CN)

- **定位与场景**：提供 Matt Pocock Agent Skills 的简体中文本地化版本，适合按结构化方法处理其覆盖的前端和 TypeScript 任务。
- **官方 Claude Code 入口**：

  ```text
  /plugin marketplace add vinvcn/mattpocock-skills-zh-CN
  /plugin install mattpocock-skills@mattpocock
  ```

- **验证**：新建会话，确认相关 Skill 可见，并用一个小型示例检查触发方式。
- **安全边界**：安装前审查 `SKILL.md` 和附属脚本；注意这是 `vinvcn` 的本地化仓库，更新时复核与上游及本地修改的差异。

#### Obsidian Skills

项目地址：[Obsidian Skills](https://github.com/kepano/obsidian-skills)

- **定位与场景**：提供 Obsidian CLI、Markdown、Bases 与 JSON Canvas 等领域技能，适合维护 Vault 和生成 Obsidian 格式内容。
- **官方 Claude Code 入口**：

  ```text
  /plugin marketplace add kepano/obsidian-skills
  /plugin install obsidian@obsidian-skills
  ```

  README 也允许把仓库内容放到 Vault 根目录的 `.claude` 中；两种方式按团队的更新与版本管理需求选择其一。
- **验证**：在测试 Vault 中新建会话，先生成一个可丢弃的 Markdown 文件，确认语法和写入位置。
- **安全边界**：重要 Vault 先备份，并把可写范围限制在明确目录；审查 Skill 是否会调用 Obsidian CLI 或修改现有文件。

#### Codex Plugin for Claude Code

项目地址：[openai/codex-plugin-cc](https://github.com/openai/codex-plugin-cc)

- **定位与场景**：这是供 Claude Code 使用的插件，通过本机 Codex CLI 和 app server 提供代码审查、对抗性审查、任务委派与会话转移；它不是 Codex 端插件市场。
- **前置条件**：需要 Node.js 18.18 或更高、支持 app server 的本机 Codex CLI，以及 ChatGPT 订阅（包括 Free）或 OpenAI API Key。插件复用现有 Codex 登录状态。若 CLI 缺失且 npm 可用，`/codex:setup` 会请求确认；确认后直接执行全局安装并重新检查。若 CLI 已安装但未登录，则提示在 Claude Code 中运行 `!codex login`。也可手工安装：

  ```bash
  npm install -g @openai/codex
  ```

  官方资料未声明 Claude Code 或 Codex CLI 的精确最低版本，因此应让 `/codex:setup` 实际检查 app server 能力。
- **官方 Claude Code 入口**：以下命令在 Claude Code 会话中逐条运行：

  ```text
  /plugin marketplace add openai/codex-plugin-cc
  /plugin install codex@openai-codex
  /reload-plugins
  /codex:setup
  ```

- **最小验证**：确认相关 slash command 和 `/agents` 中的 `codex:codex-rescue` 可见，再在可丢弃的小型仓库执行：

  ```text
  /codex:review --background
  /codex:status
  /codex:result
  ```

- **安全与成本边界**：review 与 adversarial review 使用只读 sandbox；rescue/委派对非明确只读任务默认可写工作区。相关线程的默认 `approvalPolicy` 为 `"never"`，即不会在执行途中请求批准，不应把它理解成额外的安全确认。插件继承本机环境和 Codex 配置，可保存工作区级任务状态，并注册 SessionStart、SessionEnd 与 Stop Hook：SessionStart 只把当前 transcript 路径等写入会话环境，不会自动导入内容；只有显式运行 `/codex:transfer` 才会把 Claude Code 会话记录导入 Codex；SessionEnd 会终止并清理当前 Claude 会话关联的任务。启用 review gate 后，Stop Hook 才会执行阻断式审查，并可能形成长时间循环。调用会计入 Codex 使用额度，官方未给插件另列价格或 token 表，因此首次使用只做只读审查，不默认启用 review gate，也不要在敏感仓库直接运行可写委派。

#### oh-my-claudecode

项目地址：[oh-my-claudecode](https://github.com/Yeachan-Heo/oh-my-claudecode)

- **定位与场景**：Claude Code-first 多代理编排层，提供工作流、角色代理、Hook 与持久状态，适合基础链路已经稳定的长任务。
- **官方推荐入口**：README 推荐 marketplace/plugin，并要求两条命令逐条输入：

  ```text
  /plugin marketplace add https://github.com/Yeachan-Heo/oh-my-claudecode
  /plugin install oh-my-claudecode
  ```

  随后在会话中运行 `/setup` 或 `/omc-setup`。若选择 npm CLI/runtime 路径，当前包名仍是 `oh-my-claude-sisyphus`，不能根据仓库名猜包名。
- **验证**：新建会话，确认 setup 生成位置和最小工作流可用，并记录停止方式与状态目录。
- **安全边界**：它会增加 Agent、Hook、Shell、状态和模型调用。建议最后安装、逐项授权、限定预算和停止条件，不要仅因安装成功就开启全部自动化模式。

#### UI UX Pro Max Skill

项目地址：[UI UX Pro Max Skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill)

- **定位与场景**：提供 UI/UX 设计知识、设计系统和界面实现建议，适合页面设计与交互评审。
- **官方 Claude Code 入口**：可用 marketplace：

  ```text
  /plugin marketplace add nextlevelbuilder/ui-ux-pro-max-skill
  /plugin install ui-ux-pro-max@ui-ux-pro-max-skill
  ```

  也可用当前维护的 CLI：

  ```bash
  npm install -g ui-ux-pro-max-cli
  uipro init --ai claude
  ```

- **前置与验证**：搜索脚本需要 Python 3。安装后运行 `python3 --version`，再用一个设计查询验证 Skill 和脚本路径。
- **安全边界**：CLI 会向项目写入 Skill 文件；执行前检查目标路径和覆盖行为。旧包 `uipro-cli` 已过时，不应用于当前资源。

#### Understand Anything

项目地址：[Understand Anything](https://github.com/Egonex-AI/Understand-Anything)

- **定位与场景**：使用多代理流程分析项目，生成代码知识图谱和交互式 Dashboard，适合接手陌生代码库。
- **官方 Claude Code 入口**：

  ```text
  /plugin marketplace add Egonex-AI/Understand-Anything
  /plugin install understand-anything
  ```

- **验证**：重启 Claude Code，在可公开或脱敏的小型项目中执行最小分析，检查生成位置、忽略规则和 Dashboard。
- **安全边界**：分析会读取大量源码并生成本地可视化资料。运行前确认敏感源码边界、输出目录、Git 忽略规则、资源消耗和卸载方式。

## Claude Code MCP 统一管理

### 传输方式

- **`stdio`**：Claude Code 启动本地命令，通过标准输入输出通信。适合 npm 包或本地二进制。
- **HTTP**：Claude Code 连接远程 MCP 端点；当前新配置的推荐远程传输。认证可使用 OAuth 或服务官方支持的 header。
- **SSE**：Claude Code 仍可识别，但官方已标记为 deprecated；新指南不推荐用它创建服务。

本地 `stdio` 示例中，`--` 将 Claude Code 参数与服务端命令分开：

```bash
claude mcp add --scope local <name> -- <command> [args...]
claude mcp add --scope local --env API_KEY=<YOUR_API_KEY> <name> -- <command> [args...]
```

远程 HTTP 示例：

```bash
claude mcp add --transport http --scope local <name> <url>
claude mcp add --transport http --scope local <name> <url> \
  --header "Authorization: Bearer <YOUR_TOKEN>"
```

`<name>`、`<command>`、`<url>`、`<YOUR_API_KEY>` 与 `<YOUR_TOKEN>` 都必须替换；不要把真实密钥写进可提交配置。具体服务只使用其官方支持的认证机制，不能随意互换环境变量、URL 参数和 header。

### 作用域、审批与管理

| Scope | 范围与共享 | 建议 |
|---|---|---|
| `local` | 当前用户、当前项目，不共享；也是当前默认值 | 首次试用首选 |
| `project` | 写入可共享的 `.mcp.json` | 只提交无明文密钥且经团队审查的配置 |
| `user` | 当前用户全部项目 | 只用于确实通用的服务 |

项目级服务首次使用前需要批准；如需重新做选择，可运行 `claude mcp reset-project-choices`。常用管理命令：

```bash
claude mcp list
claude mcp get <name>
claude mcp remove <name>
claude mcp remove --scope <scope> <name>
```

`<name>` 和 `<scope>` 必须替换。当前版本的 `list` 与 `get` 会对已批准服务执行健康检查，可能启动本地进程或连接远端，并非单纯静态查看；待批准的项目服务不会连接。交互式会话中运行 `/mcp`，可以查看状态、工具和认证入口。

当前 Claude Code 还提供 `claude mcp login <name>` 与 `logout`；官方 CLI 参考注明 `login` 需要 2.1.186 或更高版本。为兼容版本差异，优先按服务 README 和 `/mcp` 完成认证，并用本机 `claude mcp --help` 复核。

## 五个 MCP 专题

### Browser MCP

项目地址：[BrowserMCP](https://github.com/BrowserMCP/mcp)

- **定位与场景**：由 MCP Server 与 Chrome 扩展组成，让 Claude Code 操作用户当前浏览器，复用现有 profile 与登录会话；适合必须在已有会话中完成的网页操作。
- **前置条件**：需要配套 Chrome 扩展和 MCP Server，但当前官方 README 未给出可核验的扩展安装/配对步骤、Chrome Web Store 链接、版本要求或 Claude Code 专用命令。
- **安装资料边界**：当前 npm 包元数据可确认服务包为 `@browsermcp/mcp`，但 README 没有最终用户的 `npx` 安装说明，而且仓库依赖开发 monorepo 的内部包，不适合建议 clone 后独立构建。因此本文不把根据包名推导出的命令包装成官方推荐；请先核对项目 README 或可访问的官方文档，确认完整的扩展安装与配对流程后再配置。
- **最小验证**：完成官方流程后运行：

  ```bash
  claude mcp list
  claude mcp get browsermcp
  ```

  再在 `/mcp` 确认连接与工具数量，只在无敏感数据页面执行一个最小操作。
- **安全边界**：复用现有 profile 等同于获得对应网站账户的操作能力。项目声明自动化在本机完成、浏览器活动不发送到远程服务器，但这不是独立安全审计；页面内容仍可能提示注入。不要在邮箱、支付、生产后台或凭据管理器页面首次验证。

### CodeGraph

项目地址：[CodeGraph](https://github.com/colbymchenry/codegraph)

- **定位与场景**：本地提取符号、调用、导入、继承和影响范围，通过 MCP 提供结构化代码查询，适合大型或陌生项目。
- **前置条件**：支持 macOS、Linux、Windows 的 x64/arm64。官方独立安装器不要求预装 Node.js；README 未说明 npm 安装路径的最低 Node.js 版本。
- **官方安装与 Claude Code 配置**：任选一个官方 CLI 安装入口：

  ```bash
  # macOS / Linux
  curl -fsSL https://raw.githubusercontent.com/colbymchenry/codegraph/main/install.sh | sh

  # npm
  npm i -g @colbymchenry/codegraph
  ```

  Windows PowerShell 的官方入口为：

  ```powershell
  irm https://raw.githubusercontent.com/colbymchenry/codegraph/main/install.ps1 | iex
  ```

  然后使用 README 推荐的自动配置：

  ```bash
  codegraph install --target=claude --yes
  ```

- **每项目初始化**：把下面路径替换为待分析项目的绝对路径：

  ```bash
  codegraph init /absolute/path/to/your-project
  ```

  该命令创建 `.codegraph/`，数据库位于 `.codegraph/codegraph.db`。
- **最小验证**：

  ```bash
  cd /absolute/path/to/your-project
  codegraph status
  claude mcp list
  claude mcp get codegraph
  ```

  重启 Claude Code，在 `/mcp` 确认连接；README 默认公开 `codegraph_explore`，其他工具需要通过 `CODEGRAPH_MCP_TOOLS` 显式启用。
- **安全边界**：索引在本地保存不代表源码不会进入会话；MCP 查询会把相关源码片段返回 Claude Code。README 声明匿名遥测不收集代码、路径、文件名、符号名、查询或 IP，可用 `codegraph telemetry off` 关闭。不要默认添加全量自动允许规则，先逐次审查工具授权。

### Context7

项目地址：[Context7](https://github.com/upstash/context7)

- **定位与场景**：向 Claude Code 提供第三方库的当前文档和示例，适合核对框架、SDK、API、CLI 与云服务用法。
- **前置与认证**：API Key 可提高 rate limit，并支持私有仓库能力。以下 `<YOUR_CONTEXT7_API_KEY>` 必须替换；密钥不要写入共享或版本控制配置。
- **官方本地 `stdio` 入口**：Context7 README 原命令使用 `user` scope。下例改成 `local` 是本文为首次试用采用的 Claude Code 作用域选择：

  ```bash
  claude mcp add --scope local context7 -- \
    npx -y @upstash/context7-mcp --api-key <YOUR_CONTEXT7_API_KEY>
  ```

  也可通过本地环境变量 `CONTEXT7_API_KEY` 注入密钥并省略 `--api-key`。
- **官方远程 HTTP 入口**：同样将 README 的 `user` scope 收窄为首次试用的 `local`：

  ```bash
  claude mcp add --scope local \
    --header "Authorization: Bearer <YOUR_CONTEXT7_API_KEY>" \
    --transport http context7 https://mcp.context7.com/mcp
  ```

  OAuth 只适用于远程 HTTP，端点为 `https://mcp.context7.com/mcp/oauth`；本地 `stdio` 需要 API Key。
- **最小验证**：运行 `claude mcp list`、`claude mcp get context7`，再在 `/mcp` 确认工具可见，用公开库执行一次文档查询。
- **安全与资料边界**：远程服务会收到库查询；使用私有仓库能力时要额外审查发送内容。官方还提醒第三方库文档不保证完全准确、完整或安全，生成建议仍需核对。本节只介绍 MCP，不把其他交付形态混入安装流程。

### Exa MCP Server

项目地址：[Exa MCP Server](https://github.com/exa-labs/exa-mcp-server)

- **定位与场景**：提供网络搜索与网页内容抓取，适合查找公开资料和获取目标 URL 内容。
- **官方推荐入口**：README 给出的 Claude Code hosted HTTP 命令未写 scope，按当前 Claude Code 默认使用 `local`。本文显式写出该默认值：

  ```bash
  claude mcp add --transport http --scope local exa https://mcp.exa.ai/mcp
  ```

- **工具边界**：默认启用 `web_search_exa` 与 `web_fetch_exa`；`web_search_advanced_exa` 默认关闭。若确有需要，可通过 `tools` 查询参数选择工具。不要默认开启更宽的 `agent_tools`；它包含 `agent_run`，并需要 OAuth 或 API Key。
- **最小验证**：运行 `claude mcp list`、`claude mcp get exa`，在 `/mcp` 查看实际工具，再执行一次不含敏感内容的公开搜索或抓取。
- **安全与资料边界**：远程 Exa 会收到搜索词、URL 和相关上下文。若需要认证，优先使用项目提供的 OAuth 流程或本地环境变量方案；把密钥放入 URL 可能暴露于 shell 历史、配置和日志。README 未给出固定配额、价格或 rate limit 数字，使用前应在账户后台核对当前政策。

### Tavily MCP

项目地址：[Tavily MCP](https://github.com/tavily-ai/tavily-mcp)

- **定位与场景**：提供搜索、提取、网站 map 与 crawl 能力，适合公开网络研究和结构化抓取。
- **官方远程 OAuth 入口**：

  ```bash
  claude mcp add --transport http --scope local tavily https://mcp.tavily.com/mcp
  ```

  启动 Claude Code 后，在 `/mcp` 选择 Tavily 完成认证。`--scope local` 是本文显式写出的 Claude Code 默认作用域。
- **API Key 与本地入口**：README 也支持 `Authorization: Bearer <YOUR_TAVILY_API_KEY>` header。其本地 NPX 服务要求 Node.js v20 或更高，启动器为 `npx -y tavily-mcp@latest`；但 README 的本地客户端清单没有给 Claude Code 专用命令。若将官方通用 MCP JSON 转换为 Claude Code 语法，下面明确属于**通用语法组合示例**，不是 Tavily README 的 Claude Code 原命令：

  ```bash
  claude mcp add --scope local \
    --env TAVILY_API_KEY=<YOUR_TAVILY_API_KEY> \
    tavily -- npx -y tavily-mcp@latest
  ```

  `<YOUR_TAVILY_API_KEY>` 必须替换，且不得提交真实值。
- **可选参数**：`DEFAULT_PARAMETERS` 可为 `tavily-search` 设置非敏感默认 JSON。可选 `TAVILY_HUMAN_ID` 应使用不透明内部 ID，不使用邮箱等直接个人信息。
- **最小验证**：本地路径先运行 `node --version` 确认 v20+；再运行 `claude mcp list`、`claude mcp get tavily`，在 `/mcp` 完成认证并执行一次公开查询。
- **安全与资料边界**：Tavily 会收到查询、目标 URL、抓取内容和可选用户标识。`@latest` 是浮动标签，团队需要可复现时应固定已审查版本。README 未提供固定配额、计费或 rate limit 数字，应以账户当前信息为准。

## 快速选型

| 需求 | 优先考虑 | 入口 | 主要权限面 |
|---|---|---|---|
| 查询第三方库当前文档 | Context7 | MCP | 查询内容、可选私有仓库 |
| 搜索与抓取公开网页 | Exa 或 Tavily | 远程 MCP | 查询、URL、抓取内容 |
| 分析项目调用链和影响范围 | CodeGraph | 本地 CLI + MCP | 源码读取、本地索引、会话片段 |
| 复用现有登录会话自动化网页 | Browser MCP | 浏览器扩展 + MCP | 当前浏览器 profile 与账户 |
| 调试页面、网络和性能 | Chrome DevTools MCP | 插件或 MCP | Chrome、页面、请求和控制台 |
| 使用中文前端工作方法 | Matt Pocock Skills 中文版 | 插件 | Skill 脚本与项目上下文 |
| 编辑 Obsidian 内容 | Obsidian Skills | 插件或 Vault 配置 | Vault 文件与可选 Obsidian CLI |
| UI/UX 设计与设计系统 | UI UX Pro Max | 插件或 CLI | 项目 Skill 文件、Python 脚本 |
| 生成项目知识图谱与 Dashboard | Understand Anything | 插件 | 大量源码与生成资料 |
| 用本机 Codex 审查或接手 Claude Code 任务 | Codex Plugin for Claude Code | 插件 + 本地 Codex CLI | 源码、会话转移、可写委派、Codex 额度 |
| 多代理工作流与持久状态 | oh-my-claudecode | 插件或 CLI/runtime | Agent、Hook、Shell、状态、模型调用 |

Browser MCP 强项是复用现有浏览器 profile；Chrome DevTools MCP 强项是开发者工具调试、网络与性能分析。两者权限面重叠但目标不同，不应默认同时安装。

### 推荐安装顺序

1. **先稳定 Claude Code 本身**：确认版本、认证、基本工具授权和项目读写正常。
2. **先选一个低耦合能力**：例如 Context7 或只读公开搜索，验证 MCP 注册、认证和调用链路。
3. **再增加项目上下文能力**：需要调用链时启用 CodeGraph，需要领域方法时选择一个 Skill。
4. **谨慎加入浏览器或大范围源码分析**：单独验证 Browser MCP、Chrome DevTools MCP 或 Understand Anything 的访问边界。
5. **最后安装编排或跨模型委派层**：基础链路稳定后再加入 oh-my-claudecode 或 Codex Plugin for Claude Code。两者不要因功能重叠而默认同时启用；分别设置预算、停止条件、写权限与回滚方法。

## 安装后的统一验证清单

### 原生插件

- `/plugin` 中 marketplace 与插件标识和 manifest 一致。
- 重启或新建会话后，命令、Skill、Hook 或 MCP 可见。
- 只用一个非敏感、可回滚的最小任务验证。

### MCP

- `claude mcp get <name>` 与 `/mcp` 显示预期服务和工具；`<name>` 已替换。
- 本地进程能启动，远程端点认证成功，没有同名或重复工具。
- 实际工具集、作用域、项目审批和密钥位置符合预期。
- 首次调用不包含敏感源码、内部域名、账户数据或生产操作。

### Agent Skills

- `SKILL.md` 和附属脚本完整，位于 Claude Code 会扫描的位置。
- 新会话能按 README 的触发方式发现 Skill。
- 更新没有覆盖本地自定义内容，也没有扩大脚本权限。

### CLI 与安装脚本

- 可执行文件在 `PATH` 中，版本和运行时要求满足。
- 新增目录、配置、符号链接和 Hook 符合预期。
- 已记录升级、卸载和回滚方式。

## 常见问题

### 添加 marketplace 后为什么没有新命令？

注册 marketplace 不等于安装插件。先在 `/plugin` 查看 manifest 声明的标识，再安装目标插件并重启或新建会话。

### 为什么仓库不是有效 marketplace？

它可能只提供 MCP、Skills 或安装脚本，也可能没有 Claude Code marketplace manifest。不要因为 URL 可以克隆就认定它是市场；以项目 README 和 `/plugin` 为准。

### `local`、`project` 和 `user` 应该选哪个？

第三方扩展首次试用优先 `local`。团队需要共享且已审查配置时选择 `project`；只有确实跨项目通用的个人服务才选择 `user`。密钥不要写入 project 配置。

### MCP 显示连接失败怎么办？

先把 `<name>` 替换为服务名，再运行 `claude mcp get <name>` 并查看 `/mcp`；核对命令是否在 `PATH`、Node.js 版本、URL、认证和 scope。注意该检查可能真的启动或连接服务。若是项目配置，确认已批准；若同一项目同时装了插件和 MCP，检查重复服务。

### 远程服务如何认证？

只使用项目官方支持的 OAuth、header 或环境变量。本机版本支持时，可在把 `<name>` 替换为服务名后运行 `claude mcp login <name>`；但 `/mcp` 是更直观且兼容性更强的入口。不要把一种服务的认证方式套到另一种服务。

### 为什么 Browser MCP 没有可复制的安装命令？

因为当前官方 README 没有完整的最终用户扩展安装、配对与 Claude Code 配置步骤。透明保留资料缺口比根据 npm 包名猜命令更可靠；等待或复核官方文档后再配置。

### 更新后能力失效怎么办？

记录 Claude Code 版本、扩展版本或 Git ref、配置 scope 和最小复现步骤；用本机 `--help` 对照语法，再检查项目 README/release。团队环境可回退到已审查版本，验证后再升级。

## 安全注意事项

第三方扩展不只是“提示词包”，可能获得 Shell、网络、浏览器、源码、文件、环境变量、Git 仓库或凭据访问能力。

- **审查来源**：只使用官方仓库，阅读 manifest、`SKILL.md`、安装脚本、Hook、依赖和更新差异。
- **最小作用域与工具集**：先用 `local` 和最少工具，不默认启用高级搜索、Agent 工具或自动允许规则。
- **隔离密钥**：优先 OAuth、环境变量或项目明确支持的 header；不要提交真实密钥，也避免把密钥放入 URL、shell 历史和日志。
- **保护浏览器会话**：Browser MCP 与调试工具可能操作登录账户并读取页面或请求；首次验证使用专门 profile 或无敏感数据页面。
- **区分本地索引与会话数据**：本地处理不代表结果不会进入 Claude Code 上下文。源码片段、符号和查询仍可能发给模型服务。
- **防范提示注入**：网页、库文档和仓库内容都是不受信任输入；不要让其中的指令自动提升权限或执行高影响操作。
- **限制文件写入**：Skills、安装器和分析器只访问明确目录；重要 Vault、配置和仓库先备份，并检查生成文件的忽略规则。
- **控制成本和自动化**：远程搜索有动态配额，多代理编排会增加模型调用；设置预算、超时、停止条件与人工确认点。
- **固定与回滚**：团队环境优先固定已审查的 tag、ref 或包版本，记录卸载、删除配置和恢复步骤。

## 官方参考资料

### Claude Code

- [Claude Code 插件](https://code.claude.com/docs/en/plugins)
- [Claude Code MCP](https://code.claude.com/docs/en/mcp)
- [Claude Code CLI 参考](https://code.claude.com/docs/en/cli-reference)

### 七个扩展

- [Chrome DevTools MCP](https://github.com/ChromeDevTools/chrome-devtools-mcp)
- [Matt Pocock Skills 简体中文本地化](https://github.com/vinvcn/mattpocock-skills-zh-CN)
- [Obsidian Skills](https://github.com/kepano/obsidian-skills)
- [Codex Plugin for Claude Code](https://github.com/openai/codex-plugin-cc)
- [oh-my-claudecode](https://github.com/Yeachan-Heo/oh-my-claudecode)
- [UI UX Pro Max Skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill)
- [Understand Anything](https://github.com/Egonex-AI/Understand-Anything)

### 五个 MCP

- [BrowserMCP](https://github.com/BrowserMCP/mcp)
- [CodeGraph](https://github.com/colbymchenry/codegraph)
- [Context7 MCP README](https://github.com/upstash/context7/blob/master/packages/mcp/README.md)
- [Exa MCP Server](https://github.com/exa-labs/exa-mcp-server)
- [Tavily MCP](https://github.com/tavily-ai/tavily-mcp)
