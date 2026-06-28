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
    category: string
    stock: number
  }
}

function formatRupiah(amount: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount)
}

export default function CartPage() {
  const router = useRouter()
  const [items, setItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    checkUser()
  }, [])

  async function checkUser() {
    const { data } = await supabase.auth.getUser()
    if (!data.user) { router.push('/login'); return }
    setUser(data.user)
    fetchCart(data.user.id)
  }

  async function fetchCart(userId: string) {
    const { data, error } = await supabase
      .from('carts').select('*, products(*)')
      .eq('user_id', userId)
    if (error) console.error(error)
    else setItems(data || [])
    setLoading(false)
  }

  async function updateQty(id: string, delta: number, currentQty: number) {
    const newQty = currentQty + delta
    if (newQty < 1) return
    await supabase.from('carts').update({ quantity: newQty }).eq('id', id)
    fetchCart(user.id)
  }

  async function removeItem(id: string) {
    await supabase.from('carts').delete().eq('id', id)
    fetchCart(user.id)
  }

  async function clearCart() {
    await supabase.from('carts').delete().eq('user_id', user.id)
    setItems([])
  }

  const subtotal = items.reduce((sum, item) => sum + item.products.price * item.quantity, 0)
  const tax = subtotal * 0.11
  const biayaLayanan = 10000
  const total = subtotal + tax + biayaLayanan

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f7f9fb]">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#f7f9fb]">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 flex justify-between items-center px-4 md:px-8 py-3 w-full shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full transition-all text-gray-500">
            ← Kembali
          </button>
          <Link className="text-xl md:text-2xl font-bold text-gray-900" href="/" style={{ fontFamily: 'Hanken Grotesk, sans-serif' }}>
            Alim Rugi
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <Link className="text-blue-600 font-bold text-sm" href="/cart">🛒 Keranjang ({items.length})</Link>
          <Link className="text-gray-500 text-sm hidden md:block" href="/orders">📋 Pesanan</Link>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-2 text-gray-900" style={{ fontFamily: 'Hanken Grotesk, sans-serif' }}>
          Keranjang Belanja
        </h1>
        <p className="text-gray-400 text-sm mb-6 md:mb-8">
          {items.length === 0 ? 'Keranjang kosong' : `${items.length} produk dalam keranjang`}
        </p>

        {items.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">🛒</p>
            <p className="text-gray-400 mb-4">Keranjang Anda masih kosong</p>
            <Link href="/" className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 inline-block">
              Mulai Belanja
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
            <div className="lg:col-span-8 flex flex-col gap-4">
              {items.map((item) => (
                <div key={item.id} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gray-50 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 border border-gray-100">📦</div>
                    <div className="flex-1">
                      <p className="font-bold text-sm text-gray-900">{item.products.name}</p>
                      <p className="text-xs text-gray-400">{item.products.category}</p>
                      <button onClick={() => removeItem(item.id)} className="text-xs text-red-400 mt-1 hover:text-red-600">
                        🗑 Hapus
                      </button>
                    </div>
                    <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                      <button onClick={() => updateQty(item.id, -1, item.quantity)} className="px-3 py-2 hover:bg-gray-100 text-sm font-bold">−</button>
                      <span className="px-3 py-2 text-sm font-bold border-x border-gray-200">{item.quantity}</span>
                      <button onClick={() => updateQty(item.id, 1, item.quantity)} className="px-3 py-2 hover:bg-gray-100 text-sm font-bold">+</button>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400">{formatRupiah(item.products.price)}</p>
                      <p className="font-bold text-blue-600 text-sm">{formatRupiah(item.products.price * item.quantity)}</p>
                    </div>
                  </div>
                </div>
              ))}
              <div className="flex justify-between pt-2">
                <Link href="/" className="text-sm text-gray-400 hover:text-blue-600">← Lanjut Belanja</Link>
                <button onClick={clearCart} className="text-sm text-red-400 hover:text-red-600">Kosongkan Keranjang</button>
              </div>
            </div>

            <div className="lg:col-span-4">
              <div className="bg-white border border-gray-200 rounded-2xl p-6 sticky top-24 shadow-sm">
                <h2 className="font-bold text-lg mb-4 text-gray-900">Ringkasan Pesanan</h2>
                <div className="flex flex-col gap-2 text-sm mb-4">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Subtotal</span>
                    <span className="font-bold">{formatRupiah(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Pajak (11%)</span>
                    <span className="font-bold">{formatRupiah(tax)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Biaya Layanan</span>
                    <span className="font-bold">{formatRupiah(biayaLayanan)}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between">
                    <span className="font-bold text-lg text-gray-900">Total</span>
                    <span className="font-bold text-lg text-blue-600">{formatRupiah(total)}</span>
                  </div>
                </div>
                <div className="flex gap-2 mb-4">
                  <input className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm" placeholder="Kode Promo" />
                  <button className="bg-gray-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-gray-700">Pakai</button>
                </div>
                <Link href="/checkout" className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 flex items-center justify-center gap-2 transition-all">
                  Checkout Sekarang →
                </Link>
                <p className="text-xs text-gray-400 text-center mt-2">🔒 Pembayaran Aman & Terenkripsi</p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 grid grid-cols-4 py-2 z-50 shadow-lg">
        <Link href="/" className="flex flex-col items-center gap-0.5 text-gray-400">
          <span className="text-xl">🏠</span>
          <span className="text-[10px] font-bold">Toko</span>
        </Link>
        <Link href="/cart" className="flex flex-col items-center gap-0.5 text-blue-600">
          <span className="text-xl">🛒</span>
          <span className="text-[10px] font-bold">Keranjang</span>
        </Link>
        <Link href="/orders" className="flex flex-col items-center gap-0.5 text-gray-400">
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