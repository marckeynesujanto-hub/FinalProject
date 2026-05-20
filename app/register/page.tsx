'use client'

import { supabase } from '../supabaseClient'
import { useState } from 'react'
import { useRouter } from 'next/navigation' 

export default function RegisterPage() {
  const router = useRouter()

 
  const [role, setRole] = useState('users')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

 
  const [phone, setPhone] = useState('')       
  const [platNomor, setPlatNomor] = useState('')

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    let result;

    if (role === 'drivers') {
     
      result = await supabase
        .from('drivers') 
        .insert([
          {
            driver_name: name,         
            driver_email: email,       
            driver_password: password, 
            driver_number: phone,     
            plat_nomor: platNomor,    
          },
        ])
    } else {
      
      result = await supabase
        .from('users') 
        .insert([
          {
            user_name: username, 
            user_email: email,       
            user_password: password, 
            user_point: 0,
            user_phone: phone,       
            fullname: name,           
          },
        ])
    }

    setLoading(false)

    if (result.error) {
      console.error('Error inserting data:', result.error)
      alert(`Registration failed: ${result.error.message}`)
    } else {
      alert(`Registration successful sebagai ${role === 'drivers' ? 'Driver' : 'User'}! Silakan log in.`)
      router.push('/login') 
    } 
  }

  return (
    <div style={{ padding: '20px', maxWidth: '400px', margin: '60px auto', color: 'black', fontFamily: 'sans-serif' }}>
      <div style={{ background: '#fff', padding: '30px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        
        <h2 style={{ marginBottom: '20px', textAlign: 'center', color: '#1e293b' }}>Daftar Akun ThrashIn ♻️</h2>
        
        <form onSubmit={handleRegister}>
          
          {/* DROPDOWN UTAMA */}
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Daftar Sebagai:</label>
            <select 
              value={role} 
              onChange={(e) => {
                setRole(e.target.value)
               
                setPhone('')
                setPlatNomor('')
              }}
              style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #cbd5e1', background: '#fff' }}
            >
              <option value="users">User</option>
              <option value="drivers">Driver</option>
            </select>
          </div>

          {/* INPUT NAMA (Berlaku untuk keduanya) */}
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Nama Lengkap:</label>
            <input 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              required 
              placeholder={role === 'drivers' ? "Masukkan nama driver" : "Masukkan nama lengkap "}
              style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} 
            />
          </div>

          {/* 🚀 INPUT USERNAME  */}
            {role === 'users' && (
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Username:</label>
                <input 
                  type="text" 
                  value={username} 
                  onChange={(e) => setUsername(e.target.value)} 
                  required 
                  placeholder="Masukkan username unik "
                  style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} 
                />
              </div>
            )}

          {/* INPUT EMAIL (Berlaku untuk keduanya) */}
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Email:</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              placeholder="Masukkan email aktif"
              style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} 
            />
          </div>

          {/* INPUT NOMOR TELEPON (Berlaku untuk keduanya, dipetakan otomatis ke kolom masing-masing) */}
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Nomor Telepon:</label>
            <input 
              type="text" 
              value={phone} 
              onChange={(e) => setPhone(e.target.value)} 
              required 
              placeholder="Contoh: 0812xxxxxxxx"
              style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} 
            />
          </div>

          {/*  KHUSUS JIKA MEMILIH DRIVER */}
          {role === 'drivers' && (
            <div style={{ marginBottom: '15px', padding: '10px', background: '#f8fafc', borderRadius: '6px', border: '1px dashed #cbd5e1' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#0f172a' }}>Plat Nomor Kendaraan:</label>
              <input 
                type="text" 
                value={platNomor} 
                onChange={(e) => setPlatNomor(e.target.value)} 
                required 
                placeholder="Contoh: B 1234 ABC"
                style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} 
              />
            </div>
          )}

          {/* INPUT PASSWORD (Berlaku untuk keduanya) */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Password:</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              placeholder="Buat password akun"
              style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} 
            />
          </div>

          {/* TOMBOL SUBMIT */}
          <button 
            type="submit" 
            disabled={loading} 
            style={{ 
              padding: '12px', 
              background: '#486e56', 
              color: '#fff', 
              border: 'none', 
              borderRadius: '4px', 
              width: '100%', 
              cursor: 'pointer', 
              fontWeight: 'bold', 
              fontSize: '16px' 
            }}
          >
            {loading ? 'Mendaftarkan...' : 'Daftar Sekarang'}
          </button>
        </form>

        <p style={{ marginTop: '20px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
          Sudah punya akun?{' '}
          <span 
            onClick={() => router.push('/login')} 
            style={{ color: '#486e56', cursor: 'pointer', fontWeight: 'bold', textDecoration: 'underline' }}
          >
            Login di sini
          </span>
        </p>

      </div>
    </div>
  )
}