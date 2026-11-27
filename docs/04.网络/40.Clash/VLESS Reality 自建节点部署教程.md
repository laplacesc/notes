---
title: VLESS Reality 自建节点部署教程
date: 2026-07-06 08:00:00
categories:
  - 网络
  - Clash
tags:
  - clash
  - vless
  - reality
  - xray
  - proxy
top: true
description: 从零在 VPS 上部署 VLESS + Reality 节点：SSH 免密、3x-ui、Cloudflare 子域名、Nginx 伪装站点、Clash 客户端配置与排障。
permalink: /pages/1c34c3
---

# VLESS Reality 自建节点部署教程

> 参考：[自建代理节点教程——零基础从头搭建你的专属 VLESS+Reality 节点](https://linux.do/t/topic/1750919/1)。本文按实际部署过程整理，仅用于合规的网络学习与自用测试，使用前请自行确认当地法律法规和服务商条款。文中 IP、UUID、密钥均为占位符。

## 架构

```text
Clash ── VLESS + Reality (443) ──► Xray ──► 目标网站
                                     │
              非 Reality 流量 / 探测 ─┴──► Nginx 127.0.0.1:8443（真实 HTTPS 站点）
```

Reality 让握手看起来像访问一个真实站点。这里把 Target 指向本机 Nginx，并用自己域名的有效证书，探测者看到的是一个正常网页，而不是借用的第三方站点。

## 准备

| 项目 | 要求 |
| --- | --- |
| VPS | 境外，Ubuntu 24.04，443 和 80 端口空闲 |
| 域名 | 托管在 Cloudflare，用于一个子域名（下文用 `node.example.com`） |
| 客户端 | Clash Verge / Mihomo 系 |

## 1. 配置 SSH 免密登录

本机生成并安装公钥（已有 `~/.ssh/id_ed25519` 可跳过生成）：

```bash
ssh-keygen -t ed25519
ssh-copy-id -i ~/.ssh/id_ed25519.pub root@<服务器IP>
```

验证无需密码：

```bash
ssh -o BatchMode=yes root@<服务器IP> 'id -un'
```

## 2. 安装 3x-ui

3x-ui 是 Xray 的 Web 面板。脚本在 stdin 不是终端时自动进入无人值守模式，面板用 Let's Encrypt IP 证书走 HTTPS，用户名、密码、端口和路径随机生成：

```bash
export XUI_NONINTERACTIVE=1 XUI_SSL_MODE=ip
bash <(curl -Ls https://raw.githubusercontent.com/mhsanaei/3x-ui/master/install.sh)
```

凭据保存在 `/etc/x-ui/install-result.env`（权限 600），也可用 `x-ui settings` 查看。安装日志含初始密码，用完删除：

```bash
shred -u <安装日志>
```

> 面板端口默认对公网开放。建议在服务商防火墙限制来源，或只通过 SSH 隧道访问。

## 3. 添加 Cloudflare DNS 记录

在 Cloudflare 为子域名添加 A 记录指向 VPS：

| 类型 | 名称 | 内容 | 代理状态 |
| --- | --- | --- | --- |
| A | `node` | VPS IP | **仅 DNS（灰云）** |

**必须关闭代理。** Reality 要直连源站，开橙云会让 443 握手失败。

在服务器上确认解析生效：

```bash
getent hosts node.example.com
```

## 4. 部署 Nginx 伪装站点

### 4.1 安装并申请证书

```bash
apt install -y nginx certbot
certbot certonly --webroot -w /var/www/html -d node.example.com \
  --deploy-hook 'systemctl reload nginx' \
  --register-unsafely-without-email --agree-tos --non-interactive
```

`certbot.timer`（`systemctl list-timers certbot.timer`）负责定期续期。`--deploy-hook` 会在续期成功后重载 Nginx，让它使用新证书。不要关闭公网 TCP `80`，否则 Let’s Encrypt 无法完成 HTTP-01 验证。

### 4.2 站点配置

在 `/var/www/html/index.html` 放一个普通静态页，然后创建 `/etc/nginx/sites-available/node.example.com`：

```nginx
# 80：只放行证书续期，其余跳转 HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name node.example.com;
    location /.well-known/acme-challenge/ { root /var/www/html; }
    location / { return 301 https://$host$request_uri; }
}

# Reality 的 Target：只监听本机回环
server {
    listen 127.0.0.1:8443 ssl http2;
    server_name node.example.com;

    ssl_certificate     /etc/letsencrypt/live/node.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/node.example.com/privkey.pem;
    ssl_protocols TLSv1.3;

    server_tokens off;
    root /var/www/html;
    index index.html;
    location / { try_files $uri $uri/ =404; }
}
```

启用并检查：

```bash
rm -f /etc/nginx/sites-enabled/default
ln -s /etc/nginx/sites-available/node.example.com /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

> Ubuntu 24.04 的 Nginx 是 1.24，不支持独立的 `http2 on;` 指令，要写在 `listen` 行里（如上）。

如果是在已有站点上把 `0.0.0.0:8443` 改成 `127.0.0.1:8443`，旧监听可能阻止热重载。先 `nginx -t`，再 `systemctl restart nginx`，用 `ss -ltn 'sport = :8443'` 确认只监听回环。重启期间 HTTPS 回落会短暂不可用。

已有证书若是用 `nginx` 插件申请的，先启用上面的 `80` 站点，再切换为 `webroot`（Certbot ≥ 2.3）：

```bash
certbot reconfigure --cert-name node.example.com --webroot -w /var/www/html \
  --installer null --deploy-hook 'systemctl reload nginx' --run-deploy-hooks
```

`reconfigure` 通过 Let’s Encrypt 测试环境验证后才保存设置，不替换当前证书。`--installer null` 禁用旧的 Nginx 安装插件，由续期钩子负责重载。

### 4.3 替换首页

从 [StyleKit 模板库](https://www.stylekit.top/zh/templates) 选择模板，在详情页点击「下载完整项目」。当前首页使用 [余白博客（Yohaku Blog）](https://www.stylekit.top/zh/templates/yohaku-blog)，直接使用[官方 ZIP](https://www.stylekit.top/api/templates/yohaku-blog/download) 中的模板源码，不另写页面。

1. 解压 ZIP，在 `next.config.ts` 的 `nextConfig` 中设置 `output: 'export'` 和 `trailingSlash: true`。把 `app/page.tsx` 的重定向改为 `export { default } from './templates/yohaku-blog/page';`，让模板直接显示在 `/`。
2. 在项目目录运行 `pnpm install` 和 `pnpm build`，生成静态产物 `out/`。
3. 将 `/var/www/html/index.html` 备份到站点目录之外。先上传 `out/_next/static/` 到 `/var/www/html/_next/static/`，再用 `out/index.html` 替换首页，并将原始 `LICENSE` 发布为 `stylekit-license.txt`。确保 Nginx 可读取文件（例如 `644`）和遍历目录（例如 `755`）。服务器不需要运行 Node.js，也不需要重载 Nginx 或 Xray，或修改 DNS。

公网访问 `https://node.example.com/`，不要加 `:8443`。`8443` 只监听服务器的 `127.0.0.1`，不是公网端口。

## 5. 创建 VLESS + Reality 入站

登录 3x-ui 面板，「入站列表」→「添加入站」：

| 配置项 | 值 |
| --- | --- |
| 协议 | `vless` |
| 监听端口 | `443` |
| 传输 | `TCP` |
| 安全 | `Reality` |
| uTLS | `chrome` |
| Target | `127.0.0.1:8443` |
| SNI | `node.example.com` |
| Flow | `xtls-rprx-vision` |

点「生成证书」生成 Reality 的 X25519 公私钥对，Short ID 也用面板生成。这个按钮不会签发 Nginx 的 HTTPS 证书。

记录这四项，客户端要用：**UUID、公钥、Short ID、SNI**。公钥不是私钥，私钥只留在服务器上。

### 5.1 给朋友添加独立账号

每位朋友使用独立的 UUID，便于单独限额或停用，不影响其他人。在 3x-ui 面板打开「客户端」→「添加客户端」，填写以下字段：

| 分组 | 字段 | 填法 |
| --- | --- | --- |
| 基本 | 邮箱 | 填一个未被其他客户端使用的邮箱标识，例如 `friend@example.com`，方便在列表里区分账号。 |
| 基本 | 关联入站（必填） | 勾选第 5 节创建的 VLESS + Reality 入站。如果列表里只有这一个入站，点「全选」即可；有多个时只勾选要共享的入站。 |
| 凭据 | UUID | 使用为这个客户端新生成的 UUID，不要复用自己的。 |
| 凭据 | Flow（必填） | 选择 `xtls-rprx-vision`。这是本教程的 VLESS + Reality 入站使用的传输优化模式，客户端的 `flow` 也要填同一个值。 |

保存后，从面板复制这位朋友的 `vless://` 节点链接，按第 6 节转换成 Clash 订阅。私下发送专属订阅链接，不要共享自己的节点链接或服务端私钥。

### 5.2 Xray 内核版本与握手兼容性

在 3x-ui 的「Xray 更新」里查看内核版本。排查升级后断连时，先区分下面两项检查；它们与面板版本、Nginx 证书签发方式无关。

| Xray-core 版本 | Reality 握手差异 | 部署注意点 |
| --- | --- | --- |
| `v26.6.27` | 本文部署中，FlClash 可以正常代理。 | 可作为短期回退版本，不建议为了兼容长期停留在旧内核。 |
| `v26.7.11`、`v26.7.28` | [未填写 `minClientVer` 时默认要求 `26.3.27`](https://github.com/XTLS/Xray-core/commit/af7eb68028732a8ee3c0e5d6ab2b8a657bb2e770)。Mihomo `v1.19.34` 在 Reality 握手中上报 `1.8.2`，会被拒绝。 | 这里比较的不是 Mihomo 的发行版本。若必须暂留这两个版本，可显式设 `minClientVer: "0.0.0"` 解除该版本门槛；不要把它当成新版握手失败的通用修复。 |
| `v26.9.9`、`v26.9.30` | 不再默认设置 `minClientVer`，但[客户端的 TLS `ClientHello` 必须带 `X25519MLKEM768` 的 `key_share`](https://github.com/XTLS/REALITY/blob/8cdf7bf9c7f0/tls.go#L214-L238)，只有普通 `X25519` 不够。 | 检查客户端实际使用的 TLS 指纹及配置，见第 6.3 节。改 `minClientVer` 不会补上这个 `key_share`。 |
| `v26.10.21`、`v26.10.31`、`v26.11.9` | [仍有](https://github.com/XTLS/REALITY/blob/4bb46b2afd8b/tls.go#L215-L239) `X25519MLKEM768` 握手检查，也未恢复默认 `minClientVer`。 | [v26.10.21](https://github.com/XTLS/Xray-core/releases/tag/v26.10.21) 更新了内置根证书，[v26.10.31](https://github.com/XTLS/Xray-core/releases/tag/v26.10.31) 默认关闭 MPTCP。选择内核时兼顾安全修复和实际客户端验证，不要仅凭版本号判断能否连接。 |

**不用换证书。** 这里的 `X25519MLKEM768` 是 TLS 密钥交换组，不是证书类型。普通 HTTPS 访问由 `target`（本机 Nginx）提供第 4 节的 Let’s Encrypt 证书；Reality 客户端则用自己的握手校验机制认证服务端。普通 TLS 的 [`allowInsecure` 弃用](https://xtls.github.io/config/transports/tls.html)与这两项兼容性检查无关。

## 6. Clash 客户端配置

### 6.1 推荐：用 SubBoost 转换订阅

使用自建的 [SubBoost](https://subboost.laplacesc.com/) 将 3x-ui 导出的 VLESS 节点链接转换成 Clash 配置：

1. 在「快捷模式」找到「节点链接」输入框，粘贴从 3x-ui 复制的 `vless://` 链接，点「导入此源」。如果拿到的是订阅 URL，则粘贴到「订阅链接」输入框。
2. 选择「精简版」模板，点「生成配置」，再点「生成订阅链接」。
3. 将生成的订阅 URL 导入使用 Mihomo 内核的 Clash 客户端。也可以点「下载配置」，在客户端本地导入 YAML。

节点链接和生成的订阅 URL 都应视为凭据。给朋友转换时只导入对方的节点，不要把自己的节点混进去，也不要公开分享链接。

使用要求 `X25519MLKEM768` 的 Xray 内核时，核对 **SubBoost 最终输出的 YAML** 是否包含第 6.3 节的选项。若订阅输出没有保留该选项，下载 YAML、补上后从客户端本地导入。

### 6.2 备选：手动配置 YAML

```yaml
proxies:
  - name: "my-reality"
    type: vless
    server: node.example.com
    port: 443
    uuid: <UUID>
    flow: xtls-rprx-vision
    tls: true
    udp: true
    network: tcp
    reality-opts:
      public-key: <公钥>
      short-id: <Short ID>
    servername: node.example.com
    client-fingerprint: chrome

proxy-groups:
  - name: "节点选择"
    type: select
    proxies:
      - my-reality
      - DIRECT

rules:
  - DOMAIN-SUFFIX,cn,DIRECT
  - GEOIP,CN,DIRECT
  - MATCH,节点选择
```

已有完整配置时，只合并 `proxies` 和 `proxy-groups`，保留原有规则。

| 字段 | 说明 |
| --- | --- |
| `server` | 域名或 IP |
| `servername` | 必须与服务端 SNI 一致 |
| `flow` | 必须与服务端一致 |
| `reality-opts.public-key` | 公钥，不是私钥 |

> 如果本机 Clash 开了 fake-ip，把节点域名加入 `fake-ip-filter`，否则可能解析成假地址。不想处理时，`server` 直接写 IP，`servername` 仍写域名。

### 6.3 新版 Xray 的客户端设置

**FlClash / Mihomo：** FlClash `v0.9.5` 内置的 Mihomo `v1.19.34` 支持 `X25519MLKEM768`，[但默认会从 Reality 握手中移除它](https://github.com/MetaCubeX/mihomo/blob/v1.19.34/component/tls/reality.go)。保留节点的 `client-fingerprint: chrome`，在现有 `reality-opts` 中加入 [`support-x25519mlkem768: true`](https://wiki.metacubex.one/config/proxies/tls/#reality-optssupport-x25519mlkem768)，与 `public-key`、`short-id` 同级。不要为此更换公钥、Short ID 或关闭证书校验。

**Shadowrocket（小火箭）：** 在「编辑节点」的 TCP/TLS 指纹设置中，选择明确标有 `X25519MLKEM768` 的指纹。仅更新 App 或只改全局指纹不一定有效。[3x-ui #6596](https://github.com/MHSanaei/3x-ui/issues/6596) 既有改节点指纹后恢复的反馈，也有改后仍失败的个案；[#6668](https://github.com/MHSanaei/3x-ui/issues/6668) 记录了同一节点在多个其他客户端正常、仅小火箭失败的现象。

## 7. 验证

**服务端**，确认 443 由 Xray 监听、伪装站点正常：

```bash
ss -tlnp | grep -E ':443 |:8443 '
curl -s --resolve node.example.com:443:<服务器IP> https://node.example.com/ | grep -o '<title>.*</title>'
```

第二条没带 Reality 凭据，应通过 TLS 证书校验并输出首页标题。替换首页后，再从外部浏览器打开不带端口的公网地址，确认新页面显示正常、页内链接能跳转。

**客户端**，选中节点后访问 `https://ip.sb`，出口 IP 应为 VPS 地址。

更换内核后，用实际使用的每个客户端分别选中该节点、发起代理请求并核对出口 IP。仅首页可打开、端口可连接或另一个客户端可用，都不能证明当前客户端的 Reality 握手成功。第 5.2 节的新版本差异来自源码和上游报告，不能代替在本部署上的升级验证。

## 排障

| 现象 | 优先检查 |
| --- | --- |
| 延迟 `-1 ms` / 握手失败 | SNI 与 `servername`、公钥、Short ID、`flow` 是否逐字一致 |
| 升级 Xray 后握手失败 | 先对照第 5.2 节区分 `minClientVer` 和 `X25519MLKEM768`；若只有小火箭失败，先检查节点自己的 TLS 指纹。 |
| 改过服务端 SNI 后旧配置失效 | 客户端 `servername` 必须同步更新 |
| 域名解析到 `198.18.x.x` | Clash fake-ip，见第 6 节提示 |
| 域名连不上、IP 能连 | Cloudflare 记录是否误开橙云 |
| 怀疑 443 被封 | 服务器上 `tcpdump -i eth0 port 443 -c 20`，客户端发起连接时收不到包，说明流量没到服务器，应换 IP 或机房 |
| 替换 Xray 内核 | 3x-ui 用独立二进制 `/usr/local/x-ui/bin/xray-linux-amd64`，要先 `x-ui stop` 再替换 |

## 常用命令

```bash
x-ui status                          # 面板状态
x-ui restart                         # 重启面板与 Xray
x-ui settings                        # 查看面板凭据
/usr/local/x-ui/bin/xray-linux-amd64 version
nginx -t && systemctl reload nginx
certbot renew --dry-run               # 验证证书续期
```
