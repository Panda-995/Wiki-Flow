<p align="center">
  <img src="https://img.shields.io/badge/Next.js-15-black?logo=next.js" alt="Next.js">
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react" alt="React">
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss" alt="Tailwind">
  <img src="https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma" alt="Prisma">
  <img src="https://img.shields.io/badge/SQLite-003B57?logo=sqlite" alt="SQLite">
  <img src="https://img.shields.io/badge/Docker-2496ED?logo=docker" alt="Docker">
  <img src="https://img.shields.io/badge/license-MIT-green" alt="License">
</p>

<h1 align="center">WikiFlow</h1>
<p align="center"><strong>Modern Markdown Wiki System</strong> / <strong>现代化 Markdown WIKI 系统</strong></p>
<p align="center">Knowledge Graph · File Import · Multi-level Access Control</p>
<p align="center">知识图谱 · 文件导入 · 多级访问控制</p>

---

[English](#english) | [中文](#中文)

---

<a name="english"></a>
## English

### Tech Stack

**Frontend**
- **Next.js 15** (App Router + RSC)
- **React 19**
- **TypeScript 5**
- **Tailwind CSS 4**
- **shadcn/ui** + **Radix UI**
- **Lucide React** (Icons)

**Backend**
- **Next.js Server Actions** + **API Routes**
- **Prisma ORM** + **SQLite**
- **Auth.js v5** (Authentication)
- **Resend** / **Nodemailer** (Email)

**Security**
- AES-256-GCM password encryption
- CSP security headers
- XSS protection (HTML escaping)
- File upload magic number detection
- API rate limiting
- Access code permission control

### Quick Start

**Requirements:** Node.js 22+

```bash
npm install
cp .env.example .env   # Edit .env with your config
npm run db:generate
npm run db:push
npm run db:seed         # Optional: seed sample data
npm run dev             # http://localhost:3000
```

### Docker

**Pre-built Images (GitHub Container Registry)**

```bash
# x86 / amd64
docker pull ghcr.io/panda-995/wiki-flow:latest

# ARM / arm64
docker pull ghcr.io/panda-995/wiki-flow:arm
```

**Docker Compose**

```bash
cp .env.example .env
docker compose -f docker/compose.yml up -d
```

SQLite data persists via Docker volume — no data loss on container restart.

### Features

- [x] User authentication (Magic Link + Password)
- [x] Markdown editor & renderer (GFM + Math)
- [x] Comment system (nested replies)
- [x] Batch file import (.md & .zip)
- [x] Category & tag system (tree categories)
- [x] Admin dashboard (Posts/Categories/Tags/Users/Settings)
- [x] Access codes (PUBLIC/PROTECTED/PRIVATE)
- [x] Knowledge graph preview
- [x] Guestbook
- [x] System settings (SMTP/Site/Security)
- [x] Data export (JSON)
- [x] Audit logs
- [x] Dark mode

### Project Structure

```
src/
├── app/              # Next.js App Router
│   ├── admin/        # Admin panel
│   ├── api/          # API routes
│   ├── posts/        # Articles
│   ├── graph/        # Knowledge graph
│   └── guestbook/    # Guestbook
├── components/       # React components
├── lib/              # Utilities
└── actions/          # Server Actions

prisma/
├── schema.prisma     # Database schema
└── seed.ts           # Seed data

docker/
├── compose.yml       # Docker Compose
└── Dockerfile        # App image
```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | SQLite database path | Yes |
| `AUTH_SECRET` | Auth.js secret | Yes |
| `AUTH_URL` | Application URL | Yes |
| `AUTH_RESEND_KEY` | Resend API Key | No |
| `RESEND_API_KEY` | Resend API Key | No |
| `EMAIL_FROM` | Sender address | No |
| `NEXT_PUBLIC_APP_URL` | Public URL | No |

### Database Models

| Model | Description |
|-------|-------------|
| User | Users (ADMIN/EDITOR/USER roles) |
| Post | Articles (Draft/Published/Archived, 3-level access) |
| Category | Categories (tree structure) |
| Tag | Tags |
| Comment | Comments (nested replies) |
| AccessCode | Access codes (usage limit & expiry) |
| ImportJob | Import job records |
| LoginAttempt | Login attempt records |
| EmailVerificationCode | Email verification codes |
| SystemSetting | System settings (key-value) |
| AuditLog | Audit logs |

### License

MIT

---

<a name="中文"></a>
## 中文

### 技术栈

**前端**
- **Next.js 15** (App Router + RSC)
- **React 19**
- **TypeScript 5**
- **Tailwind CSS 4**
- **shadcn/ui** + **Radix UI**
- **Lucide React** (图标)

**后端**
- **Next.js Server Actions** + **API Routes**
- **Prisma ORM** + **SQLite**
- **Auth.js v5** (认证)
- **Resend** / **Nodemailer** (邮件服务)

**安全**
- AES-256-GCM 密码加密
- CSP 安全头
- XSS 防护 (HTML 转义)
- 文件上传魔数检测
- API 限流
- 访问码权限控制

### 快速开始

**环境要求：** Node.js 22+

```bash
npm install
cp .env.example .env   # 编辑 .env 填入配置
npm run db:generate
npm run db:push
npm run db:seed         # 可选：初始化示例数据
npm run dev             # http://localhost:3000
```

### Docker

**预构建镜像 (GitHub Container Registry)**

```bash
# x86 / amd64
docker pull ghcr.io/panda-995/wiki-flow:latest

# ARM / arm64
docker pull ghcr.io/panda-995/wiki-flow:arm
```

**Docker Compose**

```bash
cp .env.example .env
docker compose -f docker/compose.yml up -d
```

SQLite 数据通过 Docker volume 持久化，容器重启不丢失数据。

### 功能特性

- [x] 用户认证 (邮箱 Magic Link + 密码登录)
- [x] Markdown 文章编辑与渲染 (GFM + 数学公式)
- [x] 文章评论系统 (支持嵌套回复)
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

### 项目结构

```
src/
├── app/              # Next.js App Router 页面
│   ├── admin/        # 管理后台
│   ├── api/          # API 路由
│   ├── posts/        # 文章页
│   ├── graph/        # 知识图谱
│   └── guestbook/    # 留言板
├── components/       # React 组件
├── lib/              # 工具函数
└── actions/          # Server Actions

prisma/
├── schema.prisma     # 数据库模型
└── seed.ts           # 种子数据

docker/
├── compose.yml       # Docker Compose 配置
└── Dockerfile        # 应用镜像构建
```

### 环境变量

| 变量 | 说明 | 必填 |
|------|------|------|
| `DATABASE_URL` | SQLite 数据库路径 | 是 |
| `AUTH_SECRET` | Auth.js 密钥 | 是 |
| `AUTH_URL` | 应用 URL | 是 |
| `AUTH_RESEND_KEY` | Resend API Key | 否 |
| `RESEND_API_KEY` | Resend API Key | 否 |
| `EMAIL_FROM` | 发件人地址 | 否 |
| `NEXT_PUBLIC_APP_URL` | 公开访问 URL | 否 |

### 数据库模型

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

### 许可证

MIT
