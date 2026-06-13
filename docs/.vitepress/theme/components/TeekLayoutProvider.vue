<script setup lang="ts" name="TeekLayoutProvider">
import { onMounted, nextTick, watch } from "vue";
import { useRouter, getScrollOffset } from "vitepress";
import Teek from "vitepress-theme-teek";
import CalendarCard from "./CalendarCard.vue";
import ContributeChart from "./ContributeChart.vue";
import NotFound from "./404.vue";

const router = useRouter();

/**
 * Scroll to the element matching the current URL hash, after DOM settles.
 * This fixes hash-anchor scroll on page refresh for Cloudflare Pages,
 * where the initial static HTML (index.html) doesn't contain the target page content.
 */
function scrollToHash() {
  if (!location.hash) return;
  const id = decodeURIComponent(location.hash).slice(1);
  const target = document.getElementById(id);
  if (target) {
    // 与 VitePress 内部 scrollTo 保持一致的计算公式:
    // targetTop = absPos - getScrollOffset() + targetPadding
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

// Handle initial page load: scroll after Vue has rendered the page content
onMounted(() => {
  nextTick(() => {
    scrollToHash();
  });
});

// Handle in-app route changes (e.g. clicking a nav link with hash)
watch(
  () => router.route.path,
  () => {
    nextTick(() => {
      scrollToHash();
    });
  }
);
</script>

<template>
  <Teek.Layout>
    <template #teek-archives-top-before>
      <ContributeChart />
    </template>

    <template #teek-home-card-my-after>
      <CalendarCard />
    </template>

    <template #not-found>
      <NotFound />
    </template>
  </Teek.Layout>
</template>

<style lang="scss">
.tk-my.is-circle-bg {
  margin-bottom: 20px;

  .tk-my__avatar.circle-rotate {
    margin-top: 200px;
  }
}
</style>
