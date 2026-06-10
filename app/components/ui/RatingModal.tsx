'use client'

import { useState } from 'react'
import { Spinner } from '@/components/ui/Spinner'

interface RatingModalProps {
  title: string
  subtitle?: string
  onSubmit: (rating: number, comment: string) => Promise<void>
  onClose: () => void
}

export function RatingModal({ title, subtitle, onSubmit, onClose }: RatingModalProps) {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (rating === 0) return
    setSubmitting(true)
    try {
      await onSubmit(rating, comment)
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-end z-50"
      onClick={() => !submitting && onClose()}
    >
      <div
        className="bg-white w-full max-w-lg mx-auto rounded-t-3xl p-6"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="font-bold text-gray-800 text-lg text-center mb-1">{title}</h3>
        {subtitle && (
          <p className="text-gray-400 text-sm text-center mb-5">{subtitle}</p>
        )}

        <div className="flex justify-center gap-2 mb-5">
          {[1, 2, 3, 4, 5].map(star => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              className={`text-4xl pressable transition-all ${star <= rating ? 'scale-110' : 'opacity-30'}`}
              aria-label={`${star} bintang`}
            >
              ⭐
            </button>
          ))}
        </div>

        <textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder="Komentar opsional..."
          rows={2}
          className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-green-400 focus:outline-none resize-none mb-4"
        />

        <button
          type="button"
          onClick={handleSubmit}
          disabled={rating === 0 || submitting}
          className="w-full bg-green-600 disabled:bg-gray-200 disabled:text-gray-400 text-white py-3.5 rounded-2xl font-bold pressable flex items-center justify-center gap-2"
        >
          {submitting ? <Spinner size="sm" /> : null}
          {submitting ? 'Mengirim...' : 'Kirim Rating'}
        </button>

        <button
          type="button"
          onClick={onClose}
          disabled={submitting}
          className="w-full mt-2 text-gray-400 text-sm py-2"
        >
          Lewati
        </button>
      </div>
    </div>
  )
}
