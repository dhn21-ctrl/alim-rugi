'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ThemeToggle } from '../components/ThemeToggle'

type Order = {
  id: string
  total: number
  status: string
  created_at: string
  shipping_address: string
  payment_method: string
  courier: string
}

type Product = {
  id: string
  name: string
  price: number
  stock: number
  category: string
}

function formatRupiah(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', minimumFractionDigits: 0
  }).format(amount)
}

export default function AdminPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'dashboard' | 'orders' | 'pos'>('dashboard')
  const [role, setRole] = useState<'owner' | 'admin' | 'customer' | null>(null)
  const [userName, setUserName] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => { checkUser() }, [])

  async function checkUser() {
    const { data } = await supabase.auth.getUser()
    if (!data.user) { router.push('/login'); return }
    setUserName(data.user.user_metadata?.name || data.user.email || 'User')

    const { data: profile } = await supabase
      .from('profiles').select('role').eq('id', data.user.id).single()

    const userRole = profile?.role || 'customer'
    setRole(userRole)

    if (userRole === 'customer') {
      router.push('/')
      return
    }

    if (userRole === 'admin') setActiveTab('pos')
    fetchAll()
  }

  async function fetchAll() {
    const [{ data: orderData }, { data: prodData }] = await Promise.all([
      supabase.from('orders').select('*').order('created_at', { ascending: false }),
      supabase.from('products').select('*'),
    ])
    setOrders(orderData || [])
    setProducts(prodData || [])
    setLoading(false)
  }

  async function updateOrderStatus(id: string, status: string) {
    await supabase.from('orders').update({ status }).eq('id', id)
    fetchAll()
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  // Statistik
  const today = new Date().toISOString().split('T')[0]
  const todayOrders = orders.filter(o => o.created_at.startsWith(today))
  const todayRevenue = todayOrders.reduce((sum, o) => sum + o.total, 0)
  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0)
  const pendingOrders = orders.filter(o => o.status === 'pending').length
  const completedOrders = orders.filter(o => o.status === 'delivered').length
  const cancelledOrders = orders.filter(o => o.status === 'cancelled').length
  const lowStockProducts = products.filter(p => p.stock < 10)

  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().split('T')[0]
  const yesterdayRevenue = orders
    .filter(o => o.created_at.startsWith(yesterdayStr))
    .reduce((sum, o) => sum + o.total, 0)
  const revenueTrend = yesterdayRevenue > 0
    ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue * 100).toFixed(1)
    : '0'
  const revenueTrendUp = todayRevenue >= yesterdayRevenue

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    const dateStr = d.toISOString().split('T')[0]
    const dayOrders = orders.filter(o => o.created_at.startsWith(dateStr))
    return {
      date: dateStr,
      label: d.toLocaleDateString('id-ID', { weekday: 'short' }),
      revenue: dayOrders.reduce((sum, o) => sum + o.total, 0),
      count: dayOrders.length,
    }
  })

  const maxRevenue = Math.max(...last7Days.map(d => d.revenue), 1)

  const statusColor: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-600',
    processing: 'bg-blue-100 text-blue-600',
    shipped: 'bg-purple-100 text-purple-600',
    delivered: 'bg-green-100 text-green-600',
    cancelled: 'bg-red-100 text-red-600',
  }

  const statusLabel: Record<string, string> = {
    pending: 'Menunggu',
    processing: 'Diproses',
    shipped: 'Dikirim',
    delivered: 'Selesai',
    cancelled: 'Dibatalkan',
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f7f9fb]">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  )

  return (
    <div className="flex min-h-screen bg-[#f7f9fb]">
      {/* Sidebar Overlay Mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 h-screen bg-white border-r border-gray-200 flex flex-col p-4 gap-2 z-40 transition-all duration-300 ${sidebarOpen ? 'w-60' : 'w-0 md:w-60'} overflow-hidden`}>
        <div className="mb-4">
          <p className="font-bold text-lg text-gray-900 whitespace-nowrap" style={{ fontFamily: 'Hanken Grotesk, sans-serif' }}>
            Alim Rugi
          </p>
          <div className="flex items-center gap-2 mt-2 bg-gray-50 rounded-xl p-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 ${role === 'owner' ? 'bg-yellow-500' : 'bg-blue-600'}`}>
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-gray-700 truncate">{userName}</p>
              <span className={`text-xs px-1.5 py-0.5 rounded font-bold ${role === 'owner' ? 'bg-yellow-100 text-yellow-600' : 'bg-blue-100 text-blue-600'}`}>
                {role === 'owner' ? '👑 Pemilik' : '🧑‍💼 Admin'}
              </span>
            </div>
          </div>
        </div>

        <nav className="flex flex-col gap-1 flex-1">
          {role === 'owner' && (
            <button
              onClick={() => { setActiveTab('dashboard'); setSidebarOpen(false) }}
              className={`flex items-center gap-3 p-3 rounded-xl text-sm font-bold text-left transition-all whitespace-nowrap ${activeTab === 'dashboard' ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}
            >
              <span className="text-lg">📊</span> Dashboard
            </button>
          )}

          {role === 'admin' && (
            <button
              onClick={() => { setActiveTab('pos'); setSidebarOpen(false) }}
              className={`flex items-center gap-3 p-3 rounded-xl text-sm font-bold text-left transition-all whitespace-nowrap ${activeTab === 'pos' ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}
            >
              <span className="text-lg">🧾</span> Kasir / POS
            </button>
          )}

          <Link
            href="/admin/products"
            className="flex items-center gap-3 p-3 text-gray-500 hover:bg-gray-100 rounded-xl text-sm whitespace-nowrap transition-all"
          >
            <span className="text-lg">📦</span> Kelola Produk
          </Link>

          <button
            onClick={() => { setActiveTab('orders'); setSidebarOpen(false) }}
            className={`flex items-center gap-3 p-3 rounded-xl text-sm font-bold text-left transition-all whitespace-nowrap ${activeTab === 'orders' ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}
          >
            <span className="text-lg">📋</span>
            Pesanan Masuk
            {pendingOrders > 0 && (
              <span className="ml-auto bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">{pendingOrders}</span>
            )}
          </button>

          <div className="border-t border-gray-200 my-2" />

          <Link href="/" className="flex items-center gap-3 p-3 text-gray-500 hover:bg-gray-100 rounded-xl text-sm whitespace-nowrap transition-all">
            <span className="text-lg">🏠</span> Kembali ke Toko
          </Link>

          <Link href="/profile" className="flex items-center gap-3 p-3 text-gray-500 hover:bg-gray-100 rounded-xl text-sm whitespace-nowrap transition-all">
            <span className="text-lg">👤</span> Profil Saya
          </Link>
        </nav>

        <div className="flex flex-col gap-2">
          <ThemeToggle />
          <button
            onClick={handleLogout}
            className="w-full border border-red-200 text-red-500 py-2 px-4 rounded-xl text-sm font-bold hover:bg-red-50 transition-all whitespace-nowrap"
          >
            🚪 Keluar
          </button>
          <Link
            href="/admin/products"
            className="bg-blue-600 text-white py-2 px-4 rounded-xl text-sm font-bold hover:bg-blue-700 text-center whitespace-nowrap transition-all"
          >
            + Tambah Produk
          </Link>
        </div>
      </aside>

      {/* Main */}
      <main className="md:ml-60 flex-1 flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-20 flex justify-between items-center px-4 md:px-8 py-3 shadow-sm">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="md:hidden p-2 hover:bg-gray-100 rounded-lg text-gray-500">
              ☰
            </button>
            <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 text-sm hidden md:flex items-center gap-1 transition-all">
              ← Kembali
            </button>
            <h1 className="font-bold text-gray-900 text-lg" style={{ fontFamily: 'Hanken Grotesk, sans-serif' }}>
              {activeTab === 'dashboard' ? '📊 Dashboard' : activeTab === 'pos' ? '🧾 Kasir' : '📋 Pesanan'}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2 py-1 rounded-full font-bold hidden md:block ${role === 'owner' ? 'bg-yellow-100 text-yellow-600' : 'bg-blue-100 text-blue-600'}`}>
              {role === 'owner' ? '👑 Pemilik' : '🧑‍💼 Admin'}
            </span>
            <span className="text-xs text-gray-400 hidden md:block">{userName}</span>
          </div>
        </header>

        <div className="p-4 md:p-8 flex-1">

          {/* ====== OWNER DASHBOARD ====== */}
          {activeTab === 'dashboard' && role === 'owner' && (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-2">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-900" style={{ fontFamily: 'Hanken Grotesk, sans-serif' }}>
                    Selamat datang, {userName.split(' ')[0]}! 👑
                  </h2>
                  <p className="text-gray-400 text-sm mt-1">
                    {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  <span className="text-xs text-green-600 font-bold">Data Realtime</span>
                </div>
              </div>

              {/* KPI Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-5 shadow-sm">
                  <div className="flex justify-between items-start mb-3">
                    <div className="bg-blue-50 p-2 rounded-lg"><span className="text-xl">💰</span></div>
                    <span className={`text-xs font-bold flex items-center gap-0.5 ${revenueTrendUp ? 'text-green-500' : 'text-red-500'}`}>
                      {revenueTrendUp ? '↑' : '↓'} {revenueTrend}%
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 uppercase font-bold mb-1">Total Penjualan</p>
                  <p className="text-base md:text-xl font-bold text-blue-600">{formatRupiah(totalRevenue)}</p>
                  <p className="text-xs text-gray-400 mt-1">{orders.length} transaksi</p>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-5 shadow-sm">
                  <div className="flex justify-between items-start mb-3">
                    <div className="bg-green-50 p-2 rounded-lg"><span className="text-xl">📦</span></div>
                    <span className="text-xs font-bold text-green-500">Hari Ini</span>
                  </div>
                  <p className="text-xs text-gray-400 uppercase font-bold mb-1">Pesanan Hari Ini</p>
                  <p className="text-base md:text-xl font-bold text-green-600">{todayOrders.length} Pesanan</p>
                  <p className="text-xs text-gray-400 mt-1">{formatRupiah(todayRevenue)}</p>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-5 shadow-sm">
                  <div className="flex justify-between items-start mb-3">
                    <div className="bg-yellow-50 p-2 rounded-lg"><span className="text-xl">⏳</span></div>
                    <span className={`text-xs font-bold ${pendingOrders > 0 ? 'text-yellow-500' : 'text-green-500'}`}>
                      {pendingOrders > 0 ? '⚠️ Perlu Aksi' : '✓ Aman'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 uppercase font-bold mb-1">Menunggu Proses</p>
                  <p className="text-base md:text-xl font-bold text-yellow-500">{pendingOrders}</p>
                  <p className="text-xs text-gray-400 mt-1">{completedOrders} selesai</p>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-5 shadow-sm">
                  <div className="flex justify-between items-start mb-3">
                    <div className="bg-red-50 p-2 rounded-lg"><span className="text-xl">⚠️</span></div>
                    <span className={`text-xs font-bold ${lowStockProducts.length > 0 ? 'text-red-500' : 'text-green-500'}`}>
                      {lowStockProducts.length > 0 ? '🔴 Kritis' : '✓ Aman'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 uppercase font-bold mb-1">Stok Menipis</p>
                  <p className="text-base md:text-xl font-bold text-red-500">{lowStockProducts.length}</p>
                  <p className="text-xs text-gray-400 mt-1">produk perlu restock</p>
                </div>
              </div>

              {/* Grafik */}
              <div className="bg-white border border-gray-200 rounded-xl p-5 md:p-6 shadow-sm">
                <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-6 gap-2">
                  <div>
                    <h2 className="font-bold text-lg text-gray-900" style={{ fontFamily: 'Hanken Grotesk, sans-serif' }}>
                      📈 Tren Penjualan 7 Hari
                    </h2>
                    <p className="text-xs text-gray-400">Pendapatan harian dalam Rupiah</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Total minggu ini</p>
                    <p className="font-bold text-blue-600">{formatRupiah(last7Days.reduce((sum, d) => sum + d.revenue, 0))}</p>
                  </div>
                </div>
                <div className="flex items-end gap-2 md:gap-3" style={{ height: '160px' }}>
                  {last7Days.map((day, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <p className="text-xs text-blue-600 font-bold" style={{ minHeight: '16px', fontSize: '10px' }}>
                        {day.revenue > 0 ? `${(day.revenue / 1000).toFixed(0)}rb` : ''}
                      </p>
                      <div className="w-full bg-gray-100 rounded-t-lg relative" style={{ height: '100px' }}>
                        <div
                          className={`w-full rounded-t-lg absolute bottom-0 transition-all duration-700 ${day.date === today ? 'bg-blue-600' : 'bg-blue-300'}`}
                          style={{ height: `${(day.revenue / maxRevenue) * 100}%`, minHeight: day.revenue > 0 ? '4px' : '0' }}
                        />
                      </div>
                      <p className="text-gray-500 font-medium" style={{ fontSize: '10px' }}>{day.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Restock Alert */}
                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                  <h2 className="font-bold text-lg mb-4 text-gray-900 flex items-center gap-2">
                    ⚠️ Peringatan Stok
                    {lowStockProducts.length > 0 && (
                      <span className="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full font-bold">{lowStockProducts.length} item</span>
                    )}
                  </h2>
                  {lowStockProducts.length === 0 ? (
                    <div className="text-center py-6">
                      <p className="text-3xl mb-2">✅</p>
                      <p className="text-gray-400 text-sm">Semua stok aman</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {lowStockProducts.map(p => (
                        <div key={p.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                          <div>
                            <p className="text-sm font-bold text-gray-900">{p.name}</p>
                            <p className="text-xs text-gray-400">{p.category}</p>
                          </div>
                          <span className={`text-xs font-bold px-2 py-1 rounded-full ${p.stock === 0 ? 'bg-gray-100 text-gray-600' : 'bg-red-100 text-red-600'}`}>
                            {p.stock === 0 ? 'HABIS' : `${p.stock} unit`}
                          </span>
                        </div>
                      ))}
                      <Link href="/admin/products" className="mt-2 text-center text-xs text-blue-600 hover:underline block">
                        Kelola Stok →
                      </Link>
                    </div>
                  )}
                </div>

                {/* Laporan Ringkas */}
                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                  <h2 className="font-bold text-lg mb-4 text-gray-900">📋 Laporan Ringkas</h2>
                  <div className="flex flex-col gap-2">
                    {[
                      { label: 'Total Pendapatan', value: formatRupiah(totalRevenue), color: 'text-green-600' },
                      { label: 'Pendapatan Hari Ini', value: formatRupiah(todayRevenue), color: 'text-blue-600' },
                      { label: 'Pesanan Selesai', value: `${completedOrders} pesanan`, color: 'text-green-500' },
                      { label: 'Pesanan Dibatalkan', value: `${cancelledOrders} pesanan`, color: 'text-red-500' },
                      { label: 'Total Produk', value: `${products.length} produk`, color: 'text-gray-700' },
                    ].map((item, i) => (
                      <div key={i} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                        <span className="text-sm text-gray-600">{item.label}</span>
                        <span className={`font-bold text-sm ${item.color}`}>{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Transaksi Terbaru */}
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <div className="px-5 md:px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                  <h2 className="font-bold text-lg text-gray-900">🧾 Transaksi Terbaru</h2>
                  <button onClick={() => setActiveTab('orders')} className="text-xs text-blue-600 hover:underline">
                    Lihat Semua →
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 md:px-6 py-3 text-xs text-gray-400 uppercase">ID Pesanan</th>
                        <th className="px-4 md:px-6 py-3 text-xs text-gray-400 uppercase hidden md:table-cell">Tanggal</th>
                        <th className="px-4 md:px-6 py-3 text-xs text-gray-400 uppercase hidden md:table-cell">Pembayaran</th>
                        <th className="px-4 md:px-6 py-3 text-xs text-gray-400 uppercase text-right">Total</th>
                        <th className="px-4 md:px-6 py-3 text-xs text-gray-400 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.length === 0 ? (
                        <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400">Belum ada transaksi</td></tr>
                      ) : orders.slice(0, 5).map(order => (
                        <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                          <td className="px-4 md:px-6 py-3 font-mono text-xs text-blue-600 font-bold">#{order.id.slice(0, 8).toUpperCase()}</td>
                          <td className="px-4 md:px-6 py-3 text-sm text-gray-400 hidden md:table-cell">
                            {new Date(order.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="px-4 md:px-6 py-3 text-sm capitalize hidden md:table-cell">{order.payment_method}</td>
                          <td className="px-4 md:px-6 py-3 text-sm font-bold text-right text-blue-600">{formatRupiah(order.total)}</td>
                          <td className="px-4 md:px-6 py-3">
                            <span className={`text-xs font-bold px-2 py-1 rounded-full ${statusColor[order.status] || 'bg-gray-100 text-gray-600'}`}>
                              {statusLabel[order.status] || order.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ====== ADMIN/KASIR POS ====== */}
          {activeTab === 'pos' && role === 'admin' && (
            <div className="flex flex-col gap-6">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900" style={{ fontFamily: 'Hanken Grotesk, sans-serif' }}>
                  Selamat datang, {userName.split(' ')[0]}! 🧑‍💼
                </h2>
                <p className="text-gray-400 text-sm mt-1">Panel Kasir — Kelola transaksi toko</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                  <p className="text-xs text-gray-400 uppercase font-bold mb-1">Menunggu Proses</p>
                  <p className="text-2xl font-bold text-yellow-500">{pendingOrders}</p>
                  <p className="text-xs text-gray-400 mt-1">pesanan masuk</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                  <p className="text-xs text-gray-400 uppercase font-bold mb-1">Selesai Hari Ini</p>
                  <p className="text-2xl font-bold text-green-500">{todayOrders.filter(o => o.status === 'delivered').length}</p>
                  <p className="text-xs text-gray-400 mt-1">transaksi sukses</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm col-span-2 md:col-span-1">
                  <p className="text-xs text-gray-400 uppercase font-bold mb-1">Omset Hari Ini</p>
                  <p className="text-xl font-bold text-blue-600">{formatRupiah(todayRevenue)}</p>
                  <p className="text-xs text-gray-400 mt-1">{todayOrders.length} transaksi</p>
                </div>
              </div>

              {/* Restock Alert untuk Admin */}
              {lowStockProducts.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                  <span className="text-2xl">⚠️</span>
                  <div>
                    <p className="font-bold text-red-700 text-sm">Peringatan Stok Menipis!</p>
                    <p className="text-xs text-red-500 mt-1">
                      {lowStockProducts.map(p => `${p.name} (${p.stock} unit)`).join(' · ')}
                    </p>
                    <Link href="/admin/products" className="text-xs text-red-600 font-bold hover:underline mt-1 inline-block">
                      Kelola Stok →
                    </Link>
                  </div>
                </div>
              )}

              {/* Tabel Pesanan Kasir */}
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <div className="px-5 py-4 border-b border-gray-200 bg-blue-50">
                  <h2 className="font-bold text-lg text-blue-800">🧾 Pesanan Masuk — Proses di Sini</h2>
                  <p className="text-xs text-blue-600 mt-0.5">Ubah status pesanan untuk memproses transaksi</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 md:px-6 py-3 text-xs text-gray-400 uppercase">ID Pesanan</th>
                        <th className="px-4 md:px-6 py-3 text-xs text-gray-400 uppercase hidden md:table-cell">Alamat</th>
                        <th className="px-4 md:px-6 py-3 text-xs text-gray-400 uppercase hidden md:table-cell">Pembayaran</th>
                        <th className="px-4 md:px-6 py-3 text-xs text-gray-400 uppercase text-right">Total</th>
                        <th className="px-4 md:px-6 py-3 text-xs text-gray-400 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                            <p className="text-3xl mb-2">📋</p>
                            Belum ada pesanan masuk
                          </td>
                        </tr>
                      ) : orders.map(order => (
                        <tr key={order.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${order.status === 'pending' ? 'bg-yellow-50/50' : ''}`}>
                          <td className="px-4 md:px-6 py-3 font-mono text-xs text-blue-600 font-bold">#{order.id.slice(0, 8).toUpperCase()}</td>
                          <td className="px-4 md:px-6 py-3 text-sm max-w-[200px] truncate hidden md:table-cell text-gray-600">{order.shipping_address}</td>
                          <td className="px-4 md:px-6 py-3 text-sm capitalize hidden md:table-cell text-gray-600">{order.payment_method}</td>
                          <td className="px-4 md:px-6 py-3 text-sm font-bold text-right text-blue-600">{formatRupiah(order.total)}</td>
                          <td className="px-4 md:px-6 py-3">
                            <select
                              value={order.status}
                              onChange={e => updateOrderStatus(order.id, e.target.value)}
                              className={`text-xs font-bold px-2 py-1 rounded-full border-0 focus:ring-2 focus:ring-blue-500 cursor-pointer ${statusColor[order.status] || 'bg-gray-100 text-gray-600'}`}
                            >
                              <option value="pending">Menunggu</option>
                              <option value="processing">Diproses</option>
                              <option value="shipped">Dikirim</option>
                              <option value="delivered">Selesai</option>
                              <option value="cancelled">Dibatalkan</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ====== ORDERS TAB (Both) ====== */}
          {activeTab === 'orders' && (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-2">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-900" style={{ fontFamily: 'Hanken Grotesk, sans-serif' }}>
                    Semua Pesanan
                  </h2>
                  <p className="text-gray-400 text-sm">{orders.length} total pesanan</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <span className="bg-yellow-100 text-yellow-600 px-3 py-1 rounded-full text-xs font-bold">{pendingOrders} Menunggu</span>
                  <span className="bg-green-100 text-green-600 px-3 py-1 rounded-full text-xs font-bold">{completedOrders} Selesai</span>
                  <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-xs font-bold">{cancelledOrders} Dibatalkan</span>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 md:px-6 py-3 text-xs text-gray-400 uppercase">ID Pesanan</th>
                        <th className="px-4 md:px-6 py-3 text-xs text-gray-400 uppercase hidden md:table-cell">Tanggal</th>
                        <th className="px-4 md:px-6 py-3 text-xs text-gray-400 uppercase hidden md:table-cell">Alamat</th>
                        <th className="px-4 md:px-6 py-3 text-xs text-gray-400 uppercase hidden md:table-cell">Pembayaran</th>
                        <th className="px-4 md:px-6 py-3 text-xs text-gray-400 uppercase text-right">Total</th>
                        <th className="px-4 md:px-6 py-3 text-xs text-gray-400 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.length === 0 ? (
                        <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400"><p className="text-3xl mb-2">📋</p>Belum ada pesanan</td></tr>
                      ) : orders.map(order => (
                        <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                          <td className="px-4 md:px-6 py-3 font-mono text-xs text-blue-600 font-bold">#{order.id.slice(0, 8).toUpperCase()}</td>
                          <td className="px-4 md:px-6 py-3 text-sm text-gray-400 hidden md:table-cell">
                            {new Date(order.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="px-4 md:px-6 py-3 text-sm max-w-[150px] truncate hidden md:table-cell text-gray-600">{order.shipping_address}</td>
                          <td className="px-4 md:px-6 py-3 text-sm capitalize hidden md:table-cell text-gray-600">{order.payment_method}</td>
                          <td className="px-4 md:px-6 py-3 text-sm font-bold text-right text-blue-600">{formatRupiah(order.total)}</td>
                          <td className="px-4 md:px-6 py-3">
                            <select
                              value={order.status}
                              onChange={e => updateOrderStatus(order.id, e.target.value)}
                              className={`text-xs font-bold px-2 py-1 rounded-full border-0 focus:ring-2 focus:ring-blue-500 cursor-pointer ${statusColor[order.status] || 'bg-gray-100 text-gray-600'}`}
                            >
                              <option value="pending">Menunggu</option>
                              <option value="processing">Diproses</option>
                              <option value="shipped">Dikirim</option>
                              <option value="delivered">Selesai</option>
                              <option value="cancelled">Dibatalkan</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {orders.length > 0 && (
                  <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
                    <p className="text-xs text-gray-400">Total pendapatan: <span className="font-bold text-blue-600">{formatRupiah(totalRevenue)}</span></p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}