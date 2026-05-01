import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format") || "json";
    const type = searchParams.get("type") || "posts";

    if (type === "posts") {
      const posts = await prisma.post.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          author: { select: { name: true, email: true } },
          category: { select: { name: true } },
          tags: { select: { name: true } },
        },
      });

      if (format === "markdown") {
        let md = "";
        for (const post of posts) {
          md += `# ${post.title}\n\n`;
          md += `> 作者: ${post.author.name || "未知"} | 状态: ${post.status} | 日期: ${post.createdAt.toISOString()}\n\n`;
          if (post.category) md += `> 分类: ${post.category.name}\n\n`;
          if (post.tags.length > 0) md += `> 标签: ${post.tags.map((t) => t.name).join(", ")}\n\n`;
          md += `---\n\n${post.content}\n\n---\n\n`;
        }

        return new NextResponse(md, {
          headers: {
            "Content-Type": "text/markdown; charset=utf-8",
            "Content-Disposition": `attachment; filename="wiki-posts-${new Date().toISOString().slice(0, 10)}.md"`,
          },
        });
      }

      return NextResponse.json(
        { posts, exportedAt: new Date().toISOString(), total: posts.length },
        {
          headers: {
            "Content-Disposition": `attachment; filename="wiki-posts-${new Date().toISOString().slice(0, 10)}.json"`,
          },
        }
      );
    }

    if (type === "users") {
      const users = await prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          role: true,
          emailVerified: true,
          createdAt: true,
          _count: { select: { posts: true, comments: true } },
        },
      });

      return NextResponse.json(
        { users, exportedAt: new Date().toISOString(), total: users.length },
        {
          headers: {
            "Content-Disposition": `attachment; filename="wiki-users-${new Date().toISOString().slice(0, 10)}.json"`,
          },
        }
      );
    }

    return NextResponse.json({ error: "不支持的导出类型" }, { status: 400 });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json({ error: "导出失败" }, { status: 500 });
  }
}
