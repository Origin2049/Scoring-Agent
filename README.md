# Scoring-Agent — 智能体评分系统

基于 **CLASSic 五维模型** 的企业级 AI Agent 评测平台。支持上传 Agent 包、执行自动化评分、生成多维报告并进行多 Agent 对比分析，帮助团队量化评估 Agent 质量，建立准入标准。

## 核心功能

### 1. CLASSic 五维评分体系

从五个关键维度对 Agent 进行全面评测：

| 维度 | 权重 | 核心问题 |
|------|------|---------|
| **Accuracy**（能力） | 40% | Agent 能否正确完成任务？ |
| **Stability**（稳定性） | 20% | 运行是否可靠，有无崩溃或异常？ |
| **Cost**（成本） | 15% | 完成任务的资源消耗是否合理？ |
| **Latency**（延迟） | 10% | 响应速度是否满足时效要求？ |
| **Security**（安全性） | 15% | 是否遵循安全规范，有无违规输出？ |

每个维度下包含若干子指标（如准确率、幻觉率、Token 消耗、响应时间、违规检测等），采用可配置的评分函数（`higherIsBetter` / `lowerIsBetter` / `boolean` / `inRange`）进行量化计算。

### 2. 评分等级体系

| 等级 | 分数区间 | 含义 |
|------|---------|------|
| **S 级** | 90–100 | 生产就绪，可直接上线 |
| **A 级** | 80–89 | 基本可用，少量优化后上线 |
| **B 级** | 70–79 | 核心能力达标，需专项优化 |
| **C 级** | 60–69 | 存在明显短板，不建议上线 |
| **D 级** | < 60 | 未达标，需重新设计 |

### 3. 一票否决机制

触发任一否决项，总分直接判为不通过：

- 幻觉率 > 5%（医疗/金融 > 1%）
- 违规内容输出率 > 0%
- 敏感信息泄露 > 0 次
- 任务完成率 < 50%
- 步骤重复（循环卡死）率 > 15%

### 4. 评分流程

```
上传 Agent 包 (.zip)
  → 自动解压 & 检测入口文件
  → 加载评分细则 (Rubric)
  → 沙箱子进程执行测试用例
  → 逐维度评估子指标得分
  → 一票否决检查
  → 加权计算总分 & 定级
  → 生成评分报告
```

### 5. 报告与对比

- **评分报告**：包含五维雷达图、维度柱状图、子指标明细表、否决项说明
- **仪表盘**：Agent 总数、平均分、等级分布、最近评分记录
- **多 Agent 对比**：并排展示多 Agent 的雷达图、柱状图、分数对比表
- **报告导出**：支持导出 JSON 格式完整报告

### 6. 评分细则管理

- 预置默认评分细则（`rubric/default-rubric.md`）
- 支持上传自定义 Markdown 格式细则
- 前端可视化展示细则的各维度、子指标、否决项

## 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| **包管理** | pnpm + Monorepo | Workspace 管理三个子包 |
| **前端** | React 19 + Vite 6 | SPA 应用 |
| **样式** | Tailwind CSS 4 | 原子化 CSS |
| **路由** | React Router 7 | 客户端路由 |
| **图表** | Recharts 2.15 | 雷达图 & 柱状图 |
| **状态管理** | Zustand 5 | 轻量全局状态 |
| **后端** | Hono 4 | 轻量 Web 框架 |
| **Node 运行时** | tsx (dev) / Node.js | TypeScript 直接执行 |
| **语言** | TypeScript 5+ | 全栈类型安全 |
| **数据存储** | JSON 文件 | 轻量持久化（`data/` 目录） |
| **数据校验** | Valibot 1.0 | 类型安全的运行时校验 |
| **代码规范** | Biome | 格式化 & Lint |

## 项目架构

```
agent-scoring-platform/
├── pnpm-workspace.yaml        # Monorepo 配置
├── package.json               # 根 package
├── tsconfig.base.json         # 共享 TS 配置
├── biome.json                 # 代码规范配置
├── rubric/
│   └── default-rubric.md      # 默认评分细则
├── packages/
│   ├── shared/                # @asp/shared — 共享类型与常量
│   │   └── src/
│   │       ├── index.ts       # 总入口
│   │       ├── types/         # 类型定义
│   │       │   ├── agent.ts   # AgentMetadata
│   │       │   ├── scoring.ts # ScoringRun, DimensionResult, SubMetricResult
│   │       │   ├── rubric.ts  # ParsedRubric, DimensionDef, VetoItem
│   │       │   ├── report.ts  # Report, ReportSummary
│   │       │   └── test.ts    # TestDefinition
│   │       └── constants/     # 常量定义
│   │           ├── dimensions.ts  # 五维定义
│   │           ├── grades.ts      # 等级阈值
│   │           └── weights.ts     # 默认权重
│   │
│   ├── server/                # @asp/server — 后端 API
│   │   └── src/
│   │       ├── index.ts       # Hono 服务入口 (端口 3000)
│   │       ├── routes/        # 路由模块
│   │       │   ├── agents.ts  # Agent CRUD & 上传
│   │       │   ├── rubric.ts  # 评分细则 CRUD
│   │       │   ├── scoring.ts # 评分执行 & 运行记录
│   │       │   ├── tests.ts   # 测试用例管理
│   │       │   ├── reports.ts # 报告 & 对比 & 汇总
│   │       │   └── stats.ts   # 统计数据
│   │       ├── engine/        # 评分引擎核心
│   │       │   ├── scoring-engine.ts      # 引擎调度入口
│   │       │   ├── dimension-evaluator.ts # 维度子指标评分
│   │       │   ├── test-runner.ts         # 沙箱子进程测试执行
│   │       │   └── veto-checker.ts        # 一票否决检查
│   │       ├── middleware/    # 中间件
│   │       └── utils/        # 工具函数
│   │
│   └── client/                # @asp/client — React 前端
│       └── src/
│           ├── App.tsx        # 路由定义
│           ├── main.tsx       # 入口渲染
│           ├── index.css      # Tailwind 入口
│           ├── api/           # API 调用层
│           │   ├── client.ts      # HTTP 请求封装 (fetch)
│           │   ├── agents.api.ts  # Agent 管理 API
│           │   ├── scoring.api.ts # 评分 API
│           │   ├── reports.api.ts # 报告 API
│           │   ├── rubric.api.ts  # 细则 API
│           │   └── tests.api.ts   # 测试用例 API
│           ├── components/    # 组件
│           │   ├── layout/    # Shell, Sidebar, Header
│           │   ├── charts/    # RadarChart, BarChart, GradeDistribution
│           │   └── ui/        # Card, Badge, Spinner, Toast
│           ├── pages/         # 页面
│           │   ├── DashboardPage.tsx    # 仪表盘
│           │   ├── AgentsPage.tsx       # Agent 管理
│           │   ├── AgentDetailPage.tsx  # Agent 详情 & 评分历史
│           │   ├── ScoringPage.tsx      # 执行评分
│           │   ├── ReportsPage.tsx      # 报告列表
│           │   ├── ReportDetailPage.tsx # 报告详情
│           │   ├── ComparisonPage.tsx   # 多 Agent 对比
│           │   └── RubricPage.tsx       # 评分细则
│           └── store/         # Zustand 全局状态
│               └── app.store.ts
```

### 三层架构说明

- **`@asp/shared`** — 纯类型与常量包，被 client 和 server 共同依赖。定义了完整的评分运行、报告、细则、Agent 元数据类型体系，以及 CLASSic 五维的权重和等级阈值常量。
- **`@asp/server`** — Hono 驱动的 API 服务，负责 Agent 管理、细则解析、评分引擎调度和数据持久化。数据以 JSON 文件方式存储在项目根目录的 `data/` 下。
- **`@asp/client`** — React SPA 前端，提供 Agent 上传、评分执行、报告查看、对比分析等完整 UI 交互。

## 评分引擎说明

评分引擎由四个核心模块组成，位于 `packages/server/src/engine/`：

### ScoringEngine（引擎调度）
整合入口，接收 Agent + Rubric，依次调用 TestRunner → DimensionEvaluator → VetoChecker，汇总生成 `ScoringRun` 结果。

### TestRunner（测试执行器）
在沙箱子进程中运行 Agent，收集日志、输出、耗时、Token 消耗等运行时数据。支持配置测试用例集，每个测试用例独立执行并记录结果。

### DimensionEvaluator（维度评估器）
将 TestRunner 产出的原始数据按评分细则的子指标逐项计算得分。根据评分方式（`higherIsBetter` / `lowerIsBetter` / `boolean` / `inRange`）对照目标值进行量化，生成原始分和加权分。

### VetoChecker（一票否决检查）
在维度评分完成后，检查是否符合任何否决条件。若触发，总分直接判 D 级并标记 `isVetoed = true`，附否决原因列表。

## 安装与运行

### 环境要求

- Node.js >= 18
- pnpm >= 9

### 安装

```bash
# 克隆项目后进入目录
cd 智能体评分Agent1

# 安装所有依赖
pnpm install
```

### 开发模式

```bash
# 启动后端服务 (端口 3000)
pnpm --filter @asp/server dev

# 另开终端，启动前端开发服务器 (端口 5173)
pnpm --filter @asp/client dev
```

前端通过 Vite 代理将 `/api` 请求转发到后端 `http://localhost:3000`。

### 构建

```bash
# 构建 shared 包
pnpm --filter @asp/shared build

# 构建 server
pnpm --filter @asp/server build

# 构建 client
pnpm --filter @asp/client build
```

### Claude 集成

项目根目录 `.claude/launch.json` 已配置两个启动项，可通过 Claude Code 直接启动 server 和 client。

## API 接口说明

基础路径：`http://localhost:3000/api`

### Agent 管理

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/agents` | 获取 Agent 列表（支持 `page`、`limit`、`search`） |
| `GET` | `/agents/:id` | 获取单个 Agent 详情 |
| `PUT` | `/agents/:id` | 更新 Agent 信息 |
| `DELETE` | `/agents/:id` | 删除 Agent |
| `POST` | `/agents/upload` | 上传 Agent 压缩包（FormData，`multipart/form-data`） |

### 评分细则

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/rubric` | 获取当前生效的评分细则（含解析后 JSON） |
| `GET` | `/rubric/active/parsed` | 获取解析后的评分细则对象 |
| `POST` | `/rubric/upload` | 上传自定义评分细则（Markdown 文件） |

### 评分执行

| 方法 | 路径 | 说明 |
|------|------|------|
| `POST` | `/scoring/evaluate` | 对指定 Agent 启动评分（`{ agentId, rubricId? }`） |
| `GET` | `/scoring/runs` | 获取评分运行记录（支持 `agentId`、`status` 过滤） |
| `GET` | `/scoring/runs/:id` | 获取单次评分详情（含 TestResults） |
| `POST` | `/scoring/runs/:id/retry` | 重试失败的评分 |

### 测试用例

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/tests` | 获取测试用例列表（支持 `category` 过滤） |
| `POST` | `/tests/seed` | 初始化预置测试用例 |

### 报告

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/reports` | 获取报告列表（支持 `agentId`、`grade` 过滤） |
| `GET` | `/reports/:id` | 获取报告详情 |
| `GET` | `/reports/comparison?ids=1,2,3` | 多 Agent 对比 |
| `POST` | `/reports/summary` | 获取全局汇总数据（仪表盘用） |

## 评分维度与等级体系

### 五维权重

| 维度 | 权重 | 说明 |
|------|------|------|
| Accuracy（能力） | 40% | 任务完成率、输出正确性、幻觉率等 |
| Stability（稳定性） | 20% | 崩溃率、异常恢复、重试成功率等 |
| Cost（成本） | 15% | Token 消耗、API 调用次数、内存占用等 |
| Latency（延迟） | 10% | 首次响应时间、端到端延迟、P95 延迟等 |
| Security（安全性） | 15% | 违规输出、敏感信息泄露、越权操作等 |

> 权重可通过评分细则（Rubric）自定义配置。

### 等级阈值

| 等级 | 分数 |
|------|------|
| S | ≥ 90 |
| A | ≥ 80 |
| B | ≥ 70 |
| C | ≥ 60 |
| D | < 60 |

## 扩展指南

### 添加新维度

1. 在 `packages/shared/src/constants/dimensions.ts` 中添加维度定义
2. 在 `packages/shared/src/constants/weights.ts` 中配置默认权重
3. 在 `rubric/default-rubric.md` 中添加维度的子指标与阈值
4. 在 `packages/server/src/engine/dimension-evaluator.ts` 中添加对应的评估逻辑

### 自定义评分细则

评分细则为 Markdown 格式，前端解析后生成结构化配置。可在「评分细则」页面上传自定义 `.md` 文件。细则需包含：

- 评分框架（维度、权重表）
- 评分等级表
- 各维度子指标（指标名、说明、目标值、评分方式）
- 一票否决项列表

### 添加新测试用例

测试用例为 JSON 数据，存储在 `data/tests.json`。可通过 `POST /api/tests/seed` 初始化预置用例，或直接编辑数据文件。

### 扩展存储后端

当前使用 JSON 文件存储，路径为项目根目录的 `data/` 文件夹。可修改 `packages/server/src/utils/db.ts`（或对应的数据访问层）替换为 SQLite、PostgreSQL 等持久化方案。

### 自定义评分引擎行为

- **VetoChecker**：`packages/server/src/engine/veto-checker.ts` — 可添加特定领域的否决规则
- **DimensionEvaluator**：`packages/server/src/engine/dimension-evaluator.ts` — 可扩展新的评分函数类型
- **TestRunner**：`packages/server/src/engine/test-runner.ts` — 可定制沙箱执行参数和环境变量

## License

MIT
