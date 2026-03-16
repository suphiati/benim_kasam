import type { LiveRate } from '../types';
import { mapTruncgilResponse } from './apiMappers';

function getApiUrl(): string {
  // Production'da Vercel serverless proxy kullan (CORS sorunu yok)
  // Development'ta dogrudan API'yi kullan
  if (window.location.hostname !== 'localhost') {
    return '/api/rates';
  }
  return 'https://finans.truncgil.com/v4/today.json';
}

async function fetchRates(): Promise<LiveRate[]> {
  const url = getApiUrl();
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const data = await res.json();
  return mapTruncgilResponse(data);
}

export async function fetchLiveRates(): Promise<LiveRate[]> {
  try {
    return await fetchRates();
  } catch (err) {
    console.error('Kur verileri alınamadı:', err);
    // Fallback: dogrudan API'yi dene
    try {
      const res = await fetch('https://finans.truncgil.com/v4/today.json');
      if (!res.ok) throw new Error('Fallback failed');
      const data = await res.json();
      return mapTruncgilResponse(data);
    } catch {
      return [];
    }
  }
}
