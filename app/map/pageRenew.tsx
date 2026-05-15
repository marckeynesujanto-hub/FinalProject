'use client'
 
import { useEffect, useRef, useState } from 'react'
 
interface WasteLocation {
  id: string
  lat: number
  lon: number
  name: string
  type: string
  distance?: number
  address?: string
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
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}
 
function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`
  return `${km.toFixed(1)} km`
}
 
const TYPE_INFO: Record<string, { label: string; icon: string; color: string; bg: string }> = {
  tps:       { label: 'TPS',           icon: '🚛', color: '#dc2626', bg: '#fee2e2' },
  tpst:      { label: 'TPST / 3R',    icon: '♻️', color: '#16a34a', bg: '#dcfce7' },
  tpa:       { label: 'TPA',           icon: '🏭', color: '#9333ea', bg: '#f3e8ff' },
  recycling: { label: 'Bank Sampah',   icon: '🏦', color: '#0891b2', bg: '#cffafe' },
  default:   { label: 'Tempat Sampah', icon: '🗑️', color: '#2563eb', bg: '#dbeafe' },
}
 
function getTypeInfo(type: string) {
  return TYPE_INFO[type] || TYPE_INFO.default
}
 
function classifyName(name: string, amenity?: string): string {
  const nl = name.toLowerCase()
  if (nl.includes('tpst') || nl.includes('3r')) return 'tpst'
  if (nl.includes('tpa')) return 'tpa'
  if (nl.includes('tps')) return 'tps'
  if (nl.includes('bank sampah') || nl.includes('daur ulang') || amenity === 'recycling') return 'recycling'
  if (amenity === 'waste_disposal') return 'tps'
  return 'default'
}
 
const RADIUS_OPTIONS = [500, 1000, 2000, 5000]
 
async function fetchFromOverpass(loc: UserLocation, radius: number): Promise<WasteLocation[]> {
  // Broad query: catches OSM amenity tags AND any node/way named TPS/TPST/TPA/etc
  const query = `
    [out:json][timeout:30];
    (
      node["amenity"="waste_disposal"](around:${radius},${loc.lat},${loc.lon});
      node["amenity"="recycling"](around:${radius},${loc.lat},${loc.lon});
      node["recycling_type"="centre"](around:${radius},${loc.lat},${loc.lon});
      node["amenity"="waste_transfer_station"](around:${radius},${loc.lat},${loc.lon});
      node["name"~"TPS|TPST|TPA|tempat sampah|bank sampah|daur ulang|pembuangan sampah",i](around:${radius},${loc.lat},${loc.lon});
      way["amenity"="waste_disposal"](around:${radius},${loc.lat},${loc.lon});
      way["amenity"="recycling"](around:${radius},${loc.lat},${loc.lon});
      way["name"~"TPS|TPST|TPA|tempat sampah|bank sampah|daur ulang|pembuangan sampah",i](around:${radius},${loc.lat},${loc.lon});
      relation["name"~"TPS|TPST|TPA|tempat sampah",i](around:${radius},${loc.lat},${loc.lon});
    );
    out center body;
  `
 
  const res = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    body: `data=${encodeURIComponent(query)}`,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
 
  if (!res.ok) throw new Error('Overpass error')
  const data = await res.json()
 
  const seen = new Set<string>()
  return (data.elements || [])
    .map((el: any) => {
      const lat = el.lat ?? el.center?.lat
      const lon = el.lon ?? el.center?.lon
      if (!lat || !lon) return null
 
      const name = el.tags?.name || el.tags?.['name:id'] || el.tags?.['name:en'] || 'Tempat Sampah'
      const type = classifyName(name, el.tags?.amenity)
      const key = `${lat.toFixed(5)},${lon.toFixed(5)}`
      if (seen.has(key)) return null
      seen.add(key)
 
      return {
        id: String(el.id),
        lat, lon, name, type,
        address: el.tags?.['addr:street'] || el.tags?.['addr:full'] || el.tags?.description || '',
        distance: getDistanceKm(loc.lat, loc.lon, lat, lon),
      }
    })
    .filter(Boolean)
    .sort((a: WasteLocation, b: WasteLocation) => (a.distance ?? 999) - (b.distance ?? 999))
    .slice(0, 50)
}
 
export default function MapPageOverpass() {
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
  const [filterType, setFilterType] = useState<string>('all')
 
  useEffect(() => {
    if (typeof window === 'undefined') return
    const load = async () => {
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link')
        link.id = 'leaflet-css'
        link.rel = 'stylesheet'
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
        document.head.appendChild(link)
      }
      if (!(window as any).L) {
        await new Promise<void>((res, rej) => {
          const s = document.createElement('script')
          s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
          s.onload = () => res()
          s.onerror = rej
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
      setUserLocation(fb); initMap(fb); fetchLocations(fb, radius)
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lon: pos.coords.longitude }
        setUserLocation(loc); initMap(loc); fetchLocations(loc, radius)
      },
      () => {
        const fb = { lat: -6.2088, lon: 106.8456 }
        setUserLocation(fb); initMap(fb); fetchLocations(fb, radius)
        setErrorMsg('GPS ditolak — menampilkan area Jakarta.')
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }
 
  const initMap = (loc: UserLocation) => {
    if (!mapRef.current || leafletMap.current) return
    const L = (window as any).L
 
    const map = L.map(mapRef.current, { center: [loc.lat, loc.lon], zoom: 14, zoomControl: false })
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map)
    L.control.zoom({ position: 'bottomright' }).addTo(map)
 
    const userIcon = L.divIcon({
      html: `<div style="width:16px;height:16px;background:#2563eb;border:3px solid white;border-radius:50%;box-shadow:0 0 0 6px rgba(37,99,235,0.2);"></div>`,
      className: '', iconSize: [16, 16], iconAnchor: [8, 8],
    })
    L.marker([loc.lat, loc.lon], { icon: userIcon })
      .addTo(map)
      .bindPopup('<b>📍 Lokasi Anda</b>')
 
    leafletMap.current = map
  }
 
  const fetchLocations = async (loc: UserLocation, r: number) => {
    setStatus('fetching')
    setLocations([])
    try {
      const results = await fetchFromOverpass(loc, r)
      setLocations(results)
      addMarkersToMap(results)
      setStatus('done')
    } catch {
      setStatus('error')
      setErrorMsg('Gagal mengambil data dari OpenStreetMap. Coba lagi.')
    }
  }
 
  const addMarkersToMap = (locs: WasteLocation[]) => {
    const L = (window as any).L
    const map = leafletMap.current
    if (!map || !L) return
 
    markersRef.current.forEach(m => map.removeLayer(m))
    markersRef.current = []
 
    locs.forEach((loc) => {
      const info = getTypeInfo(loc.type)
      const icon = L.divIcon({
        html: `<div style="position:relative;width:38px;height:44px;">
          <div style="position:absolute;top:0;left:0;width:34px;height:34px;
            background:${info.color};border-radius:50% 50% 50% 0;
            transform:rotate(-45deg);border:2.5px solid white;
            box-shadow:0 2px 8px rgba(0,0,0,0.3);">
          </div>
          <span style="position:absolute;top:5px;left:5px;font-size:15px;line-height:1;">
            ${info.icon}
          </span>
        </div>`,
        className: '', iconSize: [38, 44], iconAnchor: [17, 44], popupAnchor: [0, -44],
      })
 
      const marker = L.marker([loc.lat, loc.lon], { icon })
        .addTo(map)
        .bindPopup(`
          <div style="min-width:185px;font-family:sans-serif;padding:4px 0;">
            <p style="font-weight:700;font-size:13px;margin:0 0 4px;">${info.icon} ${loc.name}</p>
            <span style="display:inline-block;background:${info.bg};color:${info.color};
              font-size:10px;font-weight:600;padding:2px 8px;border-radius:20px;margin-bottom:5px;">
              ${info.label}
            </span>
            ${loc.address ? `<p style="color:#6b7280;font-size:11px;margin:0 0 4px;">📍 ${loc.address}</p>` : ''}
            <p style="color:#16a34a;font-weight:600;font-size:11px;margin:0 0 8px;">
              🚶 ${formatDistance(loc.distance ?? 0)} dari Anda
            </p>
            <a href="https://www.google.com/maps/dir/?api=1&destination=${loc.lat},${loc.lon}&travelmode=driving"
               target="_blank"
               style="display:block;background:#2563eb;color:white;text-align:center;
                 padding:7px;border-radius:8px;font-size:12px;font-weight:600;text-decoration:none;">
              🧭 Buka Navigasi Google Maps
            </a>
          </div>
        `)
        .on('click', () => setSelected(loc))
 
      markersRef.current.push(marker)
    })
  }
 
  const changeRadius = (r: number) => {
    setRadius(r)
    if (userLocation) fetchLocations(userLocation, r)
  }
 
  const flyToLocation = (loc: WasteLocation) => {
    leafletMap.current?.flyTo([loc.lat, loc.lon], 17, { duration: 1 })
    setSelected(loc)
    setActiveTab('map')
    setTimeout(() => {
      const marker = markersRef.current.find(
        m => Math.abs(m.getLatLng().lat - loc.lat) < 0.0001
      )
      marker?.openPopup()
    }, 1100)
  }
 
  const recenter = () => {
    if (userLocation)
      leafletMap.current?.flyTo([userLocation.lat, userLocation.lon], 14, { duration: 1 })
  }
 
  const filteredLocations = filterType === 'all'
    ? locations
    : locations.filter(l => l.type === filterType)
 
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
 
      {/* Header */}
      <div className="bg-green-600 px-5 pt-14 pb-4 rounded-b-3xl flex-shrink-0">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h1 className="text-white text-xl font-bold">Peta TPS Terdekat</h1>
            <p className="text-blue-100 text-xs mt-0.5">
              {status === 'locating' && '📡 Mendeteksi lokasi GPS...'}
              {status === 'fetching' && '🔍 Mencari TPS & TPST terdekat...'}
              {status === 'done' && `✅ ${locations.length} lokasi ditemukan · OpenStreetMap`}
              {status === 'error' && `⚠️ ${errorMsg}`}
              {status === 'loading' && '⏳ Memuat peta...'}
            </p>
          </div>
          <button
            onClick={recenter}
            className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-xl pressable"
          >🎯</button>
        </div>
 
        {/* Radius */}
        <div className="flex gap-2">
          {RADIUS_OPTIONS.map(r => (
            <button key={r} onClick={() => changeRadius(r)}
              className={`flex-1 py-1.5 rounded-full text-xs font-semibold transition-all pressable
                ${radius === r ? 'bg-white text-blue-700' : 'bg-white/20 text-white'}`}>
              {r >= 1000 ? `${r / 1000} km` : `${r} m`}
            </button>
          ))}
        </div>
      </div>
 
      {/* Filter chips */}
      {status === 'done' && locations.length > 0 && (
        <div className="flex gap-2 px-4 mt-3 overflow-x-auto scrollbar-hide pb-1">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-all pressable
              ${filterType === 'all' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200'}`}>
            Semua ({locations.length})
          </button>
          {Object.entries(TYPE_INFO).filter(([k]) => k !== 'default').map(([k, v]) => {
            const count = locations.filter(l => l.type === k).length
            if (count === 0) return null
            return (
              <button key={k} onClick={() => setFilterType(k)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-all pressable
                  ${filterType === k ? 'text-white border-transparent' : 'bg-white text-gray-600 border-gray-200'}`}
                style={filterType === k ? { background: v.color, borderColor: v.color } : {}}>
                {v.icon} {v.label} ({count})
              </button>
            )
          })}
        </div>
      )}
 
      {/* Tabs */}
      <div className="flex mx-4 mt-3 bg-gray-200 rounded-xl p-1 gap-1 flex-shrink-0">
        {(['map', 'list'] as const).map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all
              ${activeTab === t ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500'}`}>
            {t === 'map' ? '🗺️ Peta' : `📋 Daftar${status === 'done' ? ` (${filteredLocations.length})` : ''}`}
          </button>
        ))}
      </div>
 
      {/* MAP TAB */}
      {activeTab === 'map' && (
        <div className="relative mx-4 mt-3 mb-4 rounded-2xl overflow-hidden shadow-lg flex-1" style={{ minHeight: 430 }}>
          <div ref={mapRef} style={{ width: '100%', height: '100%', minHeight: 430 }} />
 
          {['loading', 'locating', 'fetching'].includes(status) && (
            <div className="absolute inset-0 bg-white/85 flex flex-col items-center justify-center gap-3 z-[1000]">
              <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-600 font-medium">
                {status === 'loading' && 'Memuat peta...'}
                {status === 'locating' && 'Mendeteksi lokasi GPS...'}
                {status === 'fetching' && 'Mencari TPS & TPST terdekat...'}
              </p>
            </div>
          )}
 
          {status === 'error' && (
            <div className="absolute inset-0 bg-white/90 flex flex-col items-center justify-center gap-3 z-[1000] p-6 text-center">
              <p className="text-4xl">😕</p>
              <p className="text-gray-700 font-medium">{errorMsg}</p>
              <button onClick={() => { setStatus('locating'); getUserLocation() }}
                className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-semibold text-sm pressable">
                Coba Lagi
              </button>
            </div>
          )}
 
          {status === 'done' && (
            <div className="absolute top-3 left-3 bg-white/95 rounded-xl p-2.5 shadow z-[999] flex flex-col gap-1.5">
              {Object.entries(TYPE_INFO).filter(([k]) => k !== 'default').map(([k, v]) => (
                <div key={k} className="flex items-center gap-2">
                  <span className="text-sm leading-none">{v.icon}</span>
                  <span className="text-xs text-gray-600">{v.label}</span>
                </div>
              ))}
              <div className="flex items-center gap-2 pt-1.5 border-t border-gray-100 mt-0.5">
                <div className="w-3 h-3 rounded-full bg-blue-600 border-2 border-white shadow flex-shrink-0" />
                <span className="text-xs text-gray-600">Lokasi Anda</span>
              </div>
            </div>
          )}
        </div>
      )}
 
      {/* LIST TAB */}
      {activeTab === 'list' && (
        <div className="px-4 mt-2 pb-6 flex-1 overflow-y-auto">
          {['fetching', 'locating', 'loading'].includes(status) ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-500 text-sm">Mencari TPS terdekat...</p>
            </div>
          ) : filteredLocations.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-5xl mb-3">🔍</p>
              <p className="text-gray-700 font-semibold">
                {filterType !== 'all' ? `Tidak ada ${getTypeInfo(filterType).label} ditemukan` : 'Tidak ada lokasi ditemukan'}
              </p>
              <p className="text-gray-400 text-sm mt-1 mb-4">
                {filterType !== 'all' ? 'Coba ganti filter atau perluas radius' : 'Coba perluas radius pencarian'}
              </p>
              <div className="flex gap-2 justify-center">
                {filterType !== 'all' && (
                  <button onClick={() => setFilterType('all')}
                    className="bg-gray-100 text-gray-700 px-4 py-2.5 rounded-xl font-semibold text-sm pressable">
                    Hapus Filter
                  </button>
                )}
                <button onClick={() => changeRadius(5000)}
                  className="bg-blue-600 text-white px-4 py-2.5 rounded-xl font-semibold text-sm pressable">
                  Perluas ke 5 km
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filteredLocations.map((loc) => {
                const info = getTypeInfo(loc.type)
                return (
                  <div key={loc.id} onClick={() => flyToLocation(loc)}
                    className={`bg-white rounded-2xl p-4 border-2 transition-all pressable cursor-pointer
                      ${selected?.id === loc.id ? 'border-blue-400 shadow-md' : 'border-gray-100'}`}>
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                        style={{ background: info.bg }}>
                        {info.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-800 text-sm leading-tight">{loc.name}</p>
                        <span className="inline-block text-xs font-semibold px-2 py-0.5 rounded-full mt-1"
                          style={{ background: info.bg, color: info.color }}>
                          {info.label}
                        </span>
                        {loc.address && (
                          <p className="text-xs text-gray-400 mt-1 truncate">📍 {loc.address}</p>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-bold text-blue-600">{formatDistance(loc.distance ?? 0)}</p>
                        <p className="text-xs text-gray-400">dari sini</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={(e) => { e.stopPropagation(); flyToLocation(loc) }}
                        className="flex-1 bg-blue-50 text-blue-700 py-2.5 rounded-xl text-xs font-semibold pressable">
                        🗺️ Lihat di Peta
                      </button>
                      <a href={`https://www.google.com/maps/dir/?api=1&destination=${loc.lat},${loc.lon}&travelmode=driving`}
                        target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
                        className="flex-1 bg-green-600 text-white py-2.5 rounded-xl text-xs font-semibold text-center pressable">
                        🧭 Navigasi
                      </a>
                    </div>
                  </div>
                )
              })}
              <p className="text-center text-xs text-gray-400 py-2">
                🗺️ Data dari OpenStreetMap · Tidak perlu API key
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}