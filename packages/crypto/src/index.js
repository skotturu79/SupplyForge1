"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.encryptDocument = encryptDocument;
exports.decryptDocument = decryptDocument;
exports.hashDocument = hashDocument;
exports.signDocument = signDocument;
exports.verifyDocumentSignature = verifyDocumentSignature;
exports.signWebhookPayload = signWebhookPayload;
exports.verifyWebhookSignature = verifyWebhookSignature;
exports.generateApiKey = generateApiKey;
exports.hashApiKey = hashApiKey;
exports.generateResetToken = generateResetToken;
exports.generateWebhookSecret = generateWebhookSecret;
exports.generateSSCC = generateSSCC;
const crypto_1 = __importDefault(require("crypto"));
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const KEY_LENGTH = 32;
function encryptDocument(plaintext, masterKey) {
    const key = Buffer.from(masterKey, 'hex');
    if (key.length !== KEY_LENGTH) {
        throw new Error('Encryption key must be 32 bytes (64 hex chars)');
    }
    const iv = crypto_1.default.randomBytes(IV_LENGTH);
    const cipher = crypto_1.default.createCipheriv(ALGORITHM, key, iv, {
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
function decryptDocument(ciphertext, iv, authTag, masterKey) {
    const key = Buffer.from(masterKey, 'hex');
    const decipher = crypto_1.default.createDecipheriv(ALGORITHM, key, Buffer.from(iv, 'hex'), {
        authTagLength: AUTH_TAG_LENGTH,
    });
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}
function hashDocument(content) {
    const data = typeof content === 'string' ? Buffer.from(content, 'utf8') : content;
    return crypto_1.default.createHash('sha256').update(data).digest('hex');
}
function signDocument(contentHash, privateKeyPem) {
    const sign = crypto_1.default.createSign('SHA256');
    sign.update(contentHash);
    sign.end();
    return sign.sign({
        key: privateKeyPem,
        padding: crypto_1.default.constants.RSA_PKCS1_PSS_PADDING,
        saltLength: crypto_1.default.constants.RSA_PSS_SALTLEN_DIGEST,
    }, 'base64');
}
function verifyDocumentSignature(contentHash, signature, publicKeyPem) {
    try {
        const verify = crypto_1.default.createVerify('SHA256');
        verify.update(contentHash);
        verify.end();
        return verify.verify({
            key: publicKeyPem,
            padding: crypto_1.default.constants.RSA_PKCS1_PSS_PADDING,
            saltLength: crypto_1.default.constants.RSA_PSS_SALTLEN_DIGEST,
        }, Buffer.from(signature, 'base64'));
    }
    catch {
        return false;
    }
}
function signWebhookPayload(payload, secret) {
    const hmac = crypto_1.default.createHmac('sha256', secret);
    hmac.update(payload);
    return `sha256=${hmac.digest('hex')}`;
}
function verifyWebhookSignature(payload, signature, secret) {
    const expected = signWebhookPayload(payload, secret);
    try {
        return crypto_1.default.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
    }
    catch {
        return false;
    }
}
function generateApiKey() {
    const random = crypto_1.default.randomBytes(32).toString('hex');
    const rawKey = `sf_live_${random}`;
    const keyHash = crypto_1.default.createHash('sha256').update(rawKey).digest('hex');
    const keyPrefix = rawKey.substring(0, 12);
    return { rawKey, keyHash, keyPrefix };
}
function hashApiKey(rawKey) {
    return crypto_1.default.createHash('sha256').update(rawKey).digest('hex');
}
function generateResetToken() {
    return crypto_1.default.randomBytes(32).toString('hex');
}
function generateWebhookSecret() {
    return crypto_1.default.randomBytes(32).toString('hex');
}
function generateSSCC(gs1CompanyPrefix) {
    const extension = '0';
    const serial = Date.now().toString().slice(-8).padStart(8, '0');
    const withoutCheck = extension + gs1CompanyPrefix + serial;
    const padded = withoutCheck.padEnd(17, '0').substring(0, 17);
    const checkDigit = calculateGS1CheckDigit(padded);
    return padded + checkDigit;
}
function calculateGS1CheckDigit(digits) {
    let sum = 0;
    for (let i = 0; i < digits.length; i++) {
        const digit = parseInt(digits[digits.length - 1 - i], 10);
        sum += i % 2 === 0 ? digit * 3 : digit;
    }
    return String((10 - (sum % 10)) % 10);
}
//# sourceMappingURL=index.js.map