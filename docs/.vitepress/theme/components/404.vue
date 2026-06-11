<script setup lang="ts">
import { useRouter } from "vitepress";

const router = useRouter();
</script>

<template>
  <div class="terminal-wrapper">
    <div class="noise"></div>
    <div class="overlay"></div>
    <div class="terminal">
      <h1>Error <span class="errorcode">404</span></h1>
      <p class="output">
        The page you are looking for might have been removed, had its name
        changed or is temporarily unavailable.
      </p>
      <p class="output">
        Please try to
        <a href="#" @click.prevent="router.go(-1)">go back</a>
        or
        <a href="#" @click.prevent="router.go('/')"
          >return to the homepage</a
        >.
      </p>
      <p class="output">Good luck.</p>
    </div>
  </div>
</template>

<style scoped lang="scss">
$tw: terminal-wrapper;
$t: terminal;

.#{$tw} {
  position: relative;
  width: 100%;
  height: calc(100vh - var(--vp-nav-height));
  font-family: var(--vp-font-family-mono);
  color: var(--vp-c-text-1);
  background-color: var(--vp-c-bg);
  overflow: hidden;
}

.noise {
  display: none;
}

.overlay {
  pointer-events: none;
  position: absolute;
  width: 100%;
  height: 100%;
  background: repeating-linear-gradient(
    180deg,
    rgba(0, 0, 0, 0) 0,
    rgba(0, 0, 0, 0.04) 50%,
    rgba(0, 0, 0, 0) 100%
  );
  background-size: auto 4px;
  z-index: 1;
}

.overlay::before {
  display: none;
}

.terminal {
  box-sizing: border-box;
  position: absolute;
  height: 100%;
  width: 1000px;
  max-width: 100%;
  padding: 4rem;
  text-transform: uppercase;
  z-index: 2;
}

.terminal h1 {
  font-size: 1.8rem;
  margin: 0 0 1.5rem;
  font-weight: 700;
  color: var(--vp-c-text-1);
}

.errorcode {
  color: var(--vp-c-brand-1);
}

.output {
  color: var(--vp-c-text-2);
  font-size: 1rem;
  line-height: 1.8;
  margin: 0 0 0.75rem;
}

.output::before {
  content: "> ";
  color: var(--vp-c-brand-1);
}

.output a {
  color: var(--vp-c-brand-1);
  text-decoration: none;
}

.output a::before {
  content: "[";
}

.output a::after {
  content: "]";
}

.output a:hover {
  color: var(--vp-c-brand-2);
}

@media (max-width: 768px) {
  .terminal {
    padding: 2rem;
  }

  .terminal h1 {
    font-size: 1.4rem;
  }

  .output {
    font-size: 0.875rem;
  }
}
</style>

<style lang="scss">
@keyframes scan {
  0% {
    background-position: 0 -100vh;
  }
  35%,
  100% {
    background-position: 0 100vh;
  }
}

html.dark .terminal-wrapper {
  background-color: #000000;
  background-image: radial-gradient(#11581e, #041607);
  background-repeat: no-repeat;
  background-size: cover;
  color: rgba(128, 255, 128, 0.8);
  text-shadow: 0 0 1ex rgba(51, 255, 51, 1), 0 0 2px rgba(255, 255, 255, 0.8);
}

html.dark .terminal-wrapper .noise {
  display: block;
  pointer-events: none;
  position: absolute;
  width: 100%;
  height: 100%;
  background-image: url("https://media.giphy.com/media/oEI9uBYSzLpBK/giphy.gif");
  background-repeat: no-repeat;
  background-size: cover;
  z-index: 0;
  opacity: 0.02;
}

html.dark .terminal-wrapper .overlay {
  background: repeating-linear-gradient(
    180deg,
    rgba(0, 0, 0, 0) 0,
    rgba(0, 0, 0, 0.3) 50%,
    rgba(0, 0, 0, 0) 100%
  );
  background-size: auto 4px;
}

html.dark .terminal-wrapper .overlay::before {
  display: block;
  content: "";
  pointer-events: none;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
  background-image: linear-gradient(
    0deg,
    transparent 0%,
    rgba(32, 128, 32, 0.2) 2%,
    rgba(32, 128, 32, 0.8) 3%,
    rgba(32, 128, 32, 0.2) 3%,
    transparent 100%
  );
  background-repeat: no-repeat;
  animation: scan 7.5s linear 0s infinite;
}

html.dark .terminal-wrapper .terminal h1 {
  color: rgba(128, 255, 128, 0.8);
  text-shadow: 0 0 1ex rgba(51, 255, 51, 1), 0 0 2px rgba(255, 255, 255, 0.8);
}

html.dark .terminal-wrapper .errorcode {
  color: #ffffff;
}

html.dark .terminal-wrapper .output {
  color: rgba(128, 255, 128, 0.8);
  text-shadow: 0 0 1px rgba(51, 255, 51, 0.4),
    0 0 2px rgba(255, 255, 255, 0.8);
}

html.dark .terminal-wrapper .output a {
  color: #ffffff;
}

html.dark .terminal-wrapper .output a:hover {
  text-decoration: underline;
}
</style>
