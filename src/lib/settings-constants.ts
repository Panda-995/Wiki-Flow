export const DEFAULT_SETTINGS = {
  verification_code_validity_minutes: "10",
  verification_cooldown_seconds: "60",
  verification_email_subject: "WikiFlow - 邮箱验证码",
  verification_email_template: "您的验证码是：{{code}}，有效期 {{expires}} 分钟。",
  smtp_host: "",
  smtp_port: "587",
  smtp_user: "",
  smtp_pass: "",
  smtp_from: "",
  smtp_secure: "true",
  site_name: "WikiFlow",
  site_description: "您的个人知识笔记本",
  posts_per_page: "9",
  enable_registration: "true",
  session_timeout_minutes: "1440",
  max_login_attempts: "5",
  lockout_duration_minutes: "15",
} as const;

export const ALLOWED_SETTINGS_KEYS = new Set(Object.keys(DEFAULT_SETTINGS));

export type SettingsData = {
  [K in keyof typeof DEFAULT_SETTINGS]: string;
};
