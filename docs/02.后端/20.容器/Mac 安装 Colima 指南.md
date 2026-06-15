---
title: Mac 安装 Colima 指南
date: 2026-06-12 08:00:00
categories:
  - 后端
  - 容器
tags:
  - colima
  - docker
  - mac
  - brew
  - 容器
  - docker-compose
  - 镜像加速
description: >-
  在 macOS 上使用 Homebrew 安装 Colima 容器运行时的完整指南，替代 Docker Desktop，含 docker-compose
  插件配置、镜像加速与常用命令。
permalink: /pages/d252c1
---

> 轻量级容器运行时 Colima，免费开源，是替代 Docker Desktop 的绝佳选择。

## 背景

[Colima](https://github.com/abiosoft/colima) 是一款 macOS/Linux 上的容器运行时，底层基于 [Lima](https://github.com/lima-vm/lima) 虚拟机管理。它提供与 Docker Desktop 几乎完全兼容的体验，但更加轻量、免费，且开源。

与主流方案的简要对比：

| 方案 | 费用 | 资源占用 | 开源 |
|------|------|----------|------|
| Docker Desktop | 商业/付费 | 较高 | ✗ |
| Colima | 免费 | 低 | ✓ |
| OrbStack | 收费 | 低 | ✗ |

## 环境要求

- macOS（Apple Silicon 或 Intel）
- [Homebrew](https://brew.sh/) 已安装

## 安装

### 1. 安装核心软件

```bash
brew install colima docker docker-compose
```

安装完成后，查看版本确认：

```bash
colima version
docker --version
docker-compose --version
```

### 2. 配置 Docker CLI 插件路径

Colima 启动后会自动将 `docker-compose` 作为 Docker CLI 插件运行，但需要确保 Docker CLI 能找到它。

编辑 `~/.docker/config.json`：

::: code-group

```json [Apple Silicon (M1/M2/M3/M4)]
{
  "cliPluginsExtraDirs": [
    "/opt/homebrew/lib/docker/cli-plugins"
  ]
}
```

```json [Intel Mac]
{
  "cliPluginsExtraDirs": [
    "/usr/local/lib/docker/cli-plugins"
  ]
}
```

:::

> [!tip] 路径说明
> - **Apple Silicon**：Homebrew 安装在 `/opt/homebrew` 目录
> - **Intel**：Homebrew 安装在 `/usr/local` 目录
> - 如果不确定，运行 `brew --prefix` 查看 Homebrew 安装位置

### 3. 配置镜像加速

在国内拉取 Docker 镜像，配置镜像加速器可大幅提升下载速度。

::: warning 注意

Colima 中**不能直接编辑 Docker daemon.json**，必须在 Colima 配置文件中声明镜像源，然后重启生效。

:::

编辑 `~/.colima/default/colima.yaml` 文件（如果文件不存在，启动一次 `colima start` 后会自动生成），在 `docker` 段添加 `registry-mirrors`：

```yaml
# ~/.colima/default/colima.yaml
docker:
  registry-mirrors:
    - https://docker.1ms.run
```

推荐镜像源（可选其一或多个）：

| 镜像源 | 说明 |
|--------|------|
| `https://docker.1ms.run` | ⭐ 推荐，稳定快速 |
| `https://docker.xuanyuan.me` | 备选 |
| `https://docker.m.daocloud.io` | DaoCloud 镜像 |
| `https://mirror.ccs.tencentyun.com` | 腾讯云镜像 |
| `https://dockerproxy.com` | Docker Proxy |

配置完成后重启 Colima：

```bash
colima restart
```

重启后验证镜像拉取速度：

```bash
docker pull nginx:alpine
```

### 4. 启动 Colima

```bash
colima start
```

默认配置即可正常运行。如果需要调整资源，可以指定参数：

```bash
# 指定 CPU 核心数、内存和磁盘大小
colima start --cpu 4 --memory 8 --disk 100

# 指定架构（默认自动检测）
colima start --arch aarch64    # ARM64（Apple Silicon）
colima start --arch x86_64     # Intel

# 指定容器运行时（默认 docker）
colima start --runtime docker
colima start --runtime containerd
```

::: info 资源建议

- 日常开发：`--cpu 2 --memory 4 --disk 60` 即可
- 运行大型项目（多服务、K3s）：建议 `--cpu 4 --memory 8 --disk 100` 以上
:::

### 5. 验证

启动后确认一切正常：

```bash
# Docker 运行正常
docker ps

# Docker Compose 插件可用
docker compose version

# Colima 状态
colima status
```

看到类似以下输出即表示安装成功：

```bash
colima is running using QEMU
arch: aarch64
runtime: docker
mountType: sshfs
pid: 12345
```

## 常用命令

| 命令 | 说明 |
|------|------|
| `colima start` | 启动 Colima |
| `colima stop` | 停止 Colima |
| `colima restart` | 重启 Colima |
| `colima delete` | 删除 Colima 实例 |
| `colima list` | 列出所有实例 |
| `colima status` | 查看运行状态 |
| `colima ssh` | SSH 进入 Colima 虚拟机 |

## 与 Docker Desktop 共存

Colima 和 Docker Desktop 可以同时安装，但同一时间只能有一个占用 `docker.sock`。

切换方式：

```bash
# 停止 Docker Desktop（托盘图标 → Quit）
# 然后启动 Colima
colima start

# 或反之：停止 Colima 后启动 Docker Desktop
colima stop
```

::: tip 推荐做法

建议完全卸载 Docker Desktop，只使用 Colima——减少资源占用，且体验一致。

:::

## 卸载

```bash
colima delete       # 删除实例
brew uninstall colima docker docker-compose   # 卸载软件
```

## 常见问题

### Q: colima 启动报错 "no space left on device"

增加磁盘大小重新创建：

```bash
colima delete
colima start --disk 100
```

### Q: docker compose 命令找不到

确认 `~/.docker/config.json` 中 `cliPluginsExtraDirs` 配置正确，且 `docker-compose` 已通过 Homebrew 安装。

### Q: 端口冲突

Colima 默认从 2000 端口开始转发。如需自定义端口映射，使用标准 `docker run -p` 参数即可。

---

## 参考

- [Colima GitHub](https://github.com/abiosoft/colima)
- [Lima](https://github.com/lima-vm/lima)
