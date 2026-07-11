import "server-only";
import webpush from "web-push";
import { serverEnv, isPushConfigured } from "@/lib/env";

let configured = false;
function ensureConfigured() {
  if (configured || !isPushConfigured) return;
  webpush.setVapidDetails(
    serverEnv.vapidSubject,
    serverEnv.vapidPublicKey,
    serverEnv.vapidPrivateKey,
  );
  configured = true;
}

export interface PushMessage {
  title: string;
  body?: string;
  url?: string;
  tag?: string;
}

export interface SubscriptionRow {
  endpoint: string;
  p256dh: string;
  auth: string;
}

/**
 * Envia uma notificação a um conjunto de subscrições.
 * Devolve contagens e os endpoints expirados (404/410) para limpeza.
 */
export async function sendToSubscriptions(
  subs: SubscriptionRow[],
  message: PushMessage,
): Promise<{ sent: number; failed: number; expired: string[] }> {
  ensureConfigured();
  if (!isPushConfigured) return { sent: 0, failed: 0, expired: [] };

  const payload = JSON.stringify(message);
  const expired: string[] = [];
  let sent = 0;
  let failed = 0;

  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          payload,
        );
        sent += 1;
      } catch (err: unknown) {
        failed += 1;
        const code = (err as { statusCode?: number })?.statusCode;
        if (code === 404 || code === 410) expired.push(s.endpoint);
      }
    }),
  );

  return { sent, failed, expired };
}
