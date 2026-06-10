export function required(value: string, label: string): string | null {
  return value.trim() ? null : `${label} wajib diisi`
}

export function minLength(value: string, min: number, label: string): string | null {
  return value.trim().length >= min ? null : `${label} minimal ${min} karakter`
}

export function email(value: string): string | null {
  if (!value.trim()) return 'Email wajib diisi'
  const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
  return ok ? null : 'Format email tidak valid'
}

export function phone(value: string): string | null {
  if (!value.trim()) return null
  const ok = /^(\+62|62|0)8[0-9]{8,12}$/.test(value.replace(/\s/g, ''))
  return ok ? null : 'Nomor WhatsApp tidak valid'
}

export function rating(value: number): string | null {
  if (!Number.isFinite(value) || value < 1 || value > 5) {
    return 'Rating harus antara 1–5'
  }
  return null
}

export function positiveNumber(value: string | number, label: string): string | null {
  const num = Number(value)
  if (!Number.isFinite(num) || num <= 0) return `${label} harus lebih dari 0`
  return null
}

export function runValidations(
  checks: Array<string | null>
): string | null {
  return checks.find(Boolean) ?? null
}
