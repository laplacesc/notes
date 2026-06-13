# Postmortem：Cloudflare Pages 子标题 hash 锚点无法定位

> **日期：** 2026-06-12  
> **涉及文件：** `docs/.vitepress/theme/components/TeekLayoutProvider.vue`  
> **触发场景：** Cloudflare Pages 部署后，直接访问含 `#hash` 的 URL 或刷新页面时子标题不滚动定位  
> **严重程度：** 中（不影响内容展示，影响导航体验）

---

## 问题现象

部署到 Cloudflare Pages 后，以下场景中页面不滚动到对应的子标题锚点：

1. **直接访问含 hash 的 URL** — 如 `https://notes.laplacesc.com/03.网络/30.Clash/Clash%20DNS%20配置详解#fake-ip-配置`
2. **在含锚点的页面刷新** — 浏览器找回页面内容后停留在顶部，不滚动到 hash 对应的标题位置
3. **搜索结果点击** — 本地搜索点击某条结果为的子标题时，页面不滚动到对应位置

**对比表现：**

| 平台 | 场景 | 结果 |
|------|------|------|
| GitHub Pages | 直接访问含 hash URL | ✅ 正常滚动 |
| GitHub Pages | 页面刷新 | ✅ 正常滚动 |
| GitHub Pages | 搜索点击子标题 | ✅ 正常滚动 |
| 本地开发 | 以上所有场景 | ✅ 正常滚动 |
| Cloudflare Pages | 直接访问含 hash URL | ❌ 不滚动 |
| Cloudflare Pages | 页面刷新 | ❌ 不滚动 |
| Cloudflare Pages | 搜索点击子标题 | ❌ 不滚动 |

## 诊断过程

1. **定位触发场景** — 发现仅 Cloudflare Pages 出现此问题，GitHub Pages 和本地开发均正常 → 排除 VitePress/Teek 自身 bug
2. **分析差异点** — Cloudflare Pages 通过 SPA fallback（`_redirects: /* /index.html 200`）对所有路径返回 `index.html`，由客户端 JS 接管路由并渲染正确页面
3. **跟踪渲染时序** — 浏览器在 `index.html` 加载后立即检测 hash 并试图滚动到对应元素，但此时目标页面内容**尚未由 Vue 渲染到 DOM 中** → 浏览器静默失败
4. **审查 VitePress 滚动逻辑** — VitePress 客户端的 `scrollTo()` 在 `loadPage()` 中通过 `nextTick → requestAnimationFrame` 执行，但**仅在首次页面加载的导航路径中触发**，刷新场景（已有完整 `index.html`）不经过该路径
5. **验证假设** — 在浏览器控制台手动执行 `document.getElementById('fake-ip-配置')`，发现刷新后短时间内返回 `null`，等待数百毫秒后为有效元素 → 证实时序问题

## 根因

```
浏览器加载 index.html
  └─ 检查 location.hash → '#fake-ip-配置'
  └─ 查找 document.getElementById('fake-ip-配置') → null（Vue 尚未渲染）
  └─ 静默失败，页面停留在顶部
  └─ (数百毫秒后) Vue mount → 路由跳转 → 真实页面渲染 → #fake-ip-配置 出现
  └─ 但此时没有任何代码再触发 hash 滚动
```

根本原因有两个层面：

### 根因 ①：Cloudflare Pages SPA fallback 的固有行为

Cloudflare Pages 通过 `_redirects` 配置实现 SPA fallback：所有路径都返回 `index.html`，再由前端路由渲染对应页面。这与 GitHub Pages 的 `404.html` fallback 机制不同——GitHub 在渲染 404 页面后会触发完整的客户端导航，而 Cloudflare 的 `200` 回退直接以 `index.html` 作为响应体。

### 根因 ②：VitePress 的 hash 滚动仅在首次导航路径中触发

VitePress 的 `scrollTo(target, hash)` 调用链为 `loadPage() → nextTick → scrollTo`，该逻辑仅在**客户端首次从根路径导航到目标页面时**执行。当 `index.html` 已包含完整 SPA 运行时且路由通过 `enhanceApp` 中 `processPermalinkNotFoundWhenFirstLoaded()` 的 `router.go()` 自动切换时，hash 滚动不触发。

### 根因 ③：没有兜底机制

Vue 组件挂载完成后（此时目标标题已在 DOM 中），没有任何代码检测 `location.hash` 并执行滚动。

## 修复方案

在 `TeekLayoutProvider.vue` 中添加一个**后挂载 hash 滚动处理器**，覆盖所有场景：

```vue
<script setup lang="ts">
import { onMounted, nextTick, watch } from "vue";
import { useRouter } from "vitepress";

const router = useRouter();

function scrollToHash() {
  if (!location.hash) return;
  const id = decodeURIComponent(location.hash).slice(1);
  const target = document.getElementById(id);
  if (target) {
    // 复用 VitePress 内部相同的偏移计算逻辑
    const vpPaddingTop = parseInt(
      window.getComputedStyle(target).paddingTop,
      10
    );
    const offset =
      window.scrollY + target.getBoundingClientRect().top - vpPaddingTop;
    window.scrollTo(0, offset);
  }
}

// 场景 A：初始加载/刷新 — onMounted 确保 Vue 组件已挂载
onMounted(() => {
  nextTick(() => {
    scrollToHash();
  });
});

// 场景 B：应用内路由跳转 — watch 响应路由变化
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

### 关键设计决策

| 决策 | 方案 | 原因 |
|------|------|------|
| 监听时机 | `onMounted` | 确保 Vue 组件树已挂载，DOM 中存在目标元素 |
| DOM 就绪保障 | `nextTick` | 等待 Vue 完成当前渲染周期，避免获取到未更新的 DOM |
| 路由变化监听 | `watch(router.route.path)` | 捕获 SPA 导航后的 hash 滚动需求，区别于首屏加载 |
| 偏移计算 | `getBoundingClientRect + paddingTop` | 与 VitePress 内部 `scrollTo` 实现一致，兼容固定导航栏 |

## 验证结果

| 测试场景 | Cloudflare Pages | GitHub Pages | 本地开发 |
|---------|:----------------:|:------------:|:--------:|
| 直接访问 `#hash` URL | ✅ 滚动到子标题 | ✅ 无回归 | ✅ 无回归 |
| 刷新含 hash 页面 | ✅ 滚动到子标题 | ✅ 无回归 | ✅ 无回归 |
| 搜索→点击子标题结果 | ✅ 滚动到子标题 | ✅ 无回归 | ✅ 无回归 |
| 页面间导航（无 hash） | ✅ 正常 | ✅ 正常 | ✅ 正常 |
| 页面间导航（带 hash） | ✅ 滚动到子标题 | ✅ 无回归 | ✅ 无回归 |

## 涉及变更

| 文件 | 变更类型 | 说明 |
|------|---------|------|
| `docs/.vitepress/theme/components/TeekLayoutProvider.vue` | 修复 | 新增 `scrollToHash()` 函数 + `onMounted` + `watch` 路由监听 |
| `docs/public/_redirects` | 已有 | SPA fallback 配置（非本次修改） |

### Git 记录

| 提交 | 内容 |
|------|------|
| `630a52d` | 添加 hash 锚点滚动处理，修复 Clash DNS 文章 frontmatter（同次迭代包含两个修复；Clash DNS 前文修复详见 [Clash DNS 文章 frontmatter 修复 postmortem](../postmortems/2026-06-12-clash-dns-frontmatter-fix.md)） |

## 经验教训

1. **SPA fallback + hash 是一个经典陷阱** — 任何使用 SPA fallback 的平台（Cloudflare Pages、Netlify、Vercel）都可能遇到此问题，因为 `index.html` 返回时目标内容尚未渲染
2. **`onMounted` 不等同于 DOM 就绪** — Vue 的 `onMounted` 仅保证组件自身 DOM 已挂载，但子组件渲染可能尚未完成；需要 `nextTick` 额外等待一个渲染周期
3. **路由监听选用 `router.route.path` 而非完整 `route`** — 避免在 `hash` 或 `query` 变化时不必要的触发，只关注页面切换
4. **跨平台差异是有效的调试线索** — GitHub Pages 正常 + Cloudflare Pages 异常的组合，直接指向 SPA fallback 机制的差异
5. **在 `enhanceApp` 阶段修改路由后缺乏钩子** — Teek 的 `processPermalinkNotFoundWhenFirstLoaded` 在 `enhanceApp` 中通过 `router.go()` 切换路由，但该阶段组件尚未挂载，后续无自动 hash 滚动的钩子

## 参考

- [Cloudflare Pages SPA Fallback 配置](https://developers.cloudflare.com/pages/configuration/serving-pages/#single-page-application-spa-rendering)
- [VitePress Router 源码](https://github.com/vuejs/vitepress/blob/main/src/client/app/router.ts) — `scrollTo` 与 `loadPage` 实现
- [vitepress-theme-teek LayoutProvider](../.vitepress/theme/components/TeekLayoutProvider.vue) — 修复所在的组件文件
