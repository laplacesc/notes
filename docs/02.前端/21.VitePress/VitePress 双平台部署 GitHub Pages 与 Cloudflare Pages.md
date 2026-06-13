---
title: VitePress 双平台部署 GitHub Pages 与 Cloudflare Pages
date: 2026-06-10 22:00:00
categories:
  - 前端
  - VitePress
tags:
  - vitepress
  - github-pages
  - cloudflare-pages
  - deployment
  - dns
description: >-
  记录 VitePress 站点同时部署到 GitHub Pages 和 Cloudflare Pages 的完整过程，包括环境变量动态切换 base
  路径、Cloudflare Pages Git 集成配置、自定义域名绑定以及双平台并行验证。
permalink: /pages/01c10b
---

## 背景与目标

本站最初仅部署于 **GitHub Pages**，访问地址为：

```bash
https://laplacesc.github.io/notes/
```

由于 GitHub Pages 的项目站点路径规则，`base` 被设置为 `/notes/`，所有静态资源路径都以此开头。

现在希望在保留 GitHub Pages 部署不变的前提下，新增 **Cloudflare Pages** 部署，并使用自定义域名：

```bash
https://notes.laplacesc.com
```

Cloudflare Pages 在绑定自定义域名后是从根路径 `/` 提供服务的，因此需要 `base` 为 `/`。

**核心要求**：一次 `git push` 同时触发两个平台的构建，互不干扰，各自产出正确的资源路径。

## 核心方案：环境变量动态 base

### 思路

VitePress 的 `base` 配置在构建时确定，我们可以通过 **环境变量** 来动态切换：

- **GitHub Actions 环境**（`GITHUB_ACTIONS=true`）→ `base = "/notes/"` —— GitHub Pages 模式
- **其他环境**（本地开发、Cloudflare Pages）→ `base = "/"` —— 从根路径提供服务

利用 GitHub Actions 内置的环境变量 `GITHUB_ACTIONS`，无需手动设置任何变量，配置文件自动感知当前运行环境。

### 代码改动

修改 `docs/.vitepress/config.ts`，在文件头部设置 base 和 siteUrl：

```typescript
const base = process.env.GITHUB_ACTIONS ? "/notes/" : "/";
const siteUrl =
  base === "/notes/"
    ? "https://laplacesc.github.io/notes/"
    : "https://notes.laplacesc.com";
```

然后将原来硬编码的 `base: "/notes/"` 改为 `base`（变量引用），favicon 路径改为模板字符串：

```typescript
// favicon
href: `${base}site/blogging-mini.svg`,
// favicon png
href: `${base}site/blogging-mini.png`,
```

sitemap 的 hostname 改为使用 `siteUrl` 变量：

```typescript
sitemap: {
  hostname: siteUrl,
  // ...
}
```

::: tip 自动感知

GitHub Actions 默认内置 `GITHUB_ACTIONS=true` 环境变量，无需在 workflow 中显式设置；本地和 Cloudflare Pages 没有此变量，自动使用 `/`。

:::

## 本地验证

修改完成后，在本地运行两种构建模式，验证产物正确：

### GitHub Pages 模式

通过设置 `GITHUB_ACTIONS=true` 模拟 GitHub Actions 环境：

```bash
GITHUB_ACTIONS=true pnpm docs:build
```

构建产物在 `docs/.vitepress/dist/` 中：

- HTML 资源路径以 `/notes/` 开头
- sitemap.xml 中域名均为 `https://laplacesc.github.io/notes/`

### Cloudflare Pages / 普通模式

不设置 `GITHUB_ACTIONS`，base 默认为 `/`：

```bash
pnpm docs:build
```

- HTML 资源路径以 `/` 开头（根路径）
- sitemap.xml 中域名均为 `https://notes.laplacesc.com`

### 验证要点

| 检查项 | GitHub Pages 模式（`GITHUB_ACTIONS=true`） | Cloudflare Pages 模式（默认） |
|--------|------------------------------------------|-----------------------------|
| favicon 路径 | `/notes/site/blogging-mini.svg` | `/site/blogging-mini.svg` |
| CSS/JS 路径 | `/notes/assets/...` | `/assets/...` |
| sitemap 域名 | `laplacesc.github.io/notes/` | `notes.laplacesc.com` |

## Cloudflare Pages 配置

### 创建项目

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入 **Workers & Pages** → **Pages** → **创建应用程序** → **连接到 Git**
3. 授权 GitHub 并选择仓库 `laplacesc/notes`

### 构建设置

| 配置项 | 值 |
|--------|-----|
| 生产分支 | `main` |
| 构建命令 | `pnpm docs:build` |
| 构建输出目录 | `docs/.vitepress/dist` |

::: tip 无需额外环境变量

改用 `GITHUB_ACTIONS` 方案后，Cloudflare Pages **不需要设置任何环境变量**。非 GitHub Actions 环境默认使用 `base = "/"`，恰好满足 Cloudflare Pages 的根路径服务要求。

:::

::: warning 注意

Cloudflare Pages 默认的 Node.js 版本可能较低，如果构建失败，在项目的环境变量中添加 `NODE_VERSION` = `24`（与项目 `package.json` 中指定的版本一致）。

:::

### 首次构建

保存配置后，Cloudflare 会自动触发首次构建。可以在 **部署** 标签页中查看构建日志，确认构建成功。

## 自定义域名绑定

1. 在 Cloudflare Pages 项目页面进入 **自定义域** 标签
2. 点击 **设置自定义域**，输入 `notes.laplacesc.com`
3. Cloudflare 会自动验证域名所有权并配置 SSL/TLS 证书

如果 `laplacesc.com` 的 DNS 托管在 Cloudflare，CNAME 记录会自动添加，无需手动操作。如果 DNS 在其他服务商，需要手动添加一条 CNAME 记录：

| 类型 | 名称 | 目标 |
|------|------|------|
| CNAME | `notes` | Cloudflare Pages 分配的域名（如 `xxx.pages.dev`） |

## 最终验证清单

部署完成后，逐一检查以下项目：

- [x] **GitHub Pages**：`https://laplacesc.github.io/notes/` —— 页面正常渲染，导航链接有效
- [x] **Cloudflare Pages**：`https://notes.laplacesc.com` —— 页面正常渲染，导航链接有效
- [x] **favicon**：两个站点均正确显示
- [x] **搜索功能**：两个站点本地搜索均正常工作
- [x] **sitemap.xml**：两个站点的 sitemap 域名分别正确指向各自的地址
- [x] **llms.txt**：两个站点的 llms.txt 均可正常访问

## 工作流程总结

整个过程无需修改 CI/CD 配置文件，利用 Cloudflare Pages 原生 Git 集成，与现有的 GitHub Actions 构建完全并行：

```bash
git push → main
├─ GitHub Actions → 自动识别 GITHUB_ACTIONS → base=/notes/ → GitHub Pages
└─ Cloudflare Pages → 无 GITHUB_ACTIONS → base=/         → notes.laplacesc.com
```

任意一次推送都会同时触发两个平台的构建，站点内容保持同步。

## 已知问题与修复

### Cloudflare Pages 子标题 hash 锚点无法定位

**现象：** 在 Cloudflare Pages 上直接访问带 `#hash` 的 URL（如 `https://notes.laplacesc.com/...文章#fake-ip-配置`），或刷新含锚点的页面时，页面停留在顶部，不滚动到对应子标题。GitHub Pages 和本地开发不受影响。

**根因：** Cloudflare Pages 的 SPA fallback（`_redirects: /* /index.html 200`）始终返回 `index.html`，此时目标页面内容尚未被 Vue 渲染到 DOM 中，浏览器的原生 hash 滚动静默失败。VitePress 的 hash 滚动逻辑仅在首次客户端导航路径中触发，SPA fallback 刷新场景不经过该路径。

**修复：** 在 `TeekLayoutProvider.vue` 中添加后挂载 hash 滚动处理器，通过 `onMounted` + `nextTick` 处理初始加载，通过 `watch(router.route.path)` 处理应用内路由切换。详情见 [Cloudflare Pages 子标题 hash 锚点修复 postmortem](../../superpowers/postmortems/2026-06-12-cloudflare-pages-hash-anchor-fix.md)。

## 参考链接

- [VitePress Site Config — base](https://vitepress.dev/reference/site-config#base)
- [Cloudflare Pages — Git Integration](https://developers.cloudflare.com/pages/get-started/git-integration/)
- [Cloudflare Pages — Custom Domains](https://developers.cloudflare.com/pages/configuration/custom-domains/)
