import Teek from "vitepress-theme-teek";
import TeekLayoutProvider from "./components/TeekLayoutProvider.vue";

// Teek 在线主题包引用（需安装 Teek 在线版本）
import "vitepress-theme-teek/index.css";

// vp-plus 样式
import "vitepress-theme-teek/theme-chalk/tk-aside.css";
import "vitepress-theme-teek/theme-chalk/tk-blockquote.css";
import "vitepress-theme-teek/theme-chalk/tk-brand-color-animation.css";
import "vitepress-theme-teek/theme-chalk/tk-code-block-mobile.css";
import "vitepress-theme-teek/theme-chalk/tk-container-bg.css";
import "vitepress-theme-teek/theme-chalk/tk-container-flow.css";
import "vitepress-theme-teek/theme-chalk/tk-container-fluid.css";
import "vitepress-theme-teek/theme-chalk/tk-container-icon.css";
import "vitepress-theme-teek/theme-chalk/tk-container-left.css";
import "vitepress-theme-teek/theme-chalk/tk-container-var.css";
import "vitepress-theme-teek/theme-chalk/tk-container.css";
import "vitepress-theme-teek/theme-chalk/tk-doc-fade-in.css";
import "vitepress-theme-teek/theme-chalk/tk-doc-h1-gradient.css";
import "vitepress-theme-teek/theme-chalk/tk-index-rainbow.css";
import "vitepress-theme-teek/theme-chalk/tk-mark.css";
import "vitepress-theme-teek/theme-chalk/tk-nav-blur.css";
import "vitepress-theme-teek/theme-chalk/tk-nav-search-button.css";
import "vitepress-theme-teek/theme-chalk/tk-nav-switch-button.css";
import "vitepress-theme-teek/theme-chalk/tk-nav-translation.css";
import "vitepress-theme-teek/theme-chalk/tk-nav.css";
import "vitepress-theme-teek/theme-chalk/tk-scrollbar.css";
import "vitepress-theme-teek/theme-chalk/tk-sidebar.css";
import "vitepress-theme-teek/theme-chalk/tk-table.css";

// tk-plus 样式
import "vitepress-theme-teek/theme-chalk/tk-banner-desc-gradient.css";
import "vitepress-theme-teek/theme-chalk/tk-banner-full-img-scale.css";
import "vitepress-theme-teek/theme-chalk/tk-copy-banner.css";
import "vitepress-theme-teek/theme-chalk/tk-fade-up-animation.css";
import "vitepress-theme-teek/theme-chalk/tk-home-card-hover.css";

import "./styles/code-bg.scss";
import "./styles/iframe.scss";
import "lxgw-wenkai-webfont/style.css"
import "./my-fonts.css"

export default {
  extends: Teek,
  Layout: TeekLayoutProvider,
};
