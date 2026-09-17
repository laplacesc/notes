---
title: Git Worktree 工作流
date: 2026-09-17 16:01:19
categories:
  - Git
tags:
  - git
  - git-worktree
  - cheatsheet
  - 版本控制
description: 整理 git worktree 的常用命令与典型工作流：紧急修复、代码评审、裸仓库布局、多个 AI 编码代理并行开发，以及清理与排错。
---

# Git Worktree 工作流

一个仓库可以挂多个工作树（worktree），每个工作树是一个独立目录，检出各自的分支，但共享同一份提交历史和对象库。和 `git stash` 相比，不用来回切换现场；和多次 `git clone` 相比，不重复下载对象，本地分支和提交在所有工作树中立即可见。

> 参考：[git-worktree 官方文档](https://git-scm.com/docs/git-worktree)、[How to use git worktree and in a clean way](https://morgan.cugerone.com/blog/how-to-use-git-worktree-and-in-a-clean-way/)、[Claude Code：用 worktree 运行并行会话](https://code.claude.com/docs/en/common-workflows)。本文核心命令已在 Git 2.54 上验证。

## 命令速查

| 命令 | 作用 |
| --- | --- |
| `git worktree add <path> [<commit-ish>]` | 新建工作树 |
| `git worktree list` | 列出所有工作树 |
| `git worktree remove <worktree>` | 删除工作树 |
| `git worktree prune` | 清理已失效的工作树记录 |
| `git worktree move <worktree> <new-path>` | 移动工作树目录 |
| `git worktree lock` / `unlock <worktree>` | 锁定 / 解锁，防止被清理、移动或删除 |
| `git worktree repair [<path>...]` | 目录被手动移动后修复链接 |

## 创建工作树

```shell
# 检出已有分支 feature-x 到 ../repo-feature-x
$ git worktree add ../repo-feature-x feature-x

# 基于当前 HEAD 新建分支 feature-y 并检出
$ git worktree add -b feature-y ../repo-feature-y

# 基于 origin/main 新建分支 hotfix-login
$ git worktree add -b hotfix-login ../repo-hotfix origin/main

# 省略分支参数：自动以路径末级目录名作为新分支名（这里是 quick-test）
$ git worktree add ../quick-test

# 本地没有该分支、但恰好一个远程有同名分支时，自动建立跟踪分支
$ git worktree add ../repo-review pr-142

# 分离 HEAD，只看代码、不占用分支
$ git worktree add --detach ../repo-v1.2 v1.2.0

# 新建一个没有任何提交历史的孤儿分支（如 gh-pages）
$ git worktree add --orphan -b gh-pages ../repo-pages

# -B：分支已存在时强制重置到指定提交
$ git worktree add -B feature-y ../repo-feature-y origin/main

# 只创建不检出文件（配合稀疏检出使用）
$ git worktree add --no-checkout -b sparse-main ../repo-sparse main

# 用相对路径链接（整个项目目录可被整体移动，Git 2.48+）
$ git worktree add --relative-paths ../repo-feature-z feature-z

# 创建时直接锁定，并写明原因
$ git worktree add --lock --reason "agent running" -b agent/task-1 ../repo-agent
```

::: warning 同一分支只能被一个工作树检出
再次检出会报错 `already used by worktree`。`-f` 可以绕过，但两个目录同时改一个分支很容易出问题，不推荐。
:::

## 查看工作树

```shell
# 主工作树排在第一行，后面是链接的工作树
$ git worktree list
/Users/me/repo           8bdaa5a [main]
/Users/me/repo-hotfix    3f1c2d0 [hotfix-login]

# 显示锁定原因、可清理原因等详情
$ git worktree list -v

# 供脚本解析的稳定格式；-z 用 NUL 分隔，可处理带换行的路径
$ git worktree list --porcelain -z
```

## 删除与清理

```shell
# 删除工作树目录及其元数据（有未提交修改时会拒绝）
$ git worktree remove ../repo-hotfix

# 强制删除有未提交修改的工作树；锁定的工作树需要 -f 两次
$ git worktree remove -f ../repo-hotfix

# 目录已被 rm -rf 手动删掉后，清理残留记录
$ git worktree prune -v

# 先预览会清理什么
$ git worktree prune -n -v

# 只清理失效超过 3 天的记录
$ git worktree prune --expire 3.days.ago

# 工作树删除后，分支仍然存在，需要单独删除
$ git branch -d hotfix-login
```

::: tip
分支被某个工作树检出期间，`git branch -d` 会报 `cannot delete branch ... used by worktree`。先 `remove` 工作树，再删分支。
:::

## 移动、锁定与修复

```shell
# 移动工作树（主工作树不能用 move 移动）
$ git worktree move ../repo-hotfix ../hotfix

# 工作树在移动硬盘或网络盘上时锁定，避免被 prune 误清理
$ git worktree lock --reason "on usb disk" ../repo-usb
$ git worktree unlock ../repo-usb

# 用 mv 手动移动了工作树后，在新位置执行修复
$ git worktree repair ../new/location/repo-hotfix

# 主仓库被移动后，在主仓库里执行，修复所有工作树
$ git worktree repair
```

## 工作流一：紧急修复不打断当前开发

正在 `feature` 分支上改到一半，线上出了 bug：

```shell
# 1. 不 stash、不提交半成品，直接开一个修复用的工作树
$ git fetch origin
$ git worktree add -b hotfix/payment ../repo-hotfix origin/main

# 2. 在新目录中修复、测试、提交、推送
$ cd ../repo-hotfix
$ git commit -am "fix: 修复支付回调重复处理"
$ git push -u origin hotfix/payment

# 3. 合并后回到原目录，清理
$ cd ../repo
$ git worktree remove ../repo-hotfix
$ git branch -d hotfix/payment
```

## 工作流二：评审 PR 或对比分支

```shell
# 把远程分支以分离 HEAD 检出到独立目录，运行测试、对照代码
$ git fetch origin
$ git worktree add --detach ../repo-review-pr-142 origin/feature-x

# GitHub PR 可以直接抓取 PR 引用到本地分支
$ git fetch origin pull/142/head:pr-142
$ git worktree add ../repo-review-pr-142 pr-142

# 评审完删除
$ git worktree remove ../repo-review-pr-142
```

长期保留一个只用于验证的「干净」工作树也很实用：不做实验、不留临时文件，专门用来跑测试和检查代码。

## 工作流三：裸仓库 + 平铺的工作树

把裸仓库藏在 `.bare`，所有分支以同级目录平铺，避免工作树嵌套在主仓库里：

```shell
$ mkdir my-project && cd my-project

# 1. 克隆为裸仓库
$ git clone --bare git@github.com:me/my-project.git .bare

# 2. 让当前目录下的 git 命令找到裸仓库
$ echo "gitdir: ./.bare" > .git

# 3. 裸克隆默认不配置 fetch 规则，补上才能获取远程分支
$ git config remote.origin.fetch "+refs/heads/*:refs/remotes/origin/*"
$ git fetch origin

# 4. 按需创建工作树
$ git worktree add main
$ git worktree add -b feature-x feature-x main
```

最终目录结构：

```
my-project/
├── .bare/        # 裸仓库
├── .git          # 文件，内容为 gitdir: ./.bare
├── main/
└── feature-x/
```

## 工作流四：并行运行多个 AI 编码代理

大多数编码代理默认独占工作目录。让每个代理使用独立工作树，互不覆盖文件：

```shell
# 1. 工作树统一放在仓库内的 .trees/，并忽略该目录
$ echo '.trees/' >> .gitignore

# 2. 每个任务一个工作树、一个分支
$ git worktree add -b agent/task-123 .trees/task-123 origin/main
$ git worktree add -b agent/task-124 .trees/task-124 origin/main

# 3. 安装依赖并先跑一遍测试，确认基线是绿的
$ cd .trees/task-123 && npm ci && npm test && cd -

# 4. 代理运行期间锁定，防止被误清理
$ git worktree lock --reason "agent running" .trees/task-123

# 5. 查看所有进行中的工作树
$ git worktree list --porcelain

# 6. 完成后解锁、删除、清理
$ git worktree unlock .trees/task-123
$ git worktree remove .trees/task-123
$ git worktree prune
```

Claude Code 内置了这个流程，一条命令即可创建工作树并在其中启动会话（仓库至少要有一个提交）：

```shell
$ claude --worktree feature-auth
```

注意事项：

- 工作树只隔离文件，不能消除冲突。两个任务改同一批文件，合并时照样冲突，拆任务时要按文件边界划分；互相依赖的任务应串行执行。
- 多个工作树同时启动开发服务器时，端口会冲突，需要分别指定端口。
- `node_modules`、`.env` 等被忽略的文件不会出现在新工作树里，需要重新安装或复制。

## 常见问题与建议

- **目录命名按用途**：如 `repo-hotfix-auth`、`repo-review-pr-142`、`repo-agent-refactor-api`，看目录名就知道它为什么存在。
- **用完即删**：短期工作树完成后立即 `remove`，并定期 `git worktree prune`。
- **不要直接 `rm -rf` 工作树**：会留下失效记录，删了就补一次 `prune`。
- **子模块**：官方文档指出多工作树对子模块的支持仍不完整，不建议对含子模块的仓库做多个检出。
- **每个工作树独立的配置**：启用 `extensions.worktreeConfig` 后，可用 `git config --worktree` 写入只对当前工作树生效的配置：

```shell
$ git config extensions.worktreeConfig true
$ git config --worktree core.sparseCheckout true
```
