import { api } from '@/app/lib/api/client'
import type { Product } from '@/app/lib/types/api'

export const productsApi = {
  getAll: () => api.get<Product[]>('/api/products'),
}
