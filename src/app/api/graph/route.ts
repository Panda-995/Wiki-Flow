import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [posts, categories, tags] = await Promise.all([
      prisma.post.findMany({
        where: { status: "PUBLISHED" },
        select: { id: true, title: true, categoryId: true, tags: { select: { id: true } } },
      }),
      prisma.category.findMany({ select: { id: true, name: true, parentId: true } }),
      prisma.tag.findMany({ select: { id: true, name: true } }),
    ]);

    const nodes = [
      ...posts.map((p) => ({ id: `post-${p.id}`, label: p.title, type: "post" as const })),
      ...categories.map((c) => ({ id: `cat-${c.id}`, label: c.name, type: "category" as const })),
      ...tags.map((t) => ({ id: `tag-${t.id}`, label: t.name, type: "tag" as const })),
    ];

    const links: { source: string; target: string }[] = [];

    posts.forEach((post) => {
      if (post.categoryId) {
        links.push({ source: `post-${post.id}`, target: `cat-${post.categoryId}` });
      }
      post.tags.forEach((tag) => {
        links.push({ source: `post-${post.id}`, target: `tag-${tag.id}` });
      });
    });

    categories.forEach((cat) => {
      if (cat.parentId) {
        links.push({ source: `cat-${cat.id}`, target: `cat-${cat.parentId}` });
      }
    });

    return NextResponse.json({ nodes, links });
  } catch {
    return NextResponse.json({ nodes: [], links: [] });
  }
}