'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

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

export default function AdminPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'dashboard' | 'orders' | 'pos'>('dashboard')
  const [role, setRole] = useState<'owner' | 'admin' | null>(null)
  const [userName, setUserName] = useState('')

  useEffect(() => {
    checkUser()
  }, [])

  async function checkUser() {
    const { data } = await supabase.auth.getUser()
    if (!data.user) {
      router.push('/login')
      return
    }
    setUserName(data.user.user_metadata?.name || data.user.email || 'User')

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single()

    const userRole = profile?.role || 'admin'
    setRole(userRole)

    if (userRole === 'admin') {
      setActiveTab('pos')
    }

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

  // Statistik
  const today = new Date().toISOString().split('T')[0]
  const todayOrders = orders.filter(o => o.created_at.startsWith(today))
  const todayRevenue = todayOrders.reduce((sum, o) => sum + o.total, 0)
  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0)
  const pendingOrders = orders.filter(o => o.status === 'pending').length
  const completedOrders = orders.filter(o => o.status === 'delivered').length
  const cancelledOrders = orders.filter(o => o.status === 'cancelled').length
  const lowStockProducts = products.filter(p => p.stock < 10)

  // Grafik 7 hari
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

  // Hitung trend (bandingkan hari ini vs kemarin)
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
    <div className="flex min-h-screen bg-[#f7f9fb]">
      {/* Sidebar */}
      <aside className="w-16 md:w-60 bg-white border-r border-gray-200 flex flex-col p-2 md:p-4 gap-2 fixed h-screen z-40 transition-all">
        <div className="mb-4 md:mb-6 hidden md:block">
          <p className="font-bold text-lg" style={{ fontFamily: 'Hanken Grotesk, sans-serif' }}>
            Alim Rugi Admin
          </p>
          <div className="flex items-center gap-2 mt-1">
            <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-xs font-bold text-gray-700 truncate max-w-[120px]">{userName}</p>
              <span className={`text-xs px-1.5 py-0.5 rounded font-bold ${role === 'owner' ? 'bg-yellow-100 text-yellow-600' : 'bg-blue-100 text-blue-600'}`}>
                {role === 'owner' ? '👑 Owner' : '🧑‍💼 Admin'}
              </span>
            </div>
          </div>
        </div>

        <nav className="flex flex-col gap-1 flex-1">
          {/* Owner only: Dashboard */}
          {role === 'owner' && (
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-3 p-2 md:p-3 rounded-xl text-sm font-bold text-left transition-all ${activeTab === 'dashboard' ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}
            >
              <span className="text-xl">📊</span>
              <span className="hidden md:block">Dashboard</span>
            </button>
          )}

          {/* Admin only: POS/Kasir */}
          {role === 'admin' && (
            <button
              onClick={() => setActiveTab('pos')}
              className={`flex items-center gap-3 p-2 md:p-3 rounded-xl text-sm font-bold text-left transition-all ${activeTab === 'pos' ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}
            >
              <span className="text-xl">🧾</span>
              <span className="hidden md:block">Kasir / POS</span>
            </button>
          )}

          {/* Products - both */}
          <Link
            href="/admin/products"
            className="flex items-center gap-3 p-2 md:p-3 text-gray-500 hover:bg-gray-100 rounded-xl text-sm transition-all"
          >
            <span className="text-xl">📦</span>
            <span className="hidden md:block">Products</span>
          </Link>

          {/* Orders - both */}
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-3 p-2 md:p-3 rounded-xl text-sm font-bold text-left transition-all ${activeTab === 'orders' ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}
          >
            <span className="text-xl">🧾</span>
            <span className="hidden md:block">
              Orders
              {pendingOrders > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                  {pendingOrders}
                </span>
              )}
            </span>
          </button>

          <div className="border-t border-gray-200 my-2" />

          <Link href="/" className="flex items-center gap-3 p-2 md:p-3 text-gray-500 hover:bg-gray-100 rounded-xl text-sm transition-all">
            <span className="text-xl">🏠</span>
            <span className="hidden md:block">Back to Store</span>
          </Link>
        </nav>

        <Link
          href="/admin/products"
          className="bg-blue-600 text-white py-2 px-2 md:px-4 rounded-xl text-xs md:text-sm font-bold hover:bg-blue-700 text-center flex items-center justify-center gap-2"
        >
          <span>+</span>
          <span className="hidden md:block">Add Product</span>
        </Link>
      </aside>

      {/* Main */}
      <main className="ml-16 md:ml-60 flex-1 p-4 md:p-8">

        {/* OWNER DASHBOARD */}
        {activeTab === 'dashboard' && role === 'owner' && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-2">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold" style={{ fontFamily: 'Hanken Grotesk, sans-serif' }}>
                  System Dashboard
                </h1>
                <p className="text-gray-400 text-sm">
                  {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                <span className="text-xs text-green-600 font-bold">Real-time Data</span>
              </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-5">
                <div className="flex justify-between items-start mb-3">
                  <div className="bg-blue-50 p-2 rounded-lg">
                    <span className="text-xl">💰</span>
                  </div>
                  <span className={`text-xs font-bold flex items-center gap-0.5 ${revenueTrendUp ? 'text-green-500' : 'text-red-500'}`}>
                    {revenueTrendUp ? '↑' : '↓'} {revenueTrend}%
                  </span>
                </div>
                <p className="text-xs text-gray-400 uppercase font-bold mb-1">Total Penjualan Bulan Ini</p>
                <p className="text-lg md:text-2xl font-bold text-blue-600">${totalRevenue.toFixed(2)}</p>
                <p className="text-xs text-gray-400 mt-1">{orders.length} total transaksi</p>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-5">
                <div className="flex justify-between items-start mb-3">
                  <div className="bg-green-50 p-2 rounded-lg">
                    <span className="text-xl">📦</span>
                  </div>
                  <span className={`text-xs font-bold flex items-center gap-0.5 ${todayOrders.length > 0 ? 'text-green-500' : 'text-gray-400'}`}>
                    {todayOrders.length > 0 ? '↑' : '→'} Hari Ini
                  </span>
                </div>
                <p className="text-xs text-gray-400 uppercase font-bold mb-1">Order Hari Ini</p>
                <p className="text-lg md:text-2xl font-bold text-green-600">{todayOrders.length} Unit</p>
                <p className="text-xs text-gray-400 mt-1">${todayRevenue.toFixed(2)} pemasukan</p>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-5">
                <div className="flex justify-between items-start mb-3">
                  <div className="bg-yellow-50 p-2 rounded-lg">
                    <span className="text-xl">⏳</span>
                  </div>
                  <span className={`text-xs font-bold ${pendingOrders > 0 ? 'text-yellow-500' : 'text-green-500'}`}>
                    {pendingOrders > 0 ? '⚠️ Perlu Aksi' : '✓ Aman'}
                  </span>
                </div>
                <p className="text-xs text-gray-400 uppercase font-bold mb-1">Order Pending</p>
                <p className="text-lg md:text-2xl font-bold text-yellow-500">{pendingOrders}</p>
                <p className="text-xs text-gray-400 mt-1">{completedOrders} sudah delivered</p>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-5">
                <div className="flex justify-between items-start mb-3">
                  <div className="bg-red-50 p-2 rounded-lg">
                    <span className="text-xl">⚠️</span>
                  </div>
                  <span className={`text-xs font-bold ${lowStockProducts.length > 0 ? 'text-red-500' : 'text-green-500'}`}>
                    {lowStockProducts.length > 0 ? '🔴 Kritis' : '✓ Aman'}
                  </span>
                </div>
                <p className="text-xs text-gray-400 uppercase font-bold mb-1">Stok Kritis</p>
                <p className="text-lg md:text-2xl font-bold text-red-500">{lowStockProducts.length}</p>
                <p className="text-xs text-gray-400 mt-1">produk perlu restock</p>
              </div>
            </div>

            {/* Grafik Penjualan */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 md:p-6">
              <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-6 gap-2">
                <div>
                  <h2 className="font-bold text-lg" style={{ fontFamily: 'Hanken Grotesk, sans-serif' }}>
                    📈 Tren Penjualan (7 Hari Terakhir)
                  </h2>
                  <p className="text-xs text-gray-400">Revenue harian dalam dollar</p>
                </div>
                <div className="text-left md:text-right">
                  <p className="text-xs text-gray-400">Total minggu ini</p>
                  <p className="font-bold text-blue-600 text-lg">
                    ${last7Days.reduce((sum, d) => sum + d.revenue, 0).toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="flex items-end gap-2 md:gap-3" style={{ height: '160px' }}>
                {last7Days.map((day, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <p className="text-xs text-blue-600 font-bold" style={{ minHeight: '16px' }}>
                      {day.revenue > 0 ? `$${day.revenue.toFixed(0)}` : ''}
                    </p>
                    <div className="w-full bg-gray-100 rounded-t-lg relative" style={{ height: '100px' }}>
                      <div
                        className={`w-full rounded-t-lg absolute bottom-0 transition-all duration-700 ${day.date === today ? 'bg-blue-600' : 'bg-blue-300'}`}
                        style={{
                          height: `${(day.revenue / maxRevenue) * 100}%`,
                          minHeight: day.revenue > 0 ? '4px' : '0'
                        }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 font-medium">{day.label}</p>
                    <p className="text-xs text-gray-300">{day.count}x</p>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-600 rounded"></div>
                  <span className="text-xs text-gray-400">Hari ini</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-300 rounded"></div>
                  <span className="text-xs text-gray-400">Hari lain</span>
                </div>
              </div>
            </div>

            {/* Bottom Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Restock Alert */}
              <div className="bg-white border border-gray-200 rounded-xl p-5 md:p-6">
                <h2 className="font-bold text-lg mb-4 flex items-center gap-2" style={{ fontFamily: 'Hanken Grotesk, sans-serif' }}>
                  ⚠️ Restock Alert
                  {lowStockProducts.length > 0 && (
                    <span className="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full font-bold">
                      {lowStockProducts.length} item
                    </span>
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
                          <p className="text-sm font-bold">{p.name}</p>
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
              <div className="bg-white border border-gray-200 rounded-xl p-5 md:p-6">
                <h2 className="font-bold text-lg mb-4" style={{ fontFamily: 'Hanken Grotesk, sans-serif' }}>
                  📋 Laporan Ringkas
                </h2>
                <div className="flex flex-col gap-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Total Pendapatan</span>
                    <span className="font-bold text-green-600">${totalRevenue.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Pemasukan Hari Ini</span>
                    <span className="font-bold text-blue-600">${todayRevenue.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Order Selesai</span>
                    <span className="font-bold text-green-500">{completedOrders} order</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Order Dibatalkan</span>
                    <span className="font-bold text-red-500">{cancelledOrders} order</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-gray-600">Total Produk</span>
                    <span className="font-bold text-gray-700">{products.length} produk</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Transactions */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-5 md:px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h2 className="font-bold text-lg" style={{ fontFamily: 'Hanken Grotesk, sans-serif' }}>
                  🧾 Transaksi Terbaru
                </h2>
                <button onClick={() => setActiveTab('orders')} className="text-xs text-blue-600 hover:underline">
                  Lihat Semua →
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 md:px-6 py-3 text-xs text-gray-400 uppercase">Order ID</th>
                      <th className="px-4 md:px-6 py-3 text-xs text-gray-400 uppercase hidden md:table-cell">Tanggal</th>
                      <th className="px-4 md:px-6 py-3 text-xs text-gray-400 uppercase hidden md:table-cell">Pembayaran</th>
                      <th className="px-4 md:px-6 py-3 text-xs text-gray-400 uppercase text-right">Total</th>
                      <th className="px-4 md:px-6 py-3 text-xs text-gray-400 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.slice(0, 5).map(order => (
                      <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="px-4 md:px-6 py-3 font-mono text-xs text-blue-600 font-bold">
                          #{order.id.slice(0, 8).toUpperCase()}
                        </td>
                        <td className="px-4 md:px-6 py-3 text-sm text-gray-400 hidden md:table-cell">
                          {new Date(order.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-4 md:px-6 py-3 text-sm capitalize hidden md:table-cell">
                          {order.payment_method}
                        </td>
                        <td className="px-4 md:px-6 py-3 text-sm font-bold text-right text-blue-600">
                          ${order.total.toFixed(2)}
                        </td>
                        <td className="px-4 md:px-6 py-3">
                          <span className={`text-xs font-bold px-2 py-1 rounded-full ${statusColor[order.status] || 'bg-gray-100 text-gray-600'}`}>
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {orders.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                          Belum ada transaksi
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ADMIN/KASIR POS */}
        {activeTab === 'pos' && role === 'admin' && (
          <div className="flex flex-col gap-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold" style={{ fontFamily: 'Hanken Grotesk, sans-serif' }}>
                🧾 Kasir / Point of Sales
              </h1>
              <p className="text-gray-400 text-sm">Proses transaksi dengan cepat</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <p className="text-xs text-gray-400 uppercase mb-1">Order Pending</p>
                <p className="text-2xl font-bold text-yellow-500">{pendingOrders}</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <p className="text-xs text-gray-400 uppercase mb-1">Selesai Hari Ini</p>
                <p className="text-2xl font-bold text-green-500">{todayOrders.filter(o => o.status === 'delivered').length}</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <p className="text-xs text-gray-400 uppercase mb-1">Pemasukan Hari Ini</p>
                <p className="text-2xl font-bold text-blue-600">${todayRevenue.toFixed(2)}</p>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-5 md:p-6">
              <h2 className="font-bold text-lg mb-4">Proses Pesanan Masuk</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-xs text-gray-400 uppercase">Order ID</th>
                      <th className="px-4 py-3 text-xs text-gray-400 uppercase hidden md:table-cell">Alamat</th>
                      <th className="px-4 py-3 text-xs text-gray-400 uppercase text-right">Total</th>
                      <th className="px-4 py-3 text-xs text-gray-400 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-gray-400">
                          <p className="text-3xl mb-2">📋</p>
                          Belum ada pesanan
                        </td>
                      </tr>
                    ) : orders.map(order => (
                      <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3 font-mono text-xs text-blue-600 font-bold">
                          #{order.id.slice(0, 8).toUpperCase()}
                        </td>
                        <td className="px-4 py-3 text-sm max-w-[200px] truncate hidden md:table-cell">
                          {order.shipping_address}
                        </td>
                        <td className="px-4 py-3 text-sm font-bold text-right text-blue-600">
                          ${order.total.toFixed(2)}
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={order.status}
                            onChange={e => updateOrderStatus(order.id, e.target.value)}
                            className={`text-xs font-bold px-2 py-1 rounded-full border-0 focus:ring-2 focus:ring-blue-500 cursor-pointer ${statusColor[order.status] || 'bg-gray-100 text-gray-600'}`}
                          >
                            <option value="pending">Pending</option>
                            <option value="processing">Processing</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <p className="font-bold text-yellow-700 text-sm">Stok Kritis</p>
                {lowStockProducts.length === 0 ? (
                  <p className="text-xs text-yellow-600">Semua stok aman ✓</p>
                ) : (
                  <p className="text-xs text-yellow-600">
                    {lowStockProducts.map(p => p.name).join(', ')} perlu restock segera!
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ORDERS TAB */}
        {activeTab === 'orders' && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-2">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold" style={{ fontFamily: 'Hanken Grotesk, sans-serif' }}>
                  Orders
                </h1>
                <p className="text-gray-400 text-sm">{orders.length} total pesanan</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <span className="bg-yellow-100 text-yellow-600 px-3 py-1 rounded-full text-xs font-bold">{pendingOrders} Pending</span>
                <span className="bg-green-100 text-green-600 px-3 py-1 rounded-full text-xs font-bold">{completedOrders} Delivered</span>
                <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-xs font-bold">{cancelledOrders} Cancelled</span>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 md:px-6 py-3 text-xs text-gray-400 uppercase">Order ID</th>
                      <th className="px-4 md:px-6 py-3 text-xs text-gray-400 uppercase hidden md:table-cell">Tanggal</th>
                      <th className="px-4 md:px-6 py-3 text-xs text-gray-400 uppercase hidden md:table-cell">Alamat</th>
                      <th className="px-4 md:px-6 py-3 text-xs text-gray-400 uppercase hidden md:table-cell">Pembayaran</th>
                      <th className="px-4 md:px-6 py-3 text-xs text-gray-400 uppercase text-right">Total</th>
                      <th className="px-4 md:px-6 py-3 text-xs text-gray-400 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                          <p className="text-3xl mb-2">📋</p>
                          Belum ada order
                        </td>
                      </tr>
                    ) : orders.map(order => (
                      <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="px-4 md:px-6 py-3 font-mono text-xs text-blue-600 font-bold">
                          #{order.id.slice(0, 8).toUpperCase()}
                        </td>
                        <td className="px-4 md:px-6 py-3 text-sm text-gray-400 hidden md:table-cell">
                          {new Date(order.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-4 md:px-6 py-3 text-sm max-w-[150px] truncate hidden md:table-cell">
                          {order.shipping_address}
                        </td>
                        <td className="px-4 md:px-6 py-3 text-sm capitalize hidden md:table-cell">
                          {order.payment_method}
                        </td>
                        <td className="px-4 md:px-6 py-3 text-sm font-bold text-right text-blue-600">
                          ${order.total.toFixed(2)}
                        </td>
                        <td className="px-4 md:px-6 py-3">
                          <select
                            value={order.status}
                            onChange={e => updateOrderStatus(order.id, e.target.value)}
                            className={`text-xs font-bold px-2 py-1 rounded-full border-0 focus:ring-2 focus:ring-blue-500 cursor-pointer ${statusColor[order.status] || 'bg-gray-100 text-gray-600'}`}
                          >
                            <option value="pending">Pending</option>
                            <option value="processing">Processing</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {orders.length > 0 && (
                <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 flex justify-between">
                  <p className="text-xs text-gray-400">Total revenue: <span className="font-bold text-blue-600">${totalRevenue.toFixed(2)}</span></p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}