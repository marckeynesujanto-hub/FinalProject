import { api } from '@/app/lib/api/client'
import type {
  AddPointsResponse,
  PointAction,
  UserPointsResponse,
} from '@/app/lib/types/api'

export const pointsApi = {
  getByUser: (userId: string) =>
    api.get<UserPointsResponse>('/api/points', { user_id: userId }),

  add: (userId: string, action: PointAction) =>
    api.post<AddPointsResponse>('/api/points', { user_id: userId, action }),
}
