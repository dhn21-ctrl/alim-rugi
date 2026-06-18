'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Order = {
  id: string
  status: string
  total: number
  payment_method: string
  shipping_address: string
  created_at: string
}

export default function OrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkUser()
  }, [])

  async function checkUser() {
    const { data } = await supabase.auth.getUser()
    if (!data.user) {
      router.push('/login')
      return
    }
    fetchOrders(data.user.id)
  }

  async function fetchOrders(userId: string) {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (error) console.error(error)
    else setOrders(data || [])
    setLoading(false)
  }

  const statusColor: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-600',
    processing: 'bg-blue-100 text-blue-600',
    shipped: 'bg-purple-100 text-purple-600',
    delivered: 'bg-green-100 text-green-600',
    cancelled: 'bg-red-100 text-red-600',
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 flex justify-between items-center px-8 py-2 w-full">
        <Link className="text-2xl font-bold text-gray-900" href="/">Alim Rugi</Link>
        <div className="flex items-center gap-4">
          <Link className="text-gray-500 text-sm" href="/cart">🛒 Cart</Link>
          <Link className="text-blue-600 font-bold text-sm" href="/orders">📋 Pesanan</Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-8 py-8">
        <h1 className="text-3xl font-bold mb-2">Riwayat Pesanan</h1>
        <p className="text-gray-400 text-sm mb-8">Semua pesanan Anda.</p>

        {loading ? (
          <p className="text-gray-400">Loading...</p>
        ) : orders.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">📋</p>
            <p className="text-gray-400 mb-4">Belum ada pesanan</p>
            <Link href="/" className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold">
              Mulai Belanja
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-xs text-gray-400 uppercase mb-1">Nomor Pesanan</p>
                    <p className="font-bold text-blue-600">#{order.id.slice(0, 8).toUpperCase()}</p>
                  </div>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${statusColor[order.status] || 'bg-gray-100 text-gray-600'}`}>
                    {order.status.toUpperCase()}
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-gray-400 uppercase mb-1">Total</p>
                    <p className="font-bold text-blue-600">${order.total.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase mb-1">Pembayaran</p>
                    <p className="font-bold">{order.payment_method || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase mb-1">Tanggal</p>
                    <p className="font-bold">{new Date(order.created_at).toLocaleDateString('id-ID')}</p>
                  </div>
                </div>
                {order.shipping_address && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-xs text-gray-400 uppercase mb-1">Alamat Pengiriman</p>
                    <p className="text-sm">{order.shipping_address}</p>
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