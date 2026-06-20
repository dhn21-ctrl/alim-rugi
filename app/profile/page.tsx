'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'orders'>('profile')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [orders, setOrders] = useState<any[]>([])
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    checkUser()
  }, [])

  async function checkUser() {
    const { data } = await supabase.auth.getUser()
    if (!data.user) {
      router.push('/login')
      return
    }
    setUser(data.user)
    setName(data.user.user_metadata?.name || '')
    setPhone(data.user.user_metadata?.phone || '')
    setAddress(data.user.user_metadata?.address || '')
    fetchOrders(data.user.id)
    setLoading(false)
  }

  async function fetchOrders(userId: string) {
    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    setOrders(data || [])
  }

  async function handleSaveProfile() {
    setSaving(true)
    const { error } = await supabase.auth.updateUser({
      data: { name, phone, address }
    })
    if (error) {
      setMessage({ type: 'error', text: error.message })
    } else {
      setMessage({ type: 'success', text: 'Profil berhasil diupdate!' })
    }
    setSaving(false)
    setTimeout(() => setMessage(null), 3000)
  }

  async function handleChangePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const newPassword = (form.elements.namedItem('newPassword') as HTMLInputElement).value
    const confirmPassword = (form.elements.namedItem('confirmPassword') as HTMLInputElement).value

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Password tidak cocok!' })
      return
    }
    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password minimal 6 karakter!' })
      return
    }

    setSaving(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) {
      setMessage({ type: 'error', text: error.message })
    } else {
      setMessage({ type: 'success', text: 'Password berhasil diubah!' })
      form.reset()
    }
    setSaving(false)
    setTimeout(() => setMessage(null), 3000)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
  }

  const statusColor: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-600',
    processing: 'bg-blue-100 text-blue-600',
    shipped: 'bg-purple-100 text-purple-600',
    delivered: 'bg-green-100 text-green-600',
    cancelled: 'bg-red-100 text-red-600',
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f7f9fb]">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#f7f9fb]">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 flex justify-between items-center px-4 md:px-8 py-3 w-full shadow-sm">
        <Link className="text-xl md:text-2xl font-bold text-gray-900" href="/" style={{ fontFamily: 'Hanken Grotesk, sans-serif' }}>
          Alim Rugi
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/cart" className="text-gray-500 hover:bg-gray-100 p-2 rounded-full transition-all">🛒</Link>
          <button onClick={handleLogout} className="text-sm text-red-400 hover:text-red-600 font-bold transition-colors">
            Logout
          </button>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 md:px-8 py-6 md:py-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-8">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl md:text-3xl font-bold flex-shrink-0">
            {name ? name.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold" style={{ fontFamily: 'Hanken Grotesk, sans-serif' }}>
              {name || 'User'}
            </h1>
            <p className="text-gray-400 text-sm">{user?.email}</p>
            <p className="text-xs text-gray-300 mt-0.5">
              Member sejak {new Date(user?.created_at).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Notifikasi */}
        {message && (
          <div className={`mb-6 px-4 py-3 rounded-xl text-sm font-bold ${
            message.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-600'
              : 'bg-red-50 border border-red-200 text-red-600'
          }`}>
            {message.type === 'success' ? '✅' : '❌'} {message.text}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-white border border-gray-200 rounded-xl p-1 w-full md:w-fit">
          {[
            { id: 'profile', label: '👤 Profil' },
            { id: 'security', label: '🔒 Keamanan' },
            { id: 'orders', label: `📋 Pesanan (${orders.length})` },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex-1 md:flex-none ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB: Profil */}
        {activeTab === 'profile' && (
          <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8">
            <h2 className="text-xl font-bold mb-6" style={{ fontFamily: 'Hanken Grotesk, sans-serif' }}>
              Informasi Pribadi
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-400 uppercase font-bold">Nama Lengkap</label>
                <input
                  className="border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="Nama lengkap"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-400 uppercase font-bold">Email</label>
                <input
                  className="border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50 cursor-not-allowed"
                  value={user?.email}
                  disabled
                />
                <p className="text-xs text-gray-400">Email tidak dapat diubah</p>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-400 uppercase font-bold">No. Telepon</label>
                <input
                  className="border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="+62 812 xxxx xxxx"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1 md:col-span-2">
                <label className="text-xs text-gray-400 uppercase font-bold">Alamat Default</label>
                <textarea
                  className="border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                  rows={3}
                  placeholder="Alamat lengkap untuk pengiriman"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                />
              </div>
            </div>
            <div className="flex flex-col md:flex-row gap-3 mt-6">
              <button
                onClick={handleSaveProfile}
                disabled={saving}
                className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-70 flex items-center justify-center gap-2 transition-all"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Menyimpan...
                  </>
                ) : '💾 Simpan Perubahan'}
              </button>
              <Link
                href="/"
                className="border border-gray-200 text-gray-500 px-6 py-3 rounded-xl font-bold hover:bg-gray-50 text-center transition-all"
              >
                Kembali ke Store
              </Link>
            </div>
          </div>
        )}

        {/* TAB: Keamanan */}
        {activeTab === 'security' && (
          <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8">
            <h2 className="text-xl font-bold mb-2" style={{ fontFamily: 'Hanken Grotesk, sans-serif' }}>
              Keamanan Akun
            </h2>
            <p className="text-gray-400 text-sm mb-6">Ubah password untuk menjaga keamanan akun kamu</p>

            <form onSubmit={handleChangePassword} className="flex flex-col gap-5 max-w-md">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-400 uppercase font-bold">Password Baru</label>
                <input
                  name="newPassword"
                  type="password"
                  className="border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="Minimal 6 karakter"
                  required
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-400 uppercase font-bold">Konfirmasi Password</label>
                <input
                  name="confirmPassword"
                  type="password"
                  className="border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="Ulangi password baru"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={saving}
                className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-70 flex items-center justify-center gap-2 transition-all w-full"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Menyimpan...
                  </>
                ) : '🔒 Ubah Password'}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-gray-100">
              <h3 className="font-bold text-red-500 mb-2">Zona Bahaya</h3>
              <p className="text-sm text-gray-400 mb-4">Logout dari semua perangkat</p>
              <button
                onClick={handleLogout}
                className="border border-red-200 text-red-500 px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-red-50 transition-all"
              >
                🚪 Logout Sekarang
              </button>
            </div>
          </div>
        )}

        {/* TAB: Pesanan */}
        {activeTab === 'orders' && (
          <div className="flex flex-col gap-4">
            {orders.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center">
                <p className="text-5xl mb-4">📋</p>
                <p className="text-gray-400 mb-4">Belum ada pesanan</p>
                <Link href="/" className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 inline-block">
                  Mulai Belanja
                </Link>
              </div>
            ) : orders.map(order => (
              <div key={order.id} className="bg-white border border-gray-200 rounded-2xl p-5 md:p-6">
                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-3 mb-4">
                  <div>
                    <p className="text-xs text-gray-400 uppercase mb-1">Nomor Pesanan</p>
                    <p className="font-bold text-blue-600 font-mono">#{order.id.slice(0, 8).toUpperCase()}</p>
                  </div>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full w-fit ${statusColor[order.status] || 'bg-gray-100 text-gray-600'}`}>
                    {order.status.toUpperCase()}
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-gray-400 uppercase mb-1">Total</p>
                    <p className="font-bold text-blue-600 text-lg">${order.total.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase mb-1">Pembayaran</p>
                    <p className="font-bold capitalize">{order.payment_method || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase mb-1">Tanggal</p>
                    <p className="font-bold">
                      {new Date(order.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric', month: 'short', year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
                {order.shipping_address && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-xs text-gray-400 uppercase mb-1">Alamat</p>
                    <p className="text-sm text-gray-600">{order.shipping_address}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}