'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

function Toast({ message, type, onClose }: { message: string, type: 'success' | 'error', onClose: () => void }) {
  return (
    <div className={`fixed top-6 right-4 md:right-6 z-[100] flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-white text-sm font-bold ${
      type === 'success' ? 'bg-green-500' : 'bg-red-500'
    }`}>
      <span>{type === 'success' ? '✅' : '❌'}</span>
      <span>{message}</span>
      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100">✕</button>
    </div>
  )
}

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null)
  const [success, setSuccess] = useState(false)

  function showToast(message: string, type: 'success' | 'error') {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  async function handleRegister() {
    if (!name || !email || !password) {
      showToast('Semua field harus diisi!', 'error')
      return
    }
    if (password.length < 6) {
      showToast('Password minimal 6 karakter!', 'error')
      return
    }
    setLoading(true)

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } }
    })

    if (error) {
      showToast(error.message, 'error')
      setLoading(false)
      return
    }

    if (data.user) {
      await supabase.from('profiles').insert([{
        id: data.user.id,
        name,
        role: 'admin'
      }])
      setSuccess(true)
      showToast('Akun berhasil dibuat!', 'success')
    }
    setLoading(false)
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#f7f9fb] flex items-center justify-center px-4">
        {toast && <Toast {...toast} onClose={() => setToast(null)} />}
        <div className="max-w-md w-full text-center bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
          <div className="text-6xl mb-4">📧</div>
          <h1 className="text-2xl font-bold mb-2 text-gray-900" style={{ fontFamily: 'Hanken Grotesk, sans-serif' }}>
            Cek Email Anda!
          </h1>
          <p className="text-gray-400 mb-6 text-sm">
            Kami mengirim link konfirmasi ke <strong className="text-gray-700">{email}</strong>.
            Klik link tersebut untuk mengaktifkan akun.
          </p>
          <Link href="/login" className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 inline-block transition-all">
            Ke Halaman Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f7f9fb] flex items-center justify-center px-4">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-bold text-blue-600" style={{ fontFamily: 'Hanken Grotesk, sans-serif' }}>
            Alim Rugi
          </Link>
          <p className="text-gray-400 mt-2 text-sm">Buat akun baru</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
          <h1 className="text-2xl font-bold mb-6 text-gray-900" style={{ fontFamily: 'Hanken Grotesk, sans-serif' }}>
            Daftar
          </h1>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-400 uppercase font-bold">Nama Lengkap</label>
              <input
                className="border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-gray-50"
                type="text"
                placeholder="Nama Lengkap"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-400 uppercase font-bold">Email</label>
              <input
                className="border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-gray-50"
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-400 uppercase font-bold">Password</label>
              <input
                className="border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-gray-50"
                type="password"
                placeholder="Minimal 6 karakter"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleRegister()}
              />
            </div>

            <button
              onClick={handleRegister}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-70 flex items-center justify-center gap-2 mt-2 transition-all"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Memproses...
                </>
              ) : '✨ Daftar Sekarang'}
            </button>
          </div>

          <p className="text-center text-sm text-gray-400 mt-6">
            Sudah punya akun?{' '}
            <Link href="/login" className="text-blue-600 font-bold hover:underline">
              Masuk
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}