'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/app/supabaseClient'

interface LeaderboardUser {
  user_id?: string
  name: string
  points: number
  badge: string
  rank?: number
}

const MY_NAME = 'Saya'
const MY_POINTS = 80

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

// Dummy data fallback
const DUMMY_USERS: LeaderboardUser[] = [
  { name: 'Andi Pratama',   points: 520, badge: 'Earth Champion'  },
  { name: 'Budi Santoso',   points: 410, badge: 'Eco Warrior'     },
  { name: 'Citra Dewi',     points: 380, badge: 'Eco Warrior'     },
  { name: 'Dian Rahayu',    points: 290, badge: 'Eco Warrior'     },
  { name: 'Eko Wahyudi',    points: 210, badge: 'Eco Warrior'     },
  { name: 'Fitri Sari',     points: 180, badge: 'Recycle Hero'    },
  { name: 'Gilang Putra',   points: 150, badge: 'Recycle Hero'    },
  { name: 'Hana Putri',     points: 120, badge: 'Recycle Hero'    },
  { name: 'Irfan Maulana',  points: 95,  badge: 'Green Saver'     },
  { name: MY_NAME,          points: MY_POINTS, badge: 'Green Saver' },
  { name: 'Joko Widodo',    points: 60,  badge: 'Green Saver'     },
  { name: 'Kartini Dewi',   points: 30,  badge: 'Recycle Starter' },
]

export default function LeaderboardPage() {
  const [users, setUsers] = useState<LeaderboardUser[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'board' | 'badges'>('board')

  useEffect(() => {
    fetchLeaderboard()
  }, [])

  const fetchLeaderboard = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('leaderboards')
        .select('user_id, leaderboard_ranking')
        .order('leaderboard_ranking', { ascending: true })
        .limit(20)

      if (!error && data && data.length > 0) {
        const mapped = data.map((row: any, i: number) => ({
          user_id: row.user_id,
          name: `User ${i + 1}`,
          points: Math.max(0, 500 - i * 30),
          badge: getBadge(Math.max(0, 500 - i * 30)).label,
          rank: row.leaderboard_ranking,
        }))
        setUsers(mapped)
      } else {
        setUsers(DUMMY_USERS)
      }
    } catch {
      setUsers(DUMMY_USERS)
    }
    setLoading(false)
  }

  const myBadge = getBadge(MY_POINTS)
  const myRank = users.findIndex(u => u.name === MY_NAME) + 1 || users.length
  const progressToNext = myBadge.next
    ? Math.round((MY_POINTS - myBadge.min) / (myBadge.next - myBadge.min) * 100)
    : 100

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-yellow-500 to-green-500 px-5 pt-14 pb-6 rounded-b-3xl">
        <h1 className="text-white text-xl font-bold">Leaderboard</h1>
        <p className="text-yellow-100 text-xs mt-0.5">Reset setiap tanggal 1 tiap bulan 🏆</p>

        {/* My stats card */}
        <div className="mt-4 bg-white/20 rounded-2xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-11 h-11 bg-white/30 rounded-full flex items-center justify-center text-2xl">
              {myBadge.icon}
            </div>
            <div className="flex-1">
              <p className="text-white font-semibold">{MY_NAME}</p>
              <p className="text-yellow-100 text-xs">{myBadge.label} · Peringkat #{myRank}</p>
            </div>
            <div className="text-right">
              <p className="text-white text-2xl font-bold">{MY_POINTS}</p>
              <p className="text-yellow-100 text-xs">poin</p>
            </div>
          </div>

          {/* Progress to next badge */}
          {myBadge.next && (
            <div>
              <div className="flex justify-between text-xs text-yellow-100 mb-1">
                <span>Menuju {getBadge(myBadge.next).label} {getBadge(myBadge.next).icon}</span>
                <span>{MY_POINTS}/{myBadge.next} poin</span>
              </div>
              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-white rounded-full transition-all duration-1000"
                  style={{ width: `${progressToNext}%` }} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex mx-4 mt-4 bg-gray-200 rounded-xl p-1 gap-1">
        {([['board', '🏆 Peringkat'], ['badges', '🎖️ Badge']] as const).map(([key, label]) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all
              ${activeTab === key ? 'bg-white text-yellow-700 shadow-sm' : 'text-gray-500'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* ── LEADERBOARD TAB ── */}
      {activeTab === 'board' && (
        <div className="px-4 mt-4 pb-6">
          {/* Podium Top 3 */}
          {!loading && users.length >= 3 && (
            <div className="mb-5">
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-3">Top 3 Bulan Ini</p>
              <div className="flex items-end justify-center gap-2">
                {/* 2nd */}
                <div className="flex-1 flex flex-col items-center">
                  <p className="text-2xl mb-1">🥈</p>
                  <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center text-2xl mb-1">
                    {getBadge(users[1]?.points || 0).icon}
                  </div>
                  <p className="text-xs font-semibold text-gray-700 text-center truncate w-full px-1">{users[1]?.name}</p>
                  <p className="text-xs text-gray-500">{users[1]?.points} poin</p>
                  <div className="w-full bg-gray-200 rounded-t-xl mt-2" style={{ height: 70 }} />
                </div>
                {/* 1st */}
                <div className="flex-1 flex flex-col items-center">
                  <p className="text-3xl mb-1">🥇</p>
                  <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center text-2xl mb-1 ring-2 ring-yellow-400">
                    {getBadge(users[0]?.points || 0).icon}
                  </div>
                  <p className="text-xs font-semibold text-gray-700 text-center truncate w-full px-1">{users[0]?.name}</p>
                  <p className="text-xs text-gray-500">{users[0]?.points} poin</p>
                  <div className="w-full bg-yellow-200 rounded-t-xl mt-2" style={{ height: 90 }} />
                </div>
                {/* 3rd */}
                <div className="flex-1 flex flex-col items-center">
                  <p className="text-2xl mb-1">🥉</p>
                  <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center text-2xl mb-1">
                    {getBadge(users[2]?.points || 0).icon}
                  </div>
                  <p className="text-xs font-semibold text-gray-700 text-center truncate w-full px-1">{users[2]?.name}</p>
                  <p className="text-xs text-gray-500">{users[2]?.points} poin</p>
                  <div className="w-full bg-green-100 rounded-t-xl mt-2" style={{ height: 55 }} />
                </div>
              </div>
              <div className="bg-yellow-50 rounded-xl p-3 text-center border border-yellow-200 mt-1">
                <p className="text-xs text-yellow-700">🎁 Top 3 mendapat hadiah voucher di akhir bulan!</p>
              </div>
            </div>
          )}

          {/* Full list */}
          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-3">Semua Peringkat</p>
          {loading ? (
            <div className="flex flex-col gap-3">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="bg-white rounded-2xl p-4 animate-pulse h-16 border border-gray-100" />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {users.map((user, index) => {
                const badge = getBadge(user.points)
                const isMe = user.name === MY_NAME
                return (
                  <div key={user.name + index}
                    className={`rounded-2xl p-4 flex items-center gap-3 border transition-all
                      ${isMe ? 'bg-yellow-50 border-yellow-200' : 'bg-white border-gray-100'}`}>
                    <span className="text-lg w-8 text-center font-bold text-gray-500">
                      {index < 3 ? MEDAL[index] : `${index + 1}`}
                    </span>
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-xl"
                      style={{ background: badge.color + '20' }}>
                      {badge.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">
                        {user.name} {isMe && <span className="text-yellow-600 text-xs">(Anda)</span>}
                      </p>
                      <p className="text-xs text-gray-400">{badge.label}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-800">{user.points}</p>
                      <p className="text-xs text-gray-400">poin</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── BADGES TAB ── */}
      {activeTab === 'badges' && (
        <div className="px-4 mt-4 pb-6">
          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-3">Semua Level Badge</p>
          <div className="flex flex-col gap-3">
            {BADGE_LEVELS.map((b, i) => {
              const achieved = MY_POINTS >= b.min
              const isCurrent = getBadge(MY_POINTS).min === b.min
              return (
                <div key={i}
                  className={`rounded-2xl p-4 border-2 transition-all
                    ${isCurrent ? 'border-yellow-400 bg-yellow-50'
                      : achieved ? 'border-green-200 bg-green-50'
                      : 'border-gray-100 bg-white'}`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl
                      ${achieved ? 'bg-white shadow-sm' : 'bg-gray-100'}`}>
                      {b.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className={`font-bold text-sm ${achieved ? 'text-gray-800' : 'text-gray-400'}`}>
                          {b.label}
                        </p>
                        {isCurrent && (
                          <span className="text-xs bg-yellow-400 text-white px-2 py-0.5 rounded-full font-semibold">
                            Level Anda
                          </span>
                        )}
                        {achieved && !isCurrent && (
                          <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full font-semibold">
                            ✓ Tercapai
                          </span>
                        )}
                      </div>
                      <p className={`text-xs ${achieved ? 'text-gray-500' : 'text-gray-300'}`}>
                        {b.min}+ poin diperlukan
                      </p>
                      {isCurrent && b.next && (
                        <div className="mt-2">
                          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-yellow-400 rounded-full"
                              style={{ width: `${progressToNext}%` }} />
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {MY_POINTS}/{b.next} poin menuju level berikutnya
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Tips */}
          <div className="mt-4 bg-green-50 rounded-2xl p-4 border border-orange-100">
            <p className="text-sm font-semibold text-orange-800 mb-1">💡 Cara dapat poin</p>
            <div className="flex flex-col gap-1.5">
              {[
                '1 kg sampah daur ulang = 10 poin',
                'Langganan aktif = +5 poin/bulan',
                'Rating driver = +2 poin',
                'Jual sampah di marketplace = +5 poin',
              ].map((tip, i) => (
                <p key={i} className="text-xs text-orange-600">✓ {tip}</p>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}