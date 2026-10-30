---
title: iStoreOS 安装 OpenClash 与 Docker 代理配置
date: 2026-10-31 08:00:00
categories:
  - 网络
  - Clash
tags:
  - istoreos
  - openclash
  - mihomo
  - docker
  - openwrt
description: >-
  记录 iStoreOS 24.10.5 上安装 OpenClash 0.48.002 的实际过程，包含 Firewall4
  依赖、公钥登录、安装包校验、离线上传 ARM64 内核，以及 Docker 守护进程代理配置和容器恢复验证。
permalink: /pages/b89971
---

# iStoreOS 安装 OpenClash 与 Docker 代理配置

本文根据 2026-10-30 的实际安装记录整理，文档创建于 2026-10-31。目标是在 iStoreOS 上安装 OpenClash 0.48.002 和匹配的 Mihomo 内核，再为 Docker 拉取镜像配置 HTTP 代理。

安装插件、导入代理配置、启用代理是三个步骤。本次安装结束时插件和内核已就绪，但尚未导入订阅，也未启用 OpenClash；后续 Docker 配置时，提供的代理端点已可用并通过测试，其间的订阅导入和代理启用过程不在本次记录中。

## 一、实测环境

| 项目 | 实测值 |
| --- | --- |
| 设备地址 | `192.168.31.2` |
| SSH 用户 | `root` |
| 系统 | iStoreOS 24.10.5，构建 `2026032011` |
| OpenWrt 目标 | `amlogic/meson` |
| 软件包架构 | `aarch64_cortex-a53` |
| CPU 架构 | `aarch64` |
| 防火墙 | Firewall4 / nftables |
| 包管理器 | `opkg` |
| OpenClash | `0.48.002` |
| Mihomo 架构 | `linux-arm64` |
| Docker Engine | `27.3.1` |

安装前根文件系统可用空间约 1.9 GiB，`/tmp` 可用空间约 961 MiB。其他设备应重新检查空间和架构，不能直接沿用 ARM64 内核。

下文明确标注命令运行位置：**Mac 终端**负责下载和上传，**设备 SSH**负责安装和配置。密码、代理认证信息均使用交互输入，不写入本文。

## 二、SSH 登录准备

在 **Mac 终端**连接设备：

```bash
ssh root@192.168.31.2
```

需要免密登录时，先检查本机是否已有公钥：

```bash
ls -l ~/.ssh/id_ed25519.pub
```

仅在没有合适密钥时生成新的密钥，遇到已有文件提示不要覆盖：

```bash
ssh-keygen -t ed25519
```

安装公钥，按提示输入设备密码：

```bash
ssh-copy-id -i ~/.ssh/id_ed25519.pub root@192.168.31.2
```

禁止回退到密码认证，验证公钥登录：

```bash
ssh -o BatchMode=yes -o PasswordAuthentication=no -o KbdInteractiveAuthentication=no root@192.168.31.2 'id -un'
```

预期输出 `root`。

### 主机指纹变化

本次曾遇到 `REMOTE HOST IDENTIFICATION HAS CHANGED`。通过服务器控制台或其他可信渠道核对新主机指纹后，才更新本机记录。不要只因为 IP 相同就直接接受新密钥。

核对后，在 **Mac 终端**备份并移除该地址的旧记录：

```bash
cp -p ~/.ssh/known_hosts ~/.ssh/known_hosts.before-istoreos
```

```bash
ssh-keygen -R 192.168.31.2
```

重新连接时再次核对提示的指纹，再确认保存。

## 三、检查系统与安装依赖

以下命令在 **设备 SSH** 中执行。

```bash
cat /etc/openwrt_release
```

```bash
uname -m
```

```bash
df -h / /tmp
```

确认使用 Firewall4，检查透明代理和 TUN 模块：

```bash
opkg list-installed | grep -E '^(firewall4|kmod-nft-tproxy|kmod-tun|kmod-inet-diag) '
```

先备份可能受依赖升级影响的配置：

```bash
cp -p /etc/config/dhcp /etc/config/dhcp.before-openclash
```

```bash
cp -p /etc/config/luci /etc/config/luci.before-openclash
```

刷新索引：

```bash
opkg update
```

依照 v0.48.002 发布页的 **Firewall4 / nftables** 安装说明，所需依赖如下：

```bash
opkg install bash dnsmasq-full curl ca-bundle ip-full ruby ruby-yaml kmod-tun kmod-inet-diag unzip kmod-nft-tproxy luci-compat luci luci-base
```

这条命令是官方依赖清单，`opkg install` 对已有软件包也可能执行升级。若只希望补齐缺失依赖，应先逐项核对 `opkg list-installed`，再安装缺失项。本次主要缺少 `ruby` 和 `ruby-yaml`，执行完整清单时还升级了 dnsmasq-full、curl、ca-bundle、unzip 和部分 LuCI 包。

本次软件源为 iStoreOS compat 源和 CERNET 的 OpenWrt 24.10.5 源，索引签名检查通过。无需为了安装插件更换软件源或强制安装不匹配的内核模块。

### 安装期间的提示

- `/etc/config/dhcp`、`/etc/config/luci` 存在自定义内容，opkg 保留原文件，将新默认配置放到对应的 `*-opkg` 文件。不要直接用新默认配置覆盖现有网络设置。
- 索引解析提示旧 `firewall` 包缺少 `libip4tc2`、`libip6tc2`。本机使用 Firewall4，随后逐项确认所需 nftables 依赖均已安装；无需为消除提示切换防火墙。
- 本机 `opkg` 不支持 `opkg check`。检查依赖应使用 `opkg status` 和实际运行验证。

## 四、校验并安装指定 IPK

本次使用的本地文件为：

```text
~/Downloads/luci-app-openclash_0.48.002_all.ipk
```

在 **Mac 终端**计算 SHA-256：

```bash
shasum -a 256 ~/Downloads/luci-app-openclash_0.48.002_all.ipk
```

本次结果与官方 v0.48.002 发布资产的 `digest` 一致：

```text
f3f0d0514553aea8d542c62dc52ac26d1f79dbda24204280f1cb8ea7fff71e9e
```

官方资产元数据：[v0.48.002 Release API](https://api.github.com/repos/vernesong/OpenClash/releases/tags/v0.48.002)。其他版本应核对对应版本的摘要，不要沿用此值。

上传到设备；`-O` 使用传统 SCP 协议，兼容没有 SFTP 子系统的 OpenWrt 设备：

```bash
scp -O ~/Downloads/luci-app-openclash_0.48.002_all.ipk root@192.168.31.2:/tmp/
```

在 **设备 SSH** 再次核对上传文件：

```bash
sha256sum /tmp/luci-app-openclash_0.48.002_all.ipk
```

确认一致后安装：

```bash
opkg install /tmp/luci-app-openclash_0.48.002_all.ipk
```

验证版本和安装状态：

```bash
opkg status luci-app-openclash
```

本次输出包含：

```text
Package: luci-app-openclash
Version: 0.48.002
Status: install user installed
```

## 五、安装 ARM64 Mihomo 内核

插件 IPK 不包含可直接使用的运行内核。官方说明要求启动前确认内核架构，或者将匹配的内核放到 `/etc/openclash/core/clash_meta`。

本机 `aarch64_cortex-a53` 对应 `linux-arm64`。安装器默认使用 OpenClash `core` 分支的 `dev/meta` 内核；该下载地址会随上游更新，以下校验值仅对应本次下载。

### 设备无法直连 GitHub 时从 Mac 下载

本次设备访问 GitHub 超时，但 Mac 可以访问，因此采用 Mac 下载、校验后上传的方式。

以下在同一个 **Mac 终端**会话中执行。先创建独立临时目录：

```bash
core_stage=$(mktemp -d /tmp/openclash-core.XXXXXX)
```

下载官方 ARM64 内核与校验清单：

```bash
curl -fL --connect-timeout 8 --max-time 60 https://raw.githubusercontent.com/vernesong/OpenClash/core/dev/meta/clash-linux-arm64.tar.gz -o "$core_stage/clash-linux-arm64.tar.gz"
```

```bash
curl -fL --connect-timeout 8 --max-time 20 https://raw.githubusercontent.com/vernesong/OpenClash/core/dev/meta/checksums.txt -o "$core_stage/checksums.txt"
```

以下命令校验摘要，只读取归档中的普通文件 `clash`，写为 `clash_meta`；不会执行归档内其他内容。需要本机安装 Python 3：

```bash
python3 -I - "$core_stage" <<'PY'
import hashlib
import pathlib
import sys
import tarfile

stage = pathlib.Path(sys.argv[1])
name = "clash-linux-arm64.tar.gz"
rows = [line.split() for line in (stage / "checksums.txt").read_text().splitlines() if line.strip()]
expected = next(row[0] for row in rows if row[-1].lstrip("*./") == name)
actual = hashlib.sha256((stage / name).read_bytes()).hexdigest()
if actual != expected:
    raise SystemExit("SHA-256 不匹配，停止安装")
with tarfile.open(stage / name) as archive:
    member = next(item for item in archive.getmembers() if item.name in ("clash", "./clash"))
    if not member.isfile():
        raise SystemExit("内核归档成员不是普通文件")
    (stage / "clash_meta").write_bytes(archive.extractfile(member).read())
print("SHA-256 校验通过：", actual)
PY
```

本次内核压缩包的 SHA-256：

```text
2b7edd07c41ba1e01f8e1843a237c6d4c0aad1b9e3163b1e4c18237ecc67d954
```

### 上传并验证内核

以下适用于首次安装，已有内核时先备份，再替换。

在 **Mac 终端**上传：

```bash
ssh root@192.168.31.2 'mkdir -p /etc/openclash/core'
```

```bash
scp -O "$core_stage/clash_meta" root@192.168.31.2:/etc/openclash/core/clash_meta
```

在 **设备 SSH** 中按官方安装器设置权限并检查可执行性：

```bash
chmod 4755 /etc/openclash/core/clash_meta
```

```bash
/etc/openclash/core/clash_meta -v
```

本次输出：

```text
Mihomo Meta alpha-g5b79f3c linux arm64 with go1.26.10 Mon Oct 26 20:16:08 UTC 2026
Use tags: with_gvisor
```

检查插件记录的架构：

```bash
uci -q get openclash.config.core_version
```

预期为 `linux-arm64`。如果使用其他架构，需重新选择对应内核。

## 六、管理入口与安装验收

浏览器登录 iStoreOS 后，进入「服务 → OpenClash」：

[OpenClash 管理入口](http://192.168.31.2/cgi-bin/luci/admin/services/openclash)

在 **设备 SSH** 检查基础服务：

```bash
/etc/init.d/dnsmasq status
```

```bash
/etc/init.d/uhttpd status
```

验证 Ruby YAML 模块：

```bash
ruby -ryaml -e 'puts YAML.dump({ready: true})'
```

检查设备本地 DNS：

```bash
nslookup openwrt.org 127.0.0.1
```

检查是否启用：

```bash
uci -q get openclash.config.enable
```

本次安装结束时为 `0`，配置目录没有代理配置文件。需要在 LuCI 中导入订阅或 YAML 配置，核对节点、规则、DNS 和监听端口后再启用。本文没有验证这一过程，也没有自动修改 IPv6、LAN 网关或 DHCP 设置。

未登录时直接请求管理入口，本次返回 HTTP 403 和 LuCI 页面，这不能单独作为插件异常的依据；仍需通过浏览器登录检查页面。若页面资源显示异常，先刷新浏览器缓存，再检查服务日志。

本次已验证插件版本、依赖、内核可执行性、dnsmasq 和 uhttpd 运行状态及本地 DNS；尚未验证登录后的插件页面、OpenClash 实际代理和设备重启后的运行情况。

## 七、可选：Docker 守护进程使用代理

这一节要求代理端点已经可用。本次后续使用的端点是 `192.168.31.2:7893`，需要用户名和密码认证。端口取决于实际配置，`7893` 不是所有 OpenClash 安装的默认端口。

Docker 守护进程代理用于拉取和推送镜像，不会自动为现有容器内的应用设置代理。

### 先测试代理

以下在 **设备 SSH 的 Bash** 中执行。交互输入真实信息，避免将密码直接写进命令历史；本例用户名和密码要求使用 URL 安全字符，其他字符需先进行百分号编码：

```bash
bash
```

```bash
read -r -p '代理用户名：' proxy_user
```

```bash
read -r -s -p '代理密码：' proxy_password; printf '\n'
```

```bash
curl -sS --connect-timeout 5 --max-time 20 --proxy http://192.168.31.2:7893 --proxy-user "$proxy_user:$proxy_password" -o /dev/null -w 'Docker registry HTTP %{http_code}\n' https://registry-1.docker.io/v2/
```

本次返回 `401`，表示请求已经通过代理抵达 Docker Registry 的未认证 API。代理认证失败通常为 `407`；仅端点测试通过仍需用 Docker 实际拉取镜像验证。

### 通过 UCI 持久化配置

本机 `/etc/init.d/dockerd` 会读取 `/etc/config/dockerd` 的 `proxies` 节，生成 `/tmp/dockerd/daemon.json`。因此应修改持久化 UCI 配置，不能只改 `/tmp` 下的生成文件。其他固件需先检查启动脚本是否支持这些字段。

以下继续在刚才的 **设备 Bash 会话**执行。

备份配置并记录当前运行容器：

```bash
cp -p /etc/config/dockerd /etc/config/dockerd.before-proxy
```

```bash
docker ps -q > /tmp/docker-running-before-proxy
```

确认现有代理节：

```bash
uci -q get dockerd.proxies
```

本机已有 `config proxies 'proxies'`，输出应为 `proxies`。若不存在该节，再创建：

```bash
uci set dockerd.proxies=proxies
```

设置 HTTP 和 HTTPS 代理。HTTPS 请求同样使用 `http://` 代理地址，通过 CONNECT 建立隧道：

```bash
uci set dockerd.proxies.http_proxy="http://${proxy_user}:${proxy_password}@192.168.31.2:7893"
```

```bash
uci set dockerd.proxies.https_proxy="http://${proxy_user}:${proxy_password}@192.168.31.2:7893"
```

本机及私有网段直连：

```bash
uci set dockerd.proxies.no_proxy='localhost,127.0.0.1,::1,192.168.0.0/16,10.0.0.0/8,172.16.0.0/12,.lan'
```

```bash
uci commit dockerd
```

```bash
chmod 600 /etc/config/dockerd
```

```bash
unset proxy_user proxy_password
```

配置包含认证信息，避免公开完整 `uci show dockerd` 或 `docker info` 输出。生成配置可能在服务重启时重建，手工设置 `/tmp/dockerd/daemon.json` 的权限不保证下次重启仍保留。

### 重启与验证

重启 Docker 会短暂影响容器服务，选择合适的维护时间执行：

```bash
/etc/init.d/dockerd restart
```

Docker 恢复响应后检查：

```bash
docker ps -a --format '{{.Names}}\t{{.Status}}'
```

本次六个容器均为 `unless-stopped`，但重启后仍有两个未自动恢复。对于重启前运行、当前停止的容器，先检查停止原因；确认可以恢复后，仅启动这些容器：

```bash
for container_id in $(cat /tmp/docker-running-before-proxy); do
    if [ "$(docker inspect --format '{{.State.Running}}' "$container_id")" = false ]; then
        docker start "$container_id"
    fi
done
```

从 Docker API 核对代理生效，使用 Go 模板隐藏认证部分：

```bash
docker info --format '{{if .HTTPProxy}}HTTP proxy configured{{end}}{{if .HTTPSProxy}}; HTTPS proxy configured{{end}}; NoProxy={{.NoProxy}}'
```

最后测试真实拉取：

```bash
docker pull hello-world:latest
```

本次拉取成功，重启前六个容器全部恢复运行，其中带健康检查的 Magpie 和数据库恢复为 healthy。`hello-world:latest` 是连通性测试镜像，不是固定版本校验。

代理配置已写入持久配置文件；本次没有重启整台设备验证。若代理运行在 Docker 容器中，还需要考虑代理容器尚未启动、其镜像又需要通过代理拉取的启动依赖。

## 八、参考资料

- [OpenClash v0.48.002 发布说明及依赖清单](https://github.com/vernesong/OpenClash/releases/tag/v0.48.002)
- [OpenClash 使用手册](https://github.com/vernesong/OpenClash/blob/dev/.github/skills/openclash-user-guide/SKILL.md)
- [OpenClash 官方安装器](https://github.com/vernesong/OpenClash/blob/dev/install.sh)
- [OpenClash ARM64 内核目录](https://github.com/vernesong/OpenClash/tree/core/dev/meta)
- [Docker 守护进程代理配置](https://docs.docker.com/engine/daemon/proxy/)
