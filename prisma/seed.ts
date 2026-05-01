import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("开始填充种子数据...");

  const adminPassword = await bcrypt.hash(
    process.env.ADMIN_SEED_PASSWORD || "admin123",
    12
  );

  const admin = await prisma.user.upsert({
    where: { email: "admin@wikiflow.dev" },
    update: { password: adminPassword },
    create: {
      email: "admin@wikiflow.dev",
      name: "管理员",
      password: adminPassword,
      role: Role.ADMIN,
      emailVerified: new Date(),
    },
  });

  await prisma.account.upsert({
    where: { provider_providerAccountId: { provider: "credentials", providerAccountId: admin.id } },
    update: {},
    create: {
      userId: admin.id,
      type: "credentials",
      provider: "credentials",
      providerAccountId: admin.id,
    },
  });

  const editorPassword = await bcrypt.hash(
    process.env.EDITOR_SEED_PASSWORD || "editor123",
    12
  );

  const editor = await prisma.user.upsert({
    where: { email: "editor@wikiflow.dev" },
    update: { password: editorPassword },
    create: {
      email: "editor@wikiflow.dev",
      name: "编辑者",
      password: editorPassword,
      role: Role.EDITOR,
      emailVerified: new Date(),
    },
  });

  await prisma.account.upsert({
    where: { provider_providerAccountId: { provider: "credentials", providerAccountId: editor.id } },
    update: {},
    create: {
      userId: editor.id,
      type: "credentials",
      provider: "credentials",
      providerAccountId: editor.id,
    },
  });

  const techCategory = await prisma.category.upsert({
    where: { slug: "tech" },
    update: {},
    create: {
      name: "技术",
      slug: "tech",
      description: "技术相关文章",
      color: "#3b82f6",
      order: 1,
    },
  });

  await prisma.category.upsert({
    where: { slug: "life" },
    update: {},
    create: {
      name: "生活",
      slug: "life",
      description: "生活随笔",
      color: "#22c55e",
      order: 2,
    },
  });

  await prisma.category.upsert({
    where: { slug: "frontend" },
    update: {},
    create: {
      name: "前端开发",
      slug: "frontend",
      description: "前端技术文章",
      color: "#8b5cf6",
      order: 1,
      parentId: techCategory.id,
    },
  });

  await prisma.tag.upsert({
    where: { slug: "react" },
    update: {},
    create: {
      name: "React",
      slug: "react",
      color: "#61dafb",
    },
  });

  const samplePost = await prisma.post.upsert({
    where: { slug: "welcome-to-wikiflow" },
    update: {},
    create: {
      title: "欢迎使用 WikiFlow",
      slug: "welcome-to-wikiflow",
      content: `# 欢迎使用 WikiFlow

WikiFlow 是一个现代化的知识管理平台，支持 Markdown 写作、文件导入、知识图谱等功能。

## 主要特性

- **Markdown 编辑** - 支持完整的 Markdown 语法和扩展
- **文件导入** - 支持批量导入 .md 文件
- **知识图谱** - 可视化知识关联
- **访问控制** - 多级访问码保护

## 快速开始

1. 注册账号或登录
2. 创建您的第一篇文章
3. 整理分类和标签

祝你使用愉快！`,
      excerpt: "欢迎使用 WikiFlow 知识管理平台",
      status: "PUBLISHED",
      authorId: admin.id,
      categoryId: techCategory.id,
      publishedAt: new Date(),
    },
  });

  await prisma.postMeta.upsert({
    where: { postId: samplePost.id },
    update: {},
    create: {
      postId: samplePost.id,
      aliases: ["home", "index"],
    },
  });

  console.log("种子数据填充完成！");
  console.log("管理员账号: admin@wikiflow.dev / admin123");
  console.log("编辑者账号: editor@wikiflow.dev");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
