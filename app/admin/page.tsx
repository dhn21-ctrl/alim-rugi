'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
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
  const [orders, setOrders] = useState<Order[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'dashboard' | 'orders'>('dashboard')

  useEffect(() => {
    fetchAll()
  }, [])

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

  const statusColor: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-600',
    processing: 'bg-blue-100 text-blue-600',
    shipped: 'bg-purple-100 text-purple-600',
    delivered: 'bg-green-100 text-green-600',
    cancelled: 'bg-red-100 text-red-600',
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-60 bg-white border-r border-gray-200 flex flex-col p-4 gap-2 fixed h-screen z-40">
        <div className="mb-6">
          <p className="font-bold text-lg">Alim Rugi Admin</p>
          <p className="text-xs text-gray-400">Management Panel</p>
        </div>

        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex items-center gap-2 p-2 rounded-lg text-sm font-bold text-left transition-all ${activeTab === 'dashboard' ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}
        >
          📊 Dashboard
        </button>

        <Link
          href="/admin/products"
          className="flex items-center gap-2 p-2 text-gray-500 hover:bg-gray-100 rounded-lg text-sm"
        >
          📦 Products
        </Link>

        <button
          onClick={() => setActiveTab('orders')}
          className={`flex items-center gap-2 p-2 rounded-lg text-sm font-bold text-left transition-all ${activeTab === 'orders' ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}
        >
          🧾 Orders
          {pendingOrders > 0 && (
            <span className="ml-auto bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
              {pendingOrders}
            </span>
          )}
        </button>

        <div className="border-t border-gray-200 my-2" />

        <Link href="/" className="flex items-center gap-2 p-2 text-gray-500 hover:bg-gray-100 rounded-lg text-sm">
          🏠 Back to Store
        </Link>

        <Link
          href="/admin/products"
          className="mt-auto bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-bold hover:bg-blue-700 text-center"
        >
          + Add Product
        </Link>
      </aside>

      {/* Main */}
      <main className="ml-60 flex-1 p-8">

        {/* DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="flex flex-col gap-6">
            <div>
              <h1 className="text-3xl font-bold">Dashboard</h1>
              <p className="text-gray-400 text-sm">
                {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white border border-gray-200 rounded-lg p-5">
                <div className="flex justify-between items-start mb-3">
                  <p className="text-xs text-gray-400 uppercase">Pemasukan Hari Ini</p>
                  <span className="text-green-500 text-lg">💰</span>
                </div>
                <p className="text-2xl font-bold text-green-600">${todayRevenue.toFixed(2)}</p>
                <p className="text-xs text-gray-400 mt-1">{todayOrders.length} transaksi hari ini</p>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-5">
                <div className="flex justify-between items-start mb-3">
                  <p className="text-xs text-gray-400 uppercase">Total Pemasukan</p>
                  <span className="text-blue-500 text-lg">📈</span>
                </div>
                <p className="text-2xl font-bold text-blue-600">${totalRevenue.toFixed(2)}</p>
                <p className="text-xs text-gray-400 mt-1">{orders.length} total order</p>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-5">
                <div className="flex justify-between items-start mb-3">
                  <p className="text-xs text-gray-400 uppercase">Order Pending</p>
                  <span className="text-yellow-500 text-lg">⏳</span>
                </div>
                <p className="text-2xl font-bold text-yellow-500">{pendingOrders}</p>
                <p className="text-xs text-gray-400 mt-1">perlu diproses</p>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-5">
                <div className="flex justify-between items-start mb-3">
                  <p className="text-xs text-gray-400 uppercase">Order Selesai</p>
                  <span className="text-green-500 text-lg">✅</span>
                </div>
                <p className="text-2xl font-bold text-green-500">{completedOrders}</p>
                <p className="text-xs text-gray-400 mt-1">delivered</p>
              </div>
            </div>

            {/* Grafik */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="font-bold text-lg">Grafik Penjualan</h2>
                  <p className="text-xs text-gray-400">Revenue 7 hari terakhir</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">Total minggu ini</p>
                  <p className="font-bold text-blue-600">
                    ${last7Days.reduce((sum, d) => sum + d.revenue, 0).toFixed(2)}
                  </p>
                </div>
              </div>

              {loading ? (
                <div className="h-48 flex items-center justify-center text-gray-400">Loading...</div>
              ) : (
                <div className="flex items-end gap-2 h-48">
                  {last7Days.map((day, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <p className="text-xs text-blue-600 font-bold h-4">
                        {day.revenue > 0 ? `$${day.revenue.toFixed(0)}` : ''}
                      </p>
                      <div className="w-full bg-gray-100 rounded-t-lg relative" style={{ height: '120px' }}>
                        <div
                          className={`w-full rounded-t-lg absolute bottom-0 transition-all duration-500 ${day.date === today ? 'bg-blue-600' : 'bg-blue-300'}`}
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
              )}

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
              {/* Stok Menipis */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h2 className="font-bold text-lg mb-4">⚠️ Stok Menipis</h2>
                {products.filter(p => p.stock < 10).length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-2xl mb-2">✅</p>
                    <p className="text-gray-400 text-sm">Semua stok aman</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {products.filter(p => p.stock < 10).map(p => (
                      <div key={p.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                        <div>
                          <p className="text-sm font-bold">{p.name}</p>
                          <p className="text-xs text-gray-400">{p.category}</p>
                        </div>
                        <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-1 rounded-full">
                          {p.stock} unit
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                <Link
                  href="/admin/products"
                  className="mt-4 block text-center text-xs text-blue-600 hover:underline"
                >
                  Kelola Produk →
                </Link>
              </div>

              {/* Order Terbaru */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h2 className="font-bold text-lg mb-4">🧾 Order Terbaru</h2>
                {orders.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-2xl mb-2">📋</p>
                    <p className="text-gray-400 text-sm">Belum ada order</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {orders.slice(0, 5).map(order => (
                      <div key={order.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                        <div>
                          <p className="text-sm font-bold font-mono">#{order.id.slice(0, 8).toUpperCase()}</p>
                          <p className="text-xs text-gray-400">
                            {new Date(order.created_at).toLocaleDateString('id-ID')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-blue-600">${order.total.toFixed(2)}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor[order.status] || 'bg-gray-100 text-gray-600'}`}>
                            {order.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <button
                  onClick={() => setActiveTab('orders')}
                  className="mt-4 block text-center text-xs text-blue-600 hover:underline w-full"
                >
                  Lihat Semua Order →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ORDERS TAB */}
        {activeTab === 'orders' && (
          <div className="flex flex-col gap-6">
            <div className="flex justify-between items-end">
              <div>
                <h1 className="text-3xl font-bold">Orders</h1>
                <p className="text-gray-400 text-sm">{orders.length} total pesanan masuk</p>
              </div>
              <div className="flex gap-3 text-sm">
                <span className="bg-yellow-100 text-yellow-600 px-3 py-1 rounded-full font-bold">
                  {pendingOrders} Pending
                </span>
                <span className="bg-green-100 text-green-600 px-3 py-1 rounded-full font-bold">
                  {completedOrders} Delivered
                </span>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-xs text-gray-400 uppercase">Order ID</th>
                    <th className="px-6 py-3 text-xs text-gray-400 uppercase">Tanggal</th>
                    <th className="px-6 py-3 text-xs text-gray-400 uppercase">Alamat</th>
                    <th className="px-6 py-3 text-xs text-gray-400 uppercase">Pembayaran</th>
                    <th className="px-6 py-3 text-xs text-gray-400 uppercase text-right">Total</th>
                    <th className="px-6 py-3 text-xs text-gray-400 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                          Loading...
                        </div>
                      </td>
                    </tr>
                  ) : orders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                        <p className="text-3xl mb-2">📋</p>
                        Belum ada order masuk
                      </td>
                    </tr>
                  ) : orders.map((order) => (
                    <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-blue-600 font-bold">
                        #{order.id.slice(0, 8).toUpperCase()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400">
                        {new Date(order.created_at).toLocaleDateString('id-ID', {
                          day: 'numeric', month: 'short', year: 'numeric'
                        })}
                      </td>
                      <td className="px-6 py-4 text-sm max-w-[180px] truncate" title={order.shipping_address}>
                        {order.shipping_address}
                      </td>
                      <td className="px-6 py-4 text-sm capitalize">{order.payment_method}</td>
                      <td className="px-6 py-4 text-sm text-right font-bold text-blue-600">
                        ${order.total.toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={order.status}
                          onChange={e => updateOrderStatus(order.id, e.target.value)}
                          className={`text-xs font-bold px-2 py-1 rounded-full cursor-pointer border-0 focus:ring-2 focus:ring-blue-500 ${statusColor[order.status] || 'bg-gray-100 text-gray-600'}`}
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

              {orders.length > 0 && (
                <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
                  <p className="text-xs text-gray-400">
                    Total revenue: <span className="font-bold text-blue-600">${totalRevenue.toFixed(2)}</span>
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}