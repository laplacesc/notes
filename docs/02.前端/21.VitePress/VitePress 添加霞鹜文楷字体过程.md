---
title: VitePress 添加霞鹜文楷字体过程
date: 2026-06-06 10:55:00
titleTag: 原创
categories:
  - VitePress
  - 前端
tags:
  - vitepress
  - lxgw-wenkai
  - webfont
  - css
  - font-face
coverImg: https://laplacesc.github.io/picx-images-hosting/20260605/image.et5roplvb.webp
permalink: /866a4f/10ba56
---

## 背景

本笔记使用 [VitePress](https://vitepress.dev/) + [Teek](https://vp.teek.top/) 主题搭建。为了提升阅读体验，决定将默认的 Inter 字体替换为 [霞鹜文楷](https://github.com/chawyehsu/lxgw-wenkai-webfont)（LXGW WenKai）系列字体。

## 方案对比

### 方案一：本地 TTF 文件（最终舍弃）

最初尝试将 `.ttf` 字体文件放入 `docs/public/fonts/`，通过自定义 `@font-face` 声明引用。

```css
@font-face {
  font-family: "LXGWWenKai";
  src: url("/fonts/LXGWWenKai-Regular.ttf") format("truetype");
  font-display: swap;
}
```

**问题：**

- 单个 TTF 文件约 25MB，总大小超 400MB
- `format('ttf')` 是无效的格式值，正确应为 `format('truetype')`，容易误写
- 字体加载阻塞渲染关键路径
- Git 仓库体积膨胀

### 方案二：lxgw-wenkai-webfont npm 包（最终采用）

使用社区维护的 [lxgw-wenkai-webfont](https://github.com/chawyehsu/lxgw-wenkai-webfont) 包，字体文件为 **WOFF2** 格式，采用 **unicode-range 分片**策略。

**优点：**

- WOFF2 采用 Brotli 压缩，体积远小于 TTF
- 分片加载：浏览器只下载当前页面需要的字符子集
- `font-display: swap` 自带，加载失败时无缝回退
- 无需手动管理 `@font-face` 声明

## 实施步骤

### 1. 安装依赖

```bash
pnpm add lxgw-wenkai-webfont
```

### 2. 引入样式文件

编辑 `docs/.vitepress/theme/index.ts`，在 Teek 主题样式之后引入字体包样式和自定义变量：

```ts
import "lxgw-wenkai-webfont/style.css";
import "./my-fonts.css";
```

::: tip 顺序说明

先引入包样式（定义 `@font-face`），再引入自定义变量（定义 `--vp-font-family-*`）。CSS 变量是惰性求值的，实际顺序不影响渲染结果，但语义上更清晰。

:::

### 3. 创建字体变量文件

新建 `docs/.vitepress/theme/my-fonts.css`：

```css
:root {
  --vp-font-family-base: "LXGW WenKai", sans-serif;
  --vp-font-family-mono: "LXGW WenKai Mono", monospace;
}
```

### 4. 构建验证

```bash
pnpm build
```

构建后效果：

- `@font-face` 声明自动随包注入到 CSS 中
- WOFF2 字体文件输出到 `.vitepress/dist/assets/`，带 hash 指纹
- 无额外字体文件体积污染仓库

## 关键知识

### CSS 字体格式值

| 字体格式 | CSS 格式值           | 说明                      |
| -------- | -------------------- | ------------------------- |
| TTF      | `format('truetype')` | ❌ 不要用 `format('ttf')` |
| OTF      | `format('opentype')` | 与 TTF 格式相近           |
| WOFF     | `format('woff')`     | 开放字体格式 1.0          |
| WOFF2    | `format('woff2')`    | Brotli 压缩，推荐         |

### 字体族命名

包中的 `@font-face` 使用带空格的完整名称：

- `'LXGW WenKai'` — 正文/UI 字体
- `'LXGW WenKai Mono'` — 等宽/代码字体

CSS `font-family` 中引用时需加引号（因为包含空格）。

### 回退字体（Generic Family Keywords）

```css
font-family: "LXGW WenKai", sans-serif;
```

- `sans-serif`：无衬线字体，作为正文最终回退
- `monospace`：等宽字体，作为代码字体最终回退

这两个是 CSS 通用字体族关键字，确保**所有自定义字体都加载失败时**，浏览器至少能用系统同风格字体显示。

### unicode-range 分片加载

lxgw-wenkai-webfont 的 CSS 将每个字重的字体拆分为多个子集文件：

```css
@font-face {
  font-family: "LXGW WenKai";
  font-weight: 400;
  src: url("./files/lxgwwenkai-regular-subset-4.woff2") format("woff2");
  unicode-range: U+1f1e9-1f1f5, U+1f1f7-1f1ff, ...;
}
@font-face {
  font-family: "LXGW WenKai";
  font-weight: 400;
  src: url("./files/lxgwwenkai-regular-subset-5.woff2") format("woff2");
  unicode-range: U+fee3, U+fef3, ...;
}
/* 更多子集… */
```

浏览器根据当前页面内容匹配 `unicode-range`，只下载需要的分片。这是性能优化的关键策略。

## 补充说明

### 也曾尝试 Maple Mono

曾尝试将 Maple Mono（MapleMonoNormal-NF-CN）作为回退字体，后因维护简化考量而放弃。切换到 npm 字体包后，Maple Mono 也不再需要。

### font-display: swap

包中所有 `@font-face` 已内置 `font-display: swap`，意味着：

1. 页面先使用回退字体立即渲染（FOUT — Flash of Unstyled Text）
2. 自定义字体下载完成后自动替换
3. 用户不会经历字体加载期间的可视文本空白（避免 FOIT — Flash of Invisible Text）

### 关于 preload

TTF 本身体积较大，preload 反而会阻塞关键渲染路径。WOFF2 配合 `font-display: swap` + unicode-range 分片后，不建议手动 preload，浏览器会自主按需加载。

## 参考链接

- [lxgw-wenkai-webfont GitHub](https://github.com/chawyehsu/lxgw-wenkai-webfont)
- [CSS Fonts Module Level 4 - @font-face](https://www.w3.org/TR/css-fonts-4/#font-face-rule)
- [unicode-range MDN](https://developer.mozilla.org/zh-CN/docs/Web/CSS/@font-face/unicode-range)
- [font-display MDN](https://developer.mozilla.org/zh-CN/docs/Web/CSS/@font-face/font-display)
- [VitePress Theme Customization](https://vitepress.dev/guide/custom-theme)
