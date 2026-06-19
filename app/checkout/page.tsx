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

export default function CheckoutPage() {
  const router = useRouter()
  const [items, setItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [payment, setPayment] = useState('bank')
  const [courier, setCourier] = useState('jnt')
  const [user, setUser] = useState<any>(null)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')

  const courierPrices: Record<string, number> = {
    jnt: 15000,
    sicepat: 22000,
    gojek: 45000,
  }

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

    const { data: cartData } = await supabase
      .from('carts')
      .select('*, products(*)')
      .eq('user_id', data.user.id)

    if (!cartData || cartData.length === 0) {
      router.push('/cart')
      return
    }
    setItems(cartData)
    setLoading(false)
  }

  const subtotal = items.reduce((sum, item) => sum + item.products.price * item.quantity, 0)
  const ongkir = courierPrices[courier] / 1000
  const tax = subtotal * 0.11
  const total = subtotal + tax + ongkir

  async function handleCheckout() {
    if (!name || !phone || !address) {
      alert('Lengkapi alamat pengiriman dulu!')
      return
    }
    setProcessing(true)

    try {
      // 1. Buat order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([{
          user_id: user.id,
          total: total,
          status: 'pending',
          shipping_address: `${name} | ${phone} | ${address}`,
          payment_method: payment,
          courier: courier,
        }])
        .select()
        .single()

      if (orderError) throw orderError

      // 2. Buat order_items & kurangi stok
      for (const item of items) {
        await supabase.from('order_items').insert([{
          order_id: order.id,
          product_id: item.products.id,
          quantity: item.quantity,
          price: item.products.price,
        }])

        // Kurangi stok produk
        await supabase
          .from('products')
          .update({ stock: item.products.stock - item.quantity })
          .eq('id', item.products.id)
      }

      // 3. Kosongkan cart
      await supabase.from('carts').delete().eq('user_id', user.id)

      // 4. Redirect ke success
      router.push(`/order-success?order_id=${order.id}&total=${total.toFixed(2)}`)

    } catch (err) {
      console.error(err)
      alert('Terjadi kesalahan, coba lagi!')
      setProcessing(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-400">Loading...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 flex justify-between items-center px-8 py-2 w-full">
        <div className="flex items-center gap-4">
          <Link className="text-gray-400 hover:text-blue-600 text-sm" href="/cart">← Kembali</Link>
          <span className="text-gray-200">|</span>
          <Link className="text-2xl font-bold text-blue-600" href="/">Alim Rugi</Link>
        </div>
        <div className="text-sm text-gray-400">🔒 Secure Checkout</div>
      </nav>

      <main className="max-w-6xl mx-auto px-8 py-8">
        <h1 className="text-2xl font-bold mb-6">Review & Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left */}
          <div className="lg:col-span-8 flex flex-col gap-6">

            {/* 1. Alamat */}
            <section className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">1</span>
                <h2 className="font-bold text-lg">Alamat Pengiriman</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-400 uppercase">Nama Penerima</label>
                  <input
                    className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Nama lengkap"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-400 uppercase">No. Telepon</label>
                  <input
                    className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+62 812 xxxx xxxx"
                  />
                </div>
                <div className="flex flex-col gap-1 md:col-span-2">
                  <label className="text-xs text-gray-400 uppercase">Alamat Lengkap</label>
                  <textarea
                    className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    rows={3}
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    placeholder="Jl. nama jalan, kelurahan, kecamatan, kota, kode pos"
                  />
                </div>
              </div>
            </section>

            {/* 2. Kurir */}
            <section className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">2</span>
                <h2 className="font-bold text-lg">Layanan Pengiriman</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  { id: 'jnt', label: 'J&T Express', desc: 'Reguler (2-3 Hari)', price: 'Rp 15.000' },
                  { id: 'sicepat', label: 'SiCepat', desc: 'Best (Next Day)', price: 'Rp 22.000' },
                  { id: 'gojek', label: 'Gojek/Grab', desc: 'Instant (3 Jam)', price: 'Rp 45.000' },
                ].map((c) => (
                  <div
                    key={c.id}
                    onClick={() => setCourier(c.id)}
                    className={`p-4 border rounded-lg flex flex-col gap-1 cursor-pointer transition-all ${courier === c.id ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}
                  >
                    <div className="flex justify-between items-center">
                      <p className="font-bold text-sm">{c.label}</p>
                      {courier === c.id && <span className="text-blue-600 text-sm">✓</span>}
                    </div>
                    <p className="text-xs text-gray-400">{c.desc}</p>
                    <p className="text-sm text-blue-600 font-bold mt-1">{c.price}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* 3. Pembayaran */}
            <section className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">3</span>
                <h2 className="font-bold text-lg">Metode Pembayaran</h2>
              </div>
              <div className="flex flex-col gap-2">
                {[
                  { id: 'bank', icon: '🏦', label: 'Transfer Bank', desc: 'BCA, Mandiri, BNI, BRI' },
                  { id: 'ewallet', icon: '💳', label: 'E-Wallet', desc: 'OVO, GoPay, ShopeePay' },
                  { id: 'card', icon: '💰', label: 'Kartu Kredit/Debit', desc: 'Visa, Mastercard, JCB' },
                ].map((method) => (
                  <div
                    key={method.id}
                    onClick={() => setPayment(method.id)}
                    className={`flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition-all ${payment === method.id ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}
                  >
                    <span className="text-2xl">{method.icon}</span>
                    <div className="flex-1">
                      <p className="font-bold text-sm">{method.label}</p>
                      <p className="text-xs text-gray-400">{method.desc}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${payment === method.id ? 'border-blue-600 bg-blue-600' : 'border-gray-300'}`}>
                      {payment === method.id && <span className="text-white text-xs">✓</span>}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Right: Summary dari Cart */}
          <div className="lg:col-span-4">
            <div className="bg-white border border-gray-200 rounded-lg p-6 sticky top-24">
              <h2 className="font-bold text-lg mb-4">Ringkasan Pesanan</h2>

              {/* Items dari cart */}
              <div className="flex flex-col gap-3 mb-4 max-h-48 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-3 items-center">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-lg flex-shrink-0">📦</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">{item.products.name}</p>
                      <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-xs text-blue-600 font-bold whitespace-nowrap">
                      ${(item.products.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-2 text-sm border-t border-gray-200 pt-4 mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-400">Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Pajak (11%)</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Ongkir</span>
                  <span>${ongkir.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t border-gray-200 pt-2 mt-1">
                  <span>Total</span>
                  <span className="text-blue-600">${total.toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                disabled={processing}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {processing ? 'Memproses...' : 'Proses Pembayaran →'}
              </button>
              <p className="text-xs text-gray-400 text-center mt-2">🔒 Transaksi Aman & Terenkripsi</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}