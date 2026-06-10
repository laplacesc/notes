import { defineConfig } from "vitepress";
import llmstxt from "vitepress-plugin-llms";
import { teekConfig } from "./teekConfig";

const description = [
  "欢迎来到 不理之山の笔记",
  "这是个人的日常随笔文档。",
].toString();

const base = process.env.VITEPRESS_BASE || "/notes/";
const siteUrl =
  base === "/notes/"
    ? "https://laplacesc.github.io/notes/"
    : "https://notes.laplacesc.com";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  extends: teekConfig,
  title: "不理之山の笔记",
  description: description,
  cleanUrls: true,
  lastUpdated: true,
  lang: "zh-CN",
  base,
  srcExclude: ["superpowers/**/*"],
  head: [
    [
      "link",
      {
        rel: "icon",
        type: "image/svg+xml",
        href: `${base}site/blogging-mini.svg`,
      },
    ],
    [
      "link",
      { rel: "icon", type: "image/png", href: `${base}site/blogging-mini.png` },
    ],
    ["meta", { property: "og:type", content: "website" }],
    ["meta", { property: "og:locale", content: "zh-CN" }],
    ["meta", { property: "og:title", content: "不理之山の笔记" }],
    ["meta", { property: "og:site_name", content: "不理之山の笔记" }],
    ["meta", { property: "og:image", content: "" }],
    ["meta", { property: "og:url", content: "" }],
    ["meta", { property: "og:description", description }],
    ["meta", { name: "description", description }],
    ["meta", { name: "author", content: "laplacesc" }],
    // 禁止浏览器缩放
    // [
    //   "meta",
    //   {
    //     name: "viewport",
    //     content: "width=device-width,initial-scale=1,minimum-scale=1.0,maximum-scale=1.0,user-scalable=no",
    //   },
    // ],
    ["meta", { name: "keywords", description }],
  ],
  markdown: {
    // 开启行号
    lineNumbers: true,
    image: {
      // 默认禁用；设置为 true 可为所有图片启用懒加载。
      lazyLoading: true,
    },
    // 更改容器默认值标题
    container: {
      tipLabel: "提示",
      warningLabel: "警告",
      dangerLabel: "危险",
      infoLabel: "信息",
      detailsLabel: "详细信息",
    },
  },
  sitemap: {
    hostname: siteUrl,
    transformItems: (items) => {
      const permalinkItemBak: typeof items = [];
      // 使用永久链接生成 sitemap
      const permalinks = (globalThis as any).VITEPRESS_CONFIG.site.themeConfig
        .permalinks;
      items.forEach((item) => {
        const permalink = permalinks?.map[item.url];
        if (permalink)
          permalinkItemBak.push({ url: permalink, lastmod: item.lastmod });
      });
      return [...items, ...permalinkItemBak];
    },
  },
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    logo: "/site/blogging-mini.svg",
    darkModeSwitchLabel: "主题",
    sidebarMenuLabel: "菜单",
    returnToTopLabel: "返回顶部",
    lastUpdatedText: "上次更新时间",
    outline: {
      level: [2, 4],
      label: "本页导航",
    },
    docFooter: {
      prev: "上一页",
      next: "下一页",
    },
    nav: [
      { text: "首页", link: "/" },
      {
        text: "AI",
        items: [{ text: "Claude Code 指南", link: "/pages/58be6f" }],
      },
      {
        text: "前端",
        items: [{ text: "VitePress", link: "/pages/022430" }],
      },
      {
        text: "碎片",
        items: [
          { text: "Git 备忘清单", link: "/pages/64bae9" },
          { text: "Claude Code 插件 & 技能", link: "/pages/19d7f4" },
        ],
      },
      {
        text: "功能",
        items: [
          { text: "归档", link: "/archives" },
          { text: "清单", link: "/articleOverview" },
          { text: "分类", link: "/categories" },
          { text: "标签", link: "/tags" },
        ],
      },
      { text: "关于", link: "/personal" },
    ],
    socialLinks: [
      {
        icon: "github",
        link: "https://github.com/laplacesc/notes",
      },
    ],
    search: {
      provider: "local",
    },
    editLink: {
      text: "在 GitHub 上编辑此页",
      pattern: "https://github.com/laplacesc/notes/edit/main/docs/:path",
    },
  },
  vite: {
    plugins: [llmstxt() as any],
  },
  // transformHtml: (code, id, context) => {
  //   if (context.page !== "404.md") return code;
  //   return code.replace("404 | ", "");
  // },
});
