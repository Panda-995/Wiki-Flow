import { Resend } from "resend";
import nodemailer from "nodemailer";
import { prisma } from "@/lib/prisma";
import { decrypt, isEncrypted } from "@/lib/crypto";

let _resend: Resend | null = null;

function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
}

export type SendMailResult =
  | { success: true; messageId?: string; devMode?: boolean }
  | { success: false; error: string };

async function getSmtpSettings() {
  try {
    const keys = ["smtp_host", "smtp_port", "smtp_user", "smtp_pass", "smtp_from", "smtp_secure"];
    const settings = await prisma.systemSetting.findMany({
      where: { key: { in: keys } },
    });
    const map: Record<string, string> = {};
    for (const s of settings) {
      map[s.key] = s.value;
    }

    let pass = map.smtp_pass || "";
    if (pass && isEncrypted(pass)) {
      try {
        pass = decrypt(pass);
      } catch {
        console.error("[SMTP] Failed to decrypt SMTP password");
        pass = "";
      }
    }

    return {
      host: map.smtp_host || "",
      port: parseInt(map.smtp_port || "587"),
      user: map.smtp_user || "",
      pass,
      from: map.smtp_from || "",
      secure: map.smtp_secure === "true",
    };
  } catch (err) {
    console.error("[SMTP] Failed to load SMTP settings:", err);
    return null;
  }
}

export async function sendMail({ to, subject, html }: SendMailOptions): Promise<SendMailResult> {
  const smtp = await getSmtpSettings();

  if (smtp && smtp.host && smtp.user && smtp.pass) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtp.host,
        port: smtp.port,
        secure: smtp.secure,
        auth: {
          user: smtp.user,
          pass: smtp.pass,
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
      });

      const info = await transporter.sendMail({
        from: smtp.from || smtp.user,
        to,
        subject,
        html,
      });

      console.log(`[SMTP] Message sent: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (err) {
      console.error("SMTP send error:", err);
      return { success: false, error: String(err) };
    }
  }

  if (process.env.RESEND_API_KEY) {
    try {
      const { data, error } = await getResend().emails.send({
        from: process.env.EMAIL_FROM || "WikiFlow <noreply@wikiflow.dev>",
        to,
        subject,
        html,
      });

      if (error) {
        console.error("Resend send error:", error);
        return { success: false, error: String(error) };
      }

      return { success: true, messageId: data?.id };
    } catch (err) {
      console.error("Mail send exception:", err);
      return { success: false, error: String(err) };
    }
  }

  console.log(`[DEV MAIL] To: ${to}`);
  console.log(`[DEV MAIL] Subject: ${subject}`);
  console.log(`[DEV MAIL] Body: ${html}`);
  return { success: true, devMode: true };
}
