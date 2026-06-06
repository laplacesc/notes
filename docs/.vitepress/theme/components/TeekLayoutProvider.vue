<script setup lang="ts" name="TeekLayoutProvider">
import Teek from "vitepress-theme-teek";
import CalendarCard from "./CalendarCard.vue";
import ContributeChart from "./ContributeChart.vue";
import NotFound from "./404.vue";

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
