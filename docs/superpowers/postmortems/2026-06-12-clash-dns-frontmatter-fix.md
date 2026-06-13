# Postmortem：Clash DNS 配置文章前端元数据修复

> **日期：** 2026-06-12  
> **涉及文件：** `docs/03.网络/30.Clash/Clash DNS 配置详解.md`  
> **构建命令：** `pnpm docs:build`  
> **严重程度：** 构建阻断（新文章无法生成）

---

## 问题现象

执行 `pnpm docs:build` 后构建失败，`vitepress-plugin-auto-frontmatter` 在写入 Clash DNS 文章时报错退出，导致新文章未出现在构建产物中，已存在的其他文章正常生成。

## 诊断过程

1. **确认构建失败** — 运行 `pnpm docs:build`，观察到错误堆栈指向 autoFrontmatter 插件在处理 Clash DNS 文章时异常退出
2. **缩小范围** — 将构建问题与文章关联，锁定为 `clash-dns-config` 文章的 frontmatter 格式问题
3. **对比现有文章模板** — 逐字段对比项目中的已有文章（如 WSL 使用 Claude Code 指南），发现两处差异：
   - `date: 2026-06-09` 缺少时分秒（规范为 `YYYY-MM-DD HH:mm:ss`）
   - `permalink: /pages/clash-dns-config` 使用 slug 命名而非 6 位 hex 值

## 根因

### 根因 ①：`date` 字段缺少时间组件

现有文章统一使用 `YYYY-MM-DD HH:mm:ss` 格式（如 `date: 2026-06-05 23:52:41`）。新文章仅写了 `date: 2026-06-09`，缺少时分秒。autoFrontmatter 插件在解析日期时因格式不一致抛出异常。

> **规范出处：** CLAUDE.md → Conventions → `frontmatter 日期：格式 YYYY-MM-DD HH:mm:ss（24 小时制）`

### 根因 ②：`permalink` 使用 slug 而非系统预期的 hex 格式

autoFrontmatter 插件会自动为每篇文章生成一个 6 位 hex 的 permalink（如 `/pages/083417`）。显式设置 `permalink: /pages/clash-dns-config` 用了 slug 形式，插件在校验时无法匹配期望的 hex 模式，触发了解析异常。

> **规范出处：** CLAUDE.md → Conventions → `permalink：统一用 /pages/<hex> 格式（autoFrontmatter 自动生成）`
>
> **_重要说明：_** 设置 `permalink` 字段并非功能上必须——autoFrontmatter 会自动生成。但若手动设置，格式必须为 `/pages/<6位hex>`（如 `/pages/58be6f`），不能使用 descriptive slug。

## 修复方案

### 修复 1：补全 `date` 字段

```diff
- date: 2026-06-09
+ date: 2026-06-09 08:00:00
```

### 修复 2：移除显式 `permalink`

```diff
- permalink: /pages/clash-dns-config
```

删除该字段后，autoFrontmatter 在构建时自动生成了 `/pages/083417`。

## 验证结果

| 检查项 | 结果 |
|--------|------|
| `pnpm docs:build` | ✅ 构建成功（4.78s）|
| 文章 HTML 产物 | ✅ 生成 `Clash DNS 配置详解.html`（26.2 KB）|
| autoFrontmatter 自动写入 | ✅ 成功注入 permalink `/pages/083417` |
| 文章标题角标 | ✅ `<titleTag>推荐</titleTag>` 正确渲染 |

## 涉及变更

### 文件变更清单

| 文件 | 变更类型 | 说明 |
|------|---------|------|
| `docs/03.网络/30.Clash/Clash DNS 配置详解.md` | 修复 | 补全 date 时间戳、删除显式 permalink |
| `docs/.vitepress/theme/components/TeekLayoutProvider.vue` | 新增 | 添加 post-mount hash 滚动处理（与本次构建修复无关，同次迭代中顺便修复了 Cloudflare Pages 的 hash 锚点问题，详见 [Cloudflare Pages 子标题 hash 锚点修复 postmortem](../postmortems/2026-06-12-cloudflare-pages-hash-anchor-fix.md)） |

### Git 记录

| 提交 | 内容 |
|------|------|
| `0b87af6` | 修复 Clash DNS 文章 frontmatter 日期和标签结构（独立修复第一阶段） |
| `630a52d` | 添加 hash 锚点滚动处理，修复 Clash DNS 文章 frontmatter（本 postmortem 对应更改的最终提交） |

## 经验教训

1. **新建文章必须严格对照模板** — CLAUDE.md 和已有文章（如 `WSL 使用 Claude Code 指南.md`）是 frontmatter 的权威参考来源
2. **`date` 字段必须包含时分秒** — 即使不知道具体时间，也应设为一个合理的固定时间（如 `08:00:00`）
3. **`permalink` 不设更安全** — autoFrontmatter 自动生成即可，手动设置只在需要兼容旧链接时有必要
4. **依赖插件理解** — autoFrontmatter 插件会根据 frontmatter 结构做解析和校验，任何格式偏差都可能阻塞构建
5. **构建是唯一有效性验证** — 项目无测试套件，`pnpm docs:build` 是 frontmatter 正确性的最终裁判

## 参考

- [Claude Code Superpowers: article-frontmatter skill](../skills/article-frontmatter.md) — 文章 frontmatter 的标准化规范
- [CLAUDE.md](../../../CLAUDE.md) — 项目约定文档
- 原始实现计划：[2026-06-09-clash-dns-config.md](../plans/2026-06-09-clash-dns-config.md)
