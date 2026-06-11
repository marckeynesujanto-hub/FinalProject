import { NextResponse } from 'next/server'
import { supabase } from '@/app/supabaseClient'

function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function classifyType(jenis: string | null, nama: string | null): string {
  const n = (nama || '').toLowerCase()
  const j = (jenis || '').toLowerCase()
  if (n.includes('tpst') || n.includes('3r')) return 'tpst'
  if (n.includes('tpa') || n.includes('pemrosesan akhir')) return 'tpa'
  if (n.includes('bank sampah') || n.includes('daur ulang')) return 'recycling'
  if (n.includes('lps')) return 'tps'
  if (j.includes('tipe 3') || j === '3') return 'tpst'
  if (j.includes('tipe 4') || j === '4') return 'tpa'
  return 'tps'
}

// Dummy TPS offsets relative to user location (always visible)
const TPS_OFFSETS = [
  { id: 'd1',  dLat:  0.0025,  dLon:  0.0018,  name: 'TPS RW 03 Kelurahan Setempat',  type: 'tps',       address: 'Jl. Mawar No. 12' },
  { id: 'd2',  dLat: -0.0020,  dLon:  0.0030,  name: 'TPS RW 07 Wilayah Setempat',    type: 'tps',       address: 'Jl. Melati Raya No. 5' },
  { id: 'd3',  dLat:  0.0060,  dLon: -0.0045,  name: 'TPS Pasar Kecamatan',           type: 'tps',       address: 'Jl. Pasar Lama No. 8' },
  { id: 'd4',  dLat: -0.0055,  dLon: -0.0050,  name: 'Bank Sampah Induk Kecamatan',   type: 'recycling', address: 'Jl. Gotong Royong No. 3' },
  { id: 'd5',  dLat:  0.0090,  dLon:  0.0080,  name: 'TPST 3R Kecamatan',            type: 'tpst',      address: 'Jl. Lingkungan Hidup No. 1' },
  { id: 'd6',  dLat: -0.0100,  dLon:  0.0070,  name: 'TPS Kelurahan Selatan',         type: 'tps',       address: 'Jl. Kenanga Indah No. 22' },
  { id: 'd7',  dLat:  0.0140,  dLon: -0.0100,  name: 'TPS Kecamatan Utara',           type: 'tps',       address: 'Jl. Raya Utama No. 45' },
  { id: 'd8',  dLat: -0.0130,  dLon: -0.0120,  name: 'Bank Sampah Unit 03',           type: 'recycling', address: 'Jl. Bersih Asri No. 7' },
  { id: 'd9',  dLat:  0.0250,  dLon:  0.0200,  name: 'TPST Kawasan Industri',         type: 'tpst',      address: 'Jl. Industri Hijau No. 100' },
  { id: 'd10', dLat: -0.0300,  dLon:  0.0180,  name: 'TPA Wilayah Kota',              type: 'tpa',       address: 'Jl. Pembuangan Akhir KM 5' },
  { id: 'd11', dLat:  0.0280,  dLon: -0.0250,  name: 'TPS Kelurahan Barat',           type: 'tps',       address: 'Jl. Barat Daya No. 33' },
  { id: 'd12', dLat: -0.0260,  dLon: -0.0220,  name: 'TPST 3R Wilayah Selatan',       type: 'tpst',      address: 'Jl. Recycle Center No. 2' },
]

function generateDummy(userLat: number, userLon: number, radiusKm: number) {
  return TPS_OFFSETS
    .map(o => {
      const lat = userLat + o.dLat
      const lon = userLon + o.dLon
      const distance = getDistanceKm(userLat, userLon, lat, lon)
      return { id: o.id, lat, lon, name: o.name, type: o.type, address: o.address, distance, source: 'dummy' }
    })
    .filter(l => l.distance <= radiusKm)
    .sort((a, b) => a.distance - b.distance)
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userLat = parseFloat(searchParams.get('lat') || '-6.2088')
  const userLon = parseFloat(searchParams.get('lon') || '106.8456')
  const radius  = parseFloat(searchParams.get('radius') || '2000')
  const radiusKm = radius / 1000

  // ── 1. Try Supabase ─────────────────────────────────────────────────────────
  try {
    const { data, error } = await supabase
      .from('waste_locations')
      .select('location_id, nama_tps, jenis_tps, alamat, wilayah, kecamatan, kelurahan, latitude, longitude')
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)

    if (!error && data && data.length > 0) {
      const withDistance = data.map((row: any) => ({
        id: String(row.location_id),
        lat: parseFloat(row.latitude),
        lon: parseFloat(row.longitude),
        name: row.nama_tps || 'Tempat Sampah',
        type: classifyType(row.jenis_tps, row.nama_tps),
        address: [row.alamat, row.kelurahan, row.kecamatan, row.wilayah].filter(Boolean).join(', '),
        distance: getDistanceKm(userLat, userLon, parseFloat(row.latitude), parseFloat(row.longitude)),
        source: 'supabase',
      }))

      const inRadius = withDistance
        .filter(l => l.distance <= radiusKm)
        .sort((a, b) => a.distance - b.distance)

      // Supabase has data in radius → return it
      if (inRadius.length > 0) {
        return NextResponse.json(inRadius)
      }

      // Supabase has data but none in radius → return 10 nearest from Supabase
      const nearest = withDistance.sort((a, b) => a.distance - b.distance).slice(0, 10)
      if (nearest.length > 0) {
        return NextResponse.json(nearest)
      }
    }
  } catch (err) {
    console.error('Supabase error:', err)
  }

  // ── 2. Dummy fallback (Supabase empty or error) ─────────────────────────────
  const dummy = generateDummy(userLat, userLon, radiusKm)
  return NextResponse.json(dummy)
}