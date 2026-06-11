// app/login/page.tsx
'use client'
import { useLoginLogic } from './logic'

const DISPLAY = "'Bricolage Grotesque', sans-serif"

export default function LoginPage() {
  const {
    email, setEmail, password, setPassword, role, setRole, loading, handleLogin, router
  } = useLoginLogic();

  return (
    <div className="min-h-screen bg-[#F5F1E6] flex items-center justify-center p-5 relative overflow-hidden">
      {/* Organic earthy blobs */}
      <div className="absolute top-[-12%] right-[-14%] w-[58%] h-[46%] rounded-[48%_52%_55%_45%] bg-[#DDE7CC] blur-2xl opacity-70 pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-12%] w-[50%] h-[40%] rounded-full bg-[#F0E0D3] blur-2xl opacity-60 pointer-events-none"></div>

      <div className="w-full max-w-md bg-[#FFFDF7] p-8 rounded-[32px] border border-[#ECE4D2] shadow-[0_30px_60px_-24px_rgba(40,38,28,0.35)] z-10 animate-fade-in-up">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#47613A] rounded-[20px_20px_22px_8px] flex items-center justify-center text-3xl shadow-[0_14px_26px_-8px_rgba(71,97,58,0.6)] mx-auto mb-4">
            🌱
          </div>
          <h2 className="text-[32px] font-extrabold text-[#2B2A23] tracking-tight" style={{ fontFamily: DISPLAY }}>ThrashIn</h2>
          <p className="text-[#6F6C5E] text-sm mt-2 font-medium">Jemput &amp; daur ulang sampah, membumi.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          {/* Role Selection */}
          <div>
            <label className="block text-sm font-bold text-[#42402F] mb-2">Masuk Sebagai</label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setRole('users')}
                className={`py-3 rounded-2xl text-sm font-bold transition-all duration-200 border flex items-center justify-center gap-2 pressable ${
                  role === 'users'
                    ? 'bg-[#47613A] border-transparent text-[#F5F1E6] shadow-[0_10px_20px_-10px_rgba(71,97,58,0.7)]'
                    : 'bg-[#FBF8F0] border-[#E2DAC6] text-[#6F6C5E] hover:bg-[#F2EDDF]'
                }`}
              >
                👤 User
              </button>
              <button
                type="button"
                onClick={() => setRole('drivers')}
                className={`py-3 rounded-2xl text-sm font-bold transition-all duration-200 border flex items-center justify-center gap-2 pressable ${
                  role === 'drivers'
                    ? 'bg-[#47613A] border-transparent text-[#F5F1E6] shadow-[0_10px_20px_-10px_rgba(71,97,58,0.7)]'
                    : 'bg-[#FBF8F0] border-[#E2DAC6] text-[#6F6C5E] hover:bg-[#F2EDDF]'
                }`}
              >
                🏍️ Driver
              </button>
            </div>
          </div>

          {/* Email Input */}
          <div className="space-y-1.5">
            <label className="block text-sm font-bold text-[#42402F]">Email</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-[#A8A492]">
                ✉️
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Masukkan email aktif lu"
                className="w-full bg-[#FBF8F0] border-[1.5px] border-[#E2DAC6] rounded-2xl pl-11 pr-4 py-3.5 text-sm font-medium text-[#2B2A23] placeholder-[#A8A492] focus:bg-white focus:border-[#47613A] focus:ring-4 focus:ring-[#47613A]/10 focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1.5">
            <label className="block text-sm font-bold text-[#42402F]">Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-[#A8A492]">
                🔒
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Masukkan password lu"
                className="w-full bg-[#FBF8F0] border-[1.5px] border-[#E2DAC6] rounded-2xl pl-11 pr-4 py-3.5 text-sm font-medium text-[#2B2A23] placeholder-[#A8A492] focus:bg-white focus:border-[#47613A] focus:ring-4 focus:ring-[#47613A]/10 focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{ fontFamily: DISPLAY }}
            className="w-full py-4 mt-1 bg-[#47613A] text-[#F8F5EC] border-none rounded-2xl font-bold text-base tracking-tight transition-all shadow-[0_16px_28px_-12px_rgba(71,97,58,0.7)] hover:scale-[1.02] active:scale-[0.98] disabled:bg-[#C5C0AE] disabled:shadow-none disabled:pointer-events-none flex items-center justify-center gap-2 pressable"
          >
            {loading ? (
              <>
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Mengecek Akun...
              </>
            ) : (
              'Masuk Sekarang 🚀'
            )}
          </button>
        </form>

        {/* Footer Link */}
        <p className="mt-7 text-center text-[#6F6C5E] text-sm font-medium">
          Belum punya akun?{' '}
          <span
            onClick={() => router.push('/register')}
            className="text-[#C06B41] hover:text-[#A8552F] cursor-pointer font-bold hover:underline transition-colors"
          >
            Daftar di sini
          </span>
        </p>
      </div>
    </div>
  )
}
