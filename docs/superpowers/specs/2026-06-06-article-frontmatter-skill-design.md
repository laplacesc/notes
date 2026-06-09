# article-frontmatter Skill 设计方案

## 概述

为当前项目（VitePress + Teek 主题）创建一个技能，用于在新创建或编辑文章时提供标准化的 frontmatter 指导。

## 文件结构

```
.claude/skills/article-frontmatter/
├── SKILL.md              # 主技能文档：行为规则 + 完整参考
└── fields-reference.md   # 字段速查表：按类别整理的表格
```

## 技能元信息

```yaml
name: article-frontmatter
description: 用于添加标准化 frontmatter 的技能——创建文章时，基于 Teek 主题支持的 frontmatter 字段，自动匹配并补全各字段的正确格式
```

## 触发场景

- 用户说"帮我新建一篇文章"或"创建一篇关于 XX 的文章"
- 用户说"给这篇文章加上 frontmatter"
- 用户说"更新这篇的 frontmatter"
- 写一篇文章时，需要决定使用哪些字段

## 字段分类体系

### 必需字段（每次创建必须包含）

| 字段 | 类型 | 格式约定 | 说明 |
|------|------|----------|------|
| `title` | `string` | 直接写文章标题 | 注意 Teek 会自动补全，但建议显式写出 |
| `date` | `string` | `YYYY-MM-DD HH:mm:ss` | 固定格式，Teek 自动生成文件的创建时间 |

### 常用字段（根据内容决定是否添加）

| 字段 | 类型 | 格式约定 | 说明 |
|------|------|----------|------|
| `categories` | `string[]` | 首字母大写，层级顺序从大到小 | Teek 自动根据目录层级生成 |
| `tags` | `string[]` | 全小写，用英文连字符连接多词（如 `claude-code`） | 每篇文章 2-5 个标签为宜 |
| `description` | `string` | 50-200 字摘要 | 显示在文章列表页 |
| `coverImg` | `string` | 图片 URL（托管在 picx-images-hosting 等图床） | 若未指定且 Teek 配置了 `coverImgList` 则随机选取 |

### 目录特定字段（按文件路径自动匹配）

`titleTag` 默认不添加，仅在文件位于特定目录时根据路径自动匹配设置值：

| 字段 | 匹配路径 | 自动设置值 |
|------|----------|-----------|
| `titleTag` | `docs/superpowers/plans/` | `AI 实现` |
| `titleTag` | `docs/superpowers/specs/` | `AI 设计` |

### 排程字段（控制列表表现）

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `top` | `boolean` | `false` | 精选文章标记，多个 `true` 按 date 排序 |
| `sticky` | `number` | — | 置顶排序值，越小越靠前 |

### 扩展字段（不常用，特殊场景使用）

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `sidebar` | `boolean` | `true` | 是否显示侧边栏 |
| `article` | `boolean` | `true` | `false`=非文章页，不显示面包屑和文章信息 |
| `comment` | `boolean` | `true` | 是否显示评论区 |
| `inCatalogue` | `boolean` | `true` | 是否纳入目录页 |
| `docAnalysis` | `boolean` | `true` | 是否允许站点统计 |
| `autoTitle` | `boolean` | `true` | 是否自动添加一级标题 |
| `articleUpdate` | `boolean` | `true` | 是否在底部显示更新栏 |
| `inHomePost` | `boolean` | `true` | 是否在首页文章列表显示 |
| `sidebarSort` | `number` | `9999` | 侧边栏排序，越小越靠前 |
| `sidebarPrefix` | `string` | `""` | 侧边栏标题前缀（支持 HTML） |
| `sidebarSuffix` | `string` | `""` | 侧边栏标题后缀（支持 HTML） |
| `articleBanner` | `boolean` | `true` | 是否显示文章页 Banner |
| `coverBgColor` | `string` | `""` | Banner 背景色 |

### 对象字段（Teek 专用）

| 字段 | 类型 | 说明 |
|------|------|------|
| `breadcrumb` | `object` | 面包屑配置，如 `{ separator: ">" }` |
| `articleShare` | `object` | 文章分享配置 |
| `appreciation` | `object` | 赞赏配置 |

## 项目特有约定

- **作者信息**：固定使用 `laplacesc`（已在 Teek 配置中设置，无需在 frontmatter 中重复）
- **Banner 风格**：已在 Teek 配置中统一设置，`banner` 相关字段一般不需要在 frontmatter 中覆盖
- **`permalink`**：Teek 已配置自动生成（rules 模式：`/$path/$uuid6`），通常不必手动指定
- **日期格式**：统一使用 `YYYY-MM-DD HH:mm:ss`（含时分秒）或 `YYYY-MM-DD`（不含时分秒）
- **分类命名**：首字母大写，如 `WSL`、`VitePress`、`开发环境`
- **标签命名**：全小写，多词用连字符连接，如 `claude-code`、`vitepress`

## 行为规则

### 场景 A：创建新文章

1. 询问文章标题、所属分类、标签、摘要
2. 从文件名推断 `title`（若用户未提供）
3. 检测文件路径：若在 `docs/superpowers/plans/` 下则自动设置 `titleTag: AI 实现`；若在 `docs/superpowers/specs/` 下则自动设置 `titleTag: AI 设计`；其他路径默认不添加 `titleTag`
4. 判断是否需要 `top` / `sticky`
5. 若需要封面图，询问是否有指定 URL
6. 按标准模板组装 frontmatter
7. 输出完整 frontmatter 块

### 场景 B：补充/修正现有文章的 frontmatter

1. 读取已有 frontmatter
2. 检查缺失的必需字段，补充
3. 检查格式是否正确（日期格式、标签大小写等）
4. 提示用户可选的扩展字段

### 场景 C：查询字段说明

1. 用户询问某个字段（如"`sidebar` 是做什么的"）
2. 从技能文档查找并返回该字段的完整说明

## Frontmatter 模板

```yaml
---
title: 文章标题
date: 2026-06-06 00:00:00
categories:
  - 分类A
  - 分类B
tags:
  - tag-a
  - tag-b
top: false
sticky:
description: 这是一篇关于……的文章摘要。
coverImg:
---
```

## Teek 自动生成说明

当前项目已开启 `autoFrontmatter: true`，Teek 会自动生成以下字段（若不存在）：

- `title`：从文件名推断
- `date`：文件创建时间
- `permalink`：按 rules 规则生成（`/$path/$uuid6`）
- `categories`：从目录层级推断

注意：Teek **不会覆盖**已存在的 key（即如果手动写了 `title`，自动生成会跳过）。

## 参考来源

- [Teek Frontmatter 配置](https://github.com/Kele-Bingtang/vitepress-theme-teek/blob/main/docs/10.%E9%85%8D%E7%BD%AE/10.Frontmatter%20%E9%85%8D%E7%BD%AE.md)
- [Teek Frontmatter 扩展](https://github.com/Kele-Bingtang/vitepress-theme-teek/blob/main/docs/01.%E6%8C%87%E5%8D%97/10.%E4%BD%BF%E7%94%A8/07.Frontmatter%20%E6%8B%93%E5%B1%95.md)
