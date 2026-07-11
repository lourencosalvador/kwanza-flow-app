/**
 * Gera um par de chaves VAPID para Web Push (sem dependências externas).
 * VAPID = par de chaves EC P-256 codificado em base64url.
 *
 * Correr:  node scripts/gen-vapid.mjs
 * Copie a saída para o .env.local / .env.vercel.local / Vercel.
 */

import { generateKeyPairSync } from "node:crypto";

const b64url = (buf) =>
  Buffer.from(buf).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

const { publicKey, privateKey } = generateKeyPairSync("ec", { namedCurve: "prime256v1" });

// Chave privada VAPID = escalar d (32 bytes) em base64url.
const privJwk = privateKey.export({ format: "jwk" });
const vapidPrivate = privJwk.d;

// Chave pública VAPID = ponto não comprimido 0x04 || X || Y (65 bytes) em base64url.
const pubJwk = publicKey.export({ format: "jwk" });
const x = Buffer.from(pubJwk.x, "base64url");
const y = Buffer.from(pubJwk.y, "base64url");
const vapidPublic = b64url(Buffer.concat([Buffer.from([0x04]), x, y]));

console.log("\n# ─── Chaves VAPID (Web Push) ───");
console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY=${vapidPublic}`);
console.log(`VAPID_PRIVATE_KEY=${vapidPrivate}`);
console.log('VAPID_SUBJECT=mailto:lorrys@horizon-development.com');
console.log("\nGuarde estes valores. A chave privada é SECRETA.\n");
