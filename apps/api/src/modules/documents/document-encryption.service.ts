import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  encryptDocument,
  decryptDocument,
  hashDocument,
  signDocument,
  verifyDocumentSignature,
} from '@supplyforge/crypto';
import { readFileSync } from 'fs';

@Injectable()
export class DocumentEncryptionService {
  private readonly masterKey: string;
  private readonly privateKeyPem: string;
  private readonly publicKeyPem: string;

  constructor(private readonly config: ConfigService) {
    this.masterKey = config.getOrThrow('ENCRYPTION_MASTER_KEY');
    const privateKeyPath = config.get('SIGNING_PRIVATE_KEY_PATH', './certs/signing-private.pem');
    const certPath = config.get('SIGNING_CERT_PATH', './certs/signing-cert.pem');

    try {
      this.privateKeyPem = readFileSync(privateKeyPath, 'utf8');
      this.publicKeyPem = readFileSync(certPath, 'utf8');
    } catch {
      // In test/dev without certs — signatures will throw if called
      this.privateKeyPem = '';
      this.publicKeyPem = '';
    }
  }

  encrypt(content: string): { ciphertextHex: string; iv: string; authTag: string; contentHash: string } {
    const result = encryptDocument(content, this.masterKey);
    const contentHash = hashDocument(content);
    return {
      ciphertextHex: result.ciphertext.toString('hex'),
      iv: result.iv,
      authTag: result.authTag,
      contentHash,
    };
  }

  decrypt(ciphertextHex: string, iv: string, authTag: string): string {
    const buf = decryptDocument(Buffer.from(ciphertextHex, 'hex'), iv, authTag, this.masterKey);
    return buf.toString('utf8');
  }

  sign(contentHash: string): string {
    return signDocument(contentHash, this.privateKeyPem);
  }

  verify(contentHash: string, signature: string): boolean {
    return verifyDocumentSignature(contentHash, signature, this.publicKeyPem);
  }
}
