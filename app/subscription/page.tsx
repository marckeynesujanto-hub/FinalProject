// app/subscription/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/app/supabaseClient'
// import { BottomNav } from '@/components/layout/BottomNav'

const DISPLAY = "'Bricolage Grotesque', sans-serif"

const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu']

const PACKAGES = [
  { id: 'mingguan', label: 'Mingguan', price: 'Rp 39.000', per: '/minggu', desc: '4× penjemputan', icon: '📦', popular: false },
  { id: 'bulanan',  label: 'Bulanan',  price: 'Rp 129.000', per: '/bulan', desc: 'Hari pilihan', icon: '🚀', popular: true },
]

const PAYMENT_METHODS = [
  { id: 'gopay',    label: 'GoPay',             icon: '💚' },
  { id: 'ovo',      label: 'OVO',               icon: '💜' },
  { id: 'dana',     label: 'DANA',              icon: '💙' },
  { id: 'transfer', label: 'Transfer Bank',      icon: '🏦' },
  { id: 'card',     label: 'Kartu Kredit/Debit', icon: '💳' },
]

const GARBAGE_TYPES = ['Organik', 'Anorganik', 'Plastik', 'Kertas', 'Logam', 'Kaca', 'Elektronik', 'Lainnya']

const HARI_MAP: Record<string, number> = {
  'Minggu': 0, 'Senin': 1, 'Selasa': 2, 'Rabu': 3,
  'Kamis': 4, 'Jumat': 5, 'Sabtu': 6,
}

interface ActiveSubscription {
  subs_id: string
  paket: string
  jadwal: string[]
  is_paused: boolean
  subs_price: number
  payment_method: string
}

interface GarbageHistory {
  garbage_id: string
  garbage_type: string
  garbage_weight: number
  accumulated_point: number
  created_at: string
}

export default function SubscriptionPage() {
  const router = useRouter()
  const [tab, setTab] = useState<'baru' | 'aktif' | 'riwayat'>('baru')
  const [paket, setPaket] = useState<'mingguan' | 'bulanan'>('mingguan')
  const [jadwal, setJadwal] = useState<string[]>([])
  const [selectedWasteTypes, setSelectedWasteTypes] = useState<string[]>([])
  const [estimasiBerat, setEstimasiBerat] = useState('')

  const toggleWasteType = (type: string) => {
    setSelectedWasteTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    )
  }
  const [paymentMethod, setPaymentMethod] = useState('gopay')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [warning, setWarning] = useState('')

  // Active subscription from Supabase
  const [activeSub, setActiveSub] = useState<ActiveSubscription | null>(null)
  const [isPaused, setIsPaused] = useState(false)
  const [garbageHistory, setGarbageHistory] = useState<GarbageHistory[]>([])

  // Today pickup confirmation
  const [showPickupModal, setShowPickupModal] = useState(false)
  const [garbageType, setGarbageType] = useState('Organik')
  const [garbageWeight, setGarbageWeight] = useState('')
  const [isTodayPickupDay, setIsTodayPickupDay] = useState(false)

  // Rating
  const [ratingModal, setRatingModal] = useState(false)
  const [ratingValue, setRatingValue] = useState(0)

  const userId = typeof window !== 'undefined' ? localStorage.getItem('user_id') : null

  useEffect(() => {
    fetchActiveSub()
  }, [])

  const fetchActiveSub = async () => {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId || '')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (!error && data) {
        const sub: ActiveSubscription = {
          subs_id: data.subs_id,
          paket: data.paket,
          jadwal: Array.isArray(data.jadwal) ? data.jadwal : JSON.parse(data.jadwal || '[]'),
          is_paused: data.is_paused,
          subs_price: data.subs_price,
          payment_method: data.payment_method,
        }
        setActiveSub(sub)
        setIsPaused(sub.is_paused)

        const todayName = Object.keys(HARI_MAP).find(
          h => HARI_MAP[h] === new Date().getDay()
        )
        if (todayName && sub.jadwal.includes(todayName) && !sub.is_paused) {
          setIsTodayPickupDay(true)
        }

        const { data: gData } = await supabase
          .from('garbage')
          .select('*')
          .eq('subs_id', data.subs_id)
          .order('created_at', { ascending: false })

        if (gData) setGarbageHistory(gData)
      }
    } catch { }
  }

  const toggleDay = (day: string) => {
    setJadwal(prev => {
      if (prev.includes(day)) {
        setWarning('')
        return prev.filter(d => d !== day)
      }
      if (paket === 'mingguan' && prev.length >= 4) {
        setWarning('Melebihi batas 4 penjemputan untuk paket Mingguan.')
        return prev
      }
      setWarning('')
      return [...prev, day]
    })
  }

  const handleSubmit = async () => {
    if (jadwal.length === 0) return alert('Pilih minimal 1 hari penjemputan')
    if (selectedWasteTypes.length === 0) return alert('Pilih minimal 1 jenis sampah')
    if (!estimasiBerat || parseFloat(estimasiBerat) <= 0) return alert('Masukkan estimasi berat yang valid')

    setLoading(true)
    try {
      const price = paket === 'mingguan' ? 39000 : 129000

      const { data: subData, error: subError } = await supabase
        .from('subscriptions')
        .insert({
          user_id: userId,
          paket,
          jadwal: jadwal,
          is_paused: false,
          subs_price: price,
          subs_duration: paket === 'mingguan' ? 1 : 4,
          payment_method: paymentMethod,
        })
        .select()
        .single()

      if (subError) throw subError

      const weight = parseFloat(estimasiBerat)
      const points = Math.round(weight * 10)

      const { error: garbageError } = await supabase
        .from('garbage')
        .insert({
          subs_id: subData.subs_id,
          garbage_type: selectedWasteTypes.join(', '),
          garbage_weight: weight,
          accumulated_point: points
        })

      if (garbageError) throw garbageError

      await fetch('/api/points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, action: 'subscription' }),
      })

      setActiveSub({
        subs_id: subData.subs_id,
        paket: subData.paket,
        jadwal: Array.isArray(subData.jadwal) ? subData.jadwal : JSON.parse(subData.jadwal || '[]'),
        is_paused: false,
        subs_price: price,
        payment_method: paymentMethod,
      })

      const todayName = Object.keys(HARI_MAP).find(h => HARI_MAP[h] === new Date().getDay())
      if (todayName && jadwal.includes(todayName)) setIsTodayPickupDay(true)

      setSuccess(true)
      setTab('aktif')
    } catch (err) {
      console.error(err)
      alert('Gagal membuat langganan. Coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  const handleTogglePause = async () => {
    if (!activeSub) return
    const newPaused = !isPaused
    await supabase
      .from('subscriptions')
      .update({ is_paused: newPaused })
      .eq('subs_id', activeSub.subs_id)
    setIsPaused(newPaused)
  }

  const handleConfirmPickup = async () => {
    if (!garbageWeight || parseFloat(garbageWeight) <= 0) {
      alert('Masukkan berat sampah yang valid')
      return
    }
    if (!activeSub) return

    const weight = parseFloat(garbageWeight)
    const points = Math.round(weight * 10)

    try {
      await supabase.from('garbage').insert({
        subs_id: activeSub.subs_id,
        garbage_type: garbageType,
        garbage_weight: weight,
        accumulated_point: points,
      })

      await fetch('/api/points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, action: 'pickup_done' }),
      })

      setShowPickupModal(false)
      router.push('/tracking')
    } catch (err) {
      console.error(err)
      alert('Gagal konfirmasi pickup. Coba lagi.')
    }
  }

  if (success && tab === 'aktif') {
    return (
      <div className="min-h-screen bg-[#F5F1E6] pb-32">
        <div className="bg-gradient-to-br from-[#4E6A41] to-[#3C5331] px-6 pt-16 pb-8 rounded-b-[34px] shadow-[0_20px_40px_-24px_rgba(40,38,28,0.5)]">
          <h1 className="text-white text-xl font-bold" style={{ fontFamily: DISPLAY }}>Langganan Jemput Sampah</h1>
        </div>
        <div className="px-6 mt-10 text-center animate-fade-in-up">
          <div className="w-20 h-20 bg-[#E8EEDD] rounded-full flex items-center justify-center text-4xl mx-auto mb-5">
            🎉
          </div>
          <h2 className="text-2xl font-extrabold text-[#2B2A23] mb-2" style={{ fontFamily: DISPLAY }}>Pembayaran Berhasil!</h2>
          <p className="text-[#6F6C5E] text-sm mb-8 font-medium">Jadwal penjemputan telah berhasil dibuat.</p>

          {/* Receipt Card */}
          <div className="bg-[#FFFDF7] rounded-[24px] p-6 border border-[#ECE4D2] shadow-[0_16px_30px_-18px_rgba(40,38,28,0.3)] text-left mb-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#8FA67C] to-[#47613A]"></div>
            <div className="flex justify-between items-center py-3.5 border-b border-[#F0EADC]">
              <span className="text-xs text-[#A8A492] font-bold uppercase tracking-wider">Paket</span>
              <span className="text-sm font-extrabold capitalize text-[#42402F]">{paket}</span>
            </div>
            <div className="flex justify-between items-center py-3.5 border-b border-[#F0EADC]">
              <span className="text-xs text-[#A8A492] font-bold uppercase tracking-wider">Hari Jemput</span>
              <span className="text-sm font-extrabold text-[#42402F]">{jadwal.join(', ')}</span>
            </div>
            <div className="flex justify-between items-center py-3.5">
              <span className="text-xs text-[#A8A492] font-bold uppercase tracking-wider">Pembayaran</span>
              <span className="text-sm font-extrabold text-[#47613A] uppercase">{paymentMethod}</span>
            </div>
          </div>

          <button onClick={() => { setSuccess(false); setTab('aktif'); fetchActiveSub() }}
            style={{ fontFamily: DISPLAY }}
            className="w-full bg-[#47613A] text-white py-4 rounded-2xl font-bold shadow-[0_16px_28px_-12px_rgba(71,97,58,0.7)] active:scale-[0.98] transition-transform pressable">
            Lihat Langganan Saya 🚛
          </button>
        </div>
        {/* <BottomNav /> */}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F5F1E6] pb-32">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#4E6A41] to-[#3C5331] px-6 pt-16 pb-8 rounded-b-[34px] shadow-[0_20px_40px_-24px_rgba(40,38,28,0.5)] relative overflow-hidden">
        <div className="absolute right-[-10%] top-[-20%] w-44 h-44 bg-[#56724A] rounded-full opacity-55 pointer-events-none"></div>
        <h1 className="text-white text-2xl font-extrabold tracking-tight relative z-10" style={{ fontFamily: DISPLAY }}>Jemput Sampah</h1>
        <p className="text-[#AFC09C] text-xs mt-1 font-medium relative z-10">Atur jadwal penjemputan rumah tangga lu 🚛</p>
      </div>

      {/* Today pickup banner */}
      {isTodayPickupDay && !isPaused && activeSub && (
        <div className="mx-4 mt-5 bg-[#47613A] rounded-[22px] p-5 flex items-center gap-4 text-white shadow-[0_16px_30px_-18px_rgba(71,97,58,0.6)] animate-fade-in-up relative overflow-hidden">
          <div className="absolute right-[-6%] top-[-30%] w-28 h-28 bg-[#56724A] rounded-full opacity-50 pointer-events-none"></div>
          <div className="w-12 h-12 bg-white/15 rounded-2xl flex items-center justify-center text-3xl relative z-10">🚛</div>
          <div className="flex-1 relative z-10">
            <p className="font-extrabold text-sm">Hari ini jadwal penjemputan!</p>
            <p className="text-xs text-[#CBD8B9] mt-0.5">Konfirmasi untuk memanggil driver sekarang</p>
          </div>
          <button
            onClick={() => setShowPickupModal(true)}
            className="bg-[#FFFDF7] text-[#47613A] px-4 py-2.5 rounded-xl text-xs font-extrabold active:scale-95 pressable relative z-10">
            Panggil
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex mx-4 mt-6 bg-[#E7E0CF] rounded-2xl p-1 gap-1">
        {(['baru', 'aktif', 'riwayat'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all pressable
              ${tab === t ? 'bg-[#FFFDF7] text-[#47613A] shadow-sm' : 'text-[#8A8674] hover:text-[#5C5A4C]'}`}>
            {t === 'baru' ? '+ Langganan Baru' : t === 'aktif' ? '✓ Paket Aktif' : '📋 Riwayat Jemput'}
          </button>
        ))}
      </div>

      {/* ── TAB: BARU ── */}
      {tab === 'baru' && (
        <div className="px-4 mt-6 flex flex-col gap-6 pb-6 animate-fade-in-up">
          {/* Package Selector */}
          <div>
            <p className="text-sm font-bold text-[#42402F] mb-3 ml-1">Pilih Paket Langganan</p>
            <div className="flex gap-4">
              {PACKAGES.map(pkg => (
                <button key={pkg.id} onClick={() => setPaket(pkg.id as 'mingguan' | 'bulanan')}
                  className={`flex-1 relative border-2 rounded-[24px] p-4 text-left transition-all flex flex-col justify-between h-40 pressable
                    ${paket === pkg.id
                      ? 'border-[#47613A] bg-[#E8EEDD] shadow-[0_12px_24px_-16px_rgba(71,97,58,0.5)]'
                      : 'border-[#E2DAC6] bg-[#FFFDF7] hover:border-[#C9C0A9]'}`}>
                  {pkg.popular && (
                    <span className="absolute -top-2.5 right-4 text-[9px] bg-[#C06B41] text-white px-2 py-0.5 rounded-full font-extrabold uppercase tracking-wider">
                      Terlaris
                    </span>
                  )}
                  <span className="text-3xl">{pkg.icon}</span>
                  <div className="mt-2">
                    <p className="font-extrabold text-[#2B2A23] text-sm">{pkg.label}</p>
                    <p className="text-[#47613A] text-base font-extrabold mt-0.5" style={{ fontFamily: DISPLAY }}>
                      {pkg.price}
                      <span className="text-xs font-medium text-[#A8A492]">{pkg.per}</span>
                    </p>
                    <p className="text-[#A8A492] text-[10px] mt-0.5 font-semibold">{pkg.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Day Picker */}
          <div>
            <div className="flex justify-between items-center mb-3 ml-1">
              <p className="text-sm font-bold text-[#42402F]">Pilih Hari Penjemputan</p>
              {paket === 'mingguan' && (
                <span className="text-[10px] bg-[#F6EBCF] text-[#8A6219] px-2 py-0.5 rounded-md font-bold">Max 4 Hari</span>
              )}
            </div>
            <div className="grid grid-cols-4 gap-2">
              {DAYS.map(day => {
                const selected = jadwal.includes(day)
                return (
                  <button key={day} onClick={() => toggleDay(day)}
                    className={`py-3 rounded-2xl text-xs font-bold border-2 transition-all pressable
                      ${selected
                        ? 'bg-[#47613A] border-transparent text-white shadow-[0_8px_16px_-10px_rgba(71,97,58,0.7)]'
                        : 'bg-[#FFFDF7] border-[#E2DAC6] text-[#5C5A4C] hover:bg-[#F5F1E6]'}`}>
                    {day.slice(0, 3)}
                  </button>
                )
              })}
            </div>
            <div className="mt-3 p-3 bg-[#E4ECEF] rounded-2xl border border-[#CFDDE2] flex gap-2">
              <span className="text-sm">ℹ️</span>
              <p className="text-[10px] text-[#3F5A6B] font-semibold leading-relaxed">
                Penggantian hari jemput dapat dilakukan mandiri melalui aplikasi maksimal H-1 sebelum jadwal penjemputan berlangsung.
              </p>
            </div>
            {warning && <p className="text-xs text-[#B0564C] mt-2.5 font-bold animate-pulse">⚠️ {warning}</p>}
          </div>

          {/* Garbage type selector */}
          <div>
            <p className="text-sm font-bold text-[#42402F] mb-3 ml-1">Pilih Jenis Sampah (Bisa lebih dari 1)</p>
            <div className="grid grid-cols-3 gap-2">
              {GARBAGE_TYPES.map(type => {
                const isSelected = selectedWasteTypes.includes(type)
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => toggleWasteType(type)}
                    className={`py-2.5 rounded-xl text-xs font-bold border-2 transition-all pressable
                      ${isSelected
                        ? 'bg-[#47613A] border-transparent text-white shadow-[0_8px_16px_-10px_rgba(71,97,58,0.7)]'
                        : 'bg-[#FFFDF7] border-[#E2DAC6] text-[#5C5A4C] hover:bg-[#F5F1E6]'}`}>
                    {type}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Estimasi Berat */}
          <div>
            <label className="block text-sm font-bold text-[#42402F] mb-2 ml-1">Estimasi Total Berat Sampah per Jemput (kg)</label>
            <div className="relative">
              <input
                type="number"
                placeholder="Contoh: 5"
                value={estimasiBerat}
                onChange={e => setEstimasiBerat(e.target.value)}
                className="w-full bg-[#FFFDF7] border-[1.5px] border-[#E2DAC6] rounded-2xl px-4 py-3.5 text-sm font-medium text-[#2B2A23] focus:border-[#47613A] focus:ring-4 focus:ring-[#47613A]/10 focus:outline-none transition-all placeholder-[#A8A492]"
              />
              <span className="absolute right-4 inset-y-0 flex items-center text-sm font-bold text-[#A8A492]">kg</span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <p className="text-sm font-bold text-[#42402F] mb-3 ml-1">Metode Pembayaran</p>
            <div className="grid grid-cols-1 gap-2.5">
              {PAYMENT_METHODS.map(m => {
                const checked = paymentMethod === m.id
                return (
                  <label key={m.id}
                    className={`flex items-center justify-between rounded-2xl p-4 border-2 cursor-pointer transition-all pressable
                      ${checked ? 'border-[#47613A] bg-[#E8EEDD]' : 'border-[#E2DAC6] bg-[#FFFDF7] hover:border-[#C9C0A9]'}`}>
                    <div className="flex items-center gap-3">
                      <input type="radio" name="payment" value={m.id}
                        checked={checked}
                        onChange={() => setPaymentMethod(m.id)}
                        className="w-4 h-4" style={{ accentColor: '#47613A' }} />
                      <span className="text-xl leading-none">{m.icon}</span>
                      <span className="text-sm text-[#42402F] font-extrabold">{m.label}</span>
                    </div>
                    {checked && <span className="text-[#47613A] text-sm font-bold">✓ Pilihan</span>}
                  </label>
                )
              })}
            </div>
          </div>

          {/* Order Summary Box */}
          {jadwal.length > 0 && (
            <div className="bg-[#FFFDF7] rounded-[24px] p-5 border border-[#ECE4D2] shadow-[0_12px_26px_-16px_rgba(40,38,28,0.3)] relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#8FA67C] to-[#47613A]"></div>
              <p className="font-extrabold text-[#2B2A23] text-sm mb-3" style={{ fontFamily: DISPLAY }}>Ringkasan Pemesanan</p>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#A8A492] font-bold uppercase">Paket</span>
                  <span className="font-extrabold text-[#42402F] capitalize">{paket}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#A8A492] font-bold uppercase">Hari Jemput</span>
                  <span className="font-extrabold text-[#42402F]">{jadwal.join(', ')}</span>
                </div>
                <div className="flex justify-between pt-3 border-t border-[#F0EADC] mt-2">
                  <span className="text-sm font-extrabold text-[#2B2A23]">Total Harga</span>
                  <span className="text-base font-extrabold text-[#47613A]" style={{ fontFamily: DISPLAY }}>
                    {paket === 'mingguan' ? 'Rp 39.000' : 'Rp 129.000'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button onClick={handleSubmit} disabled={loading || jadwal.length === 0}
            style={{ fontFamily: DISPLAY }}
            className="w-full bg-[#47613A] disabled:bg-[#C5C0AE] disabled:shadow-none text-white py-4 rounded-2xl font-bold text-base shadow-[0_16px_28px_-12px_rgba(71,97,58,0.7)] active:scale-[0.98] transition-all flex items-center justify-center gap-2 pressable">
            {loading ? (
              <>
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Memproses Pembayaran...
              </>
            ) : (
              'Konfirmasi & Bayar Sekarang 💳'
            )}
          </button>
        </div>
      )}

      {/* ── TAB: AKTIF ── */}
      {tab === 'aktif' && (
        <div className="px-4 mt-6 flex flex-col gap-6 pb-6 animate-fade-in-up">
          {activeSub ? (
            <>
              <div className="bg-[#FFFDF7] rounded-[24px] p-5 border border-[#ECE4D2] shadow-[0_16px_30px_-18px_rgba(40,38,28,0.3)] relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#8FA67C] to-[#47613A]"></div>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <span className="text-[10px] text-[#A8A492] font-extrabold uppercase tracking-wider">Paket Langganan</span>
                    <p className="font-extrabold text-[#2B2A23] text-lg capitalize mt-0.5" style={{ fontFamily: DISPLAY }}>Paket {activeSub.paket}</p>
                    <p className="text-xs text-[#A8A492] mt-1 font-semibold">🗓️ Hari: {activeSub.jadwal.join(', ')}</p>
                    <p className="text-xs text-[#47613A] mt-1 font-bold">💳 {activeSub.payment_method.toUpperCase()} · Rp {activeSub.subs_price.toLocaleString('id')}/bulan</p>
                  </div>
                  <span className={`text-[10px] px-3 py-1.5 rounded-full font-extrabold tracking-wider uppercase
                    ${isPaused ? 'bg-[#F0E0D3] text-[#A8552F]' : 'bg-[#E8EEDD] text-[#3F5733]'}`}>
                    ● {isPaused ? 'Dijeda' : 'Aktif'}
                  </span>
                </div>

                {isPaused && (
                  <div className="bg-[#F0E0D3] rounded-2xl p-4 mb-4 border border-dashed border-[#E0B898]">
                    <p className="text-xs text-[#8A5230] font-semibold leading-relaxed">
                      ⚠️ Layanan langganan sedang Anda jeda sementara. Jadwal penjemputan ditiadakan hingga diaktifkan kembali.
                    </p>
                  </div>
                )}

                <div className="flex gap-3 mt-4">
                  <button onClick={handleTogglePause}
                    className={`flex-1 py-3 rounded-2xl text-xs font-extrabold transition-all pressable
                      ${isPaused ? 'bg-[#47613A] text-white shadow-[0_8px_16px_-10px_rgba(71,97,58,0.7)]' : 'bg-[#F0E0D3] text-[#A8552F]'}`}>
                    {isPaused ? '▶ Aktifkan Kembali' : '⏸ Jeda Sementara'}
                  </button>
                  <button className="flex-1 bg-[#F5F1E6] text-[#5C5A4C] hover:bg-[#EFE9DA] py-3 rounded-2xl text-xs font-extrabold transition-all pressable border border-[#E2DAC6]">
                    ✏️ Ubah Jadwal
                  </button>
                </div>
              </div>

              {/* Upcoming pickups */}
              <div>
                <p className="text-xs text-[#A8A492] font-extrabold uppercase tracking-widest mb-3 ml-1">Jadwal Penjemputan Terdekat</p>
                {activeSub.jadwal.map(hari => {
                  const isToday = Object.keys(HARI_MAP).find(h => HARI_MAP[h] === new Date().getDay()) === hari
                  return (
                    <div key={hari} className={`rounded-[22px] p-5 border mb-3 flex items-center justify-between transition-all
                      ${isToday ? 'bg-[#E8EEDD] border-[#A9BE95] shadow-[0_10px_22px_-16px_rgba(71,97,58,0.5)]' : 'bg-[#FFFDF7] border-[#ECE4D2] hover:border-[#D8D0BC]'}`}>
                      <div className="flex items-center gap-3.5">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl
                          ${isToday ? 'bg-[#D6E0C5]' : 'bg-[#F5F1E6]'}`}>🚛</div>
                        <div>
                          <p className="text-sm font-extrabold text-[#2B2A23]">
                            Hari {hari}
                          </p>
                          <p className="text-[10px] text-[#A8A492] font-semibold">Penjemputan rutin berkala</p>
                        </div>
                      </div>
                      {isToday && !isPaused ? (
                        <button onClick={() => setShowPickupModal(true)}
                          className="bg-[#47613A] text-white px-4 py-2.5 rounded-xl text-xs font-extrabold shadow-[0_8px_16px_-10px_rgba(71,97,58,0.7)] active:scale-95 pressable">
                          Panggil Driver
                        </button>
                      ) : (
                        <span className="text-[10px] bg-[#E4ECEF] text-[#3F5A6B] px-3 py-1.5 rounded-full font-bold uppercase tracking-wider border border-[#CFDDE2]">Terjadwal</span>
                      )}
                    </div>
                  )
                })}
              </div>
            </>
          ) : (
            <div className="text-center py-16 animate-fade-in-up">
              <div className="w-20 h-20 bg-[#EDE7D8] rounded-full flex items-center justify-center text-4xl mx-auto mb-4">📭</div>
              <p className="text-[#42402F] font-extrabold" style={{ fontFamily: DISPLAY }}>Belum Ada Paket Aktif</p>
              <p className="text-[#A8A492] text-xs mt-1 mb-6">Mulai langganan untuk penjemputan sampah rutin.</p>
              <button onClick={() => setTab('baru')}
                style={{ fontFamily: DISPLAY }}
                className="bg-[#47613A] text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-[0_14px_24px_-12px_rgba(71,97,58,0.7)] pressable">
                + Berlangganan Sekarang
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── TAB: RIWAYAT ── */}
      {tab === 'riwayat' && (
        <div className="px-4 mt-6 pb-6 animate-fade-in-up">
          {garbageHistory.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-[#EDE7D8] rounded-full flex items-center justify-center text-4xl mx-auto mb-4">📋</div>
              <p className="text-[#42402F] font-extrabold" style={{ fontFamily: DISPLAY }}>Belum Ada Riwayat</p>
              <p className="text-[#A8A492] text-xs mt-1">Selesaikan pembuangan sampah pertamamu untuk melihat riwayat.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3.5">
              {garbageHistory.map(item => (
                <div key={item.garbage_id} className="bg-[#FFFDF7] rounded-[24px] p-5 border border-[#ECE4D2] shadow-[0_10px_24px_-16px_rgba(40,38,28,0.3)]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 bg-[#E8EEDD] rounded-2xl flex items-center justify-center text-xl">✅</div>
                      <div>
                        <p className="text-sm font-extrabold text-[#2B2A23] line-clamp-1">{item.garbage_type}</p>
                        <p className="text-[10px] text-[#A8A492] font-semibold mt-0.5">
                          {new Date(item.created_at).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-extrabold text-[#2B2A23]" style={{ fontFamily: DISPLAY }}>{item.garbage_weight} kg</p>
                      <p className="text-xs text-[#47613A] font-bold mt-0.5">+{item.accumulated_point} poin</p>
                    </div>
                  </div>
                  <button onClick={() => setRatingModal(true)}
                    className="mt-4 w-full bg-[#F5F1E6] hover:bg-[#EFE9DA] border border-[#E2DAC6] text-[#5C5A4C] py-2.5 rounded-2xl text-xs font-bold transition-all pressable">
                    ⭐ Beri Rating Petugas Driver
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── PICKUP CONFIRMATION MODAL ── */}
      {showPickupModal && (
        <div className="fixed inset-0 bg-black/60 flex items-end justify-center z-50 animate-fade-in" onClick={() => setShowPickupModal(false)}>
          <div className="bg-[#FFFDF7] w-full max-w-md rounded-t-[28px] p-6 shadow-2xl animate-slide-in-up" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1 bg-[#E2DAC6] rounded-full mx-auto mb-4"></div>
            <h3 className="font-extrabold text-[#2B2A23] text-lg mb-1" style={{ fontFamily: DISPLAY }}>Konfirmasi Penjemputan</h3>
            <p className="text-[#A8A492] text-xs mb-5 font-semibold">Masukkan detail sampah yang akan diserahkan ke driver hari ini</p>

            {/* Garbage type selector */}
            <p className="text-xs font-bold text-[#A8A492] uppercase tracking-wider mb-2 ml-1">Jenis Sampah Utama</p>
            <div className="grid grid-cols-4 gap-2 mb-4">
              {GARBAGE_TYPES.slice(0, 8).map(type => (
                <button key={type} onClick={() => setGarbageType(type)}
                  className={`py-2 rounded-xl text-xs font-bold border-2 transition-all pressable
                    ${garbageType === type
                      ? 'bg-[#47613A] border-transparent text-white shadow-[0_8px_16px_-10px_rgba(71,97,58,0.7)]'
                      : 'bg-[#FFFDF7] border-[#E2DAC6] text-[#5C5A4C]'}`}>
                  {type}
                </button>
              ))}
            </div>

            {/* Weight */}
            <p className="text-xs font-bold text-[#A8A492] uppercase tracking-wider mb-2 ml-1">Estimasi Berat Real (kg)</p>
            <div className="relative mb-3">
              <input
                type="number"
                placeholder="Contoh: 5"
                value={garbageWeight}
                onChange={e => setGarbageWeight(e.target.value)}
                className="w-full bg-[#FFFDF7] border-[1.5px] border-[#E2DAC6] rounded-2xl px-4 py-3 text-sm font-medium text-[#2B2A23] focus:border-[#47613A] focus:outline-none placeholder-[#A8A492]"
              />
              <span className="absolute right-4 inset-y-0 flex items-center text-sm font-bold text-[#A8A492]">kg</span>
            </div>

            {garbageWeight && (
              <p className="text-xs text-[#47613A] font-bold mb-5 ml-1">
                ✨ Estimasi perolehan poin: +{Math.round(parseFloat(garbageWeight || '0') * 10)} Poin
              </p>
            )}

            <button onClick={handleConfirmPickup}
              style={{ fontFamily: DISPLAY }}
              className="w-full bg-[#47613A] text-white py-4 rounded-2xl font-bold text-sm shadow-[0_16px_28px_-12px_rgba(71,97,58,0.7)] active:scale-[0.98] transition-all flex items-center justify-center gap-2 pressable mb-2">
              🚛 Panggil Driver Sekarang
            </button>
            <button onClick={() => setShowPickupModal(false)}
              className="w-full text-[#A8A492] text-xs font-bold py-2.5 active:text-[#6F6C5E] transition-colors">
              Batalkan
            </button>
          </div>
        </div>
      )}

      {/* Rating Modal */}
      {ratingModal && (
        <div className="fixed inset-0 bg-black/60 flex items-end justify-center z-50 animate-fade-in" onClick={() => setRatingModal(false)}>
          <div className="bg-[#FFFDF7] w-full max-w-md rounded-t-[28px] p-6 shadow-2xl animate-slide-in-up" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1 bg-[#E2DAC6] rounded-full mx-auto mb-4"></div>
            <h3 className="font-extrabold text-[#2B2A23] text-lg mb-1 text-center" style={{ fontFamily: DISPLAY }}>Beri Rating Petugas</h3>
            <p className="text-[#A8A492] text-xs text-center mb-6 font-semibold">Bagaimana pelayanan penjemputan sampah hari ini?</p>

            <div className="flex justify-center gap-4 mb-6">
              {[1, 2, 3, 4, 5].map(star => (
                <button key={star} onClick={() => setRatingValue(star)}
                  className={`text-4xl pressable transition-all hover:scale-110 active:scale-95 ${star <= ratingValue ? 'scale-105 filter drop-shadow' : 'opacity-25'}`}>
                  ⭐
                </button>
              ))}
            </div>

            <button onClick={() => setRatingModal(false)} disabled={ratingValue === 0}
              style={{ fontFamily: DISPLAY }}
              className="w-full bg-[#47613A] disabled:bg-[#C5C0AE] disabled:shadow-none text-white py-4 rounded-2xl font-bold text-sm shadow-[0_16px_28px_-12px_rgba(71,97,58,0.7)] active:scale-[0.98] transition-all pressable">
              Kirim Feedback Rating 🚀
            </button>
          </div>
        </div>
      )}

      {/* Bottom Navigation
      <BottomNav /> */}
    </div>
  )
}
