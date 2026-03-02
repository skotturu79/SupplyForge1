import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly client: Anthropic;
  private readonly model: string;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.client = new Anthropic({ apiKey: config.get('ANTHROPIC_API_KEY', 'placeholder') });
    this.model = config.get('CLAUDE_MODEL', 'claude-opus-4-6');
  }

  async suggestInvoiceMatch(invoiceId: string, tenantId: string) {
    const invoice = await this.prisma.document.findUnique({ where: { id: invoiceId } });
    if (!invoice) return null;

    const candidates = await this.prisma.document.findMany({
      where: {
        receiverTenantId: tenantId,
        type: 'PO',
        status: { in: ['SENT', 'ACKNOWLEDGED', 'ACCEPTED'] },
        totalAmount: {
          gte: (invoice.totalAmount || 0) * 0.9,
          lte: (invoice.totalAmount || 0) * 1.1,
        },
      },
      select: { id: true, referenceNumber: true, totalAmount: true, currency: true, createdAt: true },
      take: 10,
    });

    if (!candidates.length) return { matches: [], confidence: 0 };

    const prompt = `You are a supply chain document matching assistant.
    
Invoice details:
- ID: ${invoice.id}
- Reference: ${invoice.referenceNumber}
- Amount: ${invoice.totalAmount} ${invoice.currency}
- Created: ${invoice.createdAt.toISOString()}

Candidate Purchase Orders:
${candidates.map((c) => `- ID: ${c.id}, Ref: ${c.referenceNumber}, Amount: ${c.totalAmount} ${c.currency}, Date: ${c.createdAt.toISOString()}`).join('\n')}

Analyze which PO best matches this invoice based on amount, currency, and timing proximity.
Return a JSON object with: { bestMatchId: string|null, confidence: number (0-1), reasoning: string }`;

    const message = await this.client.messages.create({
      model: this.model,
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = message.content[0];
    if (content.type !== 'text') return { matches: candidates, confidence: 0 };

    try {
      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      const result = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
      return { ...result, candidates };
    } catch {
      return { matches: candidates, confidence: 0, reasoning: content.text };
    }
  }

  async analyzeDocument(documentId: string, tenantId: string, question: string) {
    const doc = await this.prisma.document.findUnique({ where: { id: documentId } });
    if (!doc) return null;

    const message = await this.client.messages.create({
      model: this.model,
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: `Document type: ${doc.type}, status: ${doc.status}, reference: ${doc.referenceNumber}, amount: ${doc.totalAmount} ${doc.currency}.\n\nQuestion: ${question}`,
      }],
    });

    return { answer: message.content[0].type === 'text' ? message.content[0].text : '' };
  }
}
