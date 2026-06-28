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

function formatRupiah(amount: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount)
}

export default function OrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { checkUser() }, [])

  async function checkUser() {
    const { data } = await supabase.auth.getUser()
    if (!data.user) { router.push('/login'); return }
    fetchOrders(data.user.id)
  }

  async function fetchOrders(userId: string) {
    const { data } = await supabase
      .from('orders').select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    setOrders(data || [])
    setLoading(false)
  }

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

  return (
    <div className="min-h-screen bg-[#f7f9fb]">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 flex justify-between items-center px-4 md:px-8 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 text-sm transition-all">
            ← Kembali
          </button>
          <Link className="text-xl font-bold text-gray-900" href="/" style={{ fontFamily: 'Hanken Grotesk, sans-serif' }}>Alim Rugi</Link>
        </div>
        <div className="flex items-center gap-4">
          <Link className="text-gray-500 text-sm hover:text-gray-900" href="/">🏠 Toko</Link>
          <Link className="text-blue-600 font-bold text-sm" href="/orders">📋 Pesanan</Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 md:px-8 py-6 md:py-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-2 text-gray-900" style={{ fontFamily: 'Hanken Grotesk, sans-serif' }}>
          Riwayat Pesanan
        </h1>
        <p className="text-gray-400 text-sm mb-6 md:mb-8">Semua pesanan yang pernah Anda buat</p>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">📋</p>
            <p className="text-gray-400 mb-4">Belum ada pesanan</p>
            <Link href="/" className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 inline-block">
              Mulai Belanja
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {orders.map(order => (
              <div key={order.id} className="bg-white border border-gray-200 rounded-2xl p-5 md:p-6 shadow-sm">
                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-3 mb-4">
                  <div>
                    <p className="text-xs text-gray-400 uppercase font-bold mb-1">Nomor Pesanan</p>
                    <p className="font-bold text-blue-600 font-mono">#{order.id.slice(0, 8).toUpperCase()}</p>
                  </div>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full w-fit ${statusColor[order.status] || 'bg-gray-100 text-gray-600'}`}>
                    {statusLabel[order.status] || order.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-gray-400 uppercase font-bold mb-1">Total</p>
                    <p className="font-bold text-blue-600">{formatRupiah(order.total)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase font-bold mb-1">Pembayaran</p>
                    <p className="font-bold text-gray-700 capitalize">{order.payment_method || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase font-bold mb-1">Kurir</p>
                    <p className="font-bold text-gray-700 capitalize">{order.courier || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase font-bold mb-1">Tanggal</p>
                    <p className="font-bold text-gray-700">
                      {new Date(order.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                </div>
                {order.shipping_address && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-xs text-gray-400 uppercase font-bold mb-1">Alamat Pengiriman</p>
                    <p className="text-sm text-gray-600">{order.shipping_address}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 grid grid-cols-4 py-2 z-50 shadow-lg">
        <Link href="/" className="flex flex-col items-center gap-0.5 text-gray-400">
          <span className="text-xl">🏠</span>
          <span className="text-[10px] font-bold">Toko</span>
        </Link>
        <Link href="/cart" className="flex flex-col items-center gap-0.5 text-gray-400">
          <span className="text-xl">🛒</span>
          <span className="text-[10px] font-bold">Keranjang</span>
        </Link>
        <Link href="/orders" className="flex flex-col items-center gap-0.5 text-blue-600">
          <span className="text-xl">📋</span>
          <span className="text-[10px] font-bold">Pesanan</span>
        </Link>
        <Link href="/profile" className="flex flex-col items-center gap-0.5 text-gray-400">
          <span className="text-xl">👤</span>
          <span className="text-[10px] font-bold">Profil</span>
        </Link>
      </div>
      <div className="md:hidden h-16" />
    </div>
  )
}