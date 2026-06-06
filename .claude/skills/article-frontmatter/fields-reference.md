# Frontmatter 字段速查表

## 核心字段（常用）

| 字段 | 类型 | 默认值 | 格式 / 说明 |
|------|------|--------|-------------|
| `title` | `string` | — | 文章标题 |
| `date` | `string` | — | `YYYY-MM-DD HH:mm:ss` |
| `titleTag` | `string` | — | 枚举：`原创` / `转载` / `优质` / `推荐` / `已修复` |
| `categories` | `string[]` | `[]` | 首字母大写，如 `WSL`、`VitePress` |
| `tags` | `string[]` | `[]` | 全小写连字符，如 `claude-code` |
| `description` | `string` | `null` | 50-200 字文章摘要 |
| `coverImg` | `string` | `null` | 封面图 URL |

## 排程字段

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `top` | `boolean` | `false` | 精选文章，多个 true 按 date 排序 |
| `sticky` | `number` | — | 置顶排序，值越小越靠前 |

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
