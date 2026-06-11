import { api } from '@/app/lib/api/client'
import type { LeaderboardEntry } from '@/app/lib/types/api'

export const leaderboardApi = {
  getAll: () => api.get<LeaderboardEntry[]>('/api/leaderboard'),
}
