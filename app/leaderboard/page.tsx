'use client'

import { useState, useEffect } from 'react'

interface User {
  name: string
  points: number
  badge: string
}

export default function Leaderboard() {
  const [users, setUsers] = useState<User[]>([])
  const [myPoints] = useState(80) // Mock user points

  useEffect(() => {
    fetch('/api/leaderboard')
      .then(res => res.json())
      .then(data => setUsers(data))
  }, [])

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Leaderboard</h1>
      <p>Poin Anda: {myPoints} | Badge: Recycle Starter</p>

      <ul>
        {users.map((user, index) => (
          <li key={user.name} className="flex justify-between p-2 border-b">
            <span>{index + 1}. {user.name}</span>
            <span>{user.points} poin - {user.badge}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}