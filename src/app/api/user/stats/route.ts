import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  try {
    const [posts, comments] = await Promise.all([
      prisma.post.count({ where: { authorId: session.user.id } }),
      prisma.comment.count({ where: { authorId: session.user.id } }),
    ]);

    return NextResponse.json({ posts, comments });
  } catch {
    return NextResponse.json({ posts: 0, comments: 0 });
  }
}
