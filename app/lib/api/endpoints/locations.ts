import { api } from '@/lib/api/client'
import type { OverpassElement, WasteLocation } from '@/lib/types/api'

function mapOverpassElement(el: OverpassElement): WasteLocation {
  const tags = el.tags ?? {}
  const amenity = tags.amenity ?? 'waste'
  const name =
    tags.name ||
    (amenity === 'recycling' ? 'Tempat Daur Ulang' : 'Tempat Sampah')

  return {
    id: el.id,
    lat: el.lat,
    lon: el.lon,
    name,
    address: [tags['addr:street'], tags['addr:city']].filter(Boolean).join(', ') || 'Lokasi terdekat',
    type: amenity,
  }
}

export const locationsApi = {
  /** Fetch nearby waste/recycling points via Overpass (proxied by /api/locations) */
  getNearby: async (lat: number, lon: number, radius = 2000): Promise<WasteLocation[]> => {
    const elements = await api.get<OverpassElement[]>('/api/locations', {
      lat,
      lon,
      radius,
    })
    return (elements ?? []).map(mapOverpassElement)
  },
}
