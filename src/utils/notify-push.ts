/**
 * iSCARB — Push + email transport (server-only).
 * ===========================================================================
 * Motivation feature P1-4: actually DELIVER the notifications the trigger rules
 * (push-triggers.ts) produce, so a student comes back even with the app closed.
 * Two channels, both env-gated and best-effort:
 *   - Web Push (VAPID) to the browser/PWA via the service worker.
 *   - Email via SMTP (nodemailer) as a fallback / for students who opted in.
 *
 * NOTHING here throws into a request: if VAPID/SMTP env is absent (e.g. local
 * dev), the senders no-op and say so, exactly like the honest stubs elsewhere.
 * Provisioning (VAPID keys, SMTP creds) is a deploy-time concern documented in
 * the handover; the code path is complete and typed.
 * ===========================================================================
 */
import "server-only";
import webpush from "web-push";
import nodemailer from "nodemailer";
import { db } from "@/lib/db";
import type { NotificationMessage } from "@/lib/push-triggers";

const VAPID_PUBLIC = process.env.VAPID_PUBLIC_KEY || "";
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY || "";
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:support@iscarb.sa";

let vapidReady = false;
export function isPushConfigured(): boolean {
  if (VAPID_PUBLIC && VAPID_PRIVATE && !vapidReady) {
    try {
      webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);
      vapidReady = true;
    } catch {
      vapidReady = false;
    }
  }
  return vapidReady;
}

/** The VAPID public key the browser needs to subscribe (empty when unset). */
export function vapidPublicKey(): string {
  return VAPID_PUBLIC;
}

export function isEmailConfigured(): boolean {
  return !!(process.env.SMTP_HOST && process.env.SMTP_PORT);
}

let mailer: nodemailer.Transporter | null = null;
function getMailer(): nodemailer.Transporter | null {
  if (!isEmailConfigured()) return null;
  if (!mailer) {
    mailer = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: process.env.SMTP_SECURE === "true",
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    });
  }
  return mailer;
}

export interface PushResult {
  pushAttempted: number;
  pushSucceeded: number;
  emailSent: boolean;
  configured: { push: boolean; email: boolean };
}

/**
 * Deliver a notification to a student across every channel available: all of
 * their stored web-push subscriptions + (if configured and opted-in) an email.
 * Best-effort — dead push subscriptions (410/404) are pruned; nothing throws.
 */
export async function notifyStudent(studentId: string, message: NotificationMessage): Promise<PushResult> {
  const result: PushResult = {
    pushAttempted: 0,
    pushSucceeded: 0,
    emailSent: false,
    configured: { push: isPushConfigured(), email: isEmailConfigured() },
  };

  // ── Web push ───────────────────────────────────────────────────────────────
  if (result.configured.push) {
    const subs = await db.pushSubscription.findMany({ where: { studentId } }).catch(() => []);
    const payload = JSON.stringify({
      title: message.titleEn,
      titleAr: message.titleAr,
      body: message.bodyEn,
      bodyAr: message.bodyAr,
      view: message.view,
      trigger: message.trigger,
    });
    for (const sub of subs) {
      result.pushAttempted++;
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload,
        );
        result.pushSucceeded++;
      } catch (e) {
        const status = (e as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) {
          // Subscription is gone — prune it so we stop trying.
          await db.pushSubscription.delete({ where: { endpoint: sub.endpoint } }).catch(() => {});
        }
      }
    }
  }

  // ── Email (opted-in students only) ──────────────────────────────────────────
  if (result.configured.email) {
    const transport = getMailer();
    const student = await db.student
      .findUnique({ where: { id: studentId }, select: { email: true } })
      .catch(() => null);
    const optedIn = await db.pushSubscription
      .findFirst({ where: { studentId, emailOptIn: true }, select: { id: true } })
      .catch(() => null);
    const to = (student as { email?: string } | null)?.email;
    if (transport && to && optedIn) {
      try {
        await transport.sendMail({
          from: process.env.SMTP_FROM || "iSCARB <no-reply@iscarb.sa>",
          to,
          subject: message.titleEn,
          html: emailHtml(message),
        });
        result.emailSent = true;
      } catch {
        /* email is best-effort */
      }
    }
  }

  return result;
}

/** A minimal RTL-aware bilingual email body. */
function emailHtml(m: NotificationMessage): string {
  return (
    `<div style="font-family:system-ui,Segoe UI,Arial,sans-serif;max-width:520px;margin:auto">` +
    `<h2 style="margin:0 0 8px">${escapeHtml(m.titleEn)}</h2>` +
    `<p style="color:#334155">${escapeHtml(m.bodyEn)}</p>` +
    `<hr style="border:none;border-top:1px solid #e2e8f0;margin:16px 0"/>` +
    `<div dir="rtl"><h3 style="margin:0 0 8px">${escapeHtml(m.titleAr)}</h3>` +
    `<p style="color:#334155">${escapeHtml(m.bodyAr)}</p></div>` +
    `</div>`
  );
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}
