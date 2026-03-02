export interface EncryptResult {
    ciphertext: Buffer;
    iv: string;
    authTag: string;
}
export declare function encryptDocument(plaintext: string | Buffer, masterKey: string): EncryptResult;
export declare function decryptDocument(ciphertext: Buffer, iv: string, authTag: string, masterKey: string): Buffer;
export declare function hashDocument(content: string | Buffer): string;
export declare function signDocument(contentHash: string, privateKeyPem: string): string;
export declare function verifyDocumentSignature(contentHash: string, signature: string, publicKeyPem: string): boolean;
export declare function signWebhookPayload(payload: string, secret: string): string;
export declare function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean;
export declare function generateApiKey(): {
    rawKey: string;
    keyHash: string;
    keyPrefix: string;
};
export declare function hashApiKey(rawKey: string): string;
export declare function generateResetToken(): string;
export declare function generateWebhookSecret(): string;
export declare function generateSSCC(gs1CompanyPrefix: string): string;
//# sourceMappingURL=index.d.ts.map