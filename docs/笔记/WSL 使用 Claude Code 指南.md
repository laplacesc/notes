---
title: WSL 使用 Claude Code 指南
date: 2026-06-04 23:52:41
permalink: /wsl-claude-code
titleTag: 原创
categories:
  - WSL
  - 开发环境
tags:
  - wsl
  - claude-code
  - codex
  - nodejs
  - ubuntu
top: true
sticky: 2
description: 在 Windows 11 上安装配置 WSL 及 Ubuntu，并搭建 Claude Code、Codex 等 AI 编程工具的完整指南。
coverImg: https://github.com/laplacesc/picx-images-hosting/raw/master/20260604/demo.1ow2wv7ubl.gif
---

> 本文档介绍如何在 Windows 11 上安装和配置 WSL (Windows Subsystem for Linux)，以及安装开发工具。

## 启用 Windows 功能

### 打开设置页面

点击 `开始` 直接搜索 `启用或关闭 Windows功能` 即可

![](https://laplacesc.github.io/picx-images-hosting/20260604/image.4clj78l6n6.webp)

### 启用必要功能

![](https://laplacesc.github.io/picx-images-hosting/20260604/image.1sfoulq7or.webp)

## 设置 WSL 版本和安装 Linux

打开 PowerShell 或命令提示符（管理员权限）

> [!tip] 快捷方式
> `Win+x` 选择 `终端(管理员)`

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

https://developer.aliyun.com/mirror/ubuntu/

### DEB822 配置方法

从 ubuntu 24 开始，已经支持 DEB822 配置方法

#### 配置文件

```bash
sudo vim /etc/apt/sources.list.d/ubuntu.sources
```

#### ubuntu 26.04 (resolute) 配置如下

```dts
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

https://nodejs.org/en/download/current

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

安装完成后即可创建对应的配置文件开始使用，以下为使用 CC Switch 的懒人做法。

---

## 在 Windows 上安装 [CC Switch](https://github.com/farion1231/cc-switch#cc-switch)

安装配置完成后

在 WSL 上使用软链接进行关联

```bash
 ln -s /mnt/c/Users/{windows_username}/.claude ~/.claude
 
 ln -s /mnt/c/Users/{windows_username}/.codex ~/.codex
```

此时修改即可直接同步
