import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { v4 as uuidv4 } from "uuid";

export const dynamic = "force-dynamic";

const ALLOWED_EXTENSIONS = new Set(["jpg", "jpeg", "png", "gif", "webp", "svg"]);
const MAX_SIZE = 5 * 1024 * 1024;

const MAGIC_NUMBERS: Record<string, number[]> = {
  jpg: [0xff, 0xd8, 0xff],
  jpeg: [0xff, 0xd8, 0xff],
  png: [0x89, 0x50, 0x4e, 0x47],
  gif: [0x47, 0x49, 0x46, 0x38],
  webp: [0x52, 0x49, 0x46, 0x46],
};

function detectTypeByMagic(buffer: Buffer): string | null {
  for (const [ext, magic] of Object.entries(MAGIC_NUMBERS)) {
    if (magic.every((byte, i) => buffer[i] === byte)) {
      if (ext === "webp") {
        if (buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50) {
          return ext;
        }
        continue;
      }
      return ext;
    }
  }
  return null;
}

function isSvgByContent(buffer: Buffer): boolean {
  const head = buffer.slice(0, 256).toString("utf8").toLowerCase().trimStart();
  return head.startsWith("<?xml") || head.startsWith("<svg") || head.startsWith("<!doctype svg");
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "未选择文件" }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "文件大小不能超过 5MB" }, { status: 400 });
    }

    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return NextResponse.json(
        { error: "不支持的文件类型，仅支持 JPG、PNG、GIF、WebP、SVG" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    if (ext === "svg") {
      if (!isSvgByContent(buffer)) {
        return NextResponse.json({ error: "文件内容不是有效的 SVG" }, { status: 400 });
      }
    } else {
      const detectedType = detectTypeByMagic(buffer);
      if (!detectedType) {
        return NextResponse.json({ error: "无法识别的文件格式" }, { status: 400 });
      }
      if (detectedType !== ext && !(detectedType === "jpg" && ext === "jpeg")) {
        return NextResponse.json({ error: "文件扩展名与实际内容不匹配" }, { status: 400 });
      }
    }

    const filename = `${uuidv4()}.${ext}`;
    const uploadDir = join(process.cwd(), "public", "uploads");

    await mkdir(uploadDir, { recursive: true });
    await writeFile(join(uploadDir, filename), buffer);

    const url = `/uploads/${filename}`;

    return NextResponse.json({ url, filename });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "上传失败" }, { status: 500 });
  }
}
