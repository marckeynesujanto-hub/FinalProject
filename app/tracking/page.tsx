// app/tracking/page.tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

const DISPLAY = "'Bricolage Grotesque', sans-serif"

function generateRoute(from: [number, number], to: [number, number], steps = 20): [number, number][] {
  const route: [number, number][] = []
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const noise = Math.sin(t * Math.PI) * 0.002
    route.push([
      from[0] + (to[0] - from[0]) * t + noise,
      from[1] + (to[1] - from[1]) * t + noise * 0.5,
    ])
  }
  return route
}

type OrderStatus = 'waiting' | 'driver_found' | 'pickup' | 'arrived' | 'collecting' | 'to_tps' | 'done'

const STATUS_STEPS: { status: OrderStatus; label: string; desc: string; icon: string }[] = [
  { status: 'waiting',      label: 'Mencari Driver',     desc: 'Sedang mencarikan driver terdekat...',     icon: '🔍' },
  { status: 'driver_found', label: 'Driver Ditemukan',   desc: 'Driver sedang bersiap menuju lokasi Anda', icon: '🏍️' },
  { status: 'pickup',       label: 'Driver Menuju Anda', desc: 'Driver sedang dalam perjalanan ke lokasi', icon: '🛵' },
  { status: 'arrived',      label: 'Driver Tiba',        desc: 'Driver sudah tiba di lokasi Anda!',        icon: '📍' },
  { status: 'collecting',   label: 'Mengambil Sampah',   desc: 'Driver sedang mengambil sampah Anda',      icon: '🗑️' },
  { status: 'to_tps',       label: 'Menuju TPS',         desc: 'Sampah dibawa ke TPS terdekat',            icon: '🚛' },
  { status: 'done',         label: 'Selesai!',           desc: 'Sampah berhasil dibuang ke TPS. Terima kasih!', icon: '✅' },
]

interface Driver {
  name: string
  phone: string
  vehicle: string
  rating: string
}

interface NearestTPS {
  id: string
  name: string
  lat: number
  lon: number
  address: string
  distance: number
}

interface UserLocation {
  lat: number
  lon: number
}

export default function TrackingPage() {
  const router = useRouter()
  const mapRef = useRef<HTMLDivElement>(null)
  const leafletMap = useRef<any>(null)
  const driverMarkerRef = useRef<any>(null)
  const routeLineRef = useRef<any>(null)

  const [userLocation, setUserLocation] = useState<UserLocation | null>(null)
  const [status, setStatus] = useState<OrderStatus>('waiting')
  const [nearestTPS, setNearestTPS] = useState<NearestTPS | null>(null)
  const [driver, setDriver] = useState<Driver>({
    name: 'Mencari driver...',
    phone: '',
    vehicle: '',
    rating: '4.9',
  })
  const [eta, setEta] = useState<number>(8)
  const [showRating, setShowRating] = useState(false)
  const [rating, setRating] = useState(0)
  const [mapReady, setMapReady] = useState(false)
  const animRef = useRef<NodeJS.Timeout | null>(null)
  const simulationStarted = useRef(false)

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
      getUserLocation()
    }
    load().catch(console.error)
    return () => { if (animRef.current) clearTimeout(animRef.current) }
  }, [])

  const getUserLocation = () => {
    if (!navigator.geolocation) {
      const fb = { lat: -6.2088, lon: 106.8456 }
      setUserLocation(fb); initMap(fb); return
    }
    navigator.geolocation.getCurrentPosition(
      pos => {
        const loc = { lat: pos.coords.latitude, lon: pos.coords.longitude }
        setUserLocation(loc); initMap(loc)
      },
      () => {
        const fb = { lat: -6.2088, lon: 106.8456 }
        setUserLocation(fb); initMap(fb)
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
    const userIcon = L.divIcon({
      html: `<div style="background:#47613A;width:24px;height:24px;border-radius:50%;border:3px solid white;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 8px rgba(0,0,0,0.25);">🏠</div>`,
      className: '', iconSize: [24, 24], iconAnchor: [12, 12],
    })
    L.marker([loc.lat, loc.lon], { icon: userIcon }).addTo(map).bindPopup('<b>📍 Lokasi Anda</b>')
    leafletMap.current = map
    setMapReady(true)
    setUserLocation(loc)
  }

  useEffect(() => {
    if (!mapReady || !userLocation || simulationStarted.current) return
    simulationStarted.current = true
    startFlow(userLocation)
  }, [mapReady, userLocation])

  const fetchNearestTPS = async (lat: number, lon: number): Promise<NearestTPS | null> => {
    try {
      const res = await fetch(`/api/locations?lat=${lat}&lon=${lon}&radius=5000`)
      const data = await res.json()
      if (data && data.length > 0) {
        return { id: data[0].id, name: data[0].name, lat: data[0].lat, lon: data[0].lon, address: data[0].address, distance: data[0].distance }
      }
    } catch { }
    return null
  }

  const fetchRandomDriver = async (): Promise<Driver> => {
    try {
      const res = await fetch('/api/drivers')
      const data = await res.json()
      return data
    } catch {
      return { name: 'Budi Santoso', phone: '081234567890', vehicle: 'Honda Vario · B 4521 XYZ', rating: '4.9' }
    }
  }

  const startFlow = async (userLoc: UserLocation) => {
    const L = (window as any).L
    const map = leafletMap.current

    const [randomDriver, tpsPromise] = await Promise.all([
      fetchRandomDriver(),
      Promise.resolve(fetchNearestTPS(userLoc.lat, userLoc.lon)),
    ])
    setDriver(randomDriver)

    await delay(2500)
    setStatus('driver_found')

    const startPos: [number, number] = [userLoc.lat - 0.015, userLoc.lon + 0.012]
    addDriverMarker(startPos, randomDriver.name, randomDriver.vehicle)

    await delay(2000)
    setStatus('pickup')

    const routeToUser = generateRoute(startPos, [userLoc.lat, userLoc.lon], 30)
    await animateDriver(routeToUser, 300, remaining => {
      setEta(Math.max(1, Math.round((remaining / 30) * 8)))
    })

    setStatus('arrived')
    setEta(0)
    map?.flyTo([userLoc.lat, userLoc.lon], 16, { duration: 1 })
    await delay(3000)

    setStatus('collecting')

    const tps = await tpsPromise
    setNearestTPS(tps)

    if (tps && map && L) {
      const tpsIcon = L.divIcon({
        html: `<div style="background:#B0564C;width:24px;height:24px;border-radius:50%;border:3px solid white;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 8px rgba(0,0,0,0.25);">🗑️</div>`,
        className: '', iconSize: [24, 24], iconAnchor: [12, 12],
      })
      L.marker([tps.lat, tps.lon], { icon: tpsIcon }).addTo(map)
        .bindPopup(`<b>🗑️ ${tps.name}</b><br>${tps.address}`)
    }

    await delay(3000)
    setStatus('to_tps')
    setEta(5)

    const tpsLoc: [number, number] = tps
      ? [tps.lat, tps.lon]
      : [userLoc.lat + 0.018, userLoc.lon - 0.014]

    const routeToTPS = generateRoute([userLoc.lat, userLoc.lon], tpsLoc, 30)
    await animateDriver(routeToTPS, 300, remaining => {
      setEta(Math.max(1, Math.round((remaining / 30) * 5)))
    })

    map?.flyTo(tpsLoc, 16, { duration: 1 })
    setStatus('done')
    setEta(0)
    setTimeout(() => setShowRating(true), 1500)
  }

  function delay(ms: number) {
    return new Promise<void>(res => { animRef.current = setTimeout(res, ms) })
  }

  function addDriverMarker(pos: [number, number], name: string, vehicle: string) {
    const L = (window as any).L
    const map = leafletMap.current
    if (!map || !L) return
    if (driverMarkerRef.current) map.removeLayer(driverMarkerRef.current)
    const icon = L.divIcon({
      html: `<div style="background:#C06B41;width:38px;height:38px;border-radius:50%;border:3px solid white;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 10px rgba(0,0,0,0.3);font-size:16px;">🛵</div>`,
      className: '', iconSize: [38, 38], iconAnchor: [19, 19],
    })
    driverMarkerRef.current = L.marker(pos, { icon }).addTo(map)
      .bindPopup(`<b>🛵 ${name}</b><br>${vehicle}`)
  }

  async function animateDriver(route: [number, number][], stepMs: number, onStep?: (remaining: number) => void) {
    const L = (window as any).L
    const map = leafletMap.current
    if (!map || !L) return
    if (routeLineRef.current) map.removeLayer(routeLineRef.current)
    routeLineRef.current = L.polyline(route, {
      color: '#C06B41', weight: 4, opacity: 0.7, dashArray: '8,8',
    }).addTo(map)
    for (let i = 0; i < route.length; i++) {
      await delay(stepMs)
      const pos = route[i]
      if (driverMarkerRef.current) driverMarkerRef.current.setLatLng(pos)
      onStep?.(route.length - i)
      if (i % 5 === 0) map.panTo(pos, { animate: true, duration: 0.5 })
    }
    if (routeLineRef.current) { map.removeLayer(routeLineRef.current); routeLineRef.current = null }
  }

  const currentStep = STATUS_STEPS.find(s => s.status === status) || STATUS_STEPS[0]
  const stepIndex = STATUS_STEPS.findIndex(s => s.status === status)

  return (
    <div className="min-h-screen bg-[#F5F1E6] flex flex-col pb-10">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#4E6A41] to-[#3C5331] px-5 pt-16 pb-6 rounded-b-[34px] shadow-[0_20px_40px_-24px_rgba(40,38,28,0.5)] flex-shrink-0 relative overflow-hidden">
        <div className="absolute right-[-10%] top-[-20%] w-44 h-44 bg-[#56724A] rounded-full opacity-55 pointer-events-none"></div>

        <div className="flex items-center gap-3.5 mb-5 relative z-10">
          <button onClick={() => router.push('/home')} className="w-10 h-10 bg-white/12 hover:bg-white/22 rounded-2xl flex items-center justify-center text-white text-lg transition-all pressable">
            ←
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/18 rounded-xl flex items-center justify-center text-xl">
              {currentStep.icon}
            </div>
            <div>
              <h1 className="text-white text-base font-extrabold tracking-tight" style={{ fontFamily: DISPLAY }}>{currentStep.label}</h1>
              <p className="text-[#AFC09C] text-[10px] mt-0.5 font-medium leading-relaxed">{currentStep.desc}</p>
            </div>
          </div>
        </div>

        {/* Progress tracker steps */}
        <div className="mt-4 flex gap-1.5 relative z-10">
          {STATUS_STEPS.map((s, i) => (
            <div key={s.status}
              className={`flex-1 h-1.5 rounded-full transition-all duration-500
                ${i <= stepIndex ? 'bg-white' : 'bg-white/25'}`} />
          ))}
        </div>
      </div>

      {/* TPS Info Panel */}
      {status === 'to_tps' && nearestTPS && (
        <div className="mx-4 mt-5 bg-[#F3E1DE] rounded-[24px] p-5 border border-[#E3C2BC] shadow-[0_10px_24px_-16px_rgba(40,38,28,0.3)] flex items-center gap-3.5 animate-fade-in-up">
          <div className="w-12 h-12 bg-[#E6C8C2] rounded-2xl flex items-center justify-center text-3xl flex-shrink-0">🗑️</div>
          <div className="flex-1 min-w-0">
            <p className="font-extrabold text-[#2B2A23] text-sm truncate">{nearestTPS.name}</p>
            <p className="text-[10px] text-[#A8A492] font-semibold truncate mt-0.5">📍 {nearestTPS.address}</p>
            <p className="text-[10px] text-[#B0564C] font-bold mt-1">
              {nearestTPS.distance < 1
                ? `● Jarak ${Math.round(nearestTPS.distance * 1000)} m dari rumah Anda`
                : `● Jarak ${nearestTPS.distance.toFixed(1)} km dari rumah Anda`}
            </p>
          </div>
        </div>
      )}

      {/* Interactive Map Frame */}
      <div className="mx-4 mt-5 rounded-[24px] overflow-hidden shadow-[0_18px_36px_-22px_rgba(40,38,28,0.4)] flex-shrink-0 border border-[#E2DAC6] relative" style={{ height: '280px' }}>
        <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
        {status === 'waiting' && (
          <div className="absolute inset-0 bg-[#F5F1E6]/80 backdrop-blur-sm flex items-center justify-center z-[999]">
            <div className="w-8 h-8 border-4 border-[#47613A] border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      {/* Map Legend */}
      <div className="mx-5 mt-2.5 flex gap-4 text-[10px] text-[#A8A492] font-bold uppercase tracking-wider flex-wrap">
        <span className="flex items-center gap-1">🏠 Lokasi Anda</span>
        <span className="flex items-center gap-1 text-[#C06B41]">🛵 Titik Driver</span>
        {nearestTPS && <span className="flex items-center gap-1 text-[#B0564C]">🗑️ {nearestTPS.name}</span>}
      </div>

      {/* ETA Display Card */}
      {status !== 'done' && status !== 'waiting' && (
        <div className="mx-4 mt-5 bg-[#FFFDF7] rounded-[24px] p-5 border border-[#ECE4D2] shadow-[0_10px_24px_-16px_rgba(40,38,28,0.3)] flex items-center gap-3.5 animate-fade-in-up">
          <div className="w-12 h-12 bg-[#F6EBCF] rounded-2xl flex items-center justify-center text-3xl flex-shrink-0">⏱️</div>
          <div className="flex-1">
            <p className="text-[10px] text-[#A8A492] font-extrabold uppercase tracking-widest">
              {status === 'to_tps' ? `Estimasi Tiba di ${nearestTPS?.name || 'TPS'}` : 'Estimasi Tiba di Lokasi Anda'}
            </p>
            <p className="font-extrabold text-[#2B2A23] text-lg mt-0.5" style={{ fontFamily: DISPLAY }}>
              {eta === 0 ? 'Sudah Tiba di Lokasi! 🎉' : `${eta} Menit Lagi`}
            </p>
          </div>
        </div>
      )}

      {/* Driver Detail Card */}
      {status !== 'waiting' && status !== 'done' && (
        <div className="mx-4 mt-3 bg-[#FFFDF7] rounded-[24px] p-5 border border-[#ECE4D2] shadow-[0_10px_24px_-16px_rgba(40,38,28,0.3)] animate-fade-in-up">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 bg-[#F6EBCF] rounded-full flex items-center justify-center text-3xl flex-shrink-0">👨</div>
              <div>
                <p className="font-extrabold text-[#2B2A23] text-sm leading-none">{driver.name}</p>
                <p className="text-[10.5px] text-[#A8A492] font-bold mt-1.5">{driver.vehicle}</p>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className="text-[#CE9A36] text-sm">⭐</span>
                  <span className="text-[10px] font-extrabold text-[#42402F]">{driver.rating} Rating</span>
                </div>
              </div>
            </div>
            {driver.phone && (
              <a href={`tel:${driver.phone}`}
                className="w-11 h-11 bg-[#E8EEDD] text-[#47613A] rounded-2xl flex items-center justify-center text-xl border border-[#D6E0C5] transition-all active:scale-95 pressable">
                📞
              </a>
            )}
          </div>
        </div>
      )}

      {/* Searching Driver animation card */}
      {status === 'waiting' && (
        <div className="mx-4 mt-4 bg-[#FFFDF7] rounded-[24px] p-6 border border-[#ECE4D2] shadow-[0_10px_24px_-16px_rgba(40,38,28,0.3)] text-center animate-fade-in-up">
          <div className="flex justify-center gap-2 mb-3">
            {[0, 1, 2].map(i => (
              <div key={i} className="w-3.5 h-3.5 bg-[#47613A] rounded-full animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
          <p className="text-[#42402F] font-extrabold text-sm" style={{ fontFamily: DISPLAY }}>Mencari Driver ThrashIn Terdekat...</p>
          <p className="text-[#A8A492] text-xs mt-1 font-semibold">Mohon lu tunggu sebentar ya, sistem sedang memproses</p>
        </div>
      )}

      {/* Status vertical timeline checklist */}
      <div className="mx-4 mt-4 bg-[#FFFDF7] rounded-[24px] p-5 border border-[#ECE4D2] shadow-[0_10px_24px_-16px_rgba(40,38,28,0.3)]">
        <p className="text-[10px] text-[#A8A492] font-extrabold uppercase tracking-widest mb-4 ml-1">Langkah Penjemputan</p>
        <div className="flex flex-col space-y-1">
          {STATUS_STEPS.map((s, i) => {
            const done = i < stepIndex
            const active = i === stepIndex
            return (
              <div key={s.status} className="flex items-start gap-4 animate-fade-in-up">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black border-2 transition-all
                    ${done ? 'bg-[#47613A] border-[#47613A] text-white'
                      : active ? 'bg-[#47613A] border-[#47613A] text-white scale-110 ring-4 ring-[#D6E0C5]'
                      : 'bg-[#FFFDF7] border-[#E2DAC6] text-[#C9C0A9]'}`}>
                    {done ? '✓' : s.icon}
                  </div>
                  {i < STATUS_STEPS.length - 1 && (
                    <div className={`w-0.5 h-6 my-0.5 ${done ? 'bg-[#8FA67C]' : 'bg-[#E7E0CF]'}`} />
                  )}
                </div>
                <div className="flex-1 pb-2 mt-1">
                  <p className={`text-xs font-extrabold
                    ${active ? 'text-[#47613A] text-sm' : done ? 'text-[#42402F]' : 'text-[#C9C0A9]'}`}>
                    {s.label}
                    {s.status === 'to_tps' && nearestTPS && active && (
                      <span className="text-[9px] bg-[#F3E1DE] text-[#9A4339] px-2 py-0.5 rounded-md font-bold uppercase ml-2">→ {nearestTPS.name}</span>
                    )}
                  </p>
                  {active && <p className="text-[10px] text-[#A8A492] mt-1 font-semibold leading-relaxed">{s.desc}</p>}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Done summary card */}
      {status === 'done' && (
        <div className="mx-4 mt-5 bg-[#47613A] rounded-[24px] p-5 text-center text-white shadow-[0_18px_34px_-20px_rgba(71,97,58,0.7)] animate-fade-in-up relative overflow-hidden">
          <div className="absolute right-[-8%] top-[-30%] w-32 h-32 bg-[#56724A] rounded-full opacity-50 pointer-events-none"></div>
          <p className="text-4xl mb-2 relative z-10">🎉</p>
          <p className="font-extrabold text-base relative z-10" style={{ fontFamily: DISPLAY }}>Sampah Berhasil Didaur Ulang!</p>
          {nearestTPS && <p className="text-[#CBD8B9] text-xs mt-1 font-medium relative z-10">Bahan dibuang aman ke {nearestTPS.name}</p>}
          <p className="text-[#E9C46A] text-sm font-extrabold mt-1.5 relative z-10">+10 Poin terkumpul telah ditambahkan ke saldo akun Anda</p>

          <button
            onClick={() => router.push('/home')}
            style={{ fontFamily: DISPLAY }}
            className="w-full mt-4 bg-[#FFFDF7] text-[#47613A] py-3 rounded-2xl font-bold text-xs active:scale-95 transition-all pressable relative z-10"
          >
            Kembali ke Beranda
          </button>
        </div>
      )}

      {/* Rating stars modal popup */}
      {showRating && (
        <div className="fixed inset-0 bg-black/60 flex items-end justify-center z-50 animate-fade-in">
          <div className="bg-[#FFFDF7] w-full max-w-md rounded-t-[28px] p-6 shadow-2xl animate-slide-in-up">
            <div className="w-12 h-1 bg-[#E2DAC6] rounded-full mx-auto mb-4"></div>
            <p className="text-center text-3xl mb-1">🛵</p>
            <h3 className="font-extrabold text-[#2B2A23] text-lg text-center mb-1" style={{ fontFamily: DISPLAY }}>Beri Ulasan Driver</h3>
            <p className="text-[#6F6C5E] text-xs text-center mb-1.5 font-semibold">{driver.name}</p>
            <p className="text-[#A8A492] text-xs text-center mb-6 font-semibold">Bagaimana pelayanan penjemputan driver Anda hari ini?</p>

            <div className="flex justify-center gap-4 mb-6">
              {[1,2,3,4,5].map(star => (
                <button key={star} onClick={() => setRating(star)}
                  className={`text-4xl pressable transition-all hover:scale-110 active:scale-95 ${star <= rating ? 'scale-105 filter drop-shadow' : 'opacity-25'}`}>
                  ⭐
                </button>
              ))}
            </div>

            <button onClick={() => setShowRating(false)} disabled={rating === 0}
              style={{ fontFamily: DISPLAY }}
              className="w-full bg-[#47613A] disabled:bg-[#C5C0AE] disabled:shadow-none text-white py-4 rounded-2xl font-bold text-xs shadow-[0_16px_28px_-12px_rgba(71,97,58,0.7)] active:scale-[0.98] transition-all pressable mb-2">
              Kirim Ulasan &amp; Selesai 🚀
            </button>
            <button onClick={() => setShowRating(false)} className="w-full text-[#A8A492] hover:text-[#6F6C5E] text-xs font-bold py-2.5 transition-colors">
              Lewati Penilaian
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
