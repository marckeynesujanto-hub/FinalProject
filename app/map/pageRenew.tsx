// app/map/pageRenew.tsx
'use client'

import { useEffect, useRef, useState } from 'react'
// import { BottomNav } from '@/components/layout/BottomNav'

const DISPLAY = "'Bricolage Grotesque', sans-serif"

interface WasteLocation {
  id: string
  lat: number
  lon: number
  name: string
  type: string
  distance: number
  address: string
}

interface UserLocation {
  lat: number
  lon: number
}

function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function formatDistance(km: number): string {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`
}

const TPS_OFFSETS = [
  { id: 'd1', dLat: 0.0025,  dLon: 0.0018,  name: 'TPS RW 03 Kelurahan Setempat',    type: 'tps',       address: 'Jl. Mawar No. 12' },
  { id: 'd2', dLat: -0.0020, dLon: 0.0030,  name: 'TPS RW 07 Wilayah Setempat',      type: 'tps',       address: 'Jl. Melati Raya No. 5' },
  { id: 'd3', dLat: 0.0060,  dLon: -0.0045, name: 'TPS Pasar Kecamatan',             type: 'tps',       address: 'Jl. Pasar Lama No. 8' },
  { id: 'd4', dLat: -0.0055, dLon: -0.0050, name: 'Bank Sampah Induk Kecamatan',     type: 'recycling', address: 'Jl. Gotong Royong No. 3' },
  { id: 'd5', dLat: 0.0090,  dLon: 0.0080,  name: 'TPST 3R Kecamatan',              type: 'tpst',      address: 'Jl. Lingkungan Hidup No. 1' },
  { id: 'd6', dLat: -0.0100, dLon: 0.0070,  name: 'TPS Kelurahan Selatan',           type: 'tps',       address: 'Jl. Kenanga Indah No. 22' },
  { id: 'd7', dLat: 0.0140,  dLon: -0.0100, name: 'TPS Kecamatan Utara',             type: 'tps',       address: 'Jl. Raya Utama No. 45' },
  { id: 'd8', dLat: -0.0130, dLon: -0.0120, name: 'Bank Sampah Unit 03',             type: 'recycling', address: 'Jl. Bersih Asri No. 7' },
  { id: 'd9', dLat: 0.0250,  dLon: 0.0200,  name: 'TPST Kawasan Industri',           type: 'tpst',      address: 'Jl. Industri Hijau No. 100' },
  { id: 'd10', dLat: -0.0300, dLon: 0.0180, name: 'TPA Wilayah Kota',                type: 'tpa',       address: 'Jl. Pembuangan Akhir KM 5' },
  { id: 'd11', dLat: 0.0280,  dLon: -0.0250, name: 'TPS Kelurahan Barat',            type: 'tps',       address: 'Jl. Barat Daya No. 33' },
  { id: 'd12', dLat: -0.0260, dLon: -0.0220, name: 'TPST 3R Wilayah Selatan',        type: 'tpst',      address: 'Jl. Recycle Center No. 2' },
]

const TYPE_INFO: Record<string, { label: string; icon: string; color: string; bg: string }> = {
  tps:       { label: 'TPS Terdekat',    icon: '🚛', color: '#47613A', bg: '#E8EEDD' },
  tpst:      { label: 'TPST / 3R',       icon: '♻️', color: '#2F7D6B', bg: '#DCEAE2' },
  tpa:       { label: 'TPA Akhir',       icon: '🏭', color: '#8A6240', bg: '#F0E6DA' },
  recycling: { label: 'Bank Sampah',     icon: '🏦', color: '#6E8CA0', bg: '#E4ECEF' },
  default:   { label: 'Tempat Sampah',   icon: '🗑️', color: '#C06B41', bg: '#F0E0D3' },
}

function getTypeInfo(t: string) { return TYPE_INFO[t] || TYPE_INFO.default }

const RADIUS_OPTIONS = [500, 1000, 2000, 5000]

function generateDummyLocations(userLat: number, userLon: number, radiusM: number): WasteLocation[] {
  const radiusKm = radiusM / 1000
  return TPS_OFFSETS
    .map(offset => {
      const lat = userLat + offset.dLat
      const lon = userLon + offset.dLon
      const distance = getDistanceKm(userLat, userLon, lat, lon)
      return {
        id: offset.id,
        lat, lon,
        name: offset.name,
        type: offset.type,
        address: offset.address,
        distance,
      }
    })
    .filter(loc => loc.distance <= radiusKm)
    .sort((a, b) => a.distance - b.distance)
}

export default function MapPage() {
  const mapRef = useRef<HTMLDivElement>(null)
  const leafletMap = useRef<any>(null)
  const markersRef = useRef<any[]>([])

  const [userLocation, setUserLocation] = useState<UserLocation | null>(null)
  const [locations, setLocations] = useState<WasteLocation[]>([])
  const [selected, setSelected] = useState<WasteLocation | null>(null)
  const [status, setStatus] = useState<'loading' | 'locating' | 'fetching' | 'done' | 'error'>('loading')
  const [errorMsg, setErrorMsg] = useState('')
  const [activeTab, setActiveTab] = useState<'map' | 'list'>('map')
  const [radius, setRadius] = useState(2000)
  const [filterType, setFilterType] = useState('all')

  useEffect(() => {
    if (typeof window === 'undefined') return
    const load = async () => {
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link')
        link.id = 'leaflet-css'; link.rel = 'stylesheet'
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
        document.head.appendChild(link)
      }
      if (!(window as any).L) {
        await new Promise<void>((res, rej) => {
          const s = document.createElement('script')
          s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
          s.onload = () => res(); s.onerror = rej
          document.head.appendChild(s)
        })
      }
      setStatus('locating')
      getUserLocation()
    }
    load().catch(() => { setStatus('error'); setErrorMsg('Gagal memuat peta.') })
  }, [])

  const getUserLocation = () => {
    if (!navigator.geolocation) {
      const fb = { lat: -6.2088, lon: 106.8456 }
      setUserLocation(fb); initMap(fb); loadLocations(fb, radius); return
    }
    navigator.geolocation.getCurrentPosition(
      pos => {
        const loc = { lat: pos.coords.latitude, lon: pos.coords.longitude }
        setUserLocation(loc); initMap(loc); loadLocations(loc, radius)
      },
      () => {
        const fb = { lat: -6.2088, lon: 106.8456 }
        setUserLocation(fb); initMap(fb); loadLocations(fb, radius)
        setErrorMsg('GPS tidak aktif — lokasi default Jakarta.')
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const initMap = (loc: UserLocation) => {
    if (!mapRef.current || leafletMap.current) return
    const L = (window as any).L
    const map = L.map(mapRef.current, { center: [loc.lat, loc.lon], zoom: 14, zoomControl: false })
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap', maxZoom: 19,
    }).addTo(map)
    L.control.zoom({ position: 'bottomright' }).addTo(map)

    // Custom styled User Marker
    const userIcon = L.divIcon({
      html: `<div style="width:20px;height:20px;background:#C06B41;border:4px solid white;border-radius:50%;box-shadow:0 0 0 8px rgba(192,107,65,0.25);animation:pulse 2s infinite;"></div>`,
      className: '', iconSize: [20, 20], iconAnchor: [10, 10],
    })
    L.marker([loc.lat, loc.lon], { icon: userIcon }).addTo(map).bindPopup('<b>📍 Lokasi Anda</b>')
    leafletMap.current = map
  }

  const loadLocations = async (loc: UserLocation, r: number) => {
    setStatus('fetching')
    try {
      const res = await fetch(`/api/locations?lat=${loc.lat}&lon=${loc.lon}&radius=${r}`)
      const data = await res.json()
      setLocations(data)
      addMarkersToMap(data)
      setStatus('done')
    } catch (err) {
      console.error('Fetch error:', err)
      setStatus('error')
      setErrorMsg('Gagal mengambil data.')
    }
  }

  const addMarkersToMap = (locs: WasteLocation[]) => {
    const L = (window as any).L
    const map = leafletMap.current
    if (!map || !L) return
    markersRef.current.forEach(m => map.removeLayer(m))
    markersRef.current = []

    locs.forEach(loc => {
      const info = getTypeInfo(loc.type)
      const icon = L.divIcon({
        html: `<div style="position:relative;width:40px;height:46px;">
          <div style="position:absolute;top:0;left:0;width:36px;height:36px;
            background:${info.color};border-radius:50% 50% 50% 0;transform:rotate(-45deg);
            border:2.5px solid white;box-shadow:0 3px 10px rgba(0,0,0,0.25);"></div>
          <span style="position:absolute;top:6px;left:6px;font-size:16px;line-height:1;">${info.icon}</span>
        </div>`,
        className: '', iconSize: [40, 46], iconAnchor: [18, 46], popupAnchor: [0, -46],
      })
      const marker = L.marker([loc.lat, loc.lon], { icon })
        .addTo(map)
        .bindPopup(`
          <div style="min-width:195px;font-family:'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;padding:6px 0;">
            <p style="font-weight:800;font-size:14px;color:#2B2A23;margin:0 0 4px;">${info.icon} ${loc.name}</p>
            <span style="display:inline-block;background:${info.bg};color:${info.color};
              font-size:9.5px;font-weight:750;padding:2.5px 9px;border-radius:20px;text-transform:uppercase;margin-bottom:6px;">
              ${info.label}
            </span>
            <p style="color:#6F6C5E;font-size:11px;margin:0 0 6px;line-height:1.3;">📍 ${loc.address}</p>
            <p style="color:#47613A;font-weight:700;font-size:11.5px;margin:0 0 10px;">
              🚶 ${formatDistance(loc.distance)} dari Anda
            </p>
            <a href="https://www.google.com/maps/dir/?api=1&destination=${loc.lat},${loc.lon}&travelmode=driving"
               target="_blank"
               style="display:block;background:#47613A;color:white;text-align:center;
                 padding:8.5px;border-radius:10px;font-size:11.5px;font-weight:750;text-decoration:none;box-shadow:0 2px 6px rgba(71,97,58,0.25);">
              🧭 Rute Navigasi Google Maps
            </a>
          </div>
        `)
        .on('click', () => setSelected(loc))
      markersRef.current.push(marker)
    })
  }

  const changeRadius = (r: number) => {
    setRadius(r)
    if (userLocation) {
      const results = generateDummyLocations(userLocation.lat, userLocation.lon, r)
      setLocations(results)
      addMarkersToMap(results)
    }
  }

  const flyTo = (loc: WasteLocation) => {
    leafletMap.current?.flyTo([loc.lat, loc.lon], 17, { duration: 1 })
    setSelected(loc); setActiveTab('map')
    setTimeout(() => {
      markersRef.current.find(m =>
        Math.abs(m.getLatLng().lat - loc.lat) < 0.0001
      )?.openPopup()
    }, 1100)
  }

  const filtered = filterType === 'all' ? locations : locations.filter(l => l.type === filterType)

  return (
    <div className="min-h-screen bg-[#F5F1E6] flex flex-col pb-32">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#4E6A41] to-[#3C5331] px-5 pt-16 pb-5 rounded-b-[34px] shadow-[0_20px_40px_-24px_rgba(40,38,28,0.5)] flex-shrink-0 relative overflow-hidden">
        <div className="absolute right-[-10%] top-[-20%] w-44 h-44 bg-[#56724A] rounded-full opacity-55 pointer-events-none"></div>

        <div className="flex items-center justify-between mb-4 relative z-10">
          <div>
            <h1 className="text-white text-xl font-extrabold tracking-tight" style={{ fontFamily: DISPLAY }}>Peta TPS Terdekat</h1>
            <p className="text-[#AFC09C] text-xs mt-0.5 font-medium">
              {status === 'locating' && '📡 Mengunci koordinat GPS Anda...'}
              {status === 'done' && `✅ ${locations.length} lokasi penampungan aktif`}
              {status === 'error' && `⚠️ ${errorMsg}`}
              {status === 'loading' && '⏳ Memuat Leaflet Map...'}
            </p>
          </div>
          <button
            onClick={() => { if (userLocation) leafletMap.current?.flyTo([userLocation.lat, userLocation.lon], 14, { duration: 1 }) }}
            className="w-11 h-11 bg-white/12 hover:bg-white/22 border border-white/20 rounded-2xl flex items-center justify-center text-xl active:scale-95 transition-transform pressable"
            title="Lokasi Saya"
          >
            🎯
          </button>
        </div>

        {/* Radius pills */}
        <div className="flex gap-2 relative z-10">
          {RADIUS_OPTIONS.map(r => (
            <button key={r} onClick={() => changeRadius(r)}
              className={`flex-1 py-2 rounded-full text-xs font-bold transition-all pressable
                ${radius === r ? 'bg-[#FFFDF7] text-[#47613A] font-extrabold' : 'bg-white/15 text-white hover:bg-white/25'}`}>
              {r >= 1000 ? `${r / 1000} km` : `${r} m`}
            </button>
          ))}
        </div>
      </div>

      {/* Filter chips */}
      {status === 'done' && locations.length > 0 && (
        <div className="flex gap-2 px-4 mt-4 overflow-x-auto scrollbar-hide pb-1 flex-shrink-0">
          <button onClick={() => setFilterType('all')}
            className={`px-3.5 py-2 rounded-full text-xs font-bold whitespace-nowrap border-[1.5px] transition-all pressable
              ${filterType === 'all' ? 'bg-[#47613A] border-[#47613A] text-white' : 'bg-[#FFFDF7] text-[#6F6C5E] border-[#E2DAC6] hover:border-[#C9C0A9]'}`}>
            Semua ({locations.length})
          </button>
          {Object.entries(TYPE_INFO).filter(([k]) => k !== 'default').map(([k, v]) => {
            const count = locations.filter(l => l.type === k).length
            if (!count) return null
            const isSelected = filterType === k
            return (
              <button key={k} onClick={() => setFilterType(k)}
                className={`px-3.5 py-2 rounded-full text-xs font-bold whitespace-nowrap border-[1.5px] transition-all pressable
                  ${isSelected ? 'text-white' : 'bg-[#FFFDF7] text-[#6F6C5E] border-[#E2DAC6]'}`}
                style={isSelected ? { background: v.color, borderColor: v.color } : {}}>
                {v.icon} {v.label} ({count})
              </button>
            )
          })}
        </div>
      )}

      {/* Tabs */}
      <div className="flex mx-4 mt-4 bg-[#E7E0CF] rounded-2xl p-1 gap-1 flex-shrink-0">
        {(['map', 'list'] as const).map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all pressable
              ${activeTab === t ? 'bg-[#FFFDF7] text-[#47613A] shadow-sm' : 'text-[#8A8674] hover:text-[#5C5A4C]'}`}>
            {t === 'map' ? '🗺️ Lihat Peta' : `📋 Daftar Lokasi (${filtered.length})`}
          </button>
        ))}
      </div>

      {/* MAP VIEW */}
      {activeTab === 'map' && (
        <div className="relative mx-4 mt-4 mb-4 rounded-[24px] overflow-hidden shadow-[0_18px_36px_-22px_rgba(40,38,28,0.4)] flex-1 border border-[#E2DAC6]" style={{ minHeight: 400 }}>
          <div ref={mapRef} style={{ width: '100%', height: '100%', minHeight: 400 }} />

          {/* Map Loading/Locating Overlay */}
          {['loading', 'locating'].includes(status) && (
            <div className="absolute inset-0 bg-[#F5F1E6]/90 backdrop-blur-sm flex flex-col items-center justify-center gap-3.5 z-[1000]">
              <div className="w-10 h-10 border-4 border-[#47613A] border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-[#6F6C5E] font-extrabold uppercase tracking-widest">
                {status === 'loading' ? 'Memuat Peta...' : 'Mendeteksi GPS...'}
              </p>
            </div>
          )}

          {/* Legend overlay */}
          {status === 'done' && (
            <div className="absolute top-4 left-4 bg-[#FFFDF7]/95 backdrop-blur-md rounded-2xl p-3 shadow-[0_12px_24px_-12px_rgba(40,38,28,0.4)] z-[999] border border-[#ECE4D2] flex flex-col gap-2">
              {Object.entries(TYPE_INFO).filter(([k]) => k !== 'default').map(([k, v]) => (
                <div key={k} className="flex items-center gap-2">
                  <span className="text-base leading-none">{v.icon}</span>
                  <span className="text-[10px] text-[#6F6C5E] font-bold uppercase tracking-wider">{v.label}</span>
                </div>
              ))}
              <div className="flex items-center gap-2 pt-2 border-t border-[#ECE4D2]">
                <div className="w-3.5 h-3.5 rounded-full bg-[#C06B41] border-2 border-white shadow-md flex-shrink-0" />
                <span className="text-[10px] text-[#6F6C5E] font-bold uppercase tracking-wider">Lokasi Anda</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* LIST VIEW */}
      {activeTab === 'list' && (
        <div className="px-4 mt-3 pb-6 flex-1 overflow-y-auto animate-fade-in-up">
          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-[#EDE7D8] rounded-full flex items-center justify-center text-4xl mx-auto mb-4">🔍</div>
              <p className="text-[#42402F] font-extrabold text-sm" style={{ fontFamily: DISPLAY }}>Tidak Ada Lokasi di Radius Ini</p>
              <p className="text-[#A8A492] text-xs mt-1 mb-6">Coba perluas pencarian Anda.</p>
              <button onClick={() => changeRadius(5000)}
                style={{ fontFamily: DISPLAY }}
                className="bg-[#47613A] text-white px-6 py-3 rounded-2xl font-bold text-xs shadow-[0_14px_24px_-12px_rgba(71,97,58,0.7)] pressable">
                Perluas Radius ke 5 km
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {filtered.map(loc => {
                const info = getTypeInfo(loc.type)
                return (
                  <div key={loc.id} onClick={() => flyTo(loc)}
                    className={`bg-[#FFFDF7] rounded-[24px] p-5 border-2 transition-all pressable cursor-pointer
                      ${selected?.id === loc.id ? 'border-[#47613A] shadow-[0_12px_24px_-16px_rgba(71,97,58,0.5)]' : 'border-[#ECE4D2] hover:border-[#D8D0BC]'}`}>
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
                          style={{ background: info.bg }}>{info.icon}</div>
                        <div>
                          <p className="font-extrabold text-[#2B2A23] text-sm leading-snug">{loc.name}</p>
                          <span className="inline-block text-[9px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full mt-1 border"
                            style={{ background: info.bg, color: info.color, borderColor: info.color + '20' }}>{info.label}</span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-extrabold text-[#47613A]" style={{ fontFamily: DISPLAY }}>{formatDistance(loc.distance)}</p>
                        <span className="text-[9px] text-[#A8A492] font-extrabold block">Jarak</span>
                      </div>
                    </div>

                    <p className="text-xs text-[#6F6C5E] mb-4 font-semibold">📍 {loc.address}</p>

                    <div className="flex gap-2.5">
                      <button onClick={e => { e.stopPropagation(); flyTo(loc) }}
                        className="flex-1 bg-[#E8EEDD] text-[#3F5733] py-3 rounded-2xl text-xs font-extrabold transition-all pressable">
                        🗺️ Lihat Peta
                      </button>
                      <a href={`https://www.google.com/maps/dir/?api=1&destination=${loc.lat},${loc.lon}&travelmode=driving`}
                        target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                        className="flex-1 bg-[#47613A] text-white py-3 rounded-2xl text-xs font-extrabold text-center transition-all pressable shadow-[0_10px_20px_-12px_rgba(71,97,58,0.7)]">
                        🧭 Navigasi GPS
                      </a>
                    </div>
                  </div>
                )
              })}
              <p className="text-center text-[10px] text-[#A8A492] font-semibold tracking-wide py-4 uppercase">
                🗺️ Terintegrasi dengan Sistem Data TPS Wilayah
              </p>
            </div>
          )}
        </div>
      )}

      {/* Bottom Navigation
      <BottomNav /> */}
    </div>
  )
}
