'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type CartItem = {
  id: string
  quantity: number
  products: {
    id: string
    name: string
    price: number
    stock: number
    category: string
  }
}

function formatRupiah(amount: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount)
}

export default function CheckoutPage() {
  const router = useRouter()
  const [items, setItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [payment, setPayment] = useState('transfer')
  const [courier, setCourier] = useState('jnt')
  const [user, setUser] = useState<any>(null)
  const [nama, setNama] = useState('')
  const [telepon, setTelepon] = useState('')
  const [alamat, setAlamat] = useState('')
  const [kodePos, setKodePos] = useState('')

  const ongkirMap: Record<string, number> = {
    jnt: 15000, sicepat: 22000, gojek: 45000
  }

  useEffect(() => { checkUser() }, [])

  async function checkUser() {
    const { data } = await supabase.auth.getUser()
    if (!data.user) { router.push('/login'); return }
    setUser(data.user)
    setNama(data.user.user_metadata?.name || '')
    setTelepon(data.user.user_metadata?.phone || '')
    setAlamat(data.user.user_metadata?.address || '')

    const { data: cartData } = await supabase
      .from('carts').select('*, products(*)')
      .eq('user_id', data.user.id)
    if (!cartData || cartData.length === 0) { router.push('/cart'); return }
    setItems(cartData)
    setLoading(false)
  }

  const subtotal = items.reduce((sum, item) => sum + item.products.price * item.quantity, 0)
  const ongkir = ongkirMap[courier]
  const pajak = subtotal * 0.11
  const total = subtotal + pajak + ongkir

  async function handleCheckout() {
    if (!nama || !telepon || !alamat) {
      alert('Lengkapi semua data pengiriman!')
      return
    }
    setProcessing(true)
    try {
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([{
          user_id: user.id,
          total,
          status: 'pending',
          shipping_address: `${nama} | ${telepon} | ${alamat} ${kodePos}`,
          payment_method: payment,
          courier,
        }])
        .select().single()
      if (orderError) throw orderError

      for (const item of items) {
        await supabase.from('order_items').insert([{
          order_id: order.id,
          product_id: item.products.id,
          quantity: item.quantity,
          price: item.products.price,
        }])
        await supabase.from('products')
          .update({ stock: item.products.stock - item.quantity })
          .eq('id', item.products.id)
      }

      await supabase.from('carts').delete().eq('user_id', user.id)
      router.push(`/order-success?order_id=${order.id}&total=${total}`)
    } catch (err) {
      console.error(err)
      alert('Terjadi kesalahan, coba lagi!')
      setProcessing(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f7f9fb]">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#f7f9fb]">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 flex justify-between items-center px-4 md:px-8 py-3 w-full shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-all text-sm">
            ← Kembali
          </button>
          <span className="text-gray-200">|</span>
          <Link className="text-xl font-bold text-blue-600" href="/" style={{ fontFamily: 'Hanken Grotesk, sans-serif' }}>
            Alim Rugi
          </Link>
        </div>
        <div className="text-sm text-gray-400 hidden md:flex items-center gap-1">
          🔒 Pembayaran Aman
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-8">
        <h1 className="text-xl md:text-2xl font-bold mb-6 text-gray-900" style={{ fontFamily: 'Hanken Grotesk, sans-serif' }}>
          Periksa & Checkout
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
          <div className="lg:col-span-8 flex flex-col gap-5">

            {/* 1. Alamat */}
            <section className="bg-white border border-gray-200 rounded-2xl p-5 md:p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">1</span>
                <h2 className="font-bold text-lg text-gray-900">Alamat Pengiriman</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-400 uppercase font-bold">Nama Penerima</label>
                  <input className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="Nama lengkap" value={nama} onChange={e => setNama(e.target.value)} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-400 uppercase font-bold">No. Telepon</label>
                  <input className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="+62 812 xxxx xxxx" value={telepon} onChange={e => setTelepon(e.target.value)} />
                </div>
                <div className="flex flex-col gap-1 md:col-span-2">
                  <label className="text-xs text-gray-400 uppercase font-bold">Alamat Lengkap</label>
                  <textarea className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:outline-none" rows={3} placeholder="Jl. nama jalan, kelurahan, kecamatan, kota" value={alamat} onChange={e => setAlamat(e.target.value)} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-400 uppercase font-bold">Kode Pos</label>
                  <input className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="12345" value={kodePos} onChange={e => setKodePos(e.target.value)} />
                </div>
              </div>
            </section>

            {/* 2. Kurir */}
            <section className="bg-white border border-gray-200 rounded-2xl p-5 md:p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">2</span>
                <h2 className="font-bold text-lg text-gray-900">Layanan Pengiriman</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  { id: 'jnt', label: 'J&T Express', desc: 'Reguler (2-3 Hari)', price: 'Rp 15.000' },
                  { id: 'sicepat', label: 'SiCepat', desc: 'Terbaik (Besok)', price: 'Rp 22.000' },
                  { id: 'gojek', label: 'GoSend/GrabExpress', desc: 'Instan (3 Jam)', price: 'Rp 45.000' },
                ].map(c => (
                  <div key={c.id} onClick={() => setCourier(c.id)} className={`p-4 border rounded-xl cursor-pointer transition-all ${courier === c.id ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}>
                    <div className="flex justify-between items-center">
                      <p className="font-bold text-sm text-gray-900">{c.label}</p>
                      {courier === c.id && <span className="text-blue-600 text-sm font-bold">✓</span>}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{c.desc}</p>
                    <p className="text-sm text-blue-600 font-bold mt-1">{c.price}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* 3. Pembayaran */}
            <section className="bg-white border border-gray-200 rounded-2xl p-5 md:p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">3</span>
                <h2 className="font-bold text-lg text-gray-900">Metode Pembayaran</h2>
              </div>
              <div className="flex flex-col gap-2">
                {[
                  { id: 'transfer', icon: '🏦', label: 'Transfer Bank', desc: 'BCA, Mandiri, BNI, BRI' },
                  { id: 'ewallet', icon: '💳', label: 'Dompet Digital', desc: 'OVO, GoPay, ShopeePay, Dana' },
                  { id: 'cod', icon: '💵', label: 'Bayar di Tempat (COD)', desc: 'Bayar saat paket tiba' },
                ].map(method => (
                  <div key={method.id} onClick={() => setPayment(method.id)} className={`flex items-center gap-4 p-4 border rounded-xl cursor-pointer transition-all ${payment === method.id ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}>
                    <span className="text-2xl">{method.icon}</span>
                    <div className="flex-1">
                      <p className="font-bold text-sm text-gray-900">{method.label}</p>
                      <p className="text-xs text-gray-400">{method.desc}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${payment === method.id ? 'border-blue-600 bg-blue-600' : 'border-gray-300'}`}>
                      {payment === method.id && <span className="text-white text-xs">✓</span>}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Ringkasan */}
          <div className="lg:col-span-4">
            <div className="bg-white border border-gray-200 rounded-2xl p-5 md:p-6 sticky top-24 shadow-sm">
              <h2 className="font-bold text-lg mb-4 text-gray-900">Ringkasan Pesanan</h2>
              <div className="flex flex-col gap-3 mb-4 max-h-48 overflow-y-auto">
                {items.map(item => (
                  <div key={item.id} className="flex gap-3 items-center">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-lg flex-shrink-0">📦</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">{item.products.name}</p>
                      <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-xs text-blue-600 font-bold whitespace-nowrap">
                      {formatRupiah(item.products.price * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-2 text-sm border-t border-gray-200 pt-4 mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-400">Subtotal</span>
                  <span className="font-bold">{formatRupiah(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Pajak (11%)</span>
                  <span className="font-bold">{formatRupiah(pajak)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Ongkos Kirim</span>
                  <span className="font-bold">{formatRupiah(ongkir)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t border-gray-200 pt-2 mt-1">
                  <span className="text-gray-900">Total</span>
                  <span className="text-blue-600">{formatRupiah(total)}</span>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                disabled={processing}
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-70 flex items-center justify-center gap-2 transition-all"
              >
                {processing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Memproses...
                  </>
                ) : 'Bayar Sekarang →'}
              </button>
              <p className="text-xs text-gray-400 text-center mt-2">🔒 Transaksi Aman & Terenkripsi</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}