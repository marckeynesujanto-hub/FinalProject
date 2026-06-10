import { api } from '@/lib/api/client'
import type { LeaderboardEntry } from '@/lib/types/api'

export const leaderboardApi = {
  getAll: () => api.get<LeaderboardEntry[]>('/api/leaderboard'),
}
