---
date: 2026-06-07 00:33:10
title: article-frontmatter Skill 实现计划
titleTag: AI 实现
categories:
  - superpowers
  - plans
tags:
  - skill
  - plan
  - article-frontmatter
description: article-frontmatter skill 的实现计划，包含任务分解、文件创建和代码生成的详细步骤。
---

# article-frontmatter Skill 实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 创建 article-frontmatter skill，用于在新建或编辑文章时提供标准化的 frontmatter 规范指导。

**架构：** 在 `.claude/skills/article-frontmatter/` 目录下创建两个文件：`SKILL.md`（主技能文档，包含行为规则 + 完整字段参考）和 `fields-reference.md`（字段速查表）。参考现有 skill（如 `using-git-worktrees`）的格式风格。

**技术栈：** Markdown（SKILL.md 标准格式）

---

### 任务 1：创建 SKILL.md 主文档

**文件：**
- 创建：`.claude/skills/article-frontmatter/SKILL.md`

- [ ] **步骤 1：编写 YAML 元信息 + 概述 + 触发场景**

```markdown
---
name: article-frontmatter
description: 用于添加标准化 frontmatter 的技能——创建文章时，基于 Teek 主题支持的 frontmatter 字段，自动匹配并补全各字段的正确格式
---

# article-frontmatter：文章 Frontmatter 标准化

## 概述

本项目使用 VitePress + **vitepress-theme-teek** 主题，支持丰富的 frontmatter 字段。本技能规范了文章的 frontmatter 字段使用——包括哪些字段是必需的、各字段的格式约定、以及项目特有的命名规范。

**核心原则：** 区分必需字段与可选字段。必需字段每次创建都写；常用字段根据内容决定；排程字段用于列表控制；扩展字段在特殊场景使用。

**开始时宣布：** "我正在使用 article-frontmatter 技能来添加标准化的文章 frontmatter。"

## 何时使用

**触发场景：**

- 创建新文章时需要添加 frontmatter
- 用户说"帮我新建一篇文章"或"创建一篇关于 XX 的文章"
- 用户说"给这篇文章加上 frontmatter"或"更新这篇的 frontmatter"
- 写一篇文章时，需要决定使用哪些字段
- 检查已有文章的 frontmatter 格式是否规范
```

- [ ] **步骤 2：编写字段分类体系**

```markdown
## 字段分类

### 必需字段（每次创建必须包含）

| 字段 | 类型 | 格式约定 | 说明 |
|------|------|----------|------|
| `title` | `string` | 直接写文章标题 | Teek 会自动补全，但建议显式写出 |
| `date` | `string` | `YYYY-MM-DD HH:mm:ss` | Teek 自动生成文件创建时间 |

### 常用字段（根据内容决定是否添加）

| 字段 | 类型 | 格式约定 | 说明 |
|------|------|----------|------|
| `categories` | `string[]` | 首字母大写，层级从大到小 | Teek 自动根据目录生成 |
| `tags` | `string[]` | 全小写，多词用英文连字符 | 每篇 2-5 个 |
| `description` | `string` | 50-200 字摘要 | 显示在文章列表页 |
| `coverImg` | `string` | 图片 URL（图床托管） | 未指定且 Teek 配置封面列表则随机选取 |

### 目录特定字段（按文件路径自动匹配）

| 字段 | 匹配路径 | 自动设置值 |
|------|----------|-----------|
| `titleTag` | `docs/superpowers/plans/` | `AI 实现` |
| `titleTag` | `docs/superpowers/specs/` | `AI 设计` |

### 排程字段（控制列表表现）

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `top` | `boolean` | `false` | 精选文章标记，多个 true 按 date 排序 |
| `sticky` | `number` | — | 置顶排序值，越小越靠前 |

### 扩展字段（特殊场景使用）

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `sidebar` | `boolean` | `true` | 是否显示侧边栏 |
| `article` | `boolean` | `true` | `false` = 非文章页，不显示面包屑和文章信息 |
| `comment` | `boolean` | `true` | 是否显示评论区 |
| `inCatalogue` | `boolean` | `true` | 是否纳入目录页 |
| `docAnalysis` | `boolean` | `true` | 是否允许站点统计 |
| `autoTitle` | `boolean` | `true` | 是否自动添加一级标题 |
| `articleUpdate` | `boolean` | `true` | 是否在底部显示更新栏 |
| `inHomePost` | `boolean` | `true` | 是否在首页列表显示 |
| `sidebarSort` | `number` | `9999` | 侧边栏排序，越小越靠前 |
| `sidebarPrefix` | `string` | `""` | 侧边栏标题前缀（支持 HTML） |
| `sidebarSuffix` | `string` | `""` | 侧边栏标题后缀（支持 HTML） |
| `articleBanner` | `boolean` | `true` | 是否显示文章页 Banner |
| `coverBgColor` | `string` | `""` | Banner 背景色 |

### 对象字段（Teek 专用配置）

| 字段 | 类型 | 说明 |
|------|------|------|
| `breadcrumb` | `object` | 面包屑配置，如 `{ separator: ">" }` |
| `articleShare` | `object` | 文章分享配置 |
| `appreciation` | `object` | 赞赏配置 |
```

- [ ] **步骤 3：编写项目特有约定 + 行为规则**

```markdown
## 项目约定

- **作者信息**：固定使用 `laplacesc`（已在 Teek 配置中设置，无需在 frontmatter 中重复）
- **Banner 风格**：已在 Teek 配置中统一设置，`banner` 相关字段一般不需要在 frontmatter 中覆盖
- **`permalink`**：Teek 已配置自动生成（rules 模式：`/$path/$uuid6`），**通常不必手动指定**
- **日期格式**：统一 `YYYY-MM-DD HH:mm:ss` 或 `YYYY-MM-DD`
- **分类命名**：首字母大写，如 `WSL`、`VitePress`、`开发环境`
- **标签命名**：全小写，多词用连字符，如 `claude-code`、`vitepress`

## 行为规则

### 场景 A：创建新文章

1. 询问用户文章标题、分类、标签、摘要
2. 若用户未提供标题，从文件名推断
3. 检测文件路径：若在 `docs/superpowers/plans/` 下则自动设置 `titleTag: AI 实现`；若在 `docs/superpowers/specs/` 下则自动设置 `titleTag: AI 设计`；其他路径默认不添加 `titleTag`
4. 判断是否需要 `top` / `sticky` 排程
5. 若需要封面图，询问是否有指定 URL；若无且 Teek 已配置封面列表，说明会自动随机选取
6. 按标准模板组装 frontmatter，输出完整 frontmatter 块

### 场景 B：补充/修正现有文章的 frontmatter

1. 读取已有 frontmatter
2. 检查缺失的必需字段，补充
3. 检查格式是否正确（日期格式、标签大小写等）
4. 提示用户可选的扩展字段是否要添加

### 场景 C：查询字段说明

1. 用户询问某个字段（如"`sidebar` 是做什么的"）
2. 从技能文档或 `fields-reference.md` 查找并返回该字段的完整说明
```

- [ ] **步骤 4：编写 Teek 自动生成说明 + 模板 + 快速参考**

```markdown
## Teek 自动生成说明

当前项目已开启 `autoFrontmatter: true`，Teek 会自动生成以下字段（若 key 不存在）：

| 自动字段 | 生成方式 |
|----------|----------|
| `title` | 从文件名推断 |
| `date` | 文件的创建时间 |
| `permalink` | 按 rules 规则生成（`/$path/$uuid6`） |
| `categories` | 从目录层级推断 |

> **关键行为：** Teek **不会覆盖**已存在的 key。如果手动写了 `title`，自动生成会跳过。

### Frontmatter 模板

```yaml
---
title: 文章标题
date: 2026-06-06 00:00:00
categories:
  - 分类A
tags:
  - tag-a
  - tag-b
top: false
sticky:
description: 这是一篇关于……的文章摘要。
coverImg:
---
```

### 速查表

| 类别 | 字段 | 必填 | 说明 |
|------|------|------|------|
| 核心 | `title`, `date` | 是 | 每次创建必须包含 |
| 常用 | `categories`, `tags` | 推荐 | 根据内容添加 |
| 目录特定 | `titleTag` | 自动 | 按路径匹配，见「目录特定字段」 |
| 常用 | `description`, `coverImg` | 推荐 | 优化文章展示 |
| 排程 | `top`, `sticky` | 可选 | 控制列表优先级 |
| 扩展 | 见 `fields-reference.md` | 可选 | 特殊场景调整 |

## 参考来源

- [Teek Frontmatter 配置](https://github.com/Kele-Bingtang/vitepress-theme-teek/blob/main/docs/10.%E9%85%8D%E7%BD%AE/10.Frontmatter%20%E9%85%8D%E7%BD%AE.md)
- [Teek Frontmatter 扩展](https://github.com/Kele-Bingtang/vitepress-theme-teek/blob/main/docs/01.%E6%8C%87%E5%8D%97/10.%E4%BD%BF%E7%94%A8/07.Frontmatter%20%E6%8B%93%E5%B1%95.md)
```

- [ ] **步骤 5：Commit**

```bash
git add .claude/skills/article-frontmatter/SKILL.md
git commit -m "feat(skill): 创建 article-frontmatter SKILL.md 主文档

- 定义字段分类体系（必需/常用/排程/扩展）
- 制定项目特有约定和三种使用场景的行为规则
- 添加 Teek 自动生成说明和 frontmatter 模板

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

### 任务 2：创建 fields-reference.md 速查表

**文件：**
- 创建：`.claude/skills/article-frontmatter/fields-reference.md`

- [ ] **步骤 1：编写速查表头部 + 核心字段表**

```markdown
# Frontmatter 字段速查表

## 核心字段（常用）

| 字段 | 类型 | 默认值 | 格式 / 说明 |
|------|------|--------|-------------|
| `title` | `string` | — | 文章标题 |
| `date` | `string` | — | `YYYY-MM-DD HH:mm:ss` |
| `titleTag` | `string` | `null` | 默认不添加。按路径自动匹配：`plans/` → `AI 实现`，`specs/` → `AI 设计` |
| `categories` | `string[]` | `[]` | 首字母大写，如 `WSL`、`VitePress` |
| `tags` | `string[]` | `[]` | 全小写连字符，如 `claude-code` |
| `description` | `string` | `null` | 50-200 字文章摘要 |
| `coverImg` | `string` | `null` | 封面图 URL |

## 排程字段

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `top` | `boolean` | `false` | 精选文章，多个 true 按 date 排序 |
| `sticky` | `number` | — | 置顶排序，值越小越靠前 |
```

- [ ] **步骤 2：编写扩展字段表**

```markdown
## 扩展字段

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `sidebar` | `boolean` | `true` | `false` = 隐藏侧边栏 |
| `article` | `boolean` | `true` | `false` = 非文章页，不显示面包屑和信息，不列入首页列表/归档 |
| `comment` | `boolean` | `true` | `false` = 隐藏评论区 |
| `inCatalogue` | `boolean` | `true` | `false` = 不纳入目录页（来自 vitepress-plugin-catalogue） |
| `docAnalysis` | `boolean` | `true` | `false` = 禁止站点统计（来自 vitepress-plugin-doc-analysis） |
| `autoTitle` | `boolean` | `true` | `false` = 禁止自动添加一级标题（来自 vitepress-plugin-md-h1） |
| `articleUpdate` | `boolean` | `true` | `false` = 不显示底部更新栏 |
| `inHomePost` | `boolean` | `true` | `false` = 不在首页列表展示 |
| `sidebarSort` | `number` | `9999` | 侧边栏排序，越小越靠前（来自 vitepress-plugin-sidebar-resolve） |
| `sidebarPrefix` | `string` | `""` | 侧边栏标题前缀（支持 HTML iconfont 图标） |
| `sidebarSuffix` | `string` | `""` | 侧边栏标题后缀（支持 HTML iconfont 图标） |
| `articleBanner` | `boolean` | `true` | `false` = 不显示文章页 Banner（仅无侧边栏时生效） |
| `coverBgColor` | `string` | `""` | Banner 背景色 |

## 对象字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `breadcrumb` | `object` | 面包屑配置，如 `{ separator: ">" }` |
| `articleShare` | `object` | 文章分享配置 |
| `appreciation` | `object` | 赞赏配置 |

## 首页 Banner 相关（仅在 `index.md` 使用）

> 当前项目 Banner 已在 Teek 配置中统一设置，非特殊需求不需要在 frontmatter 中覆盖。

| 字段 | 类型 | 优先级 |
|------|------|--------|
| `tk.banner.description` | `string[]` | 最高 |
| `banner.description` | `string[]` | 中 |
| `tk.features` | `object[]` | 文档风格 |
| `tk.banner.features` | `object[]` | 博客风格，最高 |
| `banner.features` | `object[]` | 博客风格，次高 |
```

- [ ] **步骤 3：Commit**

```bash
git add .claude/skills/article-frontmatter/fields-reference.md
git commit -m "feat(skill): 创建 fields-reference.md 字段速查表

- 核心字段、排程字段、扩展字段、对象字段速查
- 附首页 Banner 相关字段说明

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## 自检

**1. 规格覆盖度：**
- ✅ 字段分类全部覆盖（必需/常用/排程/扩展/对象）
- ✅ 项目约定全部包含
- ✅ 三种场景的行为规则全部覆盖
- ✅ 模板、Teek 自动生成说明全部覆盖

**2. 占位符扫描：** 无 TODO、无"待定"、无模糊需求

**3. 类型一致性：** 两个任务中的字段名、类型、默认值完全一致
