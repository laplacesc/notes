---
title: Wi-Fi 上网与有线内网并用：Windows 和 macOS 静态路由
date: "2026-11-19 09:29:22"
categories:
  - 网络
tags:
  - windows
  - macos
  - 静态路由
description: >-
  记录 Windows 和 macOS 同时使用 Wi-Fi 上网与有线内网的方法，包含接口优先级、通过有线网关访问开发网段的永久静态路由，以及验证和回退步骤。
---

# Wi-Fi 上网与有线内网并用：Windows 和 macOS 静态路由

办公机用 Wi-Fi 上网，同时通过以太网访问开发机。开发机地址已改为 `10.10.5.105`，将 `10.10.5.0/24` 的流量交给有线网关 `10.220.0.1`。

## Windows

### 配置接口跃点数和有线 IPv4

按 `Win + R`，运行 `ncpa.cpl` 打开「网络连接」。分别打开 Wi-Fi 和以太网的「属性 → Internet 协议版本 4（TCP/IPv4）→ 属性 → 高级」，取消「自动跃点数」，将 Wi-Fi 的接口跃点数设为 `5`，以太网设为 `50`。Windows 先选匹配目标地址的最长前缀，前缀长度相同时再比较路由跃点数与接口跃点数之和，数值小的优先。[Microsoft Learn：接口跃点数](https://learn.microsoft.com/en-us/windows-server/networking/technologies/network-subsystem/net-sub-interface-metric)

有线网卡使用分配给本机的固定 IPv4 地址。原 Windows 配置使用 `10.220.0.x` 和子网掩码 `255.255.255.0`，实际填入有线网段分配的地址和掩码，避开网关与已占用的地址。以太网的「默认网关」留空，由 Wi-Fi 提供默认路由。按 IP 访问开发机无需为以太网单独配置 DNS，原配置中的 `114.114.114.114` 可省略。

### 添加永久路由

以管理员身份打开 Windows PowerShell，先查询到 `10.220.0.1` 的路由。

```powershell
Find-NetRoute -RemoteIPAddress 10.220.0.1
```

确认 `InterfaceAlias` 是有线网卡，`NextHop` 为 `0.0.0.0`，表示网关在直连网段上，再添加开发网段的永久路由。

```powershell
route.exe /p add 10.10.5.0 mask 255.255.255.0 10.220.0.1
```

`/p` 将路由保存到重启之后。这里的 `10.220.0.1` 是 `10.10.5.0/24` 的下一跳，填在静态路由命令里。[Microsoft Learn：route 命令](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/route_ws2008)

开发机还在 `10.10.6.0/24` 时，覆盖整个 `10.10.0.0/16` 的静态路由曾与智铠 VPN 的同前缀路由冲突。连接 VPN 后，新连接曾失败，已有连接当时仍可用。原环境改用开发机所在的 `/24` 后，开启 VPN 也能连接。`/24` 优先于覆盖同一目标的 `/16`。如果 VPN 也下发了同样的 `/24` 或更具体的路由，应在 VPN 连接后复查实际选路。

### 验证与回退

```powershell
route.exe /p print 10.10.5.0
Find-NetRoute -RemoteIPAddress 10.10.5.105
Get-NetRoute -AddressFamily IPv4 -DestinationPrefix 0.0.0.0/0
```

在永久路由列表中确认 `10.10.5.0`、掩码 `255.255.255.0` 和下一跳 `10.220.0.1`。查询开发机时，预期选中 `10.10.5.0/24`、以太网接口和下一跳 `10.220.0.1`。正常双网卡接入时，检查 IPv4 默认路由 `0.0.0.0/0` 是否经 Wi-Fi。有 VPN 时，在连接 VPN 后再次查询开发机的实际选路。[Microsoft Learn：Find-NetRoute](https://learn.microsoft.com/en-us/powershell/module/nettcpip/find-netroute)

撤销这条永久路由时，在管理员 PowerShell 执行以下命令，再复查永久路由列表。

```powershell
route.exe delete 10.10.5.0 mask 255.255.255.0 10.220.0.1
route.exe /p print 10.10.5.0
```

## macOS

### 本机网络服务

| 网络服务 | 接口 | 附加 IPv4 路由目标 |
| --- | --- | --- |
| `Ethernet` | `en0` | `10.10.5.0/24`，下一跳为 `10.220.0.1` |
| `Wi-Fi` | `en1` | 无。当前接入另一个网段，`10.220.0.1` 由 `en0` 直接到达 |

### 保存永久路由

先确认网络服务名称、网关实际走的接口以及服务已有的附加路由。

```bash
networksetup -listnetworkserviceorder
route -n get 10.220.0.1
networksetup -getadditionalroutes "Ethernet"
```

`networksetup` 使用网络服务名，比如 `Ethernet`，接口名 `en0` 用来核对实际出接口。换用 Wi-Fi 或 USB 网卡时，先确认 `route -n get 10.220.0.1` 显示网关可经对应接口直接到达，再把命令中的 `"Ethernet"` 换成实际的服务名，如 `"Wi-Fi"`。

若该服务的附加路由列表为空，或只有本次要替换的旧开发网段 `10.10.6.0/24`，执行以下命令。

```bash
sudo networksetup -setadditionalroutes "Ethernet" 10.10.5.0 255.255.255.0 10.220.0.1
```

`-setadditionalroutes` 会替换该服务的整份附加 IPv4 路由列表。如果已有其他路由，先记录原列表，把需要保留的条目和新条目在同一条命令中按 `目标网段 掩码 网关` 逐组写入。配置会保留到重启之后，路由随对应网络服务启用。

### 验证配置与实际选路

```bash
networksetup -getadditionalroutes "Ethernet"
route -n get 10.10.5.105
```

前者应列出 `10.10.5.0 255.255.255.0 10.220.0.1`。后者的预期关键输出如下。

```text
   route to: 10.10.5.105
destination: 10.10.5.0
       mask: 255.255.255.0
    gateway: 10.220.0.1
  interface: en0
```

`route -n get` 用于核对系统选路。业务连通性可用开发机上实际开放的端口验证。

### 临时添加与回退

只想临时试路由，且路由表中还没有这条记录时，可以直接修改运行中的路由表。这项修改重启后会丢失。

```bash
sudo route add -net 10.10.5.0/24 10.220.0.1
```

撤销用 `route add` 加入的临时路由时，执行以下命令。

```bash
sudo route delete -net 10.10.5.0/24 10.220.0.1
```

撤销永久路由时，先用 `-getadditionalroutes` 查看列表。若 `Ethernet` 只有这一条附加路由，可以清空该服务的附加路由列表，再复查配置和选路。

```bash
sudo networksetup -setadditionalroutes "Ethernet"
networksetup -getadditionalroutes "Ethernet"
route -n get 10.10.5.105
```

如果还有其他附加路由，用一条 `-setadditionalroutes` 命令重新写入所有要保留的条目，再做相同的复查。
