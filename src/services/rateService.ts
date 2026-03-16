import type { LiveRate } from '../types';
import { mapTruncgilResponse } from './apiMappers';

async function fetchTruncgil(): Promise<LiveRate[]> {
  const res = await fetch('https://finans.truncgil.com/v4/today.json');
  if (!res.ok) throw new Error(`Truncgil API error: ${res.status}`);
  const data = await res.json();
  return mapTruncgilResponse(data);
}

export async function fetchLiveRates(): Promise<LiveRate[]> {
  try {
    return await fetchTruncgil();
  } catch (err) {
    console.error('Kur verileri alınamadı:', err);
    return [];
  }
}
