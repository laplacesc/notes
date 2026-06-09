---
title: Clash DNS 配置文章设计方案
date: 2026-06-09 11:15:00
titleTag: AI 设计
categories:
  - superpowers
  - specs
tags:
  - design
  - clash
  - dns
description: 将 Linux.do 论坛帖子"我终于参悟了 clash dns 配置"转化为知识库文章的设计方案。
permalink: /pages/clash-dns-config-design
---

# Clash DNS 配置文章设计方案

## 概述

将 clippings 中的论坛帖子「我终于参悟了 clash dns 配置！极致精简，无 DNS 泄露，fake-ip，redir-host 双配置」转化为知识库中文档，提炼为可复用的 Clash DNS 配置参考，加入自己的理解注释。

## 文件结构

```
docs/
├── 03.网络/                   # 新建一级分类
│   └── 30.Clash/              # 新建二级分类（按已有 2 位编排序号）
│       └── Clash DNS 配置详解.md  ← 新文章
```

- **一级分类**：`03.网络` — 与其他一级目录（`01.AI`, `02.前端`）保持编号风格
- **二级分类**：`30.Clash` — 使用 `30.` 前缀，与 `11.Claude Code`、`21.VitePress` 风格一致
- **文章文件**：`Clash DNS 配置详解.md`

## Frontmatter

```yaml
---
title: Clash DNS 配置详解
date: 2026-06-09
categories:
  - 网络
  - Clash
tags:
  - clash
  - dns
  - fake-ip
  - redir-host
  - 代理
titleTag: 推荐
description: 详细解析 Clash DNS 的 fake-ip 与 redir-host 两种模式配置，包含无 DNS 泄露的分流 DNS 架构及配套规则集。
permalink: /pages/clash-dns-config
---
```

## 文章结构（5 节）

### 1. 引言

- 简短说明本文来源与定位：通过实践总结出的 Clash DNS 配置思路
- 指明本文覆盖两种模式（fake-ip 为主，redir-host 为辅）
- 用知识库风格叙述，非论坛发帖语气

### 2. fake-ip 配置（核心章节）

- 完整 YAML 配置块
- 在每个关键段（`default-nameserver`、`nameserver-policy`、`nameserver`、`proxy-server-nameserver`、`direct-nameserver`、`fake-ip-filter`、`rules`、`rule-providers`）旁加入中文逐段注释，解释各自职责
- 说明 `#RULES` 的作用：强制走代理分流，让远程节点服务器做 DNS 解析

### 3. redir-host 配置（备选方案）

- 完整 YAML 配置块
- 精简展示（省略与原帖 fake-ip 重复的 rule-providers 部分）
- 说明适用场景：旁路由等迫不得已才用 redir-host
- 提及域名嗅探注意事项

### 4. 配置要点

从原帖 Q&A 和备注中提炼：

1. **关闭客户端 DNS 覆写** — Clash Verge 等客户端内关闭 DNS 覆写
2. **Windows 智能多宿主名称解析** — 需要关闭该功能防止 DNS 泄露
3. **QUIC 处理** — 推荐关闭 QUIC（chrome://flags/#enable-quic），避免 fake-ip 流程中触发额外 DNS 解析
4. **分流规则加载** — 使用 GitHub 上游规则源（blackmatrix7/ACL4SSR），通过 rule-providers 自动更新

### 5. 测试方法

- DNS 泄露测试：[browserleaks.com/dns](https://browserleaks.com/dns)
- 分流测试：[ip.skk.moe/split-tunnel](https://ip.skk.moe/split-tunnel)
- 简要说明各测试工具用途

## 内容转换对照

| 原帖元素 | 处理方式 |
|----------|----------|
| 论坛 frontmatter（source, author, clippings） | 移除，替换为知识库 frontmatter |
| 引言"在这之前我简直是在乱配…" | 重写为知识库风格 |
| 两套 YAML 配置 | 保留，逐段加入注释说明 |
| 论坛专属 emoji（:heart:） | 移除 |
| 论坛链接引用（#7, #15, #30） | 移除 |
| Q&A 部分 | 提炼为「配置要点」章节 |
| 更新日志 | 移除，由 Git 历史记录 |
| 论坛原帖链接 | 文末以「参考」形式标注 |
| 图片（leak-test 截图） | 移除（外部失效链接），仅保留文字说明 |
