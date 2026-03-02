import crypto from 'crypto';

// ══════════════════════════════════════════════════════════════════
// SupplyForge — Cryptography Utilities
// All document content is encrypted at rest with AES-256-GCM.
// Documents are digitally signed with RSA-PSS for non-repudiation.
// ══════════════════════════════════════════════════════════════════

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const KEY_LENGTH = 32; // 256 bits

// ── AES-256-GCM Encryption ────────────────────────────────────────

export interface EncryptResult {
  ciphertext: Buffer;
  iv: string;         // hex encoded
  authTag: string;    // hex encoded
}

/**
 * Encrypt document content with AES-256-GCM.
 * @param plaintext - Document content (string or Buffer)
 * @param masterKey - 32-byte hex key (from env ENCRYPTION_MASTER_KEY)
 */
export function encryptDocument(
  plaintext: string | Buffer,
  masterKey: string,
): EncryptResult {
  const key = Buffer.from(masterKey, 'hex');
  if (key.length !== KEY_LENGTH) {
    throw new Error('Encryption key must be 32 bytes (64 hex chars)');
  }
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });
  const data = typeof plaintext === 'string' ? Buffer.from(plaintext, 'utf8') : plaintext;
  const ciphertext = Buffer.concat([cipher.update(data), cipher.final()]);
  return {
    ciphertext,
    iv: iv.toString('hex'),
    authTag: cipher.getAuthTag().toString('hex'),
  };
}

/**
 * Decrypt document content encrypted with AES-256-GCM.
 */
export function decryptDocument(
  ciphertext: Buffer,
  iv: string,
  authTag: string,
  masterKey: string,
): Buffer {
  const key = Buffer.from(masterKey, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(iv, 'hex'), {
    authTagLength: AUTH_TAG_LENGTH,
  });
  decipher.setAuthTag(Buffer.from(authTag, 'hex'));
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}

// ── SHA-256 Content Hash ───────────────────────────────────────────

/**
 * Compute SHA-256 hash of document content.
 * Used for integrity verification and digital signing.
 */
export function hashDocument(content: string | Buffer): string {
  const data = typeof content === 'string' ? Buffer.from(content, 'utf8') : content;
  return crypto.createHash('sha256').update(data).digest('hex');
}

// ── RSA-PSS Digital Signatures ─────────────────────────────────────

/**
 * Sign a document hash with RSA-PSS (2048-bit).
 * @param contentHash - SHA-256 hex hash of document content
 * @param privateKeyPem - PEM-encoded RSA private key
 */
export function signDocument(contentHash: string, privateKeyPem: string): string {
  const sign = crypto.createSign('SHA256');
  sign.update(contentHash);
  sign.end();
  return sign.sign(
    {
      key: privateKeyPem,
      padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
      saltLength: crypto.constants.RSA_PSS_SALTLEN_DIGEST,
    },
    'base64',
  );
}

/**
 * Verify a document signature.
 * @returns true if the signature is valid
 */
export function verifyDocumentSignature(
  contentHash: string,
  signature: string,
  publicKeyPem: string,
): boolean {
  try {
    const verify = crypto.createVerify('SHA256');
    verify.update(contentHash);
    verify.end();
    return verify.verify(
      {
        key: publicKeyPem,
        padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
        saltLength: crypto.constants.RSA_PSS_SALTLEN_DIGEST,
      },
      Buffer.from(signature, 'base64'),
    );
  } catch {
    return false;
  }
}

// ── HMAC Webhook Signatures ────────────────────────────────────────

/**
 * Generate HMAC-SHA256 webhook signature.
 * Format: sha256=<hex_digest>
 * Compatible with GitHub webhook verification pattern.
 */
export function signWebhookPayload(payload: string, secret: string): string {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload);
  return `sha256=${hmac.digest('hex')}`;
}

/**
 * Verify a webhook signature using timing-safe comparison.
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string,
): boolean {
  const expected = signWebhookPayload(payload, secret);
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expected),
    );
  } catch {
    return false;
  }
}

// ── API Key Generation ─────────────────────────────────────────────

/**
 * Generate a secure API key.
 * Format: sf_<prefix>_<random>
 * Returns both the raw key (shown once) and its SHA-256 hash (stored).
 */
export function generateApiKey(): { rawKey: string; keyHash: string; keyPrefix: string } {
  const random = crypto.randomBytes(32).toString('hex');
  const rawKey = `sf_live_${random}`;
  const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
  const keyPrefix = rawKey.substring(0, 12);
  return { rawKey, keyHash, keyPrefix };
}

/**
 * Hash an API key for storage/lookup.
 */
export function hashApiKey(rawKey: string): string {
  return crypto.createHash('sha256').update(rawKey).digest('hex');
}

// ── Password Utilities ─────────────────────────────────────────────

/**
 * Generate a secure random password reset token.
 */
export function generateResetToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Generate a secure random webhook secret.
 */
export function generateWebhookSecret(): string {
  return crypto.randomBytes(32).toString('hex');
}

// ── SSCC Generation (GS1 Serial Shipping Container Code) ──────────

/**
 * Generate a GS1-compliant SSCC-18 barcode value.
 * Format: (00) + Extension digit + GS1 Company Prefix + Serial Reference + Check Digit
 * @param gs1CompanyPrefix - Your GS1 company prefix (7-10 digits)
 */
export function generateSSCC(gs1CompanyPrefix: string): string {
  const extension = '0';
  const serial = Date.now().toString().slice(-8).padStart(8, '0');
  const withoutCheck = extension + gs1CompanyPrefix + serial;
  const padded = withoutCheck.padEnd(17, '0').substring(0, 17);
  const checkDigit = calculateGS1CheckDigit(padded);
  return padded + checkDigit;
}

function calculateGS1CheckDigit(digits: string): string {
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    const digit = parseInt(digits[digits.length - 1 - i], 10);
    sum += i % 2 === 0 ? digit * 3 : digit;
  }
  return String((10 - (sum % 10)) % 10);
}
