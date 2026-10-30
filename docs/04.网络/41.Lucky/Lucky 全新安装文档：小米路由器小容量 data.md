---
title: Lucky 全新安装文档：小米路由器小容量 data
date: 2026-10-30 08:00:00
categories:
  - 网络
  - Lucky
tags:
  - lucky
  - openwrt
  - xiaomi-router
  - tmpfs
description: >-
  记录小米 RN02 官方固件上 Lucky 的全新安装方法，使用受限内存盘隔离程序与运行数据，以小型配置快照减少 data 分区占用，包含局域网下载、SSH
  兼容、服务管理和排错命令。
permalink: /pages/e67c57
---

# Lucky 全新安装文档：小米路由器小容量 /data

适用：本次实测的 RN02 小米官方固件，`armv7l`，路由器地址 `192.168.31.1`。日期：2026-10-30。

从已恢复出厂、已恢复上网和 SSH 的路由器开始。本文不需要备份，不迁移旧安装，不自动导入旧配置。你自行保存的配置可在安装完成后按需从后台导入。


## 文档与配套脚本

本文及脚本保存在笔记项目中。下文 Mac 命令按项目位置 `~/Dev/Repos/notes` 编写；其他电脑请替换为实际克隆路径。Lucky 程序包由路由器从局域网文件服务直接下载，不纳入版本管理。

- [下载安装脚本 install.sh](/downloads/lucky/scripts/install.sh)
- [下载运行管理脚本 lucky-ram.sh](/downloads/lucky/scripts/lucky-ram.sh)

安装时需要将两个脚本放在同一目录。上述链接也可用于从笔记站点下载；浏览器若直接展示脚本，可另存为文件。

## 一、采用的存储方案

本机 `/data` 只有 19.5 MiB，Lucky 程序本身超过 11 MiB；`/userdisk` 和 `/data` 是同一分区，不能通过换目录扩容。

本方案安装官方 **Lucky 3.5.0 Linux armv7 普通版**，采用以下布局：

| 路径                   | 用途                  | 容量及重启行为                                   |
| -------------------- | ------------------- | ----------------------------------------- |
| `/data/lucky-ram`    | 启动脚本、下载源设置、已保存的配置快照 | 每份配置快照最多 512 KiB，保留当前和上一份；稳定占用约 1 MiB 加脚本 |
| `/tmp/lucky-program` | 程序及下载临时文件           | 独立 tmpfs，上限 32 MiB；重启消失                   |
| `/tmp/lucky-state`   | 配置工作副本、默认运行数据、临时目录  | 独立 tmpfs，上限 8 MiB；重启消失                    |

每次冷启动重新下载固定版本并校验 SHA256，再恢复已保存的配置。防火墙 include 负责重建易失的 init.d 服务，procd 负责启动与保活。

**使用前必须接受以下条件：**

- 冷启动时需要能访问下载源。默认从局域网设备 `192.168.31.2` 的文件服务下载。该设备及文件服务须在冷启动时可达；无需依赖公网 GitHub，下载源不可达时 Lucky 不能冷启动。
- 修改规则、设置、证书或自动续签完成后，必须执行本文的 `save` 命令。重启恢复最后一次保存的配置，未保存修改会丢失。保存会短暂停止并重新启动 Lucky。
- tmpfs 只限制文件系统容量，不限制 Lucky 进程自身的 RAM。内存不足或状态盘写满时，Lucky 仍可能异常，但不会因此把默认运行数据持续写满 `/data`。
- `-cd` 不是文件系统沙箱。不要将自定义日志、脚本输出、下载、网盘缓存、上传路径指向 `/data` 或 `/userdisk`。
- 若要求离线重启立即可用，或证书自动续签后无需人工保存，推荐把 Lucky 部署到 NAS 等有持久磁盘的设备。

## 二、重置后的准备

先在小米后台完成上网设置，并恢复当前型号和固件对应的 SSH。本文不包含刷机或 SSH 解锁方法；恢复出厂后密码以你实际设置的为准。

在 **Mac 终端**登录：

```bash
ssh root@192.168.31.1
```

如果重置导致 SSH 主机指纹变化，确认目标确实是自己的路由器后，再在 Mac 执行以下命令并重新登录：

```bash
ssh-keygen -R 192.168.31.1
```

### macOS 兼容旧版 SSH 主机密钥

若连接报 `no matching host key type found. Their offer: ssh-rsa`，可临时执行：

```bash
ssh -o HostKeyAlgorithms=+ssh-rsa root@192.168.31.1
```

为使下文普通 `ssh`、`scp` 命令均可使用，在 Mac 的 `~/.ssh/config` 追加以下配置；保留文件原有内容，仅对此 IP 开启兼容：

```sshconfig
Host 192.168.31.1
    HostName 192.168.31.1
    User root
    HostKeyAlgorithms +ssh-rsa
```

```bash
chmod 600 ~/.ssh/config
```

使用密码登录不需要增加 `PubkeyAcceptedAlgorithms`，也不要关闭主机密钥检查。

## 三、在路由器 SSH 中执行预检

```bash
uname -m
```

必须输出 `armv7l`，否则不要运行此安装包。

```bash
df -h /data /tmp
```

`/data` 至少剩余 4 MiB。根目录若为只读 squashfs，显示 100% 是正常现象。

```bash
grep MemAvailable /proc/meminfo
```

启动下载前至少需要 48 MiB 可用内存；数值单位是 KiB，即至少 `49152`。独立内存盘按实际写入占内存，不在挂载时预分配全部容量。

```bash
command -v curl sha256sum flock uci tar mount
```

以上工具应全部存在；脚本不会往 `/data` 安装依赖。

```bash
mount | grep -E ' on /data | on /etc/config '
```

```bash
dmesg | grep -iE 'EXT4-fs.*(error|read-only)|UBIFS.*(error|read-only)|I/O error' | tail -20
```

**只读配置的处理：** 重置前本机 `/etc/config` 为只读，内核记录了 ext4 错误。重置后若仍只读，安装器会在写入 `/data` 前停止。此时先解决原厂固件或配置卷异常，再安装；不要强制 remount，不要删除 `/data/sec_cfg` 或 `/data/usr/sec_cfg`。只读问题解决前无法承诺重启自启动。

## 四、上传并执行安装器

以下命令在 **Mac 终端**执行，使用项目静态下载目录中的两个脚本。`scp -O` 兼容没有 SFTP 的路由器。

```bash
ssh root@192.168.31.1 'mkdir -p /tmp/lucky-install'
```

```bash
scp -O ~/Dev/Repos/notes/docs/public/downloads/lucky/scripts/install.sh ~/Dev/Repos/notes/docs/public/downloads/lucky/scripts/lucky-ram.sh root@192.168.31.1:/tmp/lucky-install/
```

```bash
ssh root@192.168.31.1 'sh /tmp/lucky-install/install.sh'
```

安装器会检查架构、空间、工具及配置可写性；遇到已有 Lucky 进程、旧 cron、自启动条目或已有 `/data/lucky-ram` 会拒绝覆盖。本文要求从全新环境开始，不需要手工删除旧安装。

脚本写入持久启动入口 `firewall.lucky_ram`，启动后台服务。它不重启路由器，不新增后台管理端口的 WAN 放行规则，不清空原厂防火墙规则。

等待约 1–3 分钟，执行：

```bash
ssh root@192.168.31.1 'sh /data/lucky-ram/lucky-ram.sh status'
```

预期看到两个 tmpfs 和 Lucky 进程。下载失败时服务会重试，排错见第八节。

## 五、首次设置并保存配置

浏览器访问：**http://192.168.31.1:16601**。

官方默认用户名、密码均为 **666**。登录后立即修改账号密码，设置管理入口保护，并确认管理后台仅允许内网访问。

按需配置 DDNS、反向代理、端口转发和证书。如果使用你已经保存的配置，从 Lucky 后台导入后，先检查其中的文件路径和定时任务，不要沿用任何向 `/data` 写日志、下载或更新的设置。旧版配置导入 3.5.0 的兼容性尚未在本机验证。

为控制内存和状态盘占用：

- 关闭不需要的日志落盘、访问历史、IPDB 下载和其他大文件功能，具体名称以界面为准。
- 不用的 FTP、WebDAV、文件上传、网盘缓存保持关闭。
- 不要在后台上传包升级；固定版本与容量预算对应，升级前需要重新核对包大小和校验值。

设置完成后，在 **Mac 终端**执行：

```bash
ssh root@192.168.31.1 'sh /data/lucky-ram/lucky-ram.sh save'
```

看到 `Saved configuration` 后才表示已持久保存。脚本会停止 Lucky，等待退出，打包顶层 `lucky_*.lkcf`，校验大小及剩余空间后原子替换快照，随后启动服务。

只保存模块配置文件，不保存用户脚本、外部证书文件、数据库和下载内容。证书应由 Lucky 模块管理，避免依赖额外的本地文件。

每次改规则、后台设置或证书后，重复执行此命令。自动续签后也需要保存。如果 save 报错，不要认为修改已持久化。

## 六、重启验收

完成配置并保存后，由你执行下列命令。它会重启路由器并暂时中断网络：

```bash
ssh root@192.168.31.1 reboot
```

网络恢复并等待下载启动后，在 **Mac 终端**执行：

```bash
ssh root@192.168.31.1 'sh /data/lucky-ram/lucky-ram.sh status'
```

```bash
ssh root@192.168.31.1 'uci -q show firewall.lucky_ram; mount | grep lucky; grep lucky-ram /tmp/messages | tail -20'
```

验收要求：

- `firewall.lucky_ram.path` 为 `/data/lucky-ram/boot.sh`，重启后仍存在。
- `/tmp/lucky-program` 和 `/tmp/lucky-state` 均是 tmpfs。
- 程序为 `/tmp/lucky-program/lucky`，启动参数包含 `-cd /tmp/lucky-state -ds`。
- 后台可登录，最后保存的配置仍在，实际 DDNS/转发/证书功能正常。
- `/data` 至少保留 2 MiB 空闲，未出现十几 MiB 的 Lucky 程序文件。

若手工能启动但重启后不能启动，应检查下载源和持久 include。没有通过此次验收，就不能认定自启动已正常。

## 七、默认局域网下载源与已安装设备的修改方法

默认下载地址：

http://192.168.31.2:6086/lucky/lucky_3.5.0_Linux_armv7.tar.gz

全新安装器会自动写入该地址。文件服务需允许路由器直接下载程序包，不能返回登录页或错误响应；文件必须与官方 3.5.0 armv7 普通包完全相同，SHA256 不一致时脚本会拒绝执行。

2026-10-31 已从电脑直接下载验证：该地址返回的安装包 SHA256 为 `34761465b4b88f6a3f19c2190d68ca3bf963d9d347ed0bcd2f8a46a73c31ea09`，与官方固定包一致。随后已从路由器下载并核对同一 SHA256，且已将路由器 source.conf 更新为该地址，更新期间 Lucky 未重启，管理入口返回 HTTP 200。

**已安装设备不会因修改电脑上的安装器而自动更新。** 如需将已有设备改为此下载源，在路由器 SSH 中执行：

```bash
cat > /data/lucky-ram/source.conf <<'EOF'
SOURCE_URL='http://192.168.31.2:6086/lucky/lucky_3.5.0_Linux_armv7.tar.gz'
SOURCE_SHA256='34761465b4b88f6a3f19c2190d68ca3bf963d9d347ed0bcd2f8a46a73c31ea09'
SOURCE_FORMAT='tar.gz'
EOF
```

修改地址不会替换已经在 RAM 中的程序，下次冷启动才使用新源。若要使用其他 NAS 或恢复官方 GitHub 下载，只更换 `SOURCE_URL`，相同版本程序包继续保留原 SHA256。官方包地址：

https://github.com/gdy666/lucky/releases/download/v3.5.0/lucky_3.5.0_Linux_armv7.tar.gz

## 八、日常操作与排错

本节命令在 **路由器 SSH** 中执行。

查看进程和空间：

```bash
sh /data/lucky-ram/lucky-ram.sh status
```

保存配置：

```bash
sh /data/lucky-ram/lucky-ram.sh save
```

停止：

```bash
sh /data/lucky-ram/lucky-ram.sh stop
```

启动：

```bash
sh /data/lucky-ram/lucky-ram.sh start
```

查看下载、校验及内存不足等错误：

```bash
grep lucky-ram /tmp/messages | tail -30
```

**下载失败：** 检查 `192.168.31.2` 的网络、文件服务和文件路径，确认返回的是程序包；可按第七节改为其他可达下载源。不要绕过 TLS 或改用未校验程序。

**`/data` 空闲不足 2 MiB：** 脚本拒绝保存配置。查明系统或其他插件占用，不能通过增大内存盘解决；不要删除系统配置卷。

**8 MiB 状态盘写满：** 先在后台关闭增长来源并清理不需要的日志/历史，再保存。若已无法操作，可重启从最后保存的配置恢复，但未保存修改会丢失。不要在 Lucky 运行时删除数据库文件。

**内存不足：** tmpfs 加进程仍可能引发 OOM。关闭高占用功能；若持续紧张，将 Lucky 迁到 NAS，不能把内存盘上限当成进程内存上限。

**需要查看前台错误：** 先 stop，再执行以下命令；当前 SSH 会话会被占用，退出前台进程后再 start。不要同时运行两份 Lucky。

```bash
sh /data/lucky-ram/lucky-ram.sh run
```

## 九、已验证范围及官方依据

已经核对：原设备架构和分区、目标命令可用性、官方固定包 SHA256、归档成员与展开大小、脚本 shell 语法和本文命令块语法。

官方包 14,129,388 字节，程序 14,125,797 字节；解压时合计约 26.95 MiB，小于 32 MiB 程序盘。

2026-10-30 已在重置后的路由器修复并验证：服务停止、启动、重复启动不产生第二个进程、procd 注册、配置快照保存及保存后服务恢复。旧脚本误用这台固件始终返回成功的 init.d running 判断，导致 start 跳过启动；修正版直接向 procd 提交服务，并在 status 中显示真实实例状态。本固件没有 logread，日志查看改用 /tmp/messages。

尚未验证：异常退出后的自动拉起、断电配置恢复、真实重启自启动，以及 DDNS/反向代理的端到端功能。未重启路由器。16601 根路径实测返回 HTTP 404，说明 HTTP 服务有响应；若配置了安全入口，请使用原有完整入口地址，不能把根路径 404 等同于启动失败。

官方资料：

- 安装、参数和默认登录：https://lucky666.cn/docs/install
- 固定版本：https://github.com/gdy666/lucky/releases/tag/v3.5.0
- 官方资产摘要：https://api.github.com/repos/gdy666/lucky/releases/tags/v3.5.0
- 小米启动入口参考：https://github.com/gdy666/lucky-files/blob/main/daji.sh

容量隔离及手动保存快照属于本交付的自建部署方式，不是直接运行官方一键安装器。
