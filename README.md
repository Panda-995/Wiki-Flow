# WikiFlow - 在线知识管理平台

> 现代化的 Markdown WIKI 系统，支持知识图谱、文件导入、多级访问控制

## 技术栈

### 前端
- **Next.js 15** (App Router + RSC)
- **React 19**
- **TypeScript 5**
- **Tailwind CSS 4**
- **shadcn/ui** + **Radix UI**
- **Lucide React** (图标)

### 后端
- **Next.js Server Actions** + **API Routes**
- **Prisma ORM** + **SQLite**
- **Auth.js v5** (认证)
- **Resend** / **Nodemailer** (邮件服务)

### 安全
- AES-256-GCM 密码加密
- CSP 安全头
- XSS 防护 (HTML 转义)
- 文件上传魔数检测
- API 限流
- 访问码权限控制

## 快速开始

### 环境要求
- Node.js 22+

### 1. 安装依赖
```bash
npm install
```

### 2. 配置环境变量
```bash
cp .env.example .env
# 编辑 .env 文件，填入必要的配置
```

### 3. 初始化数据库
```bash
npm run db:generate
npm run db:push
npm run db:seed  # 可选：初始化示例数据
```

### 4. 启动开发服务器
```bash
npm run dev
```

访问 http://localhost:3000

## Docker 部署

```bash
# 1. 创建环境变量文件
cp .env.example .env
# 编辑 .env，填入真实的 AUTH_SECRET、RESEND_API_KEY 等

# 2. 构建并启动
docker compose -f docker/compose.yml up -d

# 3. 查看日志
docker compose -f docker/compose.yml logs -f

# 4. 停止
docker compose -f docker/compose.yml down
```

SQLite 数据库文件通过 Docker volume 持久化存储，容器重启不会丢失数据。

## 功能特性

- [x] 用户认证 (邮箱 Magic Link + 密码登录)
- [x] Markdown 文章编辑与渲染 (GFM + 数学公式)
- [x] 文章评论系统 (支持回复)
- [x] 文件批量导入 (支持 .md 和 .zip)
- [x] 分类与标签系统 (树形分类)
- [x] 管理后台 (仪表盘/文章/分类/标签/用户/设置)
- [x] 访问码系统 (PUBLIC/PROTECTED/PRIVATE)
- [x] 知识图谱预览
- [x] 留言板
- [x] 系统设置 (SMTP/站点/安全配置)
- [x] 数据导出 (JSON 格式)
- [x] 审计日志
- [x] 暗色模式

## 项目结构

```
src/
├── app/              # Next.js App Router 页面
│   ├── admin/        # 管理后台
│   │   ├── settings/ # 系统设置
│   │   └── users/    # 用户管理
│   ├── api/          # API 路由
│   │   ├── admin/    # 管理 API
│   │   ├── posts/    # 文章 API
│   │   ├── comments/ # 评论 API
│   │   ├── search/   # 搜索 API
│   │   ├── upload/   # 上传 API
│   │   ├── import/   # 导入 API
│   │   └── graph/    # 知识图谱 API
│   ├── category/     # 分类页
│   ├── graph/        # 知识图谱
│   ├── guestbook/    # 留言板
│   ├── posts/        # 文章页
│   └── tag/          # 标签页
├── components/       # React 组件
│   ├── admin/        # 管理组件
│   ├── markdown/     # Markdown 组件
│   └── ui/           # shadcn/ui 基础组件
├── lib/              # 工具函数
│   ├── auth.ts       # 认证配置
│   ├── crypto.ts     # 加密工具
│   ├── mail.ts       # 邮件服务
│   ├── markdown.ts   # Markdown 渲染
│   ├── prisma.ts     # 数据库客户端
│   └── settings-constants.ts  # 设置常量
├── actions/          # Server Actions
└── types/            # TypeScript 类型

prisma/
├── schema.prisma     # 数据库模型
└── seed.ts           # 种子数据

docker/
├── compose.yml       # Docker Compose 配置
└── Dockerfile        # 应用镜像构建
```

## 开发命令

```bash
# 开发
npm run dev          # 启动开发服务器

# 代码质量
npm run lint         # ESLint 检查
npm run build        # 生产构建

# 数据库
npm run db:generate  # 生成 Prisma Client
npm run db:push      # 推送 Schema 到数据库
npm run db:migrate   # 运行迁移
npm run db:seed      # 填充示例数据
```

## 环境变量

| 变量 | 说明 | 必填 |
|------|------|------|
| `DATABASE_URL` | SQLite 数据库路径 | 是 |
| `AUTH_SECRET` | Auth.js 密钥 | 是 |
| `AUTH_URL` | 应用 URL | 是 |
| `AUTH_RESEND_KEY` | Resend API Key | 否 |
| `RESEND_API_KEY` | Resend API Key | 否 |
| `EMAIL_FROM` | 发件人地址 | 否 |
| `NEXT_PUBLIC_APP_URL` | 公开访问 URL | 否 |
| `ADMIN_SEED_PASSWORD` | 种子管理员密码 | 否 |
| `EDITOR_SEED_PASSWORD` | 种子编辑者密码 | 否 |

## 数据库模型

| 模型 | 说明 |
|------|------|
| User | 用户 (支持 ADMIN/EDITOR/USER 角色) |
| Post | 文章 (支持草稿/发布/归档，三级访问控制) |
| Category | 分类 (支持树形结构) |
| Tag | 标签 |
| Comment | 评论 (支持嵌套回复) |
| AccessCode | 访问码 (支持使用次数和过期时间) |
| ImportJob | 导入任务记录 |
| LoginAttempt | 登录尝试记录 |
| EmailVerificationCode | 邮箱验证码 |
| SystemSetting | 系统设置 (键值对存储) |
| AuditLog | 审计日志 |

## 许可证

MIT
