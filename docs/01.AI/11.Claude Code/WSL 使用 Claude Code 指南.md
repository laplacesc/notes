---
title: WSL 使用 Claude Code 指南
date: 2026-06-05 23:52:41
categories:
  - AI
  - Claude Code
tags:
  - wsl
  - claude-code
  - codex
  - ubuntu
  - node-js
titleTag: 推荐
top: true
sticky: 2
description: 在 Windows 11 上安装配置 WSL 及 Ubuntu，并搭建 Claude Code、Codex 等 AI 编程工具的完整指南。
coverImg: https://github.com/laplacesc/picx-images-hosting/raw/master/20260604/demo.1ow2wv7ubl.gif
permalink: /pages/58be6f
---

> 从零开始：在 Windows 11 上配置 WSL、Ubuntu，并完成 Claude Code 与 Codex 等 AI 编程工具的一站式安装。

## 启用 Windows 功能

### 打开设置页面

点击 `开始` 直接搜索 `启用或关闭 Windows 功能` 即可

![启用或关闭 Windows 功能搜索界面](https://laplacesc.github.io/picx-images-hosting/20260604/image.4clj78l6n6.webp)

### 启用必要功能

![Windows 功能列表](https://laplacesc.github.io/picx-images-hosting/20260604/image.1sfoulq7or.webp)

## 设置 WSL 版本和安装 Linux

打开 PowerShell 或命令提示符（管理员权限）

> [!tip] 快捷方式
> `Win + X` 选择 `终端(管理员)`

### 设置 WSL 默认版本

```bash
# 设置默认版本为 WSL2
wsl --set-default-version 2
```

### 查看可用的 Linux 发行版

```bash
# 查看可用的 Linux 发行版
wsl --list --online
```

### 安装 Linux 发行版

选择一个发行版进行安装（以下以 Ubuntu-26.04 为例）

```bash
wsl --install -d Ubuntu-26.04
```

## 用户设置

### 创建普通用户

如果首次进入发行版后是 root 用户，需要创建普通用户

```bash
# 创建新用户（替换 your_username 为你的用户名）
adduser your_username
# 将用户添加到 sudo 组
usermod -aG sudo your_username
```

### 设置默认用户

1. 编辑 WSL 配置文件

	```bash
	sudo vim /etc/wsl.conf
	```

2. 在 `/etc/wsl.conf` 中添加以下内容

	```ini
	[user]
	default=your_username
	```

3. 保存后，在 Windows 中重启 WSL

	```bash
	wsl --shutdown
	```

## 替换镜像源

[阿里云 Ubuntu 镜像源](https://developer.aliyun.com/mirror/ubuntu/)

### DEB822 配置方法

从 Ubuntu 24.04 开始，已支持 DEB822 配置方法

#### 配置文件

```bash
sudo vim /etc/apt/sources.list.d/ubuntu.sources
```

#### Ubuntu 26.04（Resolute）配置如下

```ini
Types: deb
URIs: https://mirrors.aliyun.com/ubuntu
Suites: resolute resolute-updates resolute-backports
Components: main universe restricted multiverse
Signed-By: /usr/share/keyrings/ubuntu-archive-keyring.gpg

Types: deb
URIs: https://mirrors.aliyun.com/ubuntu
Suites: resolute-security
Components: main universe restricted multiverse
Signed-By: /usr/share/keyrings/ubuntu-archive-keyring.gpg
```

## 更新软件包

```bash
sudo apt update

sudo apt upgrade -y
```

## 安装 Node.js

[Node.js 下载页面](https://nodejs.org/en/download/current)

```bash
# Download and install nvm:
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.4/install.sh | bash

# in lieu of restarting the shell
\. "$HOME/.nvm/nvm.sh"

# Download and install Node.js:
nvm install 26

# Verify the Node.js version:
node -v # Should print "v26.3.0".

# Install Corepack:
npm install -g corepack

# Download and install pnpm:
corepack enable pnpm

# Verify pnpm version:
pnpm -v
```

### 替换 NPM 镜像源

```bash
npm config set registry https://registry.npmmirror.com
```

## 安装 Claude Code

```bash
npm install -g @anthropic-ai/claude-code
```

## 安装 Codex

```bash
npm install -g @openai/codex
```

安装完成后即可创建对应的配置文件开始使用。如果觉得逐个配置比较繁琐，可通过 [CC Switch](https://github.com/farion1231/cc-switch#cc-switch) 实现一键同步。

---

## 在 Windows 上安装 CC Switch

CC Switch 是一个 AI 编程工具配置文件同步工具，可将 Windows 上 Claude Code、Codex 等工具的配置自动同步到 WSL，避免重复配置。

在 Windows 上安装配置完成后，在 WSL 中使用软链接进行关联（请将 `{windows_username}` 替换为你的 Windows 用户名）：

```bash
ln -s /mnt/c/Users/{windows_username}/.claude ~/.claude

# MCP 服务器等配置存在该文件中
ln -s /mnt/c/Users/{windows_username}/.claude.json ~/.claude.json

ln -s /mnt/c/Users/{windows_username}/.codex ~/.codex
```

此后在 Windows 上修改配置即可直接同步到 WSL。

> [!tip]
> Windows 上的 CC Switch 会将 MCP 配置 type 改为 CMD，command 会加上 `\c`，在 WSL 中使用时需注意手动调整。

## 删除 Windows 子系统和卸载 WSL

### 注销 Linux 发行版

1. 点击“开始”菜单搜索 `PowerShell` 或 `Windows 终端`，右键选择**“以管理员身份运行”**。
2. 输入以下命令查看当前安装的子系统名称：
   `wsl --list`
3. 根据列表中的名称，运行以下命令注销并删除该 Linux 分发版（例如注销 Ubuntu，将 `<DistroName>` 替换为实际名称如 `Ubuntu`）：
   `wsl --unregister <DistroName>`

### 卸载 WSL 核心组件

1. 点击任务栏的搜索图标，输入 `optionalfeatures` 并按回车键打开“启用或关闭 Windows 功能”窗口。
2. 在列表中向下滚动，取消勾选 **“适用于 Linux 的 Windows 子系统”**（Windows Subsystem for Linux）和 **“虚拟机平台”**（Virtual Machine Platform）。
3. 点击“确定”，等待 Windows 应用更改，然后根据提示**重启电脑**。

### 彻底清理（可选）

1. **清理磁盘残留文件：** 如果在 C 盘找不到，可清理 `C:\Users\你的用户名\AppData\Local\Packages` 下残留的 Linux 分发版文件夹（如带 CanonicalGroupLimited.Ubuntu 标识的文件夹）。
2. **验证卸载：** 再次打开 PowerShell，输入 `wsl`，若系统提示“不是内部或外部命令”，即代表已完全移除。
