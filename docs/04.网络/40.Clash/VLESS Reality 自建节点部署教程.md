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
  --register-unsafely-without-email --agree-tos --non-interactive
```

certbot 会自动安装续期定时器（`systemctl list-timers | grep certbot`）。

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

### 4.3 替换首页

实际部署参考了 [UI/UX Pro Max 的 Developer Tools 演示](https://www.uupm.cc/demo/developer-tools)。图库只提供在线演示和提示词，没有独立下载包，因此按它的深色样式做了单文件静态页：CSS 内嵌，不依赖外部脚本、字体或图片。

先把旧的 `/var/www/html/index.html` 备份到站点目录之外，再用新文件替换它，确保 Nginx 可读（例如权限 `644`）。只替换静态文件，不需要重载 Nginx 或 Xray，也不需要改 DNS。

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

点「生成证书」得到公钥和私钥，Short ID 用面板生成的。客户端建议每个使用者单独一个 UUID，便于限额和停用。

记录这四项，客户端要用：**UUID、公钥、Short ID、SNI**。公钥不是私钥，私钥只留在服务器上。

## 6. Clash 客户端配置

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

## 7. 验证

**服务端**，确认 443 由 Xray 监听、伪装站点正常：

```bash
ss -tlnp | grep -E ':443 |:8443 '
curl -s --resolve node.example.com:443:<服务器IP> https://node.example.com/ | grep -o '<title>.*</title>'
```

第二条没带 Reality 凭据，应通过 TLS 证书校验并输出首页标题。替换首页后，再从外部浏览器打开不带端口的公网地址，确认新页面显示正常、页内链接能跳转。

**客户端**，选中节点后访问 `https://ip.sb`，出口 IP 应为 VPS 地址。

## 排障

| 现象 | 优先检查 |
| --- | --- |
| 延迟 `-1 ms` / 握手失败 | SNI 与 `servername`、公钥、Short ID、`flow` 是否逐字一致 |
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
