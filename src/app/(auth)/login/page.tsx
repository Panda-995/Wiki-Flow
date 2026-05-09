"use client";

import { Suspense, useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Loader2, BookOpen, Mail, Lock, UserPlus, CheckCircle2, XCircle } from "lucide-react";

function AnimatedInput({ 
  id, 
  type, 
  label, 
  value, 
  onChange, 
  placeholder, 
  required,
  icon: Icon,
  error 
}: {
  id: string;
  type: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  required?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
  error?: string;
}) {
  const [isFocused, setIsFocused] = useState(false);
  const [hasValue, setHasValue] = useState(false);

  useEffect(() => {
    setHasValue(value.length > 0);
  }, [value]);

  return (
    <div className="space-y-2">
      <div className="relative">
        <Label 
          htmlFor={id}
          className={`absolute left-12 transition-all duration-200 pointer-events-none ${
            isFocused || hasValue 
              ? "-top-2.5 text-xs bg-white px-1 text-primary font-medium" 
              : "top-3 text-sm text-muted-foreground"
          }`}
        >
          {label}
        </Label>
        <div className={`
          absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center
          transition-all duration-200
          ${isFocused ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}
        `}>
          {Icon && <Icon className="h-4 w-4" />}
        </div>
        <Input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={isFocused ? placeholder : ""}
          required={required}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={`
            pl-12 pr-10 h-12 transition-all duration-200
            ${isFocused ? "border-primary ring-2 ring-primary/20" : ""}
            ${error ? "border-destructive" : "border-border"}
          `}
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange({ target: { value: "" } } as React.ChangeEvent<HTMLInputElement>)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <XCircle className="h-4 w-4" />
          </button>
        )}
      </div>
      {error && (
        <div className="flex items-center gap-2 text-destructive text-sm animate-in slide-in-from-top-1">
          <XCircle className="h-3 w-3" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = getSafeCallbackUrl(searchParams.get("callbackUrl"), "/");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
        if (result.error.includes("锁定")) {
          setPassword("");
        }
      } else if (result?.ok) {
        setSuccess("登录成功，正在跳转...");
        setTimeout(() => router.push(callbackUrl), 500);
      } else {
        setError("登录失败，请稍后重试");
      }
    } catch {
      setError("网络错误，请检查网络连接后重试");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-8">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 shadow-lg">
          <BookOpen className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">WikiFlow</h1>
          <p className="text-muted-foreground mt-1">您的个人知识笔记本</p>
        </div>
      </div>

      <Card className="border-0 shadow-xl shadow-primary/5">
        <CardHeader className="space-y-1 pb-2">
          <h2 className="text-xl font-semibold text-center">账号登录</h2>
        </CardHeader>

        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatedInput
              id="email"
              type="email"
              label="邮箱地址"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              icon={Mail}
              error={error && email ? "邮箱或密码错误" : undefined}
            />
            <AnimatedInput
              id="password"
              type="password"
              label="密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="输入您的密码"
              required
              icon={Lock}
              error={error ? "邮箱或密码错误，请检查后重试" : undefined}
            />
            
            {error && (
              <div className={`flex items-center gap-2 p-3 rounded-lg text-sm animate-in slide-in-from-top-1 ${
                error.includes("锁定")
                  ? "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                  : "bg-destructive/10 text-destructive"
              }`}>
                <XCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
            
            {success && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 text-green-600 text-sm animate-in slide-in-from-top-1">
                <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                <span>{success}</span>
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full h-12 text-base font-medium transition-all duration-200 hover:shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5 active:translate-y-0" 
              disabled={isLoading || !email || !password}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  登录中...
                </>
              ) : (
                <>
                  登录
                  <span className="ml-2 opacity-70">→</span>
                </>
              )}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">或</span>
            </div>
          </div>

          <Link href="/register">
            <Button variant="outline" className="w-full h-12" type="button">
              <UserPlus className="mr-2 h-4 w-4" />
              创建新账号
            </Button>
          </Link>
        </CardContent>
      </Card>

      <p className="text-center text-sm text-muted-foreground">
        登录即表示您同意我们的{" "}
        <Link href="#" className="underline underline-offset-4 hover:text-foreground">
          服务条款
        </Link>
        {" "}和{" "}
        <Link href="#" className="underline underline-offset-4 hover:text-foreground">
          隐私政策
        </Link>
      </p>
    </div>
  );
}

function getSafeCallbackUrl(value: string | null, fallback: string): string {
  if (!value) return fallback;
  return value.startsWith("/") && !value.startsWith("//") ? value : fallback;
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-primary/5 to-background relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
      </div>
      
      <div className="relative z-10 w-full flex justify-center">
        <Suspense fallback={
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        }>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
