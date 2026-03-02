import type { MCPTool } from './index.js';

export const trackShipment: MCPTool = {
  definition: {
    name: 'track_shipment',
    description: 'Track a shipment by shipment ID or carrier tracking number. Returns current status and event history.',
    inputSchema: {
      type: 'object',
      properties: {
        shipmentId: { type: 'string', description: 'SupplyForge shipment UUID' },
        carrier: { type: 'string', description: 'Carrier code: FEDEX, UPS, DHL, USPS' },
        trackingNumber: { type: 'string', description: 'Carrier tracking number' },
        refresh: { type: 'boolean', description: 'Force refresh from carrier API', default: false },
      },
      oneOf: [{ required: ['shipmentId'] }, { required: ['carrier', 'trackingNumber'] }],
    },
  },

  async execute(args, api) {
    let shipmentId = args.shipmentId as string;

    // If only tracking number provided, look up by searching recent shipments
    if (!shipmentId && args.carrier && args.trackingNumber) {
      const { data } = await api.get(`/carriers/${args.carrier}/track/${args.trackingNumber}`);
      return {
        trackingNumber: args.trackingNumber,
        carrier: args.carrier,
        status: data.status,
        events: data.events,
        summary: `Shipment ${args.trackingNumber} via ${args.carrier}: ${data.status}`,
      };
    }

    if (args.refresh) {
      await api.post(`/tracking/${shipmentId}/refresh`);
    }

    const { data: shipment } = await api.get(`/tracking/${shipmentId}`);

    const latestEvent = shipment.events?.[0];
    return {
      id: shipment.id,
      trackingNumber: shipment.trackingNumber,
      carrier: shipment.carrier,
      status: shipment.status,
      estimatedDelivery: shipment.estimatedDelivery,
      actualDelivery: shipment.actualDelivery,
      latestEvent,
      eventCount: shipment.events?.length || 0,
      summary: `${shipment.carrier} ${shipment.trackingNumber}: ${shipment.status}${latestEvent ? ` — Last scan: ${latestEvent.description} at ${latestEvent.location}` : ''}`,
    };
  },
};
