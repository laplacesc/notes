---
title: VLESS Reality 自建节点搭建备忘
date: 2026-07-06 00:00:00
categories:
  - 网络
  - Clash
tags:
  - clash
  - vless
  - reality
  - xray
  - proxy
description: 整理自 VLESS + Reality 自建节点教程，记录 VPS 准备、3x-ui 配置、Clash Verge 客户端配置、域名回落方案和常见排障要点。
---

> 来源：[自建代理节点教程——零基础从头搭建你的专属 VLESS+Reality 节点](https://linux.do/t/topic/1750919/1)
>
> 本文是个人备忘整理，不是逐字转载。仅用于合规网络学习、自用测试和配置记录。不同地区对代理、跨境网络访问、服务器托管等行为有不同法律要求，实际使用前应自行确认并遵守当地法律法规和服务商条款。

## 适用场景

这份备忘用于从零搭建一个自用的 VLESS + Reality 节点，并将节点接入 Clash Verge / Mihomo 生态。整体链路如下：

```text
本地设备 ── VLESS + Reality 加密流量 ── VPS / Xray ── 目标网站
```

Reality 的核心思路是让代理握手表现得更像正常 TLS 访问。常见做法是使用一个真实可访问的网站作为 SNI / Target，从而降低协议特征暴露的概率。

## 准备清单

| 项目      | 说明                                         |
| ------- | ------------------------------------------ |
| VPS     | 境外 VPS，系统建议 Ubuntu 24.04                   |
| SSH 客户端 | macOS / Linux 终端、Windows Terminal、PuTTY 均可 |
| 面板      | 使用 3x-ui 管理 Xray 入站和客户端                    |
| 客户端     | Windows 可先用 v2rayN 测试，再转 Clash Verge       |
| 可选域名    | 用于自建真实站点并配置回落，增强伪装可信度                      |

需要提前记录：

- 服务器 IP
- root 密码或 SSH 密钥
- 服务商控制台地址和密码
- 3x-ui 面板用户名、密码、端口和随机路径
- VLESS 链接中的 UUID、公钥、Short ID、SNI、Target

## 1. 购买并初始化 VPS

VPS 配置要求不高，重点是线路质量和 IP 可用性。购买完成后建议重装为 Ubuntu 24.04，然后先测试网络连通性。

```bash
ping 你的服务器IP
```

判断方式：

- 能收到响应，延迟大致在 50～300 ms：可以继续。
- `Request timed out` 或 100% 丢包：IP 可能不可用，需要考虑换 IP 或换机房。

> 注意：`ping` 只说明 ICMP 通，不代表 TCP 443 一定可用。后续如果协议握手失败，需要进一步抓包确认。

SSH 登录服务器：

```bash
ssh root@你的服务器IP
```

登录后先更新系统：

```bash
apt update && apt upgrade -y
```

## 2. 安装 3x-ui 面板

3x-ui 是 Xray 的 Web 管理面板，可以避免手写复杂 JSON 配置。

```bash
bash <(curl -Ls https://raw.githubusercontent.com/mhsanaei/3x-ui/master/install.sh)
```

安装过程中按提示设置：

- 用户名
- 密码
- 面板端口（可使用默认端口）
- 访问路径（一般会生成随机路径）

安装完成后，面板地址通常类似：

```text
https://你的IP:面板端口/随机路径
```

检查服务状态：

```bash
x-ui status
```

看到 `Active: active (running)` 表示面板正在运行。

## 3. 配置 VLESS + Reality 入站

进入 3x-ui 面板后，依次打开「入站列表」→「添加入站」。核心配置如下：

| 配置项    | 建议值                 | 说明               |
| ------ | ------------------- | ---------------- |
| 协议     | `vless`             | VLESS 协议         |
| 监听端口   | `443`               | 伪装为常规 HTTPS 流量   |
| 传输     | `TCP` / `RAW`       | 按面板选项选择          |
| 安全     | `Reality`           | 启用 Reality       |
| uTLS   | `chrome`            | 模拟 Chrome TLS 指纹 |
| Target | `www.apple.com:443` | 伪装目标，需与 SNI 匹配   |
| SNI    | `www.apple.com`     | 与 Target 域名一致    |
| Flow   | `xtls-rprx-vision`  | 客户端侧也要保持一致       |

点击「生成证书」生成 Reality 公钥、私钥等参数，然后保存入站。

新增客户端时，建议每个使用者单独生成 UUID。这样可以单独统计流量、设置限额或停用账号。

创建完成后复制分享链接，格式大致如下：

```text
vless://UUID@服务器IP:443?type=tcp&security=reality&pbk=公钥&fp=chrome&sni=www.apple.com&sid=ShortID&flow=xtls-rprx-vision
```

## 4. 先用 v2rayN 验证节点

在正式写 Clash 配置前，可以先用 v2rayN 导入 VLESS 链接验证协议是否可用。

基本步骤：

1. 下载并解压 [v2rayN](https://github.com/2dust/v2rayN/releases)。
2. 以管理员身份运行 `v2rayN.exe`。
3. 右键托盘图标，选择从剪贴板导入分享链接。
4. 将节点设为活动服务器。
5. 系统代理选择自动配置。
6. 路由模式可先用全局模式验证。
7. 如需接管更多应用流量，启用 TUN 模式。

验证方式：

- 浏览器访问 `https://www.google.com`。
- 打开 `https://ip.sb`，确认出口 IP 是 VPS 所在地区。

如果延迟显示 `-1 ms`，通常表示协议层握手失败，不是单纯网络不通。可优先检查 SNI / Target、Reality 公钥、Short ID、Flow 和客户端内核兼容性。

## 5. 转换为 Clash Verge 配置

Clash Verge Rev 使用 Mihomo 内核，适合日常分流。推荐手写最小可用配置，再逐步合并规则。

```yaml
proxies:
  - name: "节点名称"
    type: vless
    server: <服务器IP>
    port: 443
    uuid: <你的UUID>
    flow: xtls-rprx-vision
    tls: true
    udp: true
    network: tcp
    reality-opts:
      public-key: <公钥>
      short-id: <Short ID>
    servername: www.apple.com
    client-fingerprint: chrome

proxy-groups:
  - name: "节点选择"
    type: select
    proxies:
      - 节点名称
      - DIRECT

rules:
  - DOMAIN-SUFFIX,cn,DIRECT
  - GEOIP,CN,DIRECT
  - MATCH,节点选择
```

关键字段说明：

| 字段                        | 说明                                       |
| ------------------------- | ---------------------------------------- |
| `server`                  | VPS IP 或域名                               |
| `uuid`                    | 3x-ui 客户端 UUID                           |
| `flow`                    | Reality 常用 `xtls-rprx-vision`，服务端和客户端需一致 |
| `reality-opts.public-key` | Reality 公钥，不是私钥                          |
| `reality-opts.short-id`   | 3x-ui 生成的 Short ID                       |
| `servername`              | SNI，必须和服务端配置一致                           |
| `client-fingerprint`      | TLS 指纹，建议和服务端 uTLS 配置一致                  |

如果已经有更完整的 Clash DNS 和分流配置，可以把 `proxies` 和 `proxy-groups` 合并到现有配置中，再保留原有规则体系。

## 6. 可选：使用自有域名和 Nginx 回落

基础节点可以直接使用 `www.apple.com` 作为 Reality 伪装目标。但如果想让 443 端口被直接访问时呈现一个真实网页，可以使用自有域名 + Nginx 回落方案。

目标效果：

| 访问者 | 请求特征 | 处理结果 |
| --- | --- | --- |
| 合法客户端 | 携带正确 UUID / Reality 参数 | 进入 Xray 代理 |
| 普通浏览器 | 直接访问域名 | 回落到 Nginx 网站 |
| 探测请求 | 不携带合法参数 | 回落到 Nginx 网站 |

### 6.1 安装 Nginx

```bash
apt update && apt install nginx -y
systemctl status nginx
```

将静态页面放到默认目录：

```bash
scp ./index.html root@你的IP:/var/www/html/index.html
```

先用浏览器访问 `http://你的IP`，确认页面能打开。

### 6.2 配置域名解析

在域名服务商处添加解析：

| 主机记录 | 类型 | 值 |
| --- | --- | --- |
| `@` | A | VPS IP |
| `www` | A | VPS IP |

等待 DNS 生效后再申请证书。

### 6.3 申请 HTTPS 证书

```bash
apt install certbot python3-certbot-nginx -y
certbot --nginx -d 你的域名 -d www.你的域名
```

交互提示通常包括：

- 邮箱：用于证书通知。
- 服务条款：输入 `Y`。
- 营销邮件：按需选择，通常可输入 `N`。

证书路径通常是：

```text
/etc/letsencrypt/live/你的域名/fullchain.pem
/etc/letsencrypt/live/你的域名/privkey.pem
```

### 6.4 将 Nginx 改到本机回落端口

为了让 Xray 占用外部 443 端口，可以让 Nginx 监听本机 8443。

编辑站点配置：

```bash
nano /etc/nginx/sites-available/你的域名
```

示例配置：

```nginx
server {
    listen 8443 ssl;
    server_name 你的域名 www.你的域名;

    ssl_certificate /etc/letsencrypt/live/你的域名/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/你的域名/privkey.pem;

    root /var/www/html;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }
}
```

启用并检查配置：

```bash
ln -s /etc/nginx/sites-available/你的域名 /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

然后在 3x-ui 入站中配置 fallback，将不符合 Reality 参数的流量回落到：

```text
127.0.0.1:8443
```

同时将服务端 SNI / Target 以及 Clash 配置里的 `servername` 改为自有域名。

## 常见排障

### 节点能 ping 通，但代理失败

`ping` 只验证 ICMP。Reality 握手失败发生在 TCP 建立之后的协议层，所以可能出现「ping 通、TCP 也通，但代理不可用」。

优先检查：

- SNI / Target 是否一致。
- Clash 中 `servername` 是否和服务端一致。
- 公钥、Short ID、UUID 是否复制完整。
- `flow` 是否为 `xtls-rprx-vision`。
- 客户端内核是否支持当前服务端协商出的 TLS 参数。

### v2rayN 延迟显示 `-1 ms`

这通常表示协议握手失败。原文记录中，部分微软或 Google 域名作为 Reality 伪装目标时，会因为后量子密钥交换算法兼容问题导致客户端握手失败。

可尝试将 Reality 伪装目标改为：

```text
Target: www.apple.com:443
SNI: www.apple.com
```

对应地，客户端配置中的 `servername` 也要改成 `www.apple.com`。

### x-ui 使用的 Xray 不是系统 Xray

3x-ui 自带独立的 Xray 二进制文件，路径通常是：

```text
/usr/local/x-ui/bin/xray-linux-amd64
```

系统 PATH 中的 Xray 可能是另一个文件：

```text
/usr/local/bin/xray
```

如果要替换 3x-ui 使用的 Xray，必须替换前者，并先停止服务：

```bash
x-ui stop
cp /usr/local/bin/xray /usr/local/x-ui/bin/xray-linux-amd64
x-ui start
```

### 怀疑 TCP 443 被封锁

在服务器上抓包，同时从客户端发起连接：

```bash
tcpdump -i eth0 port 443 -c 20
```

如果客户端尝试连接时服务器完全收不到包，说明流量可能在到达服务器前被丢弃。这时优先考虑更换 IP 或机房，而不是继续改应用层配置。

## 常用命令速查

```bash
# SSH 连接服务器
ssh root@服务器IP

# 启动 / 停止 / 重启 x-ui
x-ui start
x-ui stop
x-ui restart

# 查看 x-ui 状态
x-ui status

# 进入 x-ui 管理菜单
x-ui

# 查看 Xray 是否监听端口
ss -tlnp | grep xray

# 抓包验证流量是否到达服务器
tcpdump -i eth0 port 443 -c 20

# 查看 3x-ui 内置 Xray 版本
/usr/local/x-ui/bin/xray-linux-amd64 version

# 检查 Nginx 配置并重载
nginx -t && systemctl reload nginx
```
