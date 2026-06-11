// app/leaderboard/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/app/supabaseClient'
// import { BottomNav } from '@/components/layout/BottomNav'

const DISPLAY = "'Bricolage Grotesque', sans-serif"

interface LeaderboardUser {
  user_id: string
  user_name: string
  fullname: string
  user_point: number
  ranking?: number
}

const BADGE_LEVELS = [
  { min: 0,   label: 'Recycle Starter', icon: '🌱', color: '#16a34a', next: 50   },
  { min: 50,  label: 'Green Saver',     icon: '🌿', color: '#0891b2', next: 100  },
  { min: 100, label: 'Recycle Hero',    icon: '♻️', color: '#7c3aed', next: 200  },
  { min: 200, label: 'Eco Warrior',     icon: '🌍', color: '#dc2626', next: 500  },
  { min: 500, label: 'Earth Champion',  icon: '🏆', color: '#d97706', next: null },
]

function getBadge(points: number) {
  return [...BADGE_LEVELS].reverse().find(b => points >= b.min) || BADGE_LEVELS[0]
}

const MEDAL = ['🥇', '🥈', '🥉']

const DEFAULT_USER_ID = '32d67f98-4d25-4871-b2ce-19f1c11ba013'

export default function LeaderboardPage() {
  const router = useRouter()
  const [users, setUsers] = useState<LeaderboardUser[]>([])
  const [currentUser, setCurrentUser] = useState<LeaderboardUser | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'board' | 'badges'>('board')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('user_id')
      setCurrentUserId(stored || DEFAULT_USER_ID)
    } else {
      setCurrentUserId(DEFAULT_USER_ID)
    }
  }, [])

  useEffect(() => {
    if (currentUserId) {
      fetchLeaderboard()
    }
  }, [currentUserId])

  const fetchLeaderboard = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('users')
        .select('user_id, user_name, fullname, user_point')
        .order('user_point', { ascending: false })

      if (!error && data && data.length > 0) {
        const ranked = data.map((u, i) => ({ ...u, ranking: i + 1 }))
        setUsers(ranked)
        const matchId = currentUserId || DEFAULT_USER_ID
        setCurrentUser(ranked.find(u => u.user_id === matchId) || ranked.find(u => u.user_id === DEFAULT_USER_ID) || null)
      }
    } catch { }
    setLoading(false)
  }

  const myPoints = currentUser?.user_point || 0
  const myBadge = getBadge(myPoints)
  const myRank = currentUser?.ranking || '-'
  const progressToNext = myBadge.next
    ? Math.round((myPoints - myBadge.min) / (myBadge.next - myBadge.min) * 100)
    : 100

  const displayName = (u: LeaderboardUser) => u.fullname || u.user_name || 'User'

  return (
    <div className="min-h-screen bg-[#F5F1E6] pb-32">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#CE9A36] via-[#7E8A3F] to-[#3C5331] px-6 pt-16 pb-8 rounded-b-[34px] shadow-[0_20px_40px_-24px_rgba(40,38,28,0.5)] relative overflow-hidden">
        <div className="absolute right-[-10%] top-[-20%] w-56 h-56 bg-[#E9C46A]/30 rounded-full blur-2xl pointer-events-none"></div>

        <div className="flex items-center gap-3.5 mb-4 relative z-10">
          <button onClick={() => router.back()} className="w-10 h-10 bg-white/15 hover:bg-white/25 rounded-2xl flex items-center justify-center text-white text-lg transition-all pressable">
            ←
          </button>
          <div>
            <h1 className="text-white text-xl font-extrabold tracking-tight" style={{ fontFamily: DISPLAY }}>Leaderboard Poin</h1>
            <p className="text-white/85 text-xs mt-0.5 font-medium">Reset berkala setiap tanggal 1 tiap bulan 🏆</p>
          </div>
        </div>

        {/* Current User Card inside Header */}
        <div className="mt-5 bg-white/15 backdrop-blur-md rounded-[24px] p-5 border border-white/20 relative z-10">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-3xl">
                {myBadge.icon}
              </div>
              <div>
                <p className="text-white font-extrabold text-sm">{currentUser ? displayName(currentUser) : 'Anda'}</p>
                <p className="text-white/85 text-xs font-semibold">{myBadge.label} · Peringkat #{myRank}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[#FFF3D6] text-3xl font-extrabold leading-none" style={{ fontFamily: DISPLAY }}>{myPoints}</p>
              <span className="text-[10px] text-white/80 uppercase tracking-widest font-extrabold mt-1 block">Poin</span>
            </div>
          </div>

          {myBadge.next && (
            <div className="animate-fade-in-up">
              <div className="flex justify-between text-[10px] text-white/85 mb-1.5 font-bold uppercase tracking-wider">
                <span>Ke {getBadge(myBadge.next).label} {getBadge(myBadge.next).icon}</span>
                <span>{myPoints} / {myBadge.next} Poin</span>
              </div>
              <div className="h-2.5 bg-white/25 rounded-full overflow-hidden">
                <div className="h-full bg-[#FFE2A0] rounded-full transition-all duration-1000"
                  style={{ width: `${progressToNext}%` }} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex mx-4 mt-6 bg-[#E7E0CF] rounded-2xl p-1 gap-1">
        {([['board', '🏆 Peringkat Aktif'], ['badges', '🎖️ Pencapaian Badge']] as const).map(([key, label]) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all pressable
              ${activeTab === key ? 'bg-[#FFFDF7] text-[#47613A] shadow-sm' : 'text-[#8A8674] hover:text-[#5C5A4C]'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* LEADERBOARD TAB */}
      {activeTab === 'board' && (
        <div className="px-4 mt-6 pb-6 animate-fade-in-up">
          {!loading && users.length >= 3 && (
            <div className="mb-6">
              <p className="text-[10px] text-[#A8A492] font-extrabold uppercase tracking-widest mb-4 ml-1">Top 3 Bulan Ini</p>
              <div className="flex items-end justify-center gap-3">
                {[1, 0, 2].map((pos, i) => {
                  const user = users[pos]
                  const heights = ['h-24', 'h-32', 'h-20']
                  const bgColors = ['bg-[#EDE7D8]', 'bg-[#F6EBCF]', 'bg-[#E8EEDD]']
                  const textColors = ['text-[#6F6C5E]', 'text-[#8A6219]', 'text-[#3F5733]']
                  const borderColors = ['border-[#D8D0BC]', 'border-[#E0C57A]', 'border-[#A9BE95]']
                  return (
                    <div key={pos} className="flex-1 flex flex-col items-center animate-fade-in-up">
                      <p className="text-3xl mb-1 flex justify-center">{MEDAL[pos]}</p>
                      <div className={`w-14 h-14 rounded-[18px] flex items-center justify-center text-3xl mb-2 bg-[#FFFDF7] border-2
                        ${pos === 0 ? 'border-[#E0C57A] ring-4 ring-[#E9C46A]/20' : 'border-[#ECE4D2]'}`}>
                        {getBadge(user?.user_point || 0).icon}
                      </div>
                      <p className="text-xs font-bold text-[#2B2A23] text-center truncate w-full px-1">
                        {user ? displayName(user) : '-'}
                      </p>
                      <p className="text-[10px] text-[#A8A492] font-extrabold mt-0.5">{user?.user_point || 0} Poin</p>
                      <div className={`w-full ${heights[i]} ${bgColors[i]} border-t-4 ${borderColors[i]} rounded-t-2xl mt-3 flex items-center justify-center`}>
                        <span className={`text-sm font-extrabold ${textColors[i]}`}>#{pos + 1}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="bg-[#C06B41] rounded-[22px] p-4 text-center text-white shadow-[0_14px_26px_-16px_rgba(192,107,65,0.7)] mt-3 flex items-center gap-3">
                <span className="text-2xl">🎁</span>
                <p className="text-xs font-semibold text-left">Top 3 kontributor daur ulang berhak mendapatkan voucher belanja eksklusif di akhir bulan!</p>
              </div>
            </div>
          )}

          <p className="text-[10px] text-[#A8A492] font-extrabold uppercase tracking-widest mb-3 ml-1">Peringkat Global</p>
          {loading ? (
            <div className="flex flex-col gap-3.5">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="bg-[#FFFDF7] rounded-[24px] p-5 animate-pulse h-20 border border-[#ECE4D2]" />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {users.map((user, index) => {
                const badge = getBadge(user.user_point)
                const isMe = user.user_id === (currentUserId || DEFAULT_USER_ID)
                return (
                  <div key={user.user_id}
                    className={`rounded-[22px] p-4 flex items-center justify-between border transition-all hover:scale-[1.01]
                      ${isMe ? 'bg-[#E8EEDD] border-[#A9BE95] shadow-[0_10px_22px_-16px_rgba(71,97,58,0.5)]' : 'bg-[#FFFDF7] border-[#ECE4D2]'}`}>
                    <div className="flex items-center gap-3.5">
                      <span className="text-sm w-7 text-center font-extrabold text-[#A8A492]">
                        {index < 3 ? MEDAL[index] : `#${index + 1}`}
                      </span>
                      <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-2xl bg-[#F5F1E6]">
                        {badge.icon}
                      </div>
                      <div>
                        <p className="text-sm font-extrabold text-[#2B2A23] flex items-center gap-1">
                          {displayName(user)}
                          {isMe && <span className="text-[9px] bg-[#47613A] text-white px-2 py-0.5 rounded-full uppercase tracking-wider font-extrabold">Anda</span>}
                        </p>
                        <p className="text-[10px] text-[#A8A492] font-semibold">{badge.label}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-extrabold text-[#47613A]" style={{ fontFamily: DISPLAY }}>{user.user_point}</p>
                      <span className="text-[9px] text-[#A8A492] font-extrabold block">Poin</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* BADGES TAB */}
      {activeTab === 'badges' && (
        <div className="px-4 mt-6 pb-6 animate-fade-in-up">
          <p className="text-[10px] text-[#A8A492] font-extrabold uppercase tracking-widest mb-3 ml-1">Lencana Level Pencapaian</p>
          <div className="flex flex-col gap-3.5">
            {BADGE_LEVELS.map((b, i) => {
              const achieved = myPoints >= b.min
              const isCurrent = getBadge(myPoints).min === b.min
              return (
                <div key={i} className={`rounded-[22px] p-5 border-2 transition-all relative overflow-hidden
                  ${isCurrent ? 'border-[#47613A] bg-[#E8EEDD]'
                    : achieved ? 'border-[#A9BE95] bg-[#FFFDF7]'
                    : 'border-[#ECE4D2] bg-[#FBF8F0]'}`}>

                  <div className="flex items-center gap-4">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-4xl flex-shrink-0
                      ${achieved ? 'bg-[#FFFDF7]' : 'bg-[#EDE7D8] opacity-40'}`}>
                      {b.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className={`font-extrabold text-sm ${achieved ? 'text-[#2B2A23]' : 'text-[#A8A492]'}`}>
                          {b.label}
                        </p>
                        {isCurrent && (
                          <span className="text-[8px] bg-[#CE9A36] text-white px-2 py-0.5 rounded-full font-black uppercase tracking-wider">
                            Level Anda
                          </span>
                        )}
                        {achieved && !isCurrent && (
                          <span className="text-[8px] bg-[#E8EEDD] text-[#3F5733] px-2 py-0.5 rounded-full font-black uppercase tracking-wider">
                            ✓ Terbuka
                          </span>
                        )}
                      </div>
                      <p className={`text-[10px] font-semibold ${achieved ? 'text-[#A8A492]' : 'text-[#BEBAA8]'}`}>
                        {b.min}+ poin daur ulang terkumpul
                      </p>

                      {isCurrent && b.next && (
                        <div className="mt-3">
                          <div className="h-2 bg-[#E7E0CF] rounded-full overflow-hidden">
                            <div className="h-full bg-[#47613A] rounded-full"
                              style={{ width: `${progressToNext}%` }} />
                          </div>
                          <p className="text-[9px] text-[#A8A492] font-bold mt-1.5 uppercase tracking-wide">
                            {myPoints} / {b.next} Poin untuk naik level lencana
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Points list guide */}
          <div className="mt-6 bg-[#47613A] rounded-[22px] p-5 text-white shadow-[0_16px_30px_-18px_rgba(71,97,58,0.6)] relative overflow-hidden">
            <div className="absolute right-[-8%] top-[-30%] w-32 h-32 bg-[#56724A] rounded-full opacity-50 pointer-events-none"></div>
            <p className="text-xs font-black uppercase tracking-widest mb-3.5 text-[#CBD8B9] relative z-10">Panduan Perolehan Poin</p>
            <div className="flex flex-col gap-2.5 relative z-10">
              {[
                { action: 'Langganan jemput sampah baru', points: '+20 Poin' },
                { action: 'Satu kali penjemputan selesai', points: '+10 Poin' },
                { action: 'Jual sampah daur ulang di marketplace', points: '+5 Poin' },
                { action: 'Beli bahan daur ulang di marketplace', points: '+5 Poin' },
                { action: 'Beri bintang ulasan driver', points: '+2 Poin' },
              ].map((item, i) => (
                <div key={i} className="flex justify-between items-center text-xs font-medium">
                  <p className="text-[#E4EAD7]">● {item.action}</p>
                  <span className="font-extrabold text-[#E9C46A] bg-white/15 px-2.5 py-1 rounded-full text-[10px]">
                    {item.points}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation
      <BottomNav /> */}
    </div>
  )
}
