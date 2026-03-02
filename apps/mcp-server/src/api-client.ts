import axios from 'axios';

export const apiClient = axios.create({
  baseURL: `${process.env.API_URL || 'http://localhost:3001'}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
    ...(process.env.SUPPLYFORGE_API_KEY
      ? { 'X-Api-Key': process.env.SUPPLYFORGE_API_KEY }
      : {}),
  },
  timeout: 30_000,
});
