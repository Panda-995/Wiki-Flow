import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q");

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ posts: [] });
    }

    const searchQuery = query.trim().toLowerCase();
    const session = await auth();

    const posts = await prisma.post.findMany({
      where: {
        status: "PUBLISHED",
        OR: [
          { title: { contains: searchQuery } },
          { content: { contains: searchQuery } },
          { excerpt: { contains: searchQuery } },
        ],
        AND: [
          {
            OR: [
              { accessLevel: "PUBLIC" },
              ...(session?.user
                ? [{ accessLevel: "PROTECTED" as const }, { accessLevel: "PRIVATE" as const, authorId: session.user.id }]
                : []),
            ],
          },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        author: { select: { name: true } },
        category: { select: { name: true, color: true } },
        tags: { select: { name: true } },
      },
    });

    const results = posts.map((post) => ({
      id: post.id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      status: post.status,
      author: post.author,
      category: post.category,
      tags: post.tags,
      createdAt: post.createdAt,
      publishedAt: post.publishedAt,
    }));

    return NextResponse.json({ posts: results, query });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ error: "搜索失败", posts: [] }, { status: 500 });
  }
}