# Clash DNS 配置文章 实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 将 clippings 中的 Clash DNS 配置帖子转化为知识库文章，创建新的「网络 / Clash」分类目录。

**架构：** 这是纯内容任务——创建 `docs/03.网络/30.Clash/` 目录结构，写入一篇标准 frontmatter + 5 章节的 Markdown 文章，验证构建无错后提交。

**技术栈：** VitePress + vitepress-theme-teek、Markdown、YAML

---

### 任务 1：创建目录结构和文章

**文件：**
- 创建：`docs/03.网络/30.Clash/Clash DNS 配置详解.md`

- [ ] **步骤 1：创建目录结构**

运行：
```bash
mkdir -p /Users/jxwu/IdeaProjects/notes/docs/03.网络/30.Clash/
```
预期：目录创建成功，无报错。

- [ ] **步骤 2：写入完整文章**

写入 `/Users/jxwu/IdeaProjects/notes/docs/03.网络/30.Clash/Clash DNS 配置详解.md`，内容包含 frontmatter 和 5 个章节。

文章全文如下：

```markdown
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

# Clash DNS 配置详解

Clash 的 DNS 配置是代理体验的关键一环——配好了能无感分流、无 DNS 泄露；配错了轻则国内网站打不开，重则 DNS 泄露到国外。本文基于实战总结，整理出一套兼顾清晰与精简的配置方案，覆盖 **fake-ip** 和 **redir-host** 两种模式。

以下配置用系统代理和 TUN 模式均可，但强烈建议使用 TUN 模式。

## fake-ip 配置

fake-ip 是 Clash 推荐的 DNS 模式。它通过给客户端返回一个虚拟 IP，将 DNS 解析延迟到流量真正转发的那一刻，从而更精确地决定走代理还是直连。

> **前置操作：**
>
> 1. 关闭 Clash Verge 等客户端的 **DNS 覆写**（内置 DNS 功能）
> 2. Windows 用户需 [关闭智能多宿主名称解析](https://blog.canmoe.com/posts/windows-dns-leak/#%E6%99%BA%E8%83%BD%E5%A4%9A%E5%AE%BF%E4%B8%BB%E5%90%8D%E7%A7%B0%E8%A7%A3%E6%9E%90)，防止 DNS 泄露

```yaml
dns:
  enable: true
  ipv6: false
  enhanced-mode: fake-ip

  # 0. 引导 DNS：仅用于解析后面所有 DOH 服务器的域名
  # 用纯 IP，不依赖任何上游解析
  default-nameserver:
    - 119.29.29.29
    - 223.5.5.5

  # 1. 策略分流：明确匹配的域名走指定的 DNS
  nameserver-policy:
    "geosite:cn,private,apple":
      - https://doh.pub/dns-query
      - https://dns.alidns.com/dns-query
    "*.linux.do": "https://xxx.ddd.oaifree.com/query-dns"
    "linux.do": "https://xxx.ddd.oaifree.com/query-dns"

  # 2. 全局默认 DNS：未命中的域名默认走国外 DNS
  # 加上 #RULES 后缀，强制匹配分流规则
  # 由于 1.1.1.1 不匹配任何规则，会走到 MATCH，由远程节点解析
  nameserver:
    - "https://1.1.1.1/dns-query#RULES"
    - "https://8.8.8.8/dns-query#RULES"

  # 3. 节点 DNS：专门用于解析代理服务器自身的域名
  # 必须使用国内可直连的 DNS，否则节点域名无法解析
  proxy-server-nameserver:
    - 119.29.29.29
    - 223.5.5.5

  # 4. 回退直连 DNS：走了直连规则后，最终的 DNS 查询源
  # 与 nameserver-policy 中 CN 的策略一致
  direct-nameserver:
    - https://doh.pub/dns-query
    - https://dns.alidns.com/dns-query

  # 即使配置了 direct-nameserver，nameserver-policy 的优先级更高
  direct-nameserver-follow-policy: true

  fake-ip-range: 198.18.0.0/16
  fake-ip-filter:
    - "*.lan"
    - "*.local"
    - "*.arpa"
    - "time.*.com"
    - "ntp.*.com"
    - "+.market.xiaomi.com"
    - "localhost.ptlogin2.qq.com"
    - "*.msftncsi.com"
    - "www.msftconnecttest.com"
```

结合上述 DNS 配置，配套的分流规则如下：

```yaml
rules:
  - GEOSITE,private,DIRECT           # 局域网域名直连
  - GEOIP,private,DIRECT,no-resolve  # 局域网 IP 直连
  - RULE-SET,Telegram,📲 电报消息
  - RULE-SET,Apple,🎯 全球直连
  - DOMAIN-SUFFIX,linux.do,🐧 Linux.do
  - GEOSITE,CN,🎯 全球直连
  - RULE-SET,AllProxy,🚀 节点选择
  - GEOIP,CN,🎯 全球直连            # 此处会触发 DNS 查询，不加 no-resolve，否则 QQ 看不了图片
  - MATCH,🚀 节点选择

rule-providers:
  Telegram:
    type: http
    behavior: classical
    url: "https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Telegram/Telegram_No_Resolve.yaml"
    format: yaml
    path: ./ruleset/Telegram.yaml
    interval: 86400

  Apple:
    type: http
    behavior: classical
    url: "https://cdn.jsdelivr.net/gh/ACL4SSR/ACL4SSR@master/Clash/Providers/Apple.yaml"
    format: yaml
    path: ./ruleset/Apple.yaml
    interval: 86400

  AllProxy:
    type: http
    behavior: domain
    url: "https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Global/Global_Domain.yaml"
    format: yaml
    path: ./ruleset/AllProxy.yaml
    interval: 86400
```

## redir-host 配置

redir-host 模式是 Clash 的传统 DNS 模式。不推荐作为首选，仅适用于旁路由等 fake-ip 存在兼容性问题的场景。

> 注意：OpenClash 会自动添加域名嗅探，若手动使用此配置记得开启域名嗅探功能。

```yaml
dns:
  enable: true
  ipv6: false
  enhanced-mode: redir-host

  default-nameserver:
    - 119.29.29.29
    - 223.5.5.5

  nameserver-policy:
    "geosite:cn,private,apple":
      - https://doh.pub/dns-query
      - https://dns.alidns.com/dns-query
    "*.linux.do": "https://xxx.ddd.oaifree.com/query-dns"
    "linux.do": "https://xxx.ddd.oaifree.com/query-dns"

  nameserver:
    - "https://1.1.1.1/dns-query#RULES"
    - "https://8.8.8.8/dns-query#RULES"

  proxy-server-nameserver:
    - 119.29.29.29
    - 223.5.5.5

  direct-nameserver:
    - https://doh.pub/dns-query
    - https://dns.alidns.com/dns-query

  direct-nameserver-follow-policy: true
```

redir-host 模式的 rules 和 rule-providers 与 fake-ip 配置相同，此处不再重复。

## 配置要点

### 关闭客户端 DNS 覆写

Clash Verge / Clash Meta 等客户端内置的 DNS 覆写会与配置中的 DNS 段冲突。在客户端设置中关闭此功能，确保 `dns` 配置块生效。

### Windows 智能多宿主名称解析

Windows 的智能多宿主名称解析（Smart Multi-Homed Name Resolution）会绕过 Clash 的 DNS 拦截，导致 DNS 泄露。按 [此指南](https://blog.canmoe.com/posts/windows-dns-leak/#%E6%99%BA%E8%83%BD%E5%A4%9A%E5%AE%BF%E4%B8%BB%E5%90%8D%E7%A7%B0%E8%A7%A3%E6%9E%90) 关闭。

### QUIC 处理

原则上不需要关闭 QUIC，因为配置中的 DNS 默认在远程节点解析。但开启 QUIC 会导致 fake-ip 流程中必定触发一次额外的 DNS 解析。推荐在 `chrome://flags/#enable-quic` 中关闭 QUIC。

### 规则集自动更新

通过 `rule-providers` 加载远程规则集，每天自动更新（`interval: 86400`）。当前使用的上游源：
- [blackmatrix7/ios_rule_script](https://github.com/blackmatrix7/ios_rule_script)（Telegram、AllProxy）
- [ACL4SSR/ACL4SSR](https://github.com/ACL4SSR/ACL4SSR)（Apple）

## 测试方法

配置完成后，用以下工具验证效果：

| 测试目的 | 工具 | 说明 |
|---------|------|------|
| DNS 泄露测试 | [BrowserLeaks DNS](https://browserleaks.com/dns) | 主要测试工具，检测 DNS 查询是否泄露到境外 |
| DNS 泄露测试（备选） | [ipleak.net](https://ipleak.net/) | 另一常用的 DNS 泄露检测站点 |
| 分流测试 | [ip.skk.moe/split-tunnel](https://ip.skk.moe/split-tunnel) | 验证国内/国外流量是否按预期分流 |

## 参考

本文整理自 [我终于参悟了 clash dns 配置！极致精简，无 DNS 泄露，fake-ip，redir-host 双配置](https://linux.do/t/topic/1999640) ，原作者 bling-yshs。
```

- [ ] **步骤 3：验证构建**

运行：
```bash
cd /Users/jxwu/IdeaProjects/notes && pnpm docs:build
```
预期：构建成功，输出包含新的 `/03.%E7%BD%91%E7%BB%9C/30.Clash/` 文章，无 error 或 warning。

- [ ] **步骤 4：提交**

```bash
git add docs/03.网络/30.Clash/Clash\ DNS\ 配置详解.md
git commit -m "docs(文章): 添加 Clash DNS 配置详解文章

将 linux.do 论坛帖子转化为知识库文档，提炼为 5 节结构化文章。
新建 03.网络/30.Clash 分类目录。

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```
