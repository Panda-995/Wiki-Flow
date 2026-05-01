"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createPost } from "@/actions/posts";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { MarkdownViewer } from "@/components/markdown/markdown-viewer";
import { 
  Bold, Italic, Heading1, Heading2, List, ListOrdered, Link as LinkIcon, 
  Code, Quote, Save, Eye, Edit3, Hash,
  Undo, Redo, Check, Upload, Loader2
} from "lucide-react";

interface Tag {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
  color: string | null;
}

export function NewPostForm() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [status, setStatus] = useState<"DRAFT" | "PUBLISHED">("DRAFT");
  const [categoryId, setCategoryId] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [isPreview, setIsPreview] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [uploading, setUploading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchTags();
    fetchCategories();
  }, []);

  useEffect(() => {
    if (title || content) {
      setHasChanges(true);
    }
  }, [title, content, excerpt, selectedTags, categoryId]);

  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      if (hasChanges && (title || content)) {
        localStorage.setItem("draft", JSON.stringify({
          title,
          content,
          excerpt,
          status,
          categoryId,
          selectedTags,
          savedAt: new Date().toISOString()
        }));
        setLastSaved(new Date());
        setHasChanges(false);
      }
    }, 30000);

    return () => clearInterval(autoSaveInterval);
  }, [title, content, excerpt, status, categoryId, selectedTags, hasChanges]);

  useEffect(() => {
    const savedDraft = localStorage.getItem("draft");
    if (savedDraft && !title && !content) {
      const draft = JSON.parse(savedDraft);
      if (confirm("发现未保存的草稿，是否恢复？")) {
        setTitle(draft.title || "");
        setContent(draft.content || "");
        setExcerpt(draft.excerpt || "");
        setStatus(draft.status || "DRAFT");
        setCategoryId(draft.categoryId || "");
        setSelectedTags(draft.selectedTags || []);
        if (draft.savedAt) {
          setLastSaved(new Date(draft.savedAt));
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchTags = async () => {
    try {
      const res = await fetch("/api/tags");
      const data = await res.json();
      setTags(Array.isArray(data) ? data : (data.tags || []));
    } catch (error) {
      console.error("Failed to fetch tags:", error);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories");
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : (data.categories || []));
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  };

  const insertMarkdown = useCallback((prefix: string, suffix: string = "", placeholder: string = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const textToInsert = selectedText || placeholder;

    const newContent = 
      content.substring(0, start) + 
      prefix + textToInsert + suffix + 
      content.substring(end);
    
    setContent(newContent);

    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + prefix.length + textToInsert.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  }, [content]);

  const uploadImage = useCallback(async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (res.ok && data.url) {
        insertMarkdown(`![${file.name}](${data.url})`);
      } else {
        setError(data.error || "上传失败");
      }
    } catch {
      setError("图片上传失败");
    } finally {
      setUploading(false);
    }
  }, [insertMarkdown]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadImage(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of Array.from(items)) {
      if (item.type.startsWith("image/")) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) uploadImage(file);
        break;
      }
    }
  }, [uploadImage]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith("image/")) {
        uploadImage(file);
      }
    }
  }, [uploadImage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    const formData = new FormData();
    formData.append("title", title);
    formData.append("content", content);
    formData.append("status", status);
    if (excerpt) formData.append("excerpt", excerpt);
    if (categoryId) formData.append("categoryId", categoryId);
    if (selectedTags.length > 0) {
      const tagNames = selectedTags
        .map((id) => tags.find((t) => t.id === id)?.name)
        .filter(Boolean)
        .join(",");
      if (tagNames) formData.append("tags", tagNames);
    }

    try {
      await createPost(formData);
      localStorage.removeItem("draft");
      window.location.href = "/posts";
    } catch (err) {
      setError(err instanceof Error ? err.message : "创建失败");
      setIsSubmitting(false);
    }
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  const toolbarActions = [
    { icon: Bold, action: () => insertMarkdown("**", "**", "粗体文本"), title: "粗体" },
    { icon: Italic, action: () => insertMarkdown("*", "*", "斜体文本"), title: "斜体" },
    { icon: Heading1, action: () => insertMarkdown("\n# ", "", "一级标题"), title: "一级标题" },
    { icon: Heading2, action: () => insertMarkdown("\n## ", "", "二级标题"), title: "二级标题" },
    { icon: List, action: () => insertMarkdown("\n- ", "", "列表项"), title: "无序列表" },
    { icon: ListOrdered, action: () => insertMarkdown("\n1. ", "", "有序列表项"), title: "有序列表" },
    { icon: LinkIcon, action: () => insertMarkdown("[", "](url)", "链接文本"), title: "链接" },
    { icon: uploading ? Loader2 : Upload, action: () => fileInputRef.current?.click(), title: "上传图片", spin: uploading },
    { icon: Code, action: () => insertMarkdown("`", "`", "代码"), title: "行内代码" },
    { icon: Quote, action: () => insertMarkdown("\n> ", "", "引用文本"), title: "引用" },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title" className="text-base font-semibold">文章标题</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="输入文章标题..."
          className="text-lg font-semibold h-12"
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="status" className="text-sm font-medium">发布状态</Label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value as "DRAFT" | "PUBLISHED")}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="DRAFT">草稿</option>
            <option value="PUBLISHED">发布</option>
          </select>
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="category" className="text-sm font-medium">分类目录</Label>
          <select
            id="category"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">选择分类（可选）</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="excerpt" className="text-sm font-medium">文章摘要（可选）</Label>
        <Textarea
          id="excerpt"
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          placeholder="输入文章摘要，用于文章列表页展示..."
          className="min-h-[80px]"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">标签</Label>
        <div className="flex flex-wrap gap-2 p-4 border rounded-lg min-h-[60px] bg-muted/30">
          {tags.length === 0 ? (
            <p className="text-sm text-muted-foreground">暂无标签</p>
          ) : (
            tags.map((tag) => (
              <Badge
                key={tag.id}
                variant={selectedTags.includes(tag.id) ? "default" : "secondary"}
                className="cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => toggleTag(tag.id)}
              >
                {selectedTags.includes(tag.id) && <Check className="h-3 w-3 mr-1" />}
                <Hash className="h-3 w-3 mr-1" />
                {tag.name}
              </Badge>
            ))
          )}
        </div>
        {selectedTags.length > 0 && (
          <p className="text-xs text-muted-foreground">
            已选择 {selectedTags.length} 个标签
          </p>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">文章内容 (Markdown)</Label>
          <div className="flex gap-2">
            <Button
              type="button"
              variant={isPreview ? "outline" : "default"}
              size="sm"
              onClick={() => setIsPreview(false)}
              className="gap-2"
            >
              <Edit3 className="h-4 w-4" />
              编写
            </Button>
            <Button
              type="button"
              variant={isPreview ? "default" : "outline"}
              size="sm"
              onClick={() => setIsPreview(true)}
              className="gap-2"
            >
              <Eye className="h-4 w-4" />
              预览
            </Button>
          </div>
        </div>

        {isPreview ? (
          <Card className="min-h-[500px] p-6">
            {content ? (
              <MarkdownViewer content={content} />
            ) : (
              <p className="text-muted-foreground text-center py-20">预览区域</p>
            )}
          </Card>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-muted/30 border-b p-2 flex flex-wrap gap-1">
              {toolbarActions.map((action, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={action.action}
                  className="p-2 hover:bg-background rounded transition-colors"
                  title={action.title}
                  disabled={action.spin}
                >
                  <action.icon className={`h-4 w-4 ${action.spin ? "animate-spin" : ""}`} />
                </button>
              ))}
              <Separator orientation="vertical" className="mx-1" />
              <button
                type="button"
                className="p-2 hover:bg-background rounded transition-colors"
                title="撤销"
              >
                <Undo className="h-4 w-4" />
              </button>
              <button
                type="button"
                className="p-2 hover:bg-background rounded transition-colors"
                title="重做"
              >
                <Redo className="h-4 w-4" />
              </button>
            </div>
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onPaste={handlePaste}
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              placeholder={`# 标题

## 二级标题

开始书写你的文章...

**提示：**
- 使用 Markdown 语法
- 支持代码块、图片、链接等
- 使用工具栏快速插入格式`}
              className="w-full min-h-[500px] p-4 border-0 focus:ring-0 resize-none font-mono text-sm"
              required
            />
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>

      {lastSaved && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Check className="h-4 w-4 text-green-500" />
          <span>自动保存于 {lastSaved.toLocaleTimeString("zh-CN")}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-4 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            if (confirm("确定要离开吗？未保存的更改将丢失。")) {
              window.location.href = "/posts";
            }
          }}
        >
          取消
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            localStorage.setItem("draft", JSON.stringify({
              title,
              content,
              excerpt,
              status,
              categoryId,
              selectedTags,
              savedAt: new Date().toISOString()
            }));
            setLastSaved(new Date());
            setHasChanges(false);
            alert("草稿已保存！");
          }}
          className="gap-2"
        >
          <Save className="h-4 w-4" />
          保存草稿
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting || !title || !content}
          className="gap-2"
        >
          {isSubmitting ? "保存中..." : status === "PUBLISHED" ? "发布文章" : "保存草稿"}
        </Button>
      </div>
    </form>
  );
}
