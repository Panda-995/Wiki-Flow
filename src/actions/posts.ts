"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { slugify, extractExcerpt } from "@/lib/markdown";
import type { PostStatus } from "@prisma/client";

export async function createPost(formData: FormData) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("未登录");
  }

  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const status = (formData.get("status") as PostStatus) || "DRAFT";
  const categoryId = formData.get("categoryId") as string | null;
  const tagsString = formData.get("tags") as string;

  if (!title || !content) {
    throw new Error("标题和内容不能为空");
  }

  const slug = slugify(title);
  const excerpt = extractExcerpt(content);

  const existingPost = await prisma.post.findUnique({
    where: { slug },
  });

  if (existingPost) {
    throw new Error("该 slug 已存在，请修改标题");
  }

  const tags = tagsString
    ? tagsString.split(",").map((t) => t.trim()).filter(Boolean)
    : [];

  const post = await prisma.post.create({
    data: {
      title,
      slug,
      content,
      excerpt,
      status,
      authorId: session.user.id,
      categoryId: categoryId || null,
      publishedAt: status === "PUBLISHED" ? new Date() : null,
      tags: {
        connectOrCreate: tags.map((name) => ({
          where: { slug: slugify(name) },
          create: { name, slug: slugify(name) },
        })),
      },
    },
    include: {
      tags: true,
    },
  });

  revalidatePath("/posts");
  revalidatePath("/");
  redirect(`/posts/${post.slug}`);
}

export async function updatePost(postId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("未登录");
  }

  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const status = (formData.get("status") as PostStatus) || "DRAFT";
  const categoryId = formData.get("categoryId") as string | null;
  const tagsString = formData.get("tags") as string;

  if (!title || !content) {
    throw new Error("标题和内容不能为空");
  }

  const existingPost = await prisma.post.findUnique({
    where: { id: postId },
  });

  if (!existingPost) {
    throw new Error("文章不存在");
  }

  if (existingPost.authorId !== session.user.id && session.user.role !== "ADMIN") {
    throw new Error("无权限编辑此文章");
  }

  const slug = title !== existingPost.title ? slugify(title) : existingPost.slug;
  const excerpt = extractExcerpt(content);

  const tags = tagsString
    ? tagsString.split(",").map((t) => t.trim()).filter(Boolean)
    : [];

  const post = await prisma.post.update({
    where: { id: postId },
    data: {
      title,
      slug,
      content,
      excerpt,
      status,
      categoryId: categoryId || null,
      publishedAt: status === "PUBLISHED" && !existingPost.publishedAt ? new Date() : existingPost.publishedAt,
      tags: {
        set: [],
        connectOrCreate: tags.map((name) => ({
          where: { slug: slugify(name) },
          create: { name, slug: slugify(name) },
        })),
      },
    },
    include: {
      tags: true,
    },
  });

  revalidatePath("/posts");
  revalidatePath(`/posts/${post.slug}`);
  redirect(`/posts/${post.slug}`);
}

export async function deletePost(postId: string) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("未登录");
  }

  const post = await prisma.post.findUnique({
    where: { id: postId },
  });

  if (!post) {
    throw new Error("文章不存在");
  }

  if (post.authorId !== session.user.id && session.user.role !== "ADMIN") {
    throw new Error("无权限删除此文章");
  }

  await prisma.post.delete({
    where: { id: postId },
  });

  revalidatePath("/posts");
  redirect("/posts");
}
