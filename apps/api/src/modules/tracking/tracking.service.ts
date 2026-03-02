import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';
import { CarrierService } from '../carriers/carriers.service';

@Injectable()
export class TrackingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly carriers: CarrierService,
    @InjectQueue('tracking-poll') private readonly queue: Queue,
    private readonly events: EventEmitter2,
  ) {}

  async getShipment(id: string, tenantId: string) {
    const shipment = await this.prisma.shipment.findUnique({
      where: { id },
      include: { events: { orderBy: { timestamp: 'desc' } } },
    });
    if (!shipment || shipment.tenantId !== tenantId) throw new NotFoundException('Shipment not found');
    return shipment;
  }

  async refreshTracking(id: string, tenantId: string) {
    const shipment = await this.prisma.shipment.findUnique({ where: { id } });
    if (!shipment || shipment.tenantId !== tenantId) throw new NotFoundException('Shipment not found');

    const result = await this.carriers.trackShipment(shipment.carrier, shipment.trackingNumber);

    const updated = await this.prisma.shipment.update({
      where: { id },
      data: {
        status: result.status,
        lastSyncedAt: new Date(),
        events: {
          deleteMany: {},
          createMany: {
            data: (result.events as Array<Record<string, unknown>>).map((e) => ({
              status: String(e.status || e.description || ''),
              description: String(e.description || ''),
              location: String(e.location || ''),
              timestamp: new Date(String(e.timestamp || Date.now())),
            })),
          },
        },
      },
    });

    if (result.status === 'DELIVERED') {
      this.events.emit('tracking.delivered', { shipmentId: id, tenantId });
    } else {
      this.events.emit('tracking.updated', { shipmentId: id, tenantId, status: result.status });
    }

    return updated;
  }

  async schedulePolling(shipmentId: string, tenantId: string) {
    await this.queue.add('poll', { shipmentId, tenantId }, { repeat: { every: 3_600_000 }, jobId: `track-${shipmentId}` });
  }
}
