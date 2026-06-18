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
    if (!data.user) {
      router.push('/login')
      return
    }
    setUser(data.user)
    fetchCart(data.user.id)
  }

  async function fetchCart(userId: string) {
    const { data, error } = await supabase
      .from('carts')
      .select('*, products(*)')
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
  const total = subtotal + tax + 10

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-400">Loading...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 flex justify-between items-center px-8 py-2 w-full">
        <Link className="text-2xl font-bold text-gray-900" href="/">Alim Rugi</Link>
        <div className="flex items-center gap-4">
          <Link className="text-blue-600 font-bold text-sm" href="/cart">🛒 Cart ({items.length})</Link>
          <Link className="text-gray-500 text-sm" href="/orders">📋 Pesanan</Link>
          <Link className="text-gray-500 text-sm" href="/admin">Admin</Link>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-8 py-8">
        <h1 className="text-3xl font-bold mb-2">Keranjang Belanja</h1>
        <p className="text-gray-400 text-sm mb-8">
          {items.length === 0 ? 'Keranjang kosong' : `${items.length} item dalam keranjang`}
        </p>

        {items.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">🛒</p>
            <p className="text-gray-400 mb-4">Keranjang kosong</p>
            <Link href="/" className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold">
              Mulai Belanja
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 flex flex-col gap-4">
              {items.map((item) => (
                <div key={item.id} className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-2xl flex-shrink-0">
                      📦
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-sm">{item.products.name}</p>
                      <p className="text-xs text-gray-400">{item.products.category}</p>
                      <button onClick={() => removeItem(item.id)} className="text-xs text-red-400 mt-1">
                        Hapus
                      </button>
                    </div>
                    <div className="flex items-center border border-gray-200 rounded-lg">
                      <button onClick={() => updateQty(item.id, -1, item.quantity)} className="px-3 py-1 hover:bg-gray-100 text-sm">−</button>
                      <span className="px-3 py-1 text-sm font-bold">{item.quantity}</span>
                      <button onClick={() => updateQty(item.id, 1, item.quantity)} className="px-3 py-1 hover:bg-gray-100 text-sm">+</button>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400">${item.products.price}</p>
                      <p className="font-bold text-blue-600">${(item.products.price * item.quantity).toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              ))}
              <div className="flex justify-between pt-2">
                <Link href="/" className="text-sm text-gray-400 hover:text-blue-600">← Lanjut Belanja</Link>
                <button onClick={clearCart} className="text-sm text-red-400">Kosongkan Keranjang</button>
              </div>
            </div>

            <div className="lg:col-span-4">
              <div className="bg-white border border-gray-200 rounded-lg p-6 sticky top-24">
                <h2 className="font-bold text-lg mb-4">Ringkasan Pesanan</h2>
                <div className="flex flex-col gap-2 text-sm mb-4">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Pajak (11%)</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Biaya Layanan</span>
                    <span>$10.00</span>
                  </div>
                  <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span className="text-blue-600">${total.toFixed(2)}</span>
                  </div>
                </div>
                <Link
                  href="/checkout"
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-blue-700"
                >
                  Checkout Sekarang →
                </Link>
                <p className="text-xs text-gray-400 text-center mt-2">🔒 Pembayaran Aman</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}