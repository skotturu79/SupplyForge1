import type { AxiosInstance } from 'axios';

export interface MCPResource {
  definition: {
    uri: string;
    name: string;
    description: string;
    mimeType: string;
  };
  read(uri: string, api: AxiosInstance): Promise<unknown>;
}

export const resources: Record<string, MCPResource> = {
  'supplyforge-document': {
    definition: {
      uri: 'supplyforge-document://documents',
      name: 'SupplyForge Documents',
      description: 'Recent documents in the SupplyForge account',
      mimeType: 'application/json',
    },
    async read(_uri, api) {
      const { data } = await api.get('/documents', { params: { limit: 20 } });
      return data;
    },
  },
  'supplyforge-partner': {
    definition: {
      uri: 'supplyforge-partner://connections',
      name: 'Partner Connections',
      description: 'Approved partner connections',
      mimeType: 'application/json',
    },
    async read(_uri, api) {
      const { data } = await api.get('/partners');
      return data;
    },
  },
  'supplyforge-kpis': {
    definition: {
      uri: 'supplyforge-kpis://dashboard',
      name: 'Dashboard KPIs',
      description: 'Current dashboard metrics and KPIs',
      mimeType: 'application/json',
    },
    async read(_uri, api) {
      const { data } = await api.get('/analytics/kpis');
      return data;
    },
  },
};
