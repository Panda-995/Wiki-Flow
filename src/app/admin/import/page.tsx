"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/admin/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { Upload, FileText, Archive, CheckCircle, XCircle, Loader2 } from "lucide-react";

interface ImportResult {
  success: boolean;
  slug?: string;
  title?: string;
  error?: string;
}

interface ImportResponse {
  isSuccess?: boolean;
  slug?: string;
  title?: string;
  redirectUrl?: string;
  total?: number;
  successCount?: number;
  failedCount?: number;
  results?: ImportResult[];
  error?: string;
}

export default function AdminImportPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [strategy, setStrategy] = useState<"skip" | "overwrite" | "rename">("skip");
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ImportResponse | null>(null);
  const [dragOver, setDragOver] = useState(false);

  if (status === "authenticated" && session?.user?.role !== "ADMIN") {
    redirect("/");
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      setFile(droppedFile);
      setResult(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleImport = async () => {
    if (!file) return;

    setIsUploading(true);
    setProgress(0);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("strategy", strategy);

    const progressInterval = setInterval(() => {
      setProgress((p) => Math.min(p + 10, 90));
    }, 200);

    try {
      const res = await fetch("/api/import", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);
      setProgress(100);

      const data: ImportResponse = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "导入失败");
      }

      setResult(data);
    } catch (error) {
      clearInterval(progressInterval);
      setResult({
        error: error instanceof Error ? error.message : "导入失败",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const isZip = file?.name.toLowerCase().endsWith(".zip");

  if (status === "loading") {
    return (
      <div className="flex min-h-screen">
        <AdminSidebar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    redirect("/login");
    return null;
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-6 max-w-4xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Upload className="h-8 w-8 text-primary" />
              文件导入
            </h1>
            <p className="text-muted-foreground mt-1">批量导入 Markdown 文件到系统中</p>
          </div>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>导入文件</CardTitle>
              <CardDescription>支持导入单个 .md 文件或包含多个 .md 文件的 .zip 压缩包</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragOver
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/25"
                }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".md,.zip"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="flex flex-col items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                    <Upload className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-lg font-medium">
                      {file ? file.name : "拖拽文件到此处或点击选择"}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      支持 .md 单文件和包含多个 .md 的 .zip 压缩包
                    </p>
                  </div>
                  {!file && (
                    <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                      选择文件
                    </Button>
                  )}
                  {file && (
                    <Button variant="outline" onClick={() => { setFile(null); setResult(null); }}>
                      清除文件
                    </Button>
                  )}
                </div>
              </div>

              {file && (
                <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                  {isZip ? (
                    <Archive className="h-8 w-8 text-primary" />
                  ) : (
                    <FileText className="h-8 w-8 text-primary" />
                  )}
                  <div className="flex-1">
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                </div>
              )}

              {file && (
                <>
                  <div className="space-y-3">
                    <Label>冲突处理策略</Label>
                    <RadioGroup
                      value={strategy}
                      onValueChange={(v) => setStrategy(v as typeof strategy)}
                      className="space-y-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="skip" id="skip" />
                        <Label htmlFor="skip" className="font-normal cursor-pointer">
                          跳过 - 如果 slug 重复则跳过该文件
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="overwrite" id="overwrite" />
                        <Label htmlFor="overwrite" className="font-normal cursor-pointer">
                          覆盖 - 如果 slug 重复则删除旧文件
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="rename" id="rename" />
                        <Label htmlFor="rename" className="font-normal cursor-pointer">
                          重命名 - 如果 slug 重复则添加时间戳
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {isUploading && <Progress value={progress} className="h-2" />}

                  {result && (
                    <div className={`p-4 rounded-lg ${result.error ? "bg-destructive/10" : "bg-green-500/10"}`}>
                      {result.error ? (
                        <div className="flex items-start gap-3">
                          <XCircle className="h-5 w-5 text-destructive mt-0.5" />
                          <p className="text-destructive">{result.error}</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            <p className="font-medium">
                              导入完成！成功 {result.successCount} 个，失败 {result.failedCount} 个
                            </p>
                          </div>
                          {result.redirectUrl && (
                            <Button onClick={() => router.push(result.redirectUrl!)}>
                              查看导入的文章
                            </Button>
                          )}
                          {result.results && result.results.length > 0 && (
                            <div className="mt-4 max-h-60 overflow-y-auto space-y-2">
                              {result.results.map((r, i) => (
                                <div key={i} className="flex items-center gap-2 text-sm">
                                  {r.success ? (
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                  ) : (
                                    <XCircle className="h-4 w-4 text-red-500" />
                                  )}
                                  <span className={r.success ? "" : "text-muted-foreground"}>
                                    {r.title || r.error}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <Button
                    onClick={handleImport}
                    disabled={isUploading}
                    className="w-full"
                    size="lg"
                  >
                    {isUploading ? "导入中..." : "开始导入"}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="mt-6 border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg">Frontmatter 支持</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>导入时会自动解析 Markdown 文件的 Frontmatter：</p>
              <div className="bg-muted p-3 rounded font-mono text-xs overflow-x-auto">
                <pre>{`---
title: 文章标题
tags: [React, TypeScript]
category: 前端
date: 2024-01-01
status: published
---

# 正文内容`}</pre>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
