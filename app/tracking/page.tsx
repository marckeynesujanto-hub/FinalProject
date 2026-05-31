'use client'

import { useEffect, useRef, useState } from 'react'

// Simulate a route as array of [lat, lon] waypoints
function generateRoute(from: [number, number], to: [number, number], steps = 20): [number, number][] {
  const route: [number, number][] = []
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    // Add slight curve/noise to make it look like real roads
    const noise = Math.sin(t * Math.PI) * 0.002
    route.push([
      from[0] + (to[0] - from[0]) * t + noise,
      from[1] + (to[1] - from[1]) * t + noise * 0.5,
    ])
  }
  return route
}

type OrderStatus =
  | 'waiting'       // Mencari driver
  | 'driver_found'  // Driver ditemukan
  | 'pickup'        // Driver menuju customer
  | 'arrived'       // Driver tiba di lokasi customer
  | 'collecting'    // Mengambil sampah
  | 'to_tps'        // Menuju TPS
  | 'done'          // Selesai

const STATUS_STEPS: { status: OrderStatus; label: string; desc: string; icon: string }[] = [
  { status: 'waiting',      label: 'Mencari Driver',       desc: 'Sedang mencarikan driver terdekat...',     icon: '🔍' },
  { status: 'driver_found', label: 'Driver Ditemukan',     desc: 'Driver sedang bersiap menuju lokasi Anda', icon: '🏍️' },
  { status: 'pickup',       label: 'Driver Menuju Anda',   desc: 'Driver sedang dalam perjalanan ke lokasi', icon: '🛵' },
  { status: 'arrived',      label: 'Driver Tiba',          desc: 'Driver sudah tiba di lokasi Anda!',        icon: '📍' },
  { status: 'collecting',   label: 'Mengambil Sampah',     desc: 'Driver sedang mengambil sampah Anda',      icon: '🗑️' },
  { status: 'to_tps',       label: 'Menuju TPS',           desc: 'Sampah dibawa ke TPS terdekat',            icon: '🚛' },
  { status: 'done',         label: 'Selesai!',             desc: 'Sampah berhasil dibuang ke TPS. Terima kasih!', icon: '✅' },
]

const DRIVER = {
  name: 'Budi Santoso',
  vehicle: 'Honda Vario · B 4521 XYZ',
  rating: 4.9,
  photo: '👨',
  phone: '+62 812-3456-7890',
}

export default function TrackingPage() {
  const mapRef = useRef<HTMLDivElement>(null)
  const leafletMap = useRef<any>(null)
  const driverMarkerRef = useRef<any>(null)
  const routeLineRef = useRef<any>(null)

  const [status, setStatus] = useState<OrderStatus>('waiting')
  const [driverPos, setDriverPos] = useState<[number, number] | null>(null)
  const [userLocation, setUserLocation] = useState<[number, number]>([-6.2088, 106.8456])
  const [tpsLocation] = useState<[number, number]>([-6.1954, 106.8223]) // TPS Slipi
  const [eta, setEta] = useState<number>(8)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [showRating, setShowRating] = useState(false)
  const [rating, setRating] = useState(0)
  const routeIndexRef = useRef(0)
  const animRef = useRef<NodeJS.Timeout | null>(null)

  // Load Leaflet
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
      setMapLoaded(true)
    }
    load().catch(console.error)
  }, [])

  // Get user location
  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      pos => setUserLocation([pos.coords.latitude, pos.coords.longitude]),
      () => {} // keep default Jakarta
    )
  }, [])

  // Init map once Leaflet loaded
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || leafletMap.current) return
    const L = (window as any).L

    const map = L.map(mapRef.current, {
      center: userLocation,
      zoom: 14,
      zoomControl: false,
    })
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap', maxZoom: 19,
    }).addTo(map)
    L.control.zoom({ position: 'bottomright' }).addTo(map)

    // User marker (home)
    const homeIcon = L.divIcon({
      html: `<div style="background:#16a34a;width:36px;height:36px;border-radius:50%;border:3px solid white;display:flex;align-items:center;justify-content:center;font-size:18px;box-shadow:0 2px 8px rgba(0,0,0,0.3);">🏠</div>`,
      className: '', iconSize: [36, 36], iconAnchor: [18, 18],
    })
    L.marker(userLocation, { icon: homeIcon }).addTo(map).bindPopup('<b>📍 Lokasi Anda</b>')

    // TPS marker
    const tpsIcon = L.divIcon({
      html: `<div style="background:#dc2626;width:36px;height:36px;border-radius:50%;border:3px solid white;display:flex;align-items:center;justify-content:center;font-size:18px;box-shadow:0 2px 8px rgba(0,0,0,0.3);">🗑️</div>`,
      className: '', iconSize: [36, 36], iconAnchor: [18, 18],
    })
    L.marker(tpsLocation, { icon: tpsIcon }).addTo(map).bindPopup('<b>🗑️ TPS Slipi</b>')

    leafletMap.current = map
  }, [mapLoaded, userLocation])

  // Simulate the full order flow
  useEffect(() => {
    if (!mapLoaded) return

    const flow = async () => {
      // 1. Waiting → driver found
      await delay(2500)
      setStatus('driver_found')

      // Start driver far from user
      const startPos: [number, number] = [userLocation[0] - 0.015, userLocation[1] + 0.012]
      setDriverPos(startPos)
      addDriverMarker(startPos)

      // 2. Driver found → pickup (animate toward user)
      await delay(2000)
      setStatus('pickup')

      const routeToUser = generateRoute(startPos, userLocation, 30)
      await animateDriver(routeToUser, 300, (remaining) => {
        setEta(Math.max(1, Math.round((remaining / 30) * 8)))
      })

      // 3. Arrived
      setStatus('arrived')
      setEta(0)
      leafletMap.current?.flyTo(userLocation, 16, { duration: 1 })
      await delay(3000)

      // 4. Collecting
      setStatus('collecting')
      await delay(3000)

      // 5. To TPS (animate toward TPS)
      setStatus('to_tps')
      setEta(5)
      const routeToTPS = generateRoute(userLocation, tpsLocation, 30)
      await animateDriver(routeToTPS, 300, (remaining) => {
        setEta(Math.max(1, Math.round((remaining / 30) * 5)))
      })

      // 6. Done
      setStatus('done')
      setEta(0)
      setTimeout(() => setShowRating(true), 1500)
    }

    flow()
    return () => { if (animRef.current) clearTimeout(animRef.current) }
  }, [mapLoaded])

  function delay(ms: number) {
    return new Promise<void>(res => { animRef.current = setTimeout(res, ms) })
  }

  function addDriverMarker(pos: [number, number]) {
    const L = (window as any).L
    const map = leafletMap.current
    if (!map || !L) return

    if (driverMarkerRef.current) map.removeLayer(driverMarkerRef.current)

    const icon = L.divIcon({
      html: `<div style="background:#f59e0b;width:40px;height:40px;border-radius:50%;border:3px solid white;display:flex;align-items:center;justify-content:center;font-size:20px;box-shadow:0 2px 10px rgba(0,0,0,0.4);">🛵</div>`,
      className: '', iconSize: [40, 40], iconAnchor: [20, 20],
    })
    driverMarkerRef.current = L.marker(pos, { icon }).addTo(map)
      .bindPopup(`<b>🛵 ${DRIVER.name}</b><br>${DRIVER.vehicle}`)
  }

  async function animateDriver(
    route: [number, number][],
    stepMs: number,
    onStep?: (remaining: number) => void
  ) {
    const L = (window as any).L
    const map = leafletMap.current
    if (!map || !L) return

    // Draw route line
    if (routeLineRef.current) map.removeLayer(routeLineRef.current)
    routeLineRef.current = L.polyline(route, {
      color: '#f59e0b', weight: 4, opacity: 0.7, dashArray: '8, 8',
    }).addTo(map)

    for (let i = 0; i < route.length; i++) {
      await delay(stepMs)
      const pos = route[i]
      setDriverPos(pos)
      if (driverMarkerRef.current) {
        driverMarkerRef.current.setLatLng(pos)
      }
      onStep?.(route.length - i)

      // Pan map to follow driver
      if (i % 5 === 0) {
        map.panTo(pos, { animate: true, duration: 0.5 })
      }
    }

    // Remove route line when done
    if (routeLineRef.current) {
      map.removeLayer(routeLineRef.current)
      routeLineRef.current = null
    }
  }

  const currentStep = STATUS_STEPS.find(s => s.status === status) || STATUS_STEPS[0]
  const stepIndex = STATUS_STEPS.findIndex(s => s.status === status)

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-green-600 px-5 pt-14 pb-5 rounded-b-3xl flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-xl">
            {currentStep.icon}
          </div>
          <div>
            <h1 className="text-white text-lg font-bold">{currentStep.label}</h1>
            <p className="text-green-100 text-xs mt-0.5">{currentStep.desc}</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4 flex gap-1">
          {STATUS_STEPS.map((s, i) => (
            <div
              key={s.status}
              className={`flex-1 h-1.5 rounded-full transition-all duration-500
                ${i <= stepIndex ? 'bg-white' : 'bg-white/30'}`}
            />
          ))}
        </div>
      </div>

      {/* Map */}
      <div className="mx-4 mt-4 rounded-2xl overflow-hidden shadow-lg flex-shrink-0" style={{ height: 280 }}>
        <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
        {!mapLoaded && (
          <div className="absolute inset-0 bg-white flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* ETA Card */}
      {status !== 'done' && status !== 'waiting' && (
        <div className="mx-4 mt-3 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center text-xl">⏱️</div>
          <div className="flex-1">
            <p className="text-xs text-gray-400">
              {status === 'to_tps' ? 'Estimasi tiba di TPS' : 'Estimasi tiba di lokasi Anda'}
            </p>
            <p className="font-bold text-gray-800 text-lg">
              {eta === 0 ? 'Sudah tiba!' : `${eta} menit lagi`}
            </p>
          </div>
          {status === 'pickup' && (
            <div className="text-right">
              <p className="text-xs text-gray-400">Jarak</p>
              <p className="font-semibold text-gray-700 text-sm">~1.2 km</p>
            </div>
          )}
        </div>
      )}

      {/* Driver Info Card */}
      {status !== 'waiting' && status !== 'done' && (
        <div className="mx-4 mt-3 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center text-2xl">
              {DRIVER.photo}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-800">{DRIVER.name}</p>
              <p className="text-xs text-gray-400">{DRIVER.vehicle}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-yellow-400 text-xs">⭐</span>
                <span className="text-xs font-semibold text-gray-700">{DRIVER.rating}</span>
              </div>
            </div>
            <a
              href={`tel:${DRIVER.phone}`}
              className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center text-xl pressable"
            >
              📞
            </a>
          </div>
        </div>
      )}

      {/* Waiting animation */}
      {status === 'waiting' && (
        <div className="mx-4 mt-3 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm text-center">
          <div className="flex justify-center gap-2 mb-3">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className="w-3 h-3 bg-green-400 rounded-full animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
          <p className="text-gray-600 font-medium">Mencari driver terdekat...</p>
          <p className="text-gray-400 text-sm mt-1">Mohon tunggu sebentar</p>
        </div>
      )}

      {/* Status Timeline */}
      <div className="mx-4 mt-3 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm mb-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Status Order</p>
        <div className="flex flex-col gap-0">
          {STATUS_STEPS.map((s, i) => {
            const done = i < stepIndex
            const active = i === stepIndex
            const upcoming = i > stepIndex
            return (
              <div key={s.status} className="flex items-start gap-3">
                <div className="flex flex-col items-center">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all
                    ${done ? 'bg-green-500 border-green-500 text-white'
                      : active ? 'bg-green-600 border-green-600 text-white scale-110'
                      : 'bg-white border-gray-200 text-gray-300'}`}>
                    {done ? '✓' : s.icon}
                  </div>
                  {i < STATUS_STEPS.length - 1 && (
                    <div className={`w-0.5 h-5 ${done ? 'bg-green-400' : 'bg-gray-100'}`} />
                  )}
                </div>
                <div className="flex-1 pb-1">
                  <p className={`text-sm font-medium ${active ? 'text-green-600' : done ? 'text-gray-700' : 'text-gray-300'}`}>
                    {s.label}
                  </p>
                  {active && (
                    <p className="text-xs text-gray-400 mt-0.5">{s.desc}</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Done state */}
      {status === 'done' && (
        <div className="mx-4 mb-4 bg-green-50 rounded-2xl p-4 border border-green-200 text-center">
          <p className="text-3xl mb-2">🎉</p>
          <p className="font-bold text-green-800">Sampah berhasil dibuang!</p>
          <p className="text-green-600 text-sm mt-1">+10 poin telah ditambahkan ke akun Anda</p>
        </div>
      )}

      {/* Rating Modal */}
      {showRating && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50">
          <div className="bg-white w-full max-w-md mx-auto rounded-t-3xl p-6">
            <p className="text-center text-2xl mb-1">🛵</p>
            <h3 className="font-bold text-gray-800 text-lg text-center mb-1">Beri Rating Driver</h3>
            <p className="text-gray-400 text-sm text-center mb-5">Bagaimana pelayanan {DRIVER.name}?</p>
            <div className="flex justify-center gap-3 mb-5">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className={`text-4xl transition-transform pressable ${star <= rating ? 'scale-110' : 'opacity-30'}`}
                >
                  ⭐
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowRating(false)}
              disabled={rating === 0}
              className="w-full bg-green-600 disabled:bg-gray-200 disabled:text-gray-400 text-white py-3.5 rounded-2xl font-bold pressable"
            >
              Kirim Rating
            </button>
            <button
              onClick={() => setShowRating(false)}
              className="w-full mt-2 text-gray-400 text-sm py-2"
            >
              Lewati
            </button>
          </div>
        </div>
      )}
    </div>
  )
}