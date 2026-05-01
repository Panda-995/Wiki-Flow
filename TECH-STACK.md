# 📚 WikiFlow - 在线 WIKI 平台技术栈文档

> 版本: v1.0 | 日期: 2026-04-30 | 状态: 设计阶段

---

## 一、项目概述

| 项目名 | WikiFlow - 在线知识管理系统 |
|---|---|
| 核心功能 | Markdown WIKI、文件导入、知识图谱、多级访问码、留言板、邮箱登录 |
| 目标用户 | 团队知识管理、个人笔记库、文档协作平台 |
| 部署方式 | Docker / Vercel |

---

## 二、前端技术栈

### 2.1 核心框架

| 技术 | 版本 | 用途 | 说明 |
|---|---|---|---|
| **Next.js** | 15.x (App Router) | 全栈框架 | SSR/SSG 支持，RSC 提升性能 |
| **React** | 19.x | UI 库 | 服务端组件 + 客户端组件 |
| **TypeScript** | 5.x | 类型系统 | 全量类型安全 |

### 2.2 UI / 样式

| 技术 | 版本 | 用途 |
|---|---|---|
| **Tailwind CSS** | 4.x | 原子化 CSS 框架 |
| **shadcn/ui** | latest | 无头 UI 组件库 (Radix 为基础) |
| **Lucide React** | latest | 图标库 |
| **Framer Motion** | 11.x | 动画库 |

### 2.3 Markdown 相关

| 技术 | 版本 | 用途 |
|---|---|---|
| **@mdx-js/loader** | 3.x | MDX 加载器 |
| **react-markdown** | 9.x | Markdown 渲染 |
| **remark-gfm** | 4.x | GitHub 风格 Markdown |
| **remark-math** / **rehype-katex** | 6.x | 数学公式渲染 |
| **remark-frontmatter** | 5.x | YAML 头部解析 |
| **gray-matter** | 4.x | Frontmatter 提取 |
| **@monaco-editor/react** | 4.x | VS Code 级别 Markdown 编辑器 |
| **rehype-raw** | 7.x | HTML 安全渲染 |
| **rehype-sanitize** | 6.x | HTML 安全过滤 |
| **rehype-highlight** | 7.x | 代码高亮 |

### 2.4 知识图谱可视化

| 技术 | 版本 | 用途 |
|---|---|---|
| **ECharts** | 5.x | 知识图谱力导向图 (推荐) |
| **@antv/G6** | 5.x | 备选：更专业的图可视化库 |
| **react-echarts** | wrapper | ECharts React 封装 |

### 2.5 状态管理与网络

| 技术 | 版本 | 用途 |
|---|---|---|
| **Zustand** | 5.x | 轻量级状态管理 |
| **@tanstack/react-query** | 5.x | 服务端状态管理 |
| **axios** | 1.x | HTTP 客户端 |

### 2.6 表单与验证

| 技术 | 版本 | 用途 |
|---|---|---|
| **react-hook-form** | 7.x | 表单管理 |
| **@hookform/resolvers** | 4.x | Zod 适配器 |
| **zod** | 4.x | 运行时 Schema 验证 |

### 2.7 文件处理

| 技术 | 版本 | 用途 |
|---|---|---|
| **jszip** | 4.x | 前端 Zip 解压 (批量导入预览) |
| **file-saver** | 2.x | 文件下载 |

### 2.8 其他工具

| 技术 | 版本 | 用途 |
|---|---|---|
| **date-fns** | 4.x | 日期处理 |
| **uuid** | 10.x | UUID 生成 |
| **crypto-js** | 4.x | 访问码加密 |

---

## 三、后端技术栈

### 3.1 核心框架

| 技术 | 版本 | 用途 | 说明 |
|---|---|---|---|
| **Next.js Server Actions** | 15.x | 服务端逻辑 | 与前端同构，减少 API 胶水代码 |
| **Next.js API Routes** | 15.x | REST API | 文件上传、公开接口等 |
| **Node.js** | 22.x LTS | 运行时 | 推荐版本 |

### 3.2 数据库

| 技术 | 版本 | 用途 |
|---|---|---|
| **PostgreSQL** | 16.x | 主数据库 |
| **Prisma** | 6.x | ORM + 迁移工具 |
| **Neo4j** | 5.x (可选) | 知识图谱专用图数据库 |
| **Redis** | 7.x | 缓存 + 会话 + 速率限制 |

### 3.3 认证与安全

| 技术 | 版本 | 用途 |
|---|---|---|
| **NextAuth.js (Auth.js)** | 5.x | 认证框架 (邮箱 Magic Link) |
| **@node-rs/bcrypt** | 1.x | 密码哈希 (备用密码登录) |
| **jose** | 5.x | JWT 签发与验证 |
| **zod** | 4.x | 输入验证 |

### 3.4 邮件服务

| 技术 | 版本 | 用途 |
|---|---|---|
| **nodemailer** | 6.x | 邮件发送引擎 |
| **@react-email/components** | 1.x | React 邮件模板 |
| **Resend** / **SendGrid** | SaaS | 邮件投递服务 (推荐 Resend) |

### 3.5 文件处理

| 技术 | 版本 | 用途 |
|---|---|---|
| **busboy** | 2.x | 流式文件上传解析 |
| **jszip** | 4.x | Zip 批量解压 |
| **sharp** | 0.33.x | 图片处理 (缩略图) |
| **fs-extra** | 11.x | 文件系统增强 |

### 3.6 Markdown 处理 (后端)

| 技术 | 版本 | 用途 |
|---|---|---|
| **gray-matter** | 4.x | Frontmatter 解析 |
| **unified** + **remark-parse** | 11.x | Markdown AST 生成 |
| **rehype-stringify** | 11.x | AST → HTML |
| **slugify** | 2.x | URL slug 生成 |
| **excerpt** | 4.x | 自动提取摘要 |

### 3.7 知识图谱构建

| 技术 | 版本 | 用途 |
|---|---|---|
| **neo4j-driver** | 5.x | Neo4j 官方驱动 |
| **prisma** | 6.x | 备选：用邻接表在 PostgreSQL 中存储图 |
| **natural** | 6.x | NLP 关键词提取 (可选) |

### 3.8 队列与后台任务

| 技术 | 版本 | 用途 |
|---|---|---|
| **BullMQ** | 5.x | 基于 Redis 的任务队列 |
| **cronstrue** | 2.x | Cron 表达式可读化 |

---

## 四、开发工具

| 工具 | 用途 |
|---|---|
| **ESLint** + **@typescript-eslint** | 代码检查 |
| **Prettier** | 代码格式化 |
| **Vitest** | 单元测试 |
| **Playwright** | E2E 测试 |
| **GitHub Actions** | CI/CD |
| **Husky** + **lint-staged** | Git Hooks |
| **changesets** | 版本管理 |

---

## 五、部署架构

### 5.1 开发环境
```
┌────────────────────────────────────────────┐
│  Docker Compose (一键启动全部依赖)            │
│  ├─ PostgreSQL 16                         │
│  ├─ Redis 7                               │
│  ├─ Neo4j 5 (可选)                         │
│  └─ Next.js dev server (热更新)             │
└────────────────────────────────────────────┘
```

### 5.2 生产环境 (Vercel 方案)
```
┌────────────────────────────────────────────┐
│  Vercel (前端 + Serverless Functions)       │
│    ├─ Neon / Supabase (PostgreSQL)          │
│    ├─ Upstash (Redis)                       │
│    └─ Neo4j Aura (图数据库, 可选)             │
└────────────────────────────────────────────┘
```

### 5.3 生产环境 (Docker 自托管方案)
```
┌────────────────────────────────────────────┐
│  Docker Compose / K8s                       │
│  ├─ Nginx (反向代理 + 静态资源)              │
│  ├─ Next.js App (Node.js 22)               │
│  ├─ PostgreSQL 16                          │
│  ├─ Redis 7                                │
│  ├─ Neo4j 5 (可选)                          │
│  └─ BullMQ Worker (后台任务)                 │
└────────────────────────────────────────────┘
```

---

## 六、目录结构

```
wiki-flow/
├── prisma/                        # Prisma ORM
│   ├── schema.prisma              # 数据库模型定义
│   └── migrations/                # 数据库迁移
├── src/
│   ├── app/                       # Next.js App Router
│   │   ├── (auth)/                # 认证相关页面
│   │   │   └── login/
│   │   ├── (wiki)/                # WIKI 公开页面
│   │   │   ├── page.tsx           # 首页
│   │   │   ├── [slug]/page.tsx    # 文章详情页
│   │   │   ├── category/[name]/   # 分类页面
│   │   │   └── tag/[name]/        # 标签页面
│   │   ├── graph/                 # 知识图谱页面
│   │   │   └── page.tsx
│   │   ├── guestbook/             # 留言板
│   │   │   └── page.tsx
│   │   ├── admin/                 # 管理后台
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx           # 仪表盘
│   │   │   ├── posts/             # 文章管理
│   │   │   ├── categories/        # 分类管理
│   │   │   ├── tags/              # 标签管理
│   │   │   ├── import/            # 批量导入
│   │   │   ├── access-codes/      # 访问码管理
│   │   │   ├── guestbook/         # 留言管理
│   │   │   ├── settings/          # 站点设置
│   │   │   └── users/             # 用户管理
│   │   ├── api/                   # API Routes
│   │   │   ├── upload/            # 文件上传
│   │   │   ├── import/            # 批量导入
│   │   │   ├── graph/             # 知识图谱 API
│   │   │   ├── guestbook/         # 留言板 API
│   │   │   └── auth/              # 认证 API
│   │   └── layout.tsx             # 根布局
│   ├── components/
│   │   ├── ui/                    # shadcn/ui 组件
│   │   ├── editor/                # Markdown 编辑器
│   │   ├── viewer/                # Markdown 查看器
│   │   ├── graph/                 # 知识图谱组件
│   │   ├── access-code/           # 访问码验证组件
│   │   └── admin/                 # 后台组件
│   ├── lib/
│   │   ├── db.ts                  # Prisma 客户端
│   │   ├── auth.ts                # Auth.js 配置
│   │   ├── markdown.ts            # Markdown 处理
│   │   ├── frontmatter.ts         # Frontmatter 解析
│   │   ├── graph.ts               # 知识图谱构建
│   │   ├── access-code.ts         # 访问码逻辑
│   │   ├── import.ts              # 文件导入逻辑
│   │   ├── email.ts               # 邮件发送
│   │   └── queue.ts               # BullMQ 队列
│   ├── server/                    # Server Actions
│   │   ├── post.actions.ts
│   │   ├── import.actions.ts
│   │   ├── access-code.actions.ts
│   │   └── admin.actions.ts
│   ├── hooks/                     # 自定义 Hooks
│   ├── stores/                    # Zustand stores
│   ├── types/                     # TypeScript 类型
│   └── styles/                    # Tailwind 样式
├── public/
│   ├── uploads/                   # 用户上传文件
│   └── assets/                    # 静态资源
├── scripts/
│   └── seed.ts                    # 种子数据
├── tests/
│   ├── unit/
│   └── e2e/
├── .env.example                   # 环境变量模板
├── docker-compose.yml             # Docker 开发环境
├── Dockerfile                     # Docker 生产镜像
└── package.json
```

---

## 七、核心数据模型 (Prisma Schema 概要)

```prisma
// 用户模型
model User {
  id            String    @id @default(uuid())
  email         String    @unique
  name          String?
  passwordHash  String?
  role          UserRole  @default(USER)
  verified      Boolean   @default(false)
  createdAt     DateTime  @default(now())
  posts         Post[]
  comments      Comment[]
}

enum UserRole {
  ADMIN
  EDITOR
  USER
}

// 文章模型
model Post {
  id          String    @id @default(uuid())
  slug        String    @unique
  title       String
  content     String    // Markdown 原始内容
  html        String    // 渲染后的 HTML
  excerpt     String?   // 自动提取的摘要
  frontmatter Json?     // 原始 YAML frontmatter
  meta        PostMeta? // 解析后的元数据
  status      PostStatus @default(DRAFT)
  isPublished Boolean   @default(false)
  viewCount   Int       @default(0)
  wordCount   Int       @default(0)
  language    String    @default("zh-CN")
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  publishedAt DateTime?

  // 关联
  author      User?     @relation("PostAuthor", fields: [authorId], references: [id])
  authorId    String?
  category    Category? @relation(fields: [categoryId], references: [id])
  categoryId  String?
  tags        Tag[]
  accessCodes AccessCode[] @relation("PostAccess")
  parentDir   DirAccess? @relation(fields: [parentDirId], references: [id])
  parentDirId String?

  comments    Comment[]
  graphNodes  GraphNode[]
}

// 分类模型
model Category {
  id        String  @id @default(uuid())
  name      String  @unique
  slug      String  @unique
  icon      String?
  color     String?
  sortOrder Int     @default(0)
  parentId  String?
  parent    Category? @relation("CategoryTree", fields: [parentId], references: [id])
  children  Category[] @relation("CategoryTree")
  posts     Post[]
  createdAt DateTime @default(now())
}

// 标签模型
model Tag {
  id        String   @id @default(uuid())
  name      String   @unique
  color     String?
  posts     Post[]
  createdAt DateTime @default(now())
}

// 访问码模型
model AccessCode {
  id          String   @id @default(uuid())
  code        String   @unique // 加密存储
  type        CodeType      // SITE / DIRECTORY / FILE
  targetId    String?   // null = 全站, 否则为分类ID或文章ID
  expiresAt   DateTime?
  maxUses     Int?      // null = 无限制
  usedCount   Int       @default(0)
  note        String?
  createdAt   DateTime  @default(now())

  posts       Post[]    @relation("PostAccess")
}

enum CodeType {
  SITE
  DIRECTORY
  FILE
}

// 知识图谱节点
model GraphNode {
  id        String   @id @default(uuid())
  label     String
  type      NodeType @default(POST) // POST / TAG / CATEGORY
  targetId  String   // 关联的 Post/Tag/Category ID
  metadata  Json?
  createdAt DateTime @default(now())

  post      Post?    @relation(fields: [postId], references: [id])
  postId    String?
}

// 知识图谱边
model GraphEdge {
  id         String   @id @default(uuid())
  sourceId   String   // 源节点 ID
  targetId   String   // 目标节点 ID
  relation   String   // 关系类型: MENTION / REFERENCE / RELATED / TAGGED
  weight     Float    @default(1.0)
  metadata   Json?
  createdAt  DateTime @default(now())
}

// 留言模型
model Comment {
  id        String   @id @default(uuid())
  content   String
  authorName String
  authorEmail String?
  isApproved Boolean  @default(false)
  parentId  String?
  parent    Comment? @relation("CommentThread", fields: [parentId], references: [id])
  replies   Comment[] @relation("CommentThread")
  user      User?    @relation(fields: [userId], references: [id])
  userId    String?
  createdAt DateTime @default(now())
}

// 站点设置
model SiteSetting {
  id        String   @id @default(uuid())
  key       String   @unique
  value     String
  updatedAt DateTime @default(now())
}
```

---

## 八、环境变量配置

```env
# ============ 应用 ============
NEXT_PUBLIC_APP_URL=http://localhost:3000
APP_NAME=WikiFlow

# ============ 数据库 ============
DATABASE_URL="postgresql://wiki:wiki123@localhost:5432/wikiflow"

# ============ Redis ============
UPSTASH_REDIS_REST_URL="http://localhost:6379"
UPSTASH_REDIS_REST_TOKEN=""

# ============ 认证 ============
AUTH_SECRET="your-auth-secret-here"
AUTH_URL="${NEXT_PUBLIC_APP_URL}"

# ============ 邮件 (Resend) ============
RESEND_API_KEY="re_xxxxxxxx"
EMAIL_FROM="noreply@wikiflow.com"

# ============ 文件存储 ============
UPLOAD_DIR="./public/uploads"
MAX_UPLOAD_SIZE_MB=50

# ============ Neo4j (可选) ============
NEO4J_URI="bolt://localhost:7687"
NEO4J_USERNAME="neo4j"
NEO4J_PASSWORD="neo4j123"

# ============ 可选: S3 存储 ============
S3_BUCKET=""
S3_REGION=""
S3_ACCESS_KEY=""
S3_SECRET_KEY=""
```

---

## 九、访问码安全设计

```
┌─────────────────────────────────────────────────────┐
│  访问码验证层级 (从高到低)                              │
│                                                      │
│  ① SITE CODE (全站码)                                 │
│     → 未通过则拒绝所有访问, 跳转到验证页                  │
│                                                      │
│  ② DIRECTORY CODE (目录码)                            │
│     → 访问特定分类/目录时需要                     │
│                                                      │
│  ③ FILE CODE (文件码)                                │
│     → 访问特定文章时需要                               │
│                                                      │
│  验证流程:                                            │
│  ① 检查是否启用全站码 → 验证 Cookie/Session              │
│  ② 检查文章所属目录是否有码 → 验证                     │
│  ③ 检查文章自身是否有码 → 验证                          │
│  ④ 全部通过 → 展示内容                                 │
│                                                      │
│  存储方式: code 字段 bcrypt 哈希存储, 验证时比对         │
│  有效期: 支持设置过期时间和最大使用次数                   │
│  共享: 验证通过后写入 Cookie, 有效期可配置               │
└─────────────────────────────────────────────────────┘
```

---

## 十、知识图谱数据流

```
┌──────────────────────────────────────────────────────┐
│  知识图谱自动构建流程                                    │
│                                                      │
│  ① 导入/编辑 Markdown 文件                             │
│     ↓                                                │
│  ② 后端解析 Markdown 提取:                              │
│     - WikiLinks: [[页面名]] → 文章间引用关系             │
│     - Tags → 标签关联                                 │
│     - Category → 分类归属                             │
│     - 关键词提取 (TF-IDF / NLP)                       │
│     ↓                                                │
│  ③ 更新图谱:                                          │
│     - 创建/更新节点 (文章/标签/分类)                      │
│     - 创建/更新边 (引用/分类/标签关系)                    │
│     ↓                                                │
│  ④ 前端可视化:                                        │
│     - ECharts 力导向图渲染                              │
│     - 支持拖拽/缩放/点击/搜索                           │
│     - 点击节点跳转到对应文章                              │
└──────────────────────────────────────────────────────┘
```

---

*文档由 WikiFlow 项目设计阶段生成*
