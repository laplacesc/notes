import { defineTeekConfig } from "vitepress-theme-teek/config";
import { version } from "vitepress-theme-teek/es/version";

export const teekConfig = defineTeekConfig({
  teekHome: true, // 是否开启博客首页
  vpHome: false, // 是否隐藏 VP 首页
  loading: false, // 页面加载 Loading 动画配置，如果为 boolean，则控制是否启用，如果为字符串，则指定加载 Loading 动画的文案
  sidebarTrigger: true, // 是否开启侧边栏折叠功能
  // 文章默认的作者信息
  author: {
    name: "laplacesc", // 作者名称
    link: "https://github.com/laplacesc/notes", // 点击作者名称后跳转的链接
  },
  banner: {
    enabled: true, // 是否启用 Banner
    name: "不理之山の笔记", // Banner 标题，默认读取 vitepress 的 title 属性
    bgStyle: "fullImg", // Banner 背景风格：pure 为纯色背景，partImg 为局部图片背景，fullImg 为全屏图片背景
    imgSrc: ["/wallpaper/chainsaw-man.jpg"], // Banner 图片链接。bgStyle 为 partImg 或 fullImg 时生效
    descStyle: "types", // 描述信息风格：default 为纯文字渲染风格（如果 description 为数组，则取第一个），types 为文字打印风格，switch 为文字切换风格
    description: ["积跬步以至千里"], // 描述信息
  },
  post: {
    coverImgMode: "full", // 文章封面图模式
  },
  // 博主信息，显示在首页左边第一个卡片。
  blogger: {
    name: "不理之山", // 博主昵称
    slogan: "山在那里，码在这里", // 博主签名
    avatar: "/site/lain.jpg", // 博主头像
    shape: "circle-rotate", // 头像风格：square 为方形头像，circle 为圆形头像，circle-rotate 可支持鼠标悬停旋转，circle-rotate-last 将会持续旋转 59s
    circleBgImg: "/wallpaper/www.hacg.me_15.jpg", // 背景图片
    circleBgMask: true, // 遮罩层是否显示，仅当 shape 为 circle 且 circleBgImg 配置时有效
    circleSize: 100, // 头像大小
    color: "#ffffff", // 字体颜色
    // 状态，仅当 shape 为 circle 相关值时有效
    status: {
      icon: "", // 状态图标
      size: 24, // 图标大小
      title: "困", // 鼠标悬停图标的提示语
    },
  },
  footerInfo: {
    copyright: {
      createYear: 2026,
      suffix: "laplacesc",
    },
  },
  codeBlock: {
    copiedDone: (TkMessage) => TkMessage.success("复制成功！"),
  },
  articleShare: { enabled: true },
  vitePlugins: {
    sidebarOption: {
      initItems: false,
    },
    autoFrontmatter: true,
    autoFrontmatterOption: {
      permalinkType: "rules",
      permalinkRules: [
        { folderName: "01.AI", rule: "/$path/$uuid6" }, // 使用一级目录的哈希混合随机数，$path 最终等于 guide
        { folderName: "02.前端", rule: "/$path/$uuid6" },
      ],
    },
  },
});
