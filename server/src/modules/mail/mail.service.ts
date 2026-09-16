import { Injectable, Logger } from "@nestjs/common";
import * as nodemailer from "nodemailer";

export type MailMessage = {
  to: string | string[];
  subject: string;
  heading: string;
  lines: string[];
  ctaLabel?: string;
  ctaPath?: string;
};

/** SMTP email alerts. Falls back to logging when SMTP is not configured. */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;

  private get transport(): nodemailer.Transporter | null {
    if (this.transporter) return this.transporter;
    const host = process.env.SMTP_HOST;
    if (!host) return null;
    this.transporter = nodemailer.createTransport({
      host,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD ?? "" }
        : undefined,
    });
    return this.transporter;
  }

  async send(message: MailMessage): Promise<boolean> {
    const transport = this.transport;
    if (!transport) {
      this.logger.warn(`SMTP not configured — skipped "${message.subject}"`);
      return false;
    }
    try {
      await transport.sendMail({
        from: process.env.MAIL_FROM ?? "Sundry Signage <no-reply@sundryfoods.com>",
        to: message.to,
        subject: message.subject,
        text: [message.heading, "", ...message.lines, this.ctaUrl(message) ?? ""].join("\n"),
        html: this.render(message),
      });
      return true;
    } catch (error) {
      this.logger.error(`Failed to send "${message.subject}"`, error as Error);
      return false;
    }
  }

  private ctaUrl(message: MailMessage): string | undefined {
    if (!message.ctaPath) return undefined;
    const base = (process.env.APP_BASE_URL ?? "").replace(/\/$/, "");
    return `${base}${message.ctaPath}`;
  }

  private render(message: MailMessage): string {
    const url = this.ctaUrl(message);
    const cta =
      url && message.ctaLabel
        ? `<p style="margin:24px 0 0"><a href="${url}" style="background:#F26722;border-radius:6px;color:#ffffff;display:inline-block;font-weight:600;padding:12px 20px;text-decoration:none">${message.ctaLabel}</a></p>`
        : "";
    return `<div style="background:#ffffff;font-family:Arial,Helvetica,sans-serif;color:#1f2328;padding:24px">
  <h1 style="font-size:18px;margin:0 0 12px">${message.heading}</h1>
  ${message.lines.map((l) => `<p style="font-size:14px;line-height:1.6;margin:0 0 8px">${l}</p>`).join("")}
  ${cta}
  <p style="color:#6b7280;font-size:12px;margin:28px 0 0">Sundry Foods signage &amp; queue console</p>
</div>`;
  }
}
