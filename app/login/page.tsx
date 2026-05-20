'use client'

import { supabase } from '../supabaseClient'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [role, setRole] = useState('users')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    
    const columnName = role === 'drivers' ? 'driver_email' : 'user_email'

    const { data, error } = await supabase
      .from(role)
      .select('*')
      .eq(columnName, email)
      .single() 

    setLoading(false)

    if (error || !data) {
      console.error('Login error:', error)
      alert(`Email tidak ditemukan di kategori ${role === 'drivers' ? 'Driver' : 'User'} atau terjadi masalah koneksi!`)
      return
    }

   
    const dbPassword = role === 'drivers' ? data.driver_password : data.user_password

    
    if (dbPassword === password) {
      alert(`Login Berhasil! Selamat Datang di ThrashIn sebagai ${role === 'drivers' ? 'Driver' : 'User'}.`)
      
     
      localStorage.setItem('user_session', JSON.stringify(data))
      localStorage.setItem('user_role', role)

     
      if (role === 'drivers') {
        router.push('/home') 
      } else {
        router.push('/home') 
      }
    } else {
      alert('Password salah! Silakan coba lagi.')
    }
  }

  return (
    <div style={{ padding: '20px', maxWidth: '400px', margin: '100px auto', color: 'black', fontFamily: 'sans-serif' }}>
      <div style={{ background: '#fff', padding: '30px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        <h2 style={{ marginBottom: '20px', textAlign: 'center', color: '#1e293b' }}>Login ThrashIn ♻️</h2>
        
        <form onSubmit={handleLogin}>
          
          {/* DROPDOWN PILIHAN ROLE (Biar sinkron sama register) */}
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Masuk Sebagai:</label>
            <select 
              value={role} 
              onChange={(e) => setRole(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #cbd5e1', background: '#fff' }}
            >
              <option value="users">User</option>
              <option value="drivers">Driver</option>
            </select>
          </div>

          {/* KOLOM EMAIL */}
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Email:</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              placeholder="Masukkan email lu"
              style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} 
            />
          </div>

          {/* KOLOM PASSWORD */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Password:</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              placeholder="Masukkan password lu"
              style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} 
            />
          </div>

          {/* TOMBOL SUBMIT */}
          <button 
            type="submit" 
            disabled={loading} 
            style={{ 
              padding: '12px', 
              background: '#3b82f6', 
              color: '#fff', 
              border: 'none', 
              borderRadius: '4px', 
              width: '100%', 
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '16px'
            }}
          >
            {loading ? 'Mengecek Akun...' : 'Login Sekarang'}
          </button>
        </form>

        {/* LINK NAVIGASI KE REGISTER */}
        <p style={{ marginTop: '20px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
          Belum punya akun?{' '}
          <span 
            onClick={() => router.push('/register')} 
            style={{ color: '#3b82f6', cursor: 'pointer', fontWeight: 'bold', textDecoration: 'underline' }}
          >
            Daftar di sini
          </span>
        </p>
      </div>
    </div>
  )
}