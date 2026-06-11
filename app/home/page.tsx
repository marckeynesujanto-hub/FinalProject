// app/home/page.tsx
'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/app/supabaseClient'
import Link from 'next/link'
import InstallPrompt from '@/app/install/installprompt'
// import { BottomNav } from '@/components/layout/BottomNav'

const DISPLAY = "'Bricolage Grotesque', sans-serif"

const features = [
  {
    href: '/subscription',
    icon: '🚛',
    title: 'Jemput Sampah',
    desc: 'Langganan harian atau mingguan, atur jadwal sendiri',
    card: 'bg-[#E8EEDD] border-[#D6E0C5]',
    iconBg: 'bg-[#47613A]',
    badge: null,
  },
  {
    href: '/leaderboard',
    icon: '🏆',
    title: 'Poin & Peringkat',
    desc: 'Kumpulkan poin dari daur ulang, menangkan hadiah',
    card: 'bg-[#F6EBCF] border-[#EBD9AC]',
    iconBg: 'bg-[#CE9A36]',
    badge: 'Hadiah Bulanan',
    badgeBg: 'bg-[#C06B41]',
  },
  {
    href: '/map',
    icon: '🗺️',
    title: 'Peta & TPS',
    desc: 'Temukan tempat sampah terdekat di sekitarmu',
    card: 'bg-[#E4ECEF] border-[#CFDDE2]',
    iconBg: 'bg-[#6E8CA0]',
    badge: null,
  },
  {
    href: '/marketplace',
    icon: '♻️',
    title: 'Jual Beli Sampah',
    desc: 'Jual sampah daur ulangmu atau beli dari orang lain',
    card: 'bg-[#F0E0D3] border-[#E6CDB9]',
    iconBg: 'bg-[#C06B41]',
    badge: 'Baru',
    badgeBg: 'bg-[#47613A]',
  },
]

export default function Home() {
  const [userData, setUserData] = useState<any>(null);
  const [successfulOrders, setSuccessfulOrders] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      const userId = localStorage.getItem('user_id');
      if (!userId) {
        setLoading(false);
        return;
      }

      // Ambil data user & poin
      const { data: user, error } = await supabase
        .from('users')
        .select('user_name, user_point')
        .eq('user_id', userId)
        .single();

      // Ambil ranking dari tabel leaderboard
      const { data: rank } = await supabase
        .from('leaderboards')
        .select('leaderboard_ranking')
        .eq('user_id', userId)
        .single();

      // Ambil jumlah data pengiriman selesai
     const { data: subscription } = await supabase
      .from('subscriptions')
      .select('successful_pickups')
      .eq('user_id', userId)
      .single();

    if (subscription) {
      setSuccessfulOrders(
        subscription.successful_pickups || 0
      );
    }
      if (user) {
        setUserData({
          ...user,
          ranking: rank?.leaderboard_ranking || '-'
        });
      }


      setLoading(false);
    };

    fetchUserData();
  }, []);

  const handleLogout = () => {
    if (confirm('Apakah Anda yakin ingin keluar?')) {
      localStorage.clear();
      window.location.href = '/login';
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#F5F1E6] flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin mb-4">
          <div className="w-12 h-12 border-4 border-[#D8E0C8] border-t-[#47613A] rounded-full"></div>
        </div>
        <p className="text-[#6F6C5E] font-bold text-sm">Memuat Dashboard...</p>
      </div>
    </div>
  );

  const stats = [
    { value: userData?.user_point || 0, label: 'Poin Anda', icon: '⭐', color: 'text-[#CE9A36]' },
    { value: successfulOrders, label: 'Jemput Berhasil', icon: '✓', color: 'text-[#47613A]' },
    { value: userData?.ranking || '-', label: 'Peringkat', icon: '🏅', color: 'text-[#C06B41]' },
  ];

  return (
    <div className="min-h-screen bg-[#F5F1E6] pb-32">
      <InstallPrompt />

      {/* Header */}
      <div className="bg-gradient-to-br from-[#4E6A41] to-[#3C5331] px-6 pt-16 pb-12 rounded-b-[34px] shadow-[0_20px_40px_-24px_rgba(40,38,28,0.5)] relative overflow-hidden">
        <div className="absolute right-[-12%] top-[-20%] w-52 h-52 bg-[#56724A] rounded-full opacity-60 pointer-events-none"></div>
        <div className="absolute right-10 bottom-2 text-[64px] opacity-[0.10] pointer-events-none select-none">♻️</div>

        <div className="flex items-center justify-between mb-8 relative z-10">
          <div>
            <p className="text-[#CBD8B9] text-sm font-semibold tracking-wide">
              Halo, {userData?.user_name || 'User'} 👋
            </p>
            <h1 className="text-[#FFFDF7] text-[28px] font-extrabold tracking-tight mt-1" style={{ fontFamily: DISPLAY }}>ThrashIn</h1>
            <p className="text-[#AFC09C] text-xs mt-1 font-medium">Kelola sampah, jaga kelestarian bumi</p>
          </div>

          <button
            onClick={handleLogout}
            title="Keluar Akun"
            className="w-12 h-12 bg-[#FFFDF7]/12 hover:bg-[#FFFDF7]/22 rounded-2xl flex items-center justify-center text-xl border border-[#FFFDF7]/20 transition-all active:scale-95 pressable"
          >
            🚪
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 relative z-10">
          {stats.map((s) => (
            <div key={s.label} className="bg-[#FFFDF7] rounded-[18px] p-3.5 text-center shadow-[0_10px_22px_-14px_rgba(40,38,28,0.5)]">
              <div className="text-lg leading-none mb-1.5">{s.icon}</div>
              <p className={`text-[22px] font-extrabold leading-none ${s.color}`} style={{ fontFamily: DISPLAY }}>{s.value}</p>
              <span className="text-[9.5px] uppercase tracking-wider text-[#8A8674] font-bold block mt-1.5">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Next Pickup Card */}
      <div className="mx-4 -mt-6 bg-[#FFFDF7] rounded-[24px] p-5 border border-[#ECE4D2] shadow-[0_16px_30px_-18px_rgba(40,38,28,0.3)] relative z-20 animate-fade-in-up">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="w-16 h-16 bg-[#E8EEDD] rounded-2xl flex items-center justify-center text-3xl flex-shrink-0">
            📅
          </div>
          <div className="flex-1">
            <p className="text-[10px] text-[#A8A492] font-extrabold uppercase tracking-widest">Penjemputan Berikutnya</p>
            <p className="font-extrabold text-[#2B2A23] text-lg mt-0.5" style={{ fontFamily: DISPLAY }}>Sabtu, 13 Juni 2026</p>
            <p className="text-xs text-[#47613A] font-semibold mt-1 flex items-center gap-1.5">
              <span className="text-sm">💡</span> Pisahkan organik &amp; anorganik ya!
            </p>
          </div>
          <span className="text-xs bg-[#E8EEDD] text-[#3F5733] px-4 py-2 rounded-full font-bold border border-[#D6E0C5] text-center self-start sm:self-center">
            ● Aktif
          </span>
        </div>
      </div>

      {/* Feature Cards */}
      <div className="px-4 mt-8">
        <p className="text-[11px] text-[#A8A492] font-extrabold uppercase tracking-widest mb-4 ml-1">Layanan Kami</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {features.map((f) => (
            <Link key={f.href} href={f.href} className="block group">
              <div className={`border rounded-[22px] p-5 flex flex-col justify-between h-44 transition-all duration-300 transform group-hover:scale-[1.02] group-hover:-translate-y-0.5 cursor-pointer ${f.card}`}>
                <div className="flex items-start justify-between">
                  <div className={`w-14 h-14 ${f.iconBg} rounded-2xl flex items-center justify-center text-3xl flex-shrink-0 shadow-[0_8px_16px_-8px_rgba(40,38,28,0.4)] group-hover:scale-105 transition-transform`}>
                    {f.icon}
                  </div>
                  {f.badge && (
                    <span className={`text-[9.5px] ${f.badgeBg} text-white px-2.5 py-1 rounded-full font-extrabold tracking-wide uppercase`}>
                      {f.badge}
                    </span>
                  )}
                </div>
                <div>
                  <p className="font-extrabold text-[#2B2A23] text-base flex items-center gap-1 transition-colors" style={{ fontFamily: DISPLAY }}>
                    {f.title}
                    <span className="text-lg opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all">→</span>
                  </p>
                  <p className="text-xs text-[#6F6C5E] mt-1 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Motivational Banner */}
      <div className="mx-4 mt-6 bg-[#47613A] rounded-[22px] p-5 shadow-[0_16px_30px_-18px_rgba(71,97,58,0.6)] text-white flex items-center gap-4 relative overflow-hidden">
        <div className="absolute right-[-8%] top-[-30%] w-32 h-32 bg-[#56724A] rounded-full opacity-50 pointer-events-none"></div>
        <div className="text-3xl relative z-10">🌟</div>
        <div className="relative z-10">
          <p className="text-xs font-extrabold text-[#CBD8B9] uppercase tracking-wider mb-0.5">Pencapaian Lingkungan</p>
          <p className="text-sm font-semibold leading-relaxed">
            Kamu telah menyelesaikan <span className="font-black text-[#E9C46A] text-base">{successfulOrders}</span> penjemputan! Terus semangat menjaga kebersihan bumi.
          </p>
        </div>
      </div>

      {/* Tips Banner */}
      <div className="mx-4 mt-4 bg-[#F0E0D3] rounded-[22px] p-5 border border-[#E6CDB9] text-[#7A4A2C] flex items-start gap-4">
        <div className="text-2xl mt-0.5">💡</div>
        <div>
          <p className="text-xs font-extrabold text-[#A8552F] uppercase tracking-wider mb-0.5">Tips Ekologi</p>
          <p className="text-sm font-medium leading-relaxed text-[#6B4631]">
            Setiap 1 kg sampah daur ulang setara dengan 10 poin. Kumpulkan 100 poin untuk naik level badge berikutnya!
          </p>
        </div>
      </div>

      {/* Render Bottom Navigation
      <BottomNav /> */}
    </div>
  )
}
