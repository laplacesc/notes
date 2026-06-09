---
title: Grafana vs Superset 嵌入式图表选型对比
date: 2026-07-17
categories:
  - 后端
tags:
  - superset
  - grafana
  - spring-boot
  - 选型
  - 架构
description: 对比 Grafana 与 Superset 在 Spring Boot 微服务中嵌入图表的方案，重点分析多用户场景下的嵌入式鉴权模型、数据隔离能力与迭代效率，结合 Guest Token 与 RLS 行级安全机制给出选型建议。
---

## 背景

需要为 Spring Boot 微服务接入 BI 工具（Superset 或 Grafana）的 SDK，用于更方便地构建图表展示后端数据。核心诉求是：**后续添加新的图表仅需后端改动，无需前端接入**。

<!-- more -->

## 需求分析

| 需求                 | 说明                                                       |
| -------------------- | ---------------------------------------------------------- |
| **后端新增图表**     | 定义数据查询 + 图表类型，前端仅渲染 iframe 即可自动展示    |
| **Spring Boot 接入** | 需要 REST API 调用，后端统一管理图表生命周期               |
| **多用户登录**       | 用户在自己的应用中登录，看到**属于自己**的数据             |
| **声明式图表定义**   | 图表元数据可版本管理，无需手动编写 ECharts / Highcharts    |

---

## 对比总览

| 维度                     | Grafana                                     | Superset                                    |
| ------------------------ | ------------------------------------------- | ------------------------------------------- |
| **图表模型**             | 面板嵌套在 Dashboard JSON 中，非独立资源     | 图表是独立资源（`/api/v1/chart/`）            |
| **后端新增图表方式**     | `POST /api/dashboards/db` 传完整 JSON       | `POST /api/v1/chart/` + `PUT /api/v1/dashboard/{id}` |
| **配置即代码**           | ✅ 原生支持：文件 Provisioning + Git Sync    | ❌ 无文件级自动加载，需通过 REST API 脚本创建 |
| **嵌入式鉴权**           | ⚠️ 需用户登录 Grafana，或 anonymous 模式     | ✅ **Guest Token**（JWT 签发，无需用户登录） |
| **多租户数据隔离**       | ❌ 基本不可行                                | ✅ **RLS（Row-Level Security）** 原生支持     |
| **部署资源**             | 轻量，单 Go 二进制                           | 较重，Python / Django 生态                   |
| **文档质量**             | ⭐ 优秀，示例丰富                             | ⭐ 良好，但较分散                             |

---

## 关键分水岭：嵌入式鉴权模型

多用户场景下，嵌入式图表的鉴权方式决定了方案的可行性。

### Grafana 的问题

| 方式               | 可行性 | 局限                                                                 |
| ------------------ | ------ | -------------------------------------------------------------------- |
| iframe 直嵌        | ✅ 可行 | ❌ 用户需登录 Grafana，体验割裂；无法按用户过滤数据                    |
| Anonymous 模式     | ⚠️ OSS 版可用 | ❌ 所有用户看到同一份数据，多租户不可行                               |
| Auth Proxy         | ⚠️ 可做 | ❌ 需额外 nginx/envoy 组件；Grafana Cloud 不支持；每用户隔离仍需 hack |
| Service Account    | ✅ API 可用 | ❌ 机器身份，不是用户身份；无法做行级数据过滤                         |

**核心矛盾**：Grafana 的嵌入式面板**没有用户级令牌机制**——要么所有人能看，要么自己处理前置认证并将 Grafana 暴露给所有用户。多租户数据隔离基本不可行。

### Superset Guest Token：为嵌入场景而生

```bash
你的 Spring Boot ──(1) 用户登录认证 ──→ 你的用户系统
      │
      ├─(2) POST /security/guest_token
      │     body: {
      │       user: { username: "user_123" },
      │       resources: [{ type: "dashboard", id: "dash_456" }],
      │       rls_rules: [{ clause: "user_id = 'user_123'" }]
      │     }
      │
      └─(3) 返回 guest_token（JWT，短期有效）
            ↓
      前端 ──(4) @superset-ui/embedded-sdk 渲染 iframe
```

**关键能力：**

- 后端认证后，**签发一个仅针对该用户的短期 Token**
- Token **绑定到具体 Dashboard**
- **RLS（Row-Level Security）**——不同用户看同一图表，数据自动过滤
- 用户**无需知道 Superset 存在**，URL 也不暴露 Superset 地址

---

## 推荐架构

```bash
┌────────────────────────────────────────────────────┐
│                    Spring Boot                       │
│                                                     │
│   SupersetService                                   │
│   ├─ createChart(datasource, sql, type) → chartId  │
│   ├─ bindToDashboard(chartId, dashboardId)          │
│   └─ generateGuestToken(user, dashboardId) → token │
│                                                     │
│   每个图表 = 一个 Java 方法                           │
│   ┌─ barChartSalesByRegion()                        │
│   ├─ lineChartDailyActiveUsers()                    │
│   └─ pieChartOrderStatus()                          │
└──────────────┬─────────────────────────────────────┘
               │ ① 用户登录认证
               │ ② 获取 guest_token
               ▼
┌──────────────────────────────┐
│   你的前端 (React/Vue)         │
│   <superset-embedded-sdk>    │
│   仅传递 token，无其他配置      │
└──────────────┬──────────────┘
               │ ③ iframe 渲染
               ▼
┌──────────────────────────────┐
│        Apache Superset        │
│  - Guest Token 校验           │
│  - RLS 行级过滤               │
│  - 渲染图表                   │
└──────────────────────────────┘
```

## 新增图表的迭代流程

```bash
一次开发：
  Spring Boot 封装 SupersetService
  ├─ createChart()     // 创建图表
  ├─ bindToDashboard() // 绑定到仪表盘
  └─ serveGuestToken() // 签发访客令牌

新增图表步骤（纯后端，无需前端发版）：
  1. 在 ChartTemplateService 中新增一个方法
  2. 定义 SQL 查询 + 图表类型 + 数据集绑定
  3. 调用 createChart() + bindToDashboard()
  4. 前端自动展示（同一 iframe 刷新即可）
```

---

## 推荐结论

**选择 Superset。** 原因只有一个决定性因素：**多用户登录 + 嵌入式展示**。

| 场景                   | 推荐           | 理由                                       |
| ---------------------- | -------------- | ------------------------------------------ |
| 内部监控 / 团队看板     | Grafana        | 配置即代码，最轻量                          |
| **多用户 SaaS / 客户报表** | **✅ Superset** | Guest Token + RLS 是唯一成熟的嵌入式鉴权方案 |

Grafana 是多用户 " 看 " 数据的工具，Superset 是多用户 " 嵌入 " 数据的工具。你的需求是后者——所有用户在你的应用中登录，看到**属于他们自己的图表和数据**。

---

## 参考资料

- [Apache Superset REST API 文档](https://superset.apache.org/docs/api/)
- [Superset Embedded SDK](https://github.com/apache-superset/superset-ui/tree/master/packages/superset-ui-embedded-sdk)
- [Grafana HTTP API](https://grafana.com/docs/grafana/latest/developers/http_api/)
- [Grafana Dashboard Provisioning](https://grafana.com/docs/grafana/latest/administration/provisioning/#dashboards)
