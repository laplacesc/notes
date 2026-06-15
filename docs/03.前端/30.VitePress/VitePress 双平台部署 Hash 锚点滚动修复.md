---
title: VitePress 双平台部署 Hash 锚点滚动修复
date: 2026-06-14 06:00:00
categories:
  - 前端
  - VitePress
tags:
  - vitepress
  - vitepress-theme-teek
  - cloudflare-pages
  - github-pages
  - 调试
  - spa
description: >-
  记录 VitePress 站点在 Cloudflare Pages SPA fallback 下两次修复 hash
  锚点滚动的完整过程——先解决"不滚动"，再解决"滚动后被导航栏遮挡"。
permalink: /pages/136fd9
---

## 背景

本笔记使用 [VitePress](https://vitepress.dev/) + [Teek](https://vp.teek.top/) 主题搭建，同时部署到 **GitHub Pages** 和 **Cloudflare Pages** 两个平台。

GitHub Pages 上所有 `#hash` 锚点导航均正常工作。但在 Cloudflare Pages 上，刷新页面的子标题跳转出现了两轮问题——先是不滚动，滚动之后又被导航栏遮挡。

两轮问题的本质都是 **SPA fallback 机制与 VitePress 客户端路由交互的时序差异**。

## 第一轮：Hash 锚点不滚动

### 问题现象

Cloudflare Pages 部署后，以下场景中页面**完全不滚动**到对应子标题：

| 场景 | GitHub Pages | Cloudflare Pages |
|------|:-----------:|:--------------:|
| 搜索结果点击子标题 | ✅ 自动滚动到目标 | ❌ 不滚动 |
| 直接访问含 hash 的 URL | ✅ 自动滚动 | ❌ 不滚动 |

### 诊断过程

#### 为什么 GitHub Pages 正常？

GitHub Pages 使用 `404.html` 作为 SPA fallback。当浏览器访问含 hash 的 URL 时：

1. GitHub Pages 返回 `404.html`（不匹配任何路由的 404 响应）
2. VitePress 客户端路由读取 `404.html`，执行 `loadPage()` 加载目标页面
3. `loadPage()` 内部在 DOM 更新后调用 `scrollTo()` 处理 hash 锚点
4. **VitePress 的 `scrollTo()` 正常触发**，滚动到对应位置

#### 为什么 Cloudflare Pages 异常？

Cloudflare Pages 使用 `_redirects` 进行 SPA fallback：

```bash
/* /index.html 200
```

当浏览器访问含 hash 的 URL 时：

1. Cloudflare Pages 直接返回 `index.html`（200 响应）
2. VitePress 客户端路由认为 " 已在首页 "，**不会触发 `loadPage()` 或 `scrollTo()`**
3. 页面首次渲染后，DOM 中的锚点元素尚未就绪
4. 浏览器原生 hash 滚动行为在内容渲染**之前**发生，被忽略
5. 最终：**页面不滚动**

### 第一轮修复方案

在 `TeekLayoutProvider.vue` 中添加兜底的 `scrollToHash()` 函数，通过 `onMounted` + `nextTick` 确保 DOM 就绪后处理 hash。

```vue
<script setup lang="ts">
import { onMounted, watch, nextTick } from "vue";
import { useRouter } from "vitepress";

const router = useRouter();

function scrollToHash() {
  if (!location.hash) return;
  const id = decodeURIComponent(location.hash).slice(1);
  const target = document.getElementById(id);
  if (target) {
    const offset =
      window.scrollY + target.getBoundingClientRect().top;
    window.scrollTo(0, offset);
  }
}

onMounted(() => {
  nextTick(() => {
    scrollToHash();
  });
});

watch(
  () => router.route.path,
  () => {
    nextTick(() => {
      scrollToHash();
    });
  }
);
</script>
```

关键设计要点：

| 要点 | 说明 |
|------|------|
| `onMounted` + `nextTick` | `onMounted` 仅保证组件自身 DOM 已挂载，但子组件渲染可能尚未完成；`nextTick` 额外等待一个 `tick` 确保完整 DOM 就绪 |
| `watch` 监听路由 `path` | 监听 `router.route.path` 而非完整 `route`，避免 hash 或 query 变化时不必要的触发 |
| 仅处理 `location.hash` | 只对 URL 中包含锚点的场景执行滚动，不影响页面间无 hash 的正常导航 |

## 第二轮：滚动后被导航栏遮挡

### 问题现象

第一轮修复部署后，子标题**能够滚动定位**，但出现了新的问题——标题被顶部固定导航栏遮挡或紧贴导航栏边缘：

| 场景 | Cloudflare Pages |
|------|:--------------:|
| 直接访问 `#hash` URL | ❌ 标题被导航栏遮挡约 64px |
| 搜索结果点击子标题 | ❌ 标题紧贴导航栏边缘 |
| 页面刷新含 hash 的 URL | ❌ 标题被导航栏遮挡 |

### 诊断过程

对比 VitePress 原生 `scrollTo()` 的实现（位于 `node_modules/vitepress/dist/client/app/router.js`）：

```js
// VitePress 原生实现
const targetTop = window.scrollY +
    target.getBoundingClientRect().top -
    getScrollOffset() +
    targetPadding;
```

VitePress 内部通过 `getScrollOffset()` 获取导航栏高度补偿，默认返回 **134**（导航栏 64px + 额外间距 70px）。而自定义 `scrollToHash()` 的公式为：

```js
// 自定义实现（有 bug）
const offset =
    window.scrollY + target.getBoundingClientRect().top - vpPaddingTop;
```

逐字段比对发现两处差异：

| 维度 | VitePress 原生 | 自定义实现（有 bug） |
|------|---------------|--------------------|
| 导航栏偏移 | `- getScrollOffset()`（默认 134） | ❌ 未减导航栏高度 |
| 目标内边距 | `+ targetPadding` | ❌ 方向相反（减而非加） |

缺少导航栏偏移导致滚动位置比正确位置高出 134px，标题自然被导航栏遮挡。

### 第二轮修复方案

导入 VitePress 的 `getScrollOffset()` 函数，将公式完全对齐。

```diff
- import { useRouter } from "vitepress";
+ import { useRouter, getScrollOffset } from "vitepress";

  function scrollToHash() {
    if (!location.hash) return;
    const id = decodeURIComponent(location.hash).slice(1);
    const target = document.getElementById(id);
    if (target) {
-     const offset =
-       window.scrollY + target.getBoundingClientRect().top - vpPaddingTop;
+     const targetTop =
+       window.scrollY +
+       target.getBoundingClientRect().top -
+       getScrollOffset() +
+       targetPadding;
-     window.scrollTo(0, offset);
+     window.scrollTo(0, targetTop);
    }
  }
```

关键变更：

| 项 | 修改前 | 修改后 |
|---|--------|--------|
| 导入 | `useRouter` | `useRouter, getScrollOffset` |
| 公式 | `absPos - padding` | `absPos - getScrollOffset() + padding` |
| 导航栏补偿 | 无 | 134px（默认） |

## 最终代码

```vue
<script setup lang="ts">
import { onMounted, watch, nextTick } from "vue";
import { useRouter, getScrollOffset } from "vitepress";

const router = useRouter();

function scrollToHash() {
  if (!location.hash) return;
  const id = decodeURIComponent(location.hash).slice(1);
  const target = document.getElementById(id);
  if (target) {
    const targetPadding = parseInt(
      window.getComputedStyle(target).paddingTop,
      10
    );
    const targetTop =
      window.scrollY +
      target.getBoundingClientRect().top -
      getScrollOffset() +
      targetPadding;
    window.scrollTo(0, targetTop);
  }
}

onMounted(() => {
  nextTick(() => {
    scrollToHash();
  });
});

watch(
  () => router.route.path,
  () => {
    nextTick(() => {
      scrollToHash();
    });
  }
);
</script>
```

## 验证结果

| 测试场景 | GitHub Pages | Cloudflare Pages |
|---------|:-----------:|:--------------:|
| 直接访问无 hash URL | ✅ 正常 | ✅ 正常 |
| 直接访问含 `#hash` URL | ✅ 标题在导航栏下方完整可见 | ✅ 标题在导航栏下方完整可见 |
| 刷新含 hash 页面 | ✅ 标题在导航栏下方完整可见 | ✅ 标题在导航栏下方完整可见 |
| 搜索 → 点击子标题结果 | ✅ 标题在导航栏下方完整可见 | ✅ 标题在导航栏下方完整可见 |
| 页面间导航（无 hash） | ✅ 正常 | ✅ 正常 |
| 页面间导航（带 hash） | ✅ 标题在导航栏下方完整可见 | ✅ 标题在导航栏下方完整可见 |

## 经验教训

1. **SPA fallback + hash 是一个经典陷阱** — 任何使用 SPA fallback 的平台（Cloudflare Pages、Netlify、Vercel）都可能遇到此问题，因为 `index.html` 返回时目标内容尚未渲染。`200` 响应而非 `404` 响应意味着 VitePress 不会触发 `loadPage()` → `scrollTo()` 路径。
2. **`onMounted` 不等同于 DOM 就绪** — Vue 的 `onMounted` 仅保证组件自身 DOM 已挂载，但子组件渲染可能尚未完成；需要 `nextTick` 额外等待一个渲染周期。
3. **兜底代码必须与原生实现逐字段对齐** — 平台差异兼容代码容易偏离上游实现，偏移计算更是如此：不仅要确认公式结构一致，还需验证每个操作符的方向（加/减）是否匹配。
4. **VitePress 的 `getScrollOffset()` 已内置导航栏高度感知** — 自定义滚动逻辑应优先复用该函数（它是 `vitepress` 包的公开导出 API），而非凭直觉硬编码偏移值。
5. **`scrollOffset` 的默认值 134 包含 padding 余量** — 不仅包含导航栏高度（64px），还预留了 70px 呼吸空间，确保标题可见区域舒适。

## 相关阅读

- [VitePress Router 源码](https://github.com/vuejs/vitepress/blob/main/src/client/app/router.ts) — `scrollTo` 与 `loadPage` 实现
- [VitePress getScrollOffset 源码](https://github.com/vuejs/vitepress/blob/main/src/client/app/utils.ts) — 偏移量计算逻辑
- [VitePress 双平台部署 GitHub Pages 与 Cloudflare Pages](https://notes.laplacesc.com/pages/01c10b) — 同一站点的双平台部署方案
- [TeekLayoutProvider.vue](https://github.com/laplacesc/notes/blob/main/docs/.vitepress/theme/components/TeekLayoutProvider.vue) — 修复所在的组件文件
