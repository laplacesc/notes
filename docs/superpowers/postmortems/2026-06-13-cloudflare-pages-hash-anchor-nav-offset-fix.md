# Postmortem：Cloudflare Pages 子标题滚动被导航栏遮挡

> **日期：** 2026-06-13  
> **涉及文件：** `docs/.vitepress/theme/components/TeekLayoutProvider.vue`  
> **触发场景：** Cloudflare Pages 部署后，含 `#hash` 锚点的页面刷新时子标题会滚动定位但被顶部导航栏遮挡  
> **严重程度：** 中（不影响内容展示，影响导航体验）

---

## 问题现象

部署到 Cloudflare Pages 后，以下场景中页面会滚动到对应子标题锚点，但标题**被顶部固定导航栏遮挡**：

1. **直接访问含 hash 的 URL** — 如 `<url>#fake-ip-配置`，刷新后自动滚动到该锚点，但标题被导航栏遮住约 64px
2. **搜索结果点击** — 本地搜索点击某子标题结果时，页面滚动后标题紧贴导航栏下方边缘

**对比表现：**

| 平台 | 场景 | 结果 |
|------|------|------|
| GitHub Pages | 直接访问含 hash URL | ✅ 标题完整可见，距导航栏有合适间距 |
| GitHub Pages | 页面刷新 | ✅ 标题完整可见 |
| GitHub Pages | 搜索点击子标题 | ✅ 标题完整可见 |
| 本地开发 | 以上所有场景 | ✅ 标题完整可见 |
| Cloudflare Pages | 直接访问含 hash URL | ❌ 标题被导航栏遮挡或紧贴导航栏边缘 |
| Cloudflare Pages | 页面刷新 | ❌ 标题被导航栏遮挡 |
| Cloudflare Pages | 搜索点击子标题 | ❌ 标题紧贴导航栏下方边缘 |

## 诊断过程

1. **确认修复前问题** — 此前已解决 Cloudflare Pages SPA fallback 下 hash 锚点不滚动的问题（详见[前序 postmortem](2026-06-12-cloudflare-pages-hash-anchor-fix.md)），新版本部署后发现子标题虽然会滚动定位，但位置不正确——被顶部固定导航栏遮挡
2. **对比 VitePress 原生实现** — 阅读 VitePress 源码 `node_modules/vitepress/dist/client/app/router.js` 中的 `scrollTo()` 函数，发现其偏移计算公式为：

   ```js
   const targetTop = window.scrollY +
       target.getBoundingClientRect().top -
       getScrollOffset() +
       targetPadding;
   ```

   其中 `getScrollOffset()` 默认返回 **134**（导航栏高度 + 额外间距），而自定义函数中缺失此偏移量。

3. **比对差异** — 自定义 `scrollToHash()` 的公式为 `absPos - targetPadding`，而 VitePress 原生为 `absPos - getScrollOffset() + targetPadding`，存在两处差异：

   | 维度 | VitePress 原生 | 自定义实现（有 bug） |
   |------|---------------|--------------------|
   | 导航栏偏移 | `- getScrollOffset()`（默认 134） | ❌ 未减导航栏高度 |
   | 目标内边距 | `+ targetPadding` | ❌ 方向相反（减而非加） |

## 根因

### 根因 ①：偏移公式遗漏 `getScrollOffset()`

VitePress 内置了 `getScrollOffset()` 函数，当未显式配置 `themeConfig.scrollOffset` 时默认返回 **134**。该值由两部分构成：

- 固定导航栏高度：`--vp-nav-height: 64px`
- 额外间距：默认 70px 的呼吸空间

自定义 `scrollToHash()` 完全未调用该函数，缺少了这 134px 的偏移量，导致滚动位置比正确位置高出了 134px，标题因此被导航栏遮挡。

### 根因 ②：目标 `paddingTop` 处理方向错误

VitePress 原生 `scrollTo` 对目标的 `paddingTop` 做**加法**，含义是"在目标标题的顶部内边距之上再向下偏移，提供额外呼吸空间"。而自定义函数做了**减法**，含义变成了"裁掉目标标题的顶部内边距"，这进一步向反方向加剧了位置偏差。

### 根因 ③：前序修复不够彻底

前序修复（见 `2026-06-12-cloudflare-pages-hash-anchor-fix.md`）专注于解决"能否滚动"的问题，采用了看似"与 VitePress 内部一致"的偏移策略，但未逐字段比对公式，导致导航栏偏移量被遗漏。

## 修复方案

在 `TeekLayoutProvider.vue` 中修改 `scrollToHash()` 函数，导入 VitePress 的 `getScrollOffset()` 并完全对齐其公式：

```diff
- import { useRouter } from "vitepress";
+ import { useRouter, getScrollOffset } from "vitepress";

  function scrollToHash() {
    if (!location.hash) return;
    const id = decodeURIComponent(location.hash).slice(1);
    const target = document.getElementById(id);
    if (target) {
-     const vpPaddingTop = parseInt(
+     const targetPadding = parseInt(
        window.getComputedStyle(target).paddingTop,
        10
      );
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

### 关键变更

| 项 | 修改前 | 修改后 | 说明 |
|---|--------|--------|------|
| 导入 | `useRouter` | `useRouter, getScrollOffset` | 引入 VitePress 内部偏移计算函数 |
| 偏移公式 | `absPos - vpPaddingTop` | `absPos - getScrollOffset() + targetPadding` | 对齐 VitePress 原生实现 |
| 导航栏补偿 | 无 | `getScrollOffset()`（默认 134px） | 确保标题不被导航栏遮挡 |
| 内边距方向 | 减法（- padding） | 加法（+ padding） | 提供恰当呼吸空间 |

## 验证结果

| 测试场景 | Cloudflare Pages | GitHub Pages | 本地开发 |
|---------|:----------------:|:------------:|:--------:|
| 直接访问 `#hash` URL | ✅ 标题在导航栏下方完整可见 | ✅ 无回归 | ✅ 无回归 |
| 刷新含 hash 页面 | ✅ 标题在导航栏下方完整可见 | ✅ 无回归 | ✅ 无回归 |
| 搜索→点击子标题结果 | ✅ 标题在导航栏下方完整可见 | ✅ 无回归 | ✅ 无回归 |
| 页面间导航（无 hash） | ✅ 正常 | ✅ 正常 | ✅ 正常 |
| 页面间导航（带 hash） | ✅ 标题在导航栏下方完整可见 | ✅ 无回归 | ✅ 无回归 |
| 构建验证 | ✅ `pnpm docs:build` 通过 | ✅ 通过 | ✅ 通过 |

## 涉及变更

| 文件 | 变更类型 | 说明 |
|------|---------|------|
| `docs/.vitepress/theme/components/TeekLayoutProvider.vue` | 修复 | `scrollToHash()` 公式对齐 VitePress 原生 `scrollTo`，导入 `getScrollOffset` |

### Git 记录

| 提交 | 内容 |
|------|------|
| (本次提交) | 修复 Cloudflare Pages 子标题滚动被导航栏遮挡问题：`scrollToHash()` 偏移公式对齐 VitePress 原生实现 |

## 经验教训

1. **兜底代码也需要与原生实现对齐** — 为特定平台差异添加的兼容代码容易偏离上游实现，应始终逐字段比对原版源码确保等价性
2. **偏移计算最容易在"视觉上基本可用"时被忽略** — 前序修复实现了"能滚动"后，偏移偏差容易被遗漏；需要逐个字段比对公式而非凭感觉评估
3. **VitePress 的 `getScrollOffset()` 已内置导航栏高度感知** — 自定义滚动逻辑应优先复用该函数而非凭直觉实现偏移计算；它是 `vitepress` 包公开导出的 API
4. **`scrollOffset` 的默认值 134 包含 padding 余量** — 不仅包含导航栏高度（64px），还预留了 70px 间距，确保标题有呼吸空间
5. **引入外部函数时，注意符号一致性** — 即使逻辑正确，方向（加/减）一旦相反就会产生可见偏差；建议对照参考实现逐符号验证

## 参考

- [VitePress Router 源码](https://github.com/vuejs/vitepress/blob/main/src/client/app/router.ts) — `scrollTo` 与 `loadPage` 实现
- [VitePress getScrollOffset 源码](https://github.com/vuejs/vitepress/blob/main/src/client/app/utils.ts) — 偏移量计算逻辑
- [前序修复 Postmortem](2026-06-12-cloudflare-pages-hash-anchor-fix.md) — Cloudflare Pages hash 锚点无法定位的首轮修复
- [TeekLayoutProvider.vue](../.vitepress/theme/components/TeekLayoutProvider.vue) — 修复所在的组件文件
