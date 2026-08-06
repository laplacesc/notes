---
title: Claude Code 与 Codex 扩展生态指南
date: 2026-08-06 08:00:00
tags:
  - claude-code
  - codex
  - plugin
  - mcp
  - agent-skills
description: 梳理 Claude Code 与 Codex 的原生插件市场、MCP、Agent Skills 和独立安装器，并给出九个常用扩展的选型、安装与验证指南。
permalink: /pages/8bec34
categories:
  - AI
  - Claude Code
---

> Claude Code 与 Codex 的扩展生态正在快速演进，但“一个 GitHub 仓库”并不等于“两个客户端都能安装的插件市场”。本文先辨清扩展形态，再介绍九个常用项目的正确入口、兼容范围和验证方法。
>
> 本文信息核实于 **2026 年 8 月 6 日**。命令会随客户端更新，请先用本机的 `--help` 复核，再按仓库 README 操作。

## 先说结论

1. **添加 marketplace 只是注册来源，不会安装插件。**
2. Claude Code 安装原生插件使用 `plugin install`；Codex 安装原生插件使用 `plugin add`。
3. MCP 服务、Agent Skills、CLI 安装器和原生插件是不同的交付方式，不能互换。
4. 原草稿中的九个仓库并非“双端通用市场”。其中有 Claude Code 专用插件、Codex 专用编排层，也有需要通过 MCP、复制 Skills 或安装脚本接入的项目。
5. 不要一次性安装全部扩展。先确定需求，再选择最小组合，最后逐个验证。

## 认识四种扩展形态

### 原生 marketplace 插件

Marketplace 是一个插件目录。客户端先注册目录，再从目录中安装具体插件：

```text
添加 marketplace 来源 → 查看其中的插件 → 安装插件 → 重启或重新加载 → 验证
```

来源仓库必须包含客户端能够识别的 marketplace 清单和插件布局。命令接受 GitHub URL，并不代表任意 GitHub 仓库都能成为有效市场。

### MCP 服务

[MCP（Model Context Protocol）](https://modelcontextprotocol.io/) 用统一协议把浏览器、文档检索、数据库等外部能力暴露给模型。MCP 服务通常需要单独配置进客户端，并可能启动本地进程或连接远程端点。

它与 marketplace 的区别是：marketplace 管理插件包，MCP 管理工具连接。一个项目也可以同时提供原生插件和 MCP 两种入口。

### Agent Skills

Agent Skills 通常由 `SKILL.md`、参考资料和脚本组成，向代理提供某一领域的操作方法。不同客户端可能都能读取 Skills，但目录位置和安装方式不同：有的通过 marketplace 分发，有的由 CLI 安装，也有的需要手动复制。

“兼容 Agent Skills”不等于“兼容某个客户端的原生插件市场”。

### 独立 CLI 或安装脚本

部分项目通过 npm CLI、Shell 安装脚本或符号链接部署。它们可能同时写入 commands、agents、skills、hooks 和配置文件，能力范围通常比单个 Skill 更广。

执行这类安装器前，应先阅读脚本，确认目标目录、覆盖行为、卸载方式和权限范围。

## 前置条件

先确认基础工具和客户端可用：

```bash
claude --version
claude plugin --help
claude plugin marketplace --help

codex --version
codex plugin --help
codex plugin marketplace --help

git --version
node --version
```

还需要注意：

- 安装最新版稳定版 Claude Code 或 Codex CLI，并完成对应账户认证。
- 多数 Node.js 工具需要当前 LTS；Context7 CLI 的最低要求是 Node.js 18，Chrome DevTools MCP 建议使用 Node.js LTS。
- 使用浏览器调试能力时，需要本机可用的 Chrome；无图形界面的环境还要关注浏览器路径与超时设置。
- UI/UX 搜索脚本需要 Python 3。
- 调用 Codex 的桥接插件要求 Codex 已安装并登录，并会消耗 Codex 配额。
- 在公司仓库或敏感环境中，先确认组织策略是否允许第三方插件、MCP 和 Hook。

> [!tip]
> 客户端与插件命令变化较快。如果本文命令与本机输出不一致，以 `claude plugin --help`、`codex plugin --help` 和目标仓库当前 README 为准，不要盲目套用旧教程。

## Claude Code：添加市场、安装与验证

### 选择作用域

Claude Code 的 marketplace 与插件命令支持 `--scope user|project|local`：

| Scope | 适合场景 | 建议 |
|---|---|---|
| `user` | 当前用户的多个项目都要使用 | 个人通用工具可选 |
| `project` | 团队希望在项目中共享来源或插件配置 | 提交前先审查配置变化 |
| `local` | 只在当前项目、当前机器试用 | 评估第三方扩展时优先 |

除非明确需要全局启用，建议先用 `local` 或隔离测试项目评估，再提升作用域。

### 标准流程

下面的 `<source>`、`<plugin>` 和 `<marketplace>` 需要替换为仓库或 marketplace 清单中声明的实际值：

```bash
# 1. 注册市场来源；也可使用 owner/repo、本地路径或带 ref 的 Git URL
claude plugin marketplace add <source> --scope local

# 2. 确认清单中的插件名和市场名后再安装
claude plugin install <plugin>@<marketplace> --scope local
```

若要先浏览市场内容，请在交互式 Claude Code 会话中输入 `/plugin`，查看清单中声明的真实插件名和市场名，再回到上面的 CLI 安装步骤。

```text
/plugin install <plugin>@<marketplace>
```

添加市场后，应先在 `/plugin` 中查看可用插件和 README，而不是根据仓库名称猜测 `<plugin>@<marketplace>`。非交互式安装会先刷新市场再查找插件；若仍然找不到，优先检查清单名称和客户端版本。

### 原草稿中可作为 Claude Code 原生市场的来源

以下项目已提供 Claude Code 原生插件或 marketplace 入口。**按需选择并逐条执行，不要整组无差别安装：**

```bash
# 浏览器调试
claude plugin marketplace add ChromeDevTools/chrome-devtools-mcp --scope local

# 在 Claude Code 中调用 Codex
claude plugin marketplace add openai/codex-plugin-cc --scope local

# Matt Pocock Skills 简体中文本地化
claude plugin marketplace add vinvcn/mattpocock-skills-zh-CN --scope local

# Obsidian Skills
claude plugin marketplace add kepano/obsidian-skills --scope local

# Claude Code-first 多代理编排
claude plugin marketplace add Yeachan-Heo/oh-my-claudecode --scope local

# UI/UX 设计 Skill
claude plugin marketplace add nextlevelbuilder/ui-ux-pro-max-skill --scope local

# 项目理解与知识图谱
claude plugin marketplace add Egonex-AI/Understand-Anything --scope local
```

`upstash/context7` 没有放进这组命令，因为其推荐入口是 `ctx7 setup --claude` 或 MCP，而不是把仓库 URL 强行注册成原生市场。

### 验证

1. 在 `/plugin` 中确认市场已注册、目标插件已安装且没有错误。
2. 按插件 README 的要求重启 Claude Code；新命令或 Hook 通常不会注入到已经打开的会话。
3. 新开一个测试会话，只调用该插件最小能力。
4. 检查是否生成了预期配置，并确认没有意外修改其他作用域。
5. 若插件调用外部服务，再核对认证状态、配额和审计日志。

## Codex：添加市场、安装与验证

### 标准流程

Codex 的 marketplace 来源可以是本地路径、GitHub `owner/repo` 简写或完整 Git URL，并支持 `--ref` 与 `--sparse` 等选项：

```bash
# 本地 marketplace
codex plugin marketplace add ./path/to/marketplace

# GitHub marketplace，并指定 ref
codex plugin marketplace add owner/repo --ref main

# 只读取仓库中的指定目录
codex plugin marketplace add <git-url> --sparse plugins/foo
```

注册来源后，用 `list` 查看实际声明的市场名和插件名，再用 `plugin add` 安装：

```bash
# 查看全部已知插件
codex plugin list

# 按市场查看
codex plugin list --marketplace <marketplace>

# 查看机器可读状态或所有可安装插件
codex plugin list --json
codex plugin list --available --json

# 安装插件；注意这里是 add，不是 install
codex plugin add <plugin>@<marketplace>

# 再次核对安装结果
codex plugin list --json
```

> [!warning]
> Claude Code 使用 `claude plugin install`，Codex 使用 `codex plugin add`。两端命令不能直接复制替换客户端名称。

### 原草稿中确认可用于 Codex marketplace 的来源

九个项目中，`oh-my-codex` 明确包含 Codex 官方插件布局：

```bash
codex plugin marketplace add Yeachan-Heo/oh-my-codex
codex plugin list --marketplace oh-my-codex-local
codex plugin add oh-my-codex@oh-my-codex-local
codex plugin list --json
```

其余面向 Codex 的工具应分别通过 MCP、Agent Skills、专用 CLI 或安装脚本接入，不应仅因为 `codex plugin marketplace add <GitHub URL>` 接受 URL，就把任意仓库当作有效市场。

### 验证

1. `codex plugin list --json` 中应能看到目标插件及安装状态。
2. 重启 Codex，新建测试会话，确认插件声明的 Skill 或能力可见。
3. 如果插件依赖外部运行时，继续验证对应命令是否存在。例如 `oh-my-codex` 的 Hook 会调用 `omx`，仅看到插件并不代表运行时已经就绪。
4. MCP 和手动 Skills 不一定出现在插件列表中，需要分别检查 MCP 状态或 Skills 目录。

## 九个项目逐项说明

### ChromeDevTools/chrome-devtools-mcp

项目地址：[Chrome DevTools MCP](https://github.com/ChromeDevTools/chrome-devtools-mcp)

- **定位**：把 Chrome DevTools 的页面操作、控制台、网络和性能分析能力提供给编码代理。
- **适用场景**：复现前端问题、检查请求、采集性能信息、验证页面交互。
- **兼容性**：Claude Code 可使用原生插件或 MCP；Codex 使用 MCP 配置，不应把该仓库当作 Codex 原生插件市场。
- **推荐入口**：Claude Code 优先选择仓库提供的原生插件；Codex 按 README 的 MCP 配置接入。
- **注意事项**：需要 Node.js LTS 和可用的 Chrome。若 Claude Code 已配置旧版 MCP，切换到插件前先移除重复配置并重启，避免同名工具重复注册。容器、WSL 或远程环境还需检查 Chrome 路径、沙箱策略和启动超时。

### openai/codex-plugin-cc

项目地址：[Codex plugin for Claude Code](https://github.com/openai/codex-plugin-cc)

- **定位**：让 Claude Code 调用 Codex，支持审查、任务委派、会话转交和作业管理。
- **适用场景**：希望以 Claude Code 为主控，将特定编码或 Review 工作交给 Codex。
- **兼容性**：这是 **Claude Code 原生插件**；Codex CLI 是后端，不是把该插件再安装进 Codex。
- **推荐入口**：在 Claude Code 注册该仓库的 marketplace，再从 `/plugin` 安装清单中声明的插件。
- **注意事项**：本机必须安装并登录 Codex。每次委派都会消耗 Codex 配额；可选 review gate 可能反复调用，启用前应设定停止条件并关注额度。

### upstash/context7

项目地址：[Context7](https://github.com/upstash/context7)

- **定位**：向代理提供较新的第三方库文档，减少依赖过时 API 或凭记忆编写代码的情况。
- **适用场景**：查询框架、SDK、CLI 或云服务的当前文档和示例。
- **兼容性**：Claude Code 可使用 Context7 CLI Skill 或 MCP；Codex 可按通用 MCP 方式配置。当前 README 没有把它定义为 Codex 原生 marketplace。
- **推荐入口**：先按 Context7 README 安装 `ctx7`，再为 Claude Code 初始化：

  ```bash
  ctx7 setup --claude
  ```

  需要跨客户端共享服务时，按 Context7 README 配置 MCP；Codex 使用通用 MCP 配置而不是 `codex plugin marketplace add upstash/context7`。
- **注意事项**：CLI 需要 Node.js 18 或更高版本。API Key 可以提高限额；手动配置远程 MCP 时应以 Bearer Token 传递，不要把密钥写入会提交的配置文件。

### vinvcn/mattpocock-skills-zh-CN

项目地址：[Matt Pocock Skills 简体中文本地化](https://github.com/vinvcn/mattpocock-skills-zh-CN)

- **定位**：Matt Pocock Agent Skills 的简体中文本地化版本，覆盖其仓库声明的前端与 TypeScript 工作方法。
- **适用场景**：希望代理按结构化技能处理相关开发任务，同时使用中文说明。
- **兼容性**：Claude Code 支持原生 marketplace 插件；Codex 可以使用 skills.sh / Agent Skills 兼容安装，但不是 Codex 原生插件。
- **推荐入口**：Claude Code 注册本地化仓库并从 `/plugin` 安装；Codex 按该仓库的 Agent Skills 安装说明操作。
- **注意事项**：确认使用的是 `vinvcn` 本地化仓库，而不是误装上游英文仓库。README 中的 Claude 原生插件命令只适用于 Claude Code，不能照搬成 Codex marketplace 命令。

### kepano/obsidian-skills

项目地址：[Obsidian Skills](https://github.com/kepano/obsidian-skills)

- **定位**：提供 Obsidian CLI、Obsidian Markdown、Bases 与 JSON Canvas 等领域技能。
- **适用场景**：维护 Obsidian Vault、生成符合 Obsidian 语法的笔记、Bases 或 Canvas 文件。
- **兼容性**：Claude Code 可通过 marketplace，或使用 Vault 内项目提供的 `.claude` 文件；Codex 需要手动部署 Skills。
- **推荐入口**：Claude Code 从仓库 marketplace 安装。Codex 克隆仓库后，将所需的 `skills/` 内容复制到 `~/.codex/skills`，并保留每个 Skill 的目录结构。
- **注意事项**：确认目标客户端支持 Agent Skills。安装前备份 Vault，并限制代理可写目录；不要把 Claude Code 的 marketplace 命令当作 Codex 原生安装方式。

### Yeachan-Heo/oh-my-claudecode

项目地址：[oh-my-claudecode](https://github.com/Yeachan-Heo/oh-my-claudecode)

- **定位**：面向 Claude Code 的多代理编排层，提供工作流、角色代理和持久状态。
- **适用场景**：以 Claude Code 为主控，需要规划、并行执行、验证和长任务状态管理。
- **兼容性**：主要面向 Claude Code，也能把 Codex CLI 作为工作节点；它不是 Codex-first 编排方案。
- **推荐入口**：按 README 逐条执行 Claude Code marketplace 的添加与安装命令。npm 包名是 `oh-my-claude-sisyphus`，不要根据项目名猜包名。
- **注意事项**：安装时出现 README 已说明的 `prebuild-install` deprecation warning 不代表安装失败。部分命名的 autopilot profile 依赖 Linux `flock`，在其他系统使用前应查看兼容说明。

### Yeachan-Heo/oh-my-codex

项目地址：[oh-my-codex](https://github.com/Yeachan-Heo/oh-my-codex)

- **定位**：面向 OpenAI Codex CLI 的工作流与多代理编排层。
- **适用场景**：以 Codex 为主控，需要代理角色、工作流、持续状态和任务编排。
- **兼容性**：主要面向 Codex，仓库包含 `.agents/plugins/marketplace.json` 和 `plugins/oh-my-codex` 的官方插件布局；未声明 Claude Code 支持。
- **推荐入口**：先按 README 完成全局 `oh-my-codex` CLI 安装和目标范围的 setup，再按前文 Codex marketplace 流程添加 `oh-my-codex` 插件。
- **注意事项**：这里有两个互补层，不能只装其中一个：

  | 层 | 提供内容 | 是否足够独立运行 |
  |---|---|---|
  | Marketplace plugin | Skills 和插件元数据，让 Codex 发现相关能力 | 否 |
  | 全局 CLI + scoped setup | `omx` 运行时、配置与目标范围初始化 | 是完整工作流的基础 |

  插件 Hook 仍会调用已经安装的 `omx`。因此 `codex plugin list` 显示安装成功，但系统找不到 `omx` 时，说明只完成了插件层。该项目主要支持 macOS/Linux，并要求 Codex CLI 已认证。若 Codex 由 Homebrew 管理，不要用 npm 安装去覆盖 Codex 二进制；这与安装独立的 OMX 运行时是两件事。

### nextlevelbuilder/ui-ux-pro-max-skill

项目地址：[UI UX Pro Max Skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill)

- **定位**：提供 UI/UX 设计知识，并可生成设计系统和界面实现建议。
- **适用场景**：设计新页面、统一视觉规范、评审交互和可访问性。
- **兼容性**：Claude Code 可使用 marketplace 或项目 CLI；Codex 使用项目 CLI 初始化 Agent Skills。
- **推荐入口**：优先使用当前维护的 `ui-ux-pro-max-cli`，然后按客户端初始化：

  ```bash
  # 安装方式和最新包版本以仓库 README 为准
  uipro init --ai claude
  uipro init --ai codex
  ```

  每个项目只执行与当前客户端对应的一条初始化命令。
- **注意事项**：不要使用已过时的 `uipro-cli`。搜索脚本需要 Python 3；如果 marketplace 的 ZIP 或符号链接安装失败，改用官方 CLI 安装器。

### Egonex-AI/Understand-Anything

项目地址：[Understand Anything](https://github.com/Egonex-AI/Understand-Anything)

- **定位**：多代理项目分析器，可生成交互式知识图谱与 Dashboard。
- **适用场景**：接手陌生代码库、梳理模块关系、形成项目级导航资料。
- **兼容性**：Claude Code 支持原生 marketplace 插件；Codex 使用仓库提供的安装脚本。
- **推荐入口**：Claude Code 注册 marketplace 后安装；Codex 按 README 在仓库目录执行：

  ```bash
  ./install.sh codex
  ```

- **注意事项**：安装器会克隆运行内容到 `~/.understand-anything/repo` 并创建符号链接，执行前应审查脚本和已有目录。安装后重启客户端；Codex 中使用 `$understand`，不是 Claude Code 风格的 `/understand`。

## 快速选型

| 需求 | 优先选择 | Claude Code 入口 | Codex 入口 |
|---|---|---|---|
| 查询最新库文档 | Context7 | CLI Skill 或 MCP | MCP |
| 调试网页与性能 | Chrome DevTools MCP | 原生插件或 MCP | MCP |
| 在 Claude 中委派 Codex | codex-plugin-cc | 原生插件 | 不适用，Codex 是后端 |
| 中文前端 Skills | mattpocock-skills-zh-CN | 原生插件 | Agent Skills 兼容安装 |
| 编辑 Obsidian 内容 | obsidian-skills | Marketplace / Vault 配置 | 手动复制 Skills |
| Claude-first 多代理编排 | oh-my-claudecode | Marketplace | 不建议，选择 OMX |
| Codex-first 多代理编排 | oh-my-codex | 未声明支持 | 插件层 + 全局 CLI/setup |
| UI/UX 设计 | ui-ux-pro-max-skill | Marketplace 或 CLI | CLI |
| 理解大型项目 | Understand Anything | Marketplace | `install.sh codex` |

### 推荐安装顺序

1. **先稳定客户端本身**：确认认证、基础读写和版本更新没有问题。
2. **先装一个低耦合能力**：例如文档检索 Skill，验证扩展发现与调用流程。
3. **再装领域能力**：按项目需要选择 Obsidian、UI/UX 或项目理解工具。
4. **需要时再接 MCP**：浏览器和远程文档服务会扩大网络与进程权限，应单独验证。
5. **最后安装编排层**：编排工具会引入更多 Agent、Hook、状态与配额消耗，最适合在基础链路稳定后加入。

不建议同时安装多个功能重叠的编排层，也不建议为了“以后也许会用”而把九个项目全部启用。

## 安装后的统一验证清单

### 原生插件

- Marketplace 已注册，插件列表中能看到清单声明的真实名称。
- 插件状态为已安装，重启后命令、Skill 或 Hook 可见。
- 用一个最小任务验证，不直接在重要仓库执行破坏性操作。

### MCP

- 客户端能列出 MCP 服务及工具。
- 本地进程能启动，远程端点能认证，没有重复服务名。
- 只授予必要的浏览器、网络、文件和密钥权限。

### Agent Skills

- Skill 位于客户端会扫描的目录，`SKILL.md` 与附属脚本完整。
- 新会话能够发现 Skill，触发方式与 README 一致。
- 更新时没有覆盖本地自定义内容。

### CLI 与安装脚本

- 可执行文件在 `PATH` 中，版本命令正常。
- 安装脚本创建的目录和符号链接符合预期。
- Hook 依赖的运行时确实存在；不能只验证配置文件是否生成。
- 已记录卸载或回滚步骤。

## 常见问题

### 添加 marketplace 后为什么没有新命令？

因为“添加市场”不等于“安装插件”。先查看市场中声明的插件，再执行 Claude Code 的 `plugin install` 或 Codex 的 `plugin add`，最后重启客户端。

### 为什么提示不是有效 marketplace？

仓库可能只提供 MCP、Skills 或安装脚本，也可能 marketplace 清单不在默认路径。先检查 README 和清单布局；Codex 仓库在子目录时可按官方命令使用 `--sparse`。不要因为 URL 能被克隆就认定它是市场。

### 为什么插件名与仓库名不同？

`<plugin>@<marketplace>` 使用清单声明的标识，不一定等于 GitHub 仓库名。以 `/plugin`、`codex plugin list --available --json` 或 marketplace manifest 为准，不要猜测。

### Claude Code 的命令能否直接改成 `codex`？

不能。除安装动词不同外，两端的清单格式、Skill 目录、作用域和运行时也可能不同。先看本文兼容性表，再按各仓库为对应客户端提供的入口操作。

### 已安装但当前会话看不到能力怎么办？

先重启客户端并新建会话，再检查安装作用域是否匹配当前项目。对于 MCP，检查进程启动日志；对于手动 Skills，检查目录；对于 OMX，确认全局 `omx` 运行时和 scoped setup 均已完成。

### 更新后失效怎么办？

分别记录客户端版本、插件提交或版本、配置作用域和最小复现步骤。用本机 `--help` 对照当前语法，再查看仓库 release/README。必要时固定到已审查的 Git ref，验证后再升级。

## 安全注意事项

第三方插件不只是“提示词包”。它们可能获得 Shell、浏览器、网络、文件系统、Git 仓库、环境变量或凭据访问能力。

- **审查来源**：只使用官方仓库，阅读 marketplace manifest、安装脚本、Hook 和依赖变更。
- **最小作用域**：先在临时项目使用 `local` 或等效局部范围，不要默认全局启用。
- **固定可信版本**：团队环境优先固定已审查的 tag、ref 或提交；升级后重新验证。
- **隔离密钥**：API Key 使用环境变量或密钥管理器，不写入仓库和可共享配置。
- **控制浏览器权限**：调试 MCP 可能看到登录态、页面内容和网络请求，不要连接包含敏感数据的日常浏览器配置。
- **关注配额**：多代理编排、review gate 和跨模型委派可能产生连续调用，应配置预算与停止条件。
- **保留回滚路径**：安装前备份配置，记录新增目录、符号链接和卸载步骤。
- **检查输出再执行**：代理生成的 Shell、Git、发布和数据修改命令仍需人工确认。

## 官方参考资料

- [Claude Code 官方仓库与 Changelog](https://github.com/anthropics/claude-code)
- [Claude Code plugin-dev 示例](https://github.com/anthropics/claude-code/blob/v2.1.89/plugins/plugin-dev/README.md)
- [OpenAI Codex 官方仓库](https://github.com/openai/codex)
- [Codex marketplace CLI 实现与示例](https://github.com/openai/codex/blob/main/codex-rs/cli/src/marketplace_cmd.rs)
- [Codex 插件安装参考](https://github.com/openai/codex/blob/main/codex-rs/skills/src/assets/samples/plugin-creator/references/installing-and-updating.md)
- [Chrome DevTools MCP](https://github.com/ChromeDevTools/chrome-devtools-mcp)
- [Codex plugin for Claude Code](https://github.com/openai/codex-plugin-cc)
- [Context7](https://github.com/upstash/context7)
- [Matt Pocock Skills 简体中文本地化](https://github.com/vinvcn/mattpocock-skills-zh-CN)
- [Obsidian Skills](https://github.com/kepano/obsidian-skills)
- [oh-my-claudecode](https://github.com/Yeachan-Heo/oh-my-claudecode)
- [oh-my-codex](https://github.com/Yeachan-Heo/oh-my-codex)
- [UI UX Pro Max Skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill)
- [Understand Anything](https://github.com/Egonex-AI/Understand-Anything)
