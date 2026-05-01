"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { slugify } from "@/lib/markdown";

export async function createCategory(formData: FormData) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "EDITOR"].includes(session.user.role)) {
    throw new Error("无权限");
  }

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const color = formData.get("color") as string;
  const parentId = formData.get("parentId") as string | null;
  const order = parseInt(formData.get("order") as string) || 0;

  if (!name) {
    throw new Error("分类名称不能为空");
  }

  const slug = slugify(name);

  const existing = await prisma.category.findUnique({ where: { slug } });
  if (existing) {
    throw new Error("该分类 slug 已存在");
  }

  const category = await prisma.category.create({
    data: {
      name,
      slug,
      description: description || null,
      color: color || null,
      parentId: parentId || null,
      order,
    },
  });

  revalidatePath("/posts");
  revalidatePath("/");
  return category;
}

export async function updateCategory(categoryId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "EDITOR"].includes(session.user.role)) {
    throw new Error("无权限");
  }

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const color = formData.get("color") as string;
  const parentId = formData.get("parentId") as string | null;
  const order = parseInt(formData.get("order") as string) || 0;

  if (!name) {
    throw new Error("分类名称不能为空");
  }

  const slug = slugify(name);

  const category = await prisma.category.update({
    where: { id: categoryId },
    data: {
      name,
      slug,
      description: description || null,
      color: color || null,
      parentId: parentId || null,
      order,
    },
  });

  revalidatePath("/posts");
  revalidatePath("/");
  revalidatePath(`/category/${slug}`);
  return category;
}

export async function deleteCategory(categoryId: string) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "EDITOR"].includes(session.user.role)) {
    throw new Error("无权限");
  }

  await prisma.category.delete({ where: { id: categoryId } });

  revalidatePath("/posts");
  revalidatePath("/");
}

export async function createTag(formData: FormData) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "EDITOR"].includes(session.user.role)) {
    throw new Error("无权限");
  }

  const name = formData.get("name") as string;
  const color = formData.get("color") as string;

  if (!name) {
    throw new Error("标签名称不能为空");
  }

  const slug = slugify(name);

  const existing = await prisma.tag.findUnique({ where: { slug } });
  if (existing) {
    throw new Error("该标签 slug 已存在");
  }

  const tag = await prisma.tag.create({
    data: {
      name,
      slug,
      color: color || null,
    },
  });

  revalidatePath("/posts");
  revalidatePath("/");
  return tag;
}

export async function updateTag(tagId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "EDITOR"].includes(session.user.role)) {
    throw new Error("无权限");
  }

  const name = formData.get("name") as string;
  const color = formData.get("color") as string;

  if (!name) {
    throw new Error("标签名称不能为空");
  }

  const slug = slugify(name);

  const tag = await prisma.tag.update({
    where: { id: tagId },
    data: {
      name,
      slug,
      color: color || null,
    },
  });

  revalidatePath("/posts");
  revalidatePath("/");
  revalidatePath(`/tag/${slug}`);
  return tag;
}

export async function deleteTag(tagId: string) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "EDITOR"].includes(session.user.role)) {
    throw new Error("无权限");
  }

  await prisma.tag.delete({ where: { id: tagId } });

  revalidatePath("/posts");
  revalidatePath("/");
}
