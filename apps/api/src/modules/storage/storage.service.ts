import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private client: Minio.Client;
  private readonly buckets: { documents: string; labels: string; attachments: string };

  constructor(private readonly config: ConfigService) {
    const endpoint = new URL(config.get('STORAGE_ENDPOINT', 'http://localhost:9000'));
    this.client = new Minio.Client({
      endPoint: endpoint.hostname,
      port: parseInt(endpoint.port || '9000'),
      useSSL: endpoint.protocol === 'https:',
      accessKey: config.get('STORAGE_ACCESS_KEY', 'minioadmin'),
      secretKey: config.get('STORAGE_SECRET_KEY', 'minioadmin'),
    });
    this.buckets = {
      documents: config.get('STORAGE_BUCKET_DOCUMENTS', 'sf-documents'),
      labels: config.get('STORAGE_BUCKET_LABELS', 'sf-labels'),
      attachments: config.get('STORAGE_BUCKET_ATTACHMENTS', 'sf-attachments'),
    };
  }

  async onModuleInit() {
    for (const bucket of Object.values(this.buckets)) {
      const exists = await this.client.bucketExists(bucket);
      if (!exists) {
        await this.client.makeBucket(bucket, this.config.get('STORAGE_REGION', 'us-east-1'));
        this.logger.log(`Created bucket: ${bucket}`);
      }
    }
  }

  async uploadDocument(key: string, data: Buffer, contentType = 'application/octet-stream') {
    await this.client.putObject(this.buckets.documents, key, data, data.length, { 'Content-Type': contentType });
    return `${this.buckets.documents}/${key}`;
  }

  async getPresignedUrl(bucket: 'documents' | 'labels' | 'attachments', key: string, expirySeconds = 3600) {
    return this.client.presignedGetObject(this.buckets[bucket], key, expirySeconds);
  }

  async uploadLabel(key: string, data: Buffer, contentType = 'application/pdf') {
    await this.client.putObject(this.buckets.labels, key, data, data.length, { 'Content-Type': contentType });
    return `${this.buckets.labels}/${key}`;
  }
}
