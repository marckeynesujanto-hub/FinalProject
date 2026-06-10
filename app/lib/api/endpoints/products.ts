import { api } from '@/lib/api/client'
import type { Product } from '@/lib/types/api'

export const productsApi = {
  getAll: () => api.get<Product[]>('/api/products'),
}
