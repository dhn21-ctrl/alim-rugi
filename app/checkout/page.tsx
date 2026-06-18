'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function CheckoutPage() {
  const router = useRouter()
  const [payment, setPayment] = useState('bank')
  const [loading, setLoading] = useState(false)

  async function handleCheckout() {
    setLoading(true)
    setTimeout(() => {
      router.push('/order-success')
    }, 1500)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 flex justify-between items-center px-8 py-2 w-full">
        <div className="flex items-center gap-4">
          <Link className="text-gray-400 hover:text-blue-600 text-sm flex items-center gap-1" href="/cart">
            ← Kembali
          </Link>
          <span className="text-gray-200">|</span>
          <Link className="text-2xl font-bold text-blue-600" href="/">Alim Rugi</Link>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          🔒 Secure Checkout
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-8 py-8">
        <h1 className="text-2xl font-bold mb-6">Review & Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: Forms */}
          <div className="lg:col-span-8 flex flex-col gap-6">

            {/* 1. Shipping */}
            <section className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">1</span>
                  <h2 className="font-bold text-lg">Alamat Pengiriman</h2>
                </div>
                <button className="text-blue-600 text-sm hover:underline">Ubah</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-400 uppercase">Nama Penerima</label>
                  <input className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm" defaultValue="Budi Santoso" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-400 uppercase">No. Telepon</label>
                  <input className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm" defaultValue="+62 812 3456 7890" />
                </div>
                <div className="flex flex-col gap-1 md:col-span-2">
                  <label className="text-xs text-gray-400 uppercase">Alamat Lengkap</label>
                  <textarea className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm resize-none" rows={3} defaultValue="Jl. Merdeka No. 123, Jakarta Pusat 10110" />
                </div>
              </div>
            </section>

            {/* 2. Delivery */}
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
                ].map((courier) => (
                  <label key={courier.id} className="cursor-pointer">
                    <input type="radio" name="courier" value={courier.id} className="sr-only" defaultChecked={courier.id === 'jnt'} />
                    <div className={`p-4 border rounded-lg flex flex-col gap-1 transition-all ${courier.id === 'jnt' ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}>
                      <p className="font-bold text-sm">{courier.label}</p>
                      <p className="text-xs text-gray-400">{courier.desc}</p>
                      <p className="text-sm text-blue-600 font-bold mt-1">{courier.price}</p>
                    </div>
                  </label>
                ))}
              </div>
            </section>

            {/* 3. Payment */}
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
                  <button
                    key={method.id}
                    onClick={() => setPayment(method.id)}
                    className={`flex items-center gap-4 p-4 border rounded-lg text-left transition-all ${payment === method.id ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}
                  >
                    <span className="text-2xl">{method.icon}</span>
                    <div>
                      <p className="font-bold text-sm">{method.label}</p>
                      <p className="text-xs text-gray-400">{method.desc}</p>
                    </div>
                    {payment === method.id && <span className="ml-auto text-blue-600">✓</span>}
                  </button>
                ))}
              </div>
            </section>
          </div>

          {/* Right: Summary */}
          <div className="lg:col-span-4">
            <div className="bg-white border border-gray-200 rounded-lg p-6 sticky top-24">
              <h2 className="font-bold text-lg mb-4">Ringkasan Pesanan</h2>

              <div className="flex flex-col gap-3 mb-4">
                {[
                  { name: 'AR-Scan Pro Wireless', qty: 1, price: 129.00 },
                  { name: 'Cloud Label Printer V2', qty: 2, price: 199.00 },
                ].map((item, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-xl flex-shrink-0">📦</div>
                    <div className="flex-1">
                      <p className="text-sm font-bold">{item.name}</p>
                      <p className="text-xs text-gray-400">Qty: {item.qty}</p>
                      <p className="text-xs text-blue-600">${(item.price * item.qty).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 mb-4">
                <input className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="Kode Promo" />
                <button className="bg-gray-600 text-white px-3 py-2 rounded-lg text-sm">Pakai</button>
              </div>

              <div className="flex flex-col gap-2 text-sm border-t border-gray-200 pt-4 mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-400">Subtotal</span>
                  <span>$527.00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Ongkir</span>
                  <span>$1.50</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Biaya Platform</span>
                  <span>$0.20</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t border-gray-200 pt-2 mt-1">
                  <span>Total</span>
                  <span className="text-blue-600">$528.70</span>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {loading ? 'Memproses...' : 'Proses Pembayaran →'}
              </button>
              <p className="text-xs text-gray-400 text-center mt-2">🔒 Transaksi Aman & Terenkripsi</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}