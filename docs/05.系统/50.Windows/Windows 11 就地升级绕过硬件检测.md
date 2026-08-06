---
title: Windows 11 就地升级绕过硬件检测
date: "2026-08-06 11:36:40"
categories:
  - 系统
  - Windows
tags:
  - windows-11
  - iso
  - system-upgrade
  - powershell
description: 在虚拟机中通过 Windows 11 ISO 镜像执行就地升级，并使用 setupprep.exe 命令行参数绕过硬件检测。
permalink: /pages/ae6918
---

> [!tip] 适用场景
> 本方法适用于在虚拟机内直接挂载 Windows 11 ISO 镜像进行就地升级。

## 操作步骤

1. 挂载或解压已经下载好的 **Windows 11 ISO 镜像**。

2. 在虚拟机内打开挂载的虚拟光驱，进入 `sources` 文件夹。

3. 找到 `setupprep.exe` 文件。

4. 按住 `Shift` 键，在文件夹空白处单击鼠标右键，选择“在此处打开 PowerShell 窗口”；也可以在当前目录打开 CMD。

5. 输入以下命令并按回车键运行：

   ```powershell
   setupprep.exe /product server
   ```

6. 升级向导会跳过硬件检测并进入安装界面，按照界面提示继续完成升级。

## 注意事项

> [!warning]
> 绕过硬件检测意味着虚拟机配置可能不满足 Windows 11 的正式要求。升级前请备份重要数据，建议同时为虚拟机创建快照，以便在安装失败时恢复。

- 必须在 ISO 镜像的 `sources` 目录中执行命令，否则系统可能无法找到 `setupprep.exe`。
- 升级过程中不要关闭虚拟机或强制断电。
- 如果安装程序仍然提示硬件不兼容，请确认命令拼写正确，并确认当前终端所在目录为 `sources`。
