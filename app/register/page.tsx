'use client'

import { supabase } from '../supabaseClient'
import { useState } from 'react'
import { useRouter } from 'next/navigation' 

export default function RegisterPage() {
  const router = useRouter()

  
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)


  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { data, error } = await supabase
      .from('users') 
      .insert([
        {
          user_name: name,         
          user_email: email,       
          user_password: password, 
          user_point: 0 
        },
      ])

    setLoading(false)

    if (error) {
      console.error('Error inserting data:', error)
      alert(`Registration failed: ${error.message}`)
    } else {
      alert('Registration successful! Please log in.')
      router.push('/login') 
    } 
  }

  // 3. UI SEMENTARA UNTUK TEST FORM
  return (
    <div style={{ padding: '20px', maxWidth: '400px', margin: '0 auto', color: 'black' }}>
      <h2 style={{ color: 'white' }}>Daftar Akun ThrashIn</h2>
      
      <form onSubmit={handleRegister} style={{ background: '#fff', padding: '20px', borderRadius: '8px' }}>
        {/* INPUT NAMA */}
        <div style={{ marginBottom: '10px' }}>
          <label>Nama Lengkap:</label>
          <input 
            type="text" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            required 
            style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #cbd5e1', boxSizing: 'border-box'}} 
          />
        </div>

        {/* INPUT EMAIL */}
        <div style={{ marginBottom: '10px' }}>
          <label>Email:</label>
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
            style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} 
          />
        </div>

        {/* INPUT PASSWORD */}
        <div style={{ marginBottom: '15px' }}>
          <label>Password:</label>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
            style={{width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #cbd5e1', boxSizing: 'border-box'}} 
          />
        </div>

        {/* TOMBOL SUBMIT */}
        <button 
          type="submit" 
          disabled={loading} 
          style={{ padding: '10px', background: '#486e56', color: '#fff', border: 'none', width: '100%', cursor: 'pointer' }}
        >
          {loading ? 'Mendaftarkan...' : 'Daftar Sekarang'}
        </button>
      </form>
    </div>
  )
}