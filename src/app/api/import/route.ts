import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { parseMarkdown, slugify } from "@/lib/markdown";
import type { PostStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_ZIP_SIZE = 50 * 1024 * 1024;
const MAX_ZIP_FILES = 500;

interface ImportResult {
  success: boolean;
  slug?: string;
  title?: string;
  error?: string;
}

async function parseAndCreatePost(
  content: string,
  filename: string,
  authorId: string,
  conflictStrategy: "skip" | "overwrite" | "rename" = "skip"
): Promise<ImportResult> {
  try {
    const parsed = parseMarkdown(content);

    const existingPost = await prisma.post.findUnique({
      where: { slug: parsed.slug },
    });

    if (existingPost) {
      if (conflictStrategy === "skip") {
        return { success: false, error: `Slug "${parsed.slug}" 已存在，跳过` };
      }
      if (conflictStrategy === "rename") {
        parsed.slug = `${parsed.slug}-${Date.now()}`;
      }
      if (conflictStrategy === "overwrite") {
        await prisma.post.delete({ where: { id: existingPost.id } });
      }
    }

    const post = await prisma.post.create({
      data: {
        title: parsed.title,
        slug: parsed.slug,
        content: parsed.content,
        excerpt: parsed.excerpt,
        status: ((parsed.status?.toUpperCase() || "DRAFT") as PostStatus),
        authorId,
        tags: {
          connectOrCreate: (parsed.tags || []).map((name) => ({
            where: { slug: slugify(name) },
            create: { name, slug: slugify(name) },
          })),
        },
      },
    });

    return { success: true, slug: post.slug, title: post.title };
  } catch (error) {
    console.error(`Error importing ${filename}:`, error);
    return { success: false, error: `处理 "${filename}" 失败: ${error instanceof Error ? error.message : "未知错误"}` };
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  if (!["ADMIN", "EDITOR"].includes(session.user.role)) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const conflictStrategy = (formData.get("strategy") as "skip" | "overwrite" | "rename") || "skip";

    if (!file) {
      return NextResponse.json({ error: "未上传文件" }, { status: 400 });
    }

    const fileName = file.name;
    const isZip = fileName.toLowerCase().endsWith(".zip");

    if (isZip) {
      if (file.size > MAX_ZIP_SIZE) {
        return NextResponse.json({ error: `ZIP 文件不能超过 ${MAX_ZIP_SIZE / 1024 / 1024}MB` }, { status: 400 });
      }

      const JSZip = (await import("jszip")).default;
      const zip = await JSZip.loadAsync(file);

      const mdFiles = Object.keys(zip.files).filter(
        (name) => name.toLowerCase().endsWith(".md") && !zip.files[name].dir
      );

      if (mdFiles.length === 0) {
        return NextResponse.json({ error: "ZIP 文件中没有找到 .md 文件" }, { status: 400 });
      }

      if (mdFiles.length > MAX_ZIP_FILES) {
        return NextResponse.json({ error: `ZIP 中文件数量不能超过 ${MAX_ZIP_FILES} 个` }, { status: 400 });
      }

      const job = await prisma.importJob.create({
        data: {
          fileName,
          totalFiles: mdFiles.length,
          status: "processing",
        },
      });

      const results: ImportResult[] = [];
      let successCount = 0;
      let failCount = 0;

      for (const mdFileName of mdFiles) {
        const fileContent = await zip.files[mdFileName].async("string");
        const result = await parseAndCreatePost(
          fileContent,
          mdFileName,
          session.user.id,
          conflictStrategy
        );
        results.push(result);
        if (result.success) {
          successCount++;
        } else {
          failCount++;
        }
      }

      await prisma.importJob.update({
        where: { id: job.id },
        data: {
          successCount,
          failCount,
          status: "completed",
          errors: results.filter((r) => !r.success).map((r) => r.error).filter((e): e is string => Boolean(e)),
        },
      });

      return NextResponse.json({
        jobId: job.id,
        total: mdFiles.length,
        successCount,
        failedCount: failCount,
        results,
      });
    } else {
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json({ error: `文件不能超过 ${MAX_FILE_SIZE / 1024 / 1024}MB` }, { status: 400 });
      }

      const content = await file.text();

      if (!content.trim()) {
        return NextResponse.json({ error: "文件内容为空" }, { status: 400 });
      }

      const result = await parseAndCreatePost(content, fileName, session.user.id, conflictStrategy);

      if (!result.success) {
        return NextResponse.json(result, { status: 400 });
      }

      return NextResponse.json({
        isSuccess: true,
        slug: result.slug,
        title: result.title,
        redirectUrl: `/posts/${result.slug}`,
      });
    }
  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json(
      { error: `导入失败: ${error instanceof Error ? error.message : "未知错误"}` },
      { status: 500 }
    );
  }
}
