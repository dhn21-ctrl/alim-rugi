'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Product = {
  id: string
  name: string
  sku: string
  price: number
  stock: number
  category: string
  image_url: string | null
}

export default function Home() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [cartCount, setCartCount] = useState(0)

  useEffect(() => {
    fetchProducts()
    checkUser()
  }, [])

  async function checkUser() {
    const { data } = await supabase.auth.getUser()
    setUser(data.user)
    if (data.user) fetchCartCount(data.user.id)
  }

  async function fetchCartCount(userId: string) {
    const { count } = await supabase
      .from('carts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
    setCartCount(count || 0)
  }

  async function fetchProducts() {
    const { data } = await supabase.from('products').select('*')
    setProducts(data || [])
    setLoading(false)
  }

  async function addToCart(productId: string) {
    if (!user) {
      router.push('/login')
      return
    }
    const { data: existing } = await supabase
      .from('carts')
      .select('*')
      .eq('user_id', user.id)
      .eq('product_id', productId)
      .single()

    if (existing) {
      await supabase
        .from('carts')
        .update({ quantity: existing.quantity + 1 })
        .eq('id', existing.id)
    } else {
      await supabase.from('carts').insert([{
        user_id: user.id,
        product_id: productId,
        quantity: 1,
      }])
    }
    fetchCartCount(user.id)
    alert('Produk ditambahkan ke keranjang! 🛒')
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    setUser(null)
    setCartCount(0)
    router.refresh()
  }

  const categories = ['All', 'Hardware', 'Software', 'Aksesori', 'F&B', 'Home & Living', 'Apparel']

  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category?.toLowerCase().includes(search.toLowerCase())
    const matchCategory = activeCategory === 'All' || p.category === activeCategory
    return matchSearch && matchCategory
  })

  return (
    <main className="min-h-screen bg-[#f7f9fb]">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 flex justify-between items-center px-8 py-3 w-full shadow-sm">
        <div className="flex items-center gap-6">
          <Link className="text-2xl font-bold text-gray-900" href="/" style={{ fontFamily: 'Hanken Grotesk, sans-serif' }}>
            Alim Rugi
          </Link>
          <div className="hidden md:flex gap-4">
            <Link className="text-blue-600 font-bold border-b-2 border-blue-600 text-sm px-1 pb-0.5" href="/">Store</Link>
            <Link className="text-gray-500 hover:text-gray-900 text-sm px-1 transition-colors" href="/orders">Pesanan</Link>
          </div>
        </div>
        <div className="flex-1 max-w-md mx-8 hidden md:block">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
            <input
              className="w-full bg-gray-100 border border-gray-200 rounded-full py-2 pl-9 pr-4 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none focus:bg-white transition-all"
              placeholder="Search products..."
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/cart" className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-all">
            🛒
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full font-bold">
                {cartCount}
              </span>
            )}
          </Link>
          {user ? (
            <div className="flex items-center gap-2">
              <Link href="/admin" className="text-sm text-blue-600 font-bold hover:underline hidden md:block">Admin</Link>
              <Link href="/orders" className="text-sm text-gray-500 hover:text-gray-900 hidden md:block">Pesanan</Link>
              <button onClick={handleLogout} className="text-sm text-gray-400 hover:text-red-500 transition-colors">Logout</button>
            </div>
          ) : (
            <Link href="/login" className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-bold hover:bg-blue-700 transition-all">
              Login
            </Link>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          <div className="md:col-span-8 relative overflow-hidden bg-blue-600 rounded-2xl h-[440px] flex flex-col justify-end p-10">
            <div className="absolute inset-0 opacity-20" style={{
              backgroundImage: 'radial-gradient(circle at 20% 50%, #ffffff 0%, transparent 50%), radial-gradient(circle at 80% 20%, #93c5fd 0%, transparent 40%)'
            }} />
            <div className="relative z-10">
              <span className="inline-block px-3 py-1 bg-white text-blue-600 text-xs font-bold rounded-full mb-3">
                NEW COLLECTION
              </span>
              <h1 className="text-white font-bold mb-4 leading-tight" style={{ fontSize: '2.5rem', fontFamily: 'Hanken Grotesk, sans-serif' }}>
                Elevate Your SME Efficiency.
              </h1>
              <p className="text-blue-100 text-base mb-6 max-w-lg">
                Experience the next generation of inventory management tools designed for high-growth businesses.
              </p>
              <Link
                className="bg-white text-blue-600 px-6 py-3 rounded-full font-bold hover:bg-gray-100 transition-all inline-flex items-center gap-2 shadow-lg"
                href="/cart"
              >
                Shop Now <span>→</span>
              </Link>
            </div>
          </div>
          <div className="md:col-span-4 flex flex-col gap-5">
            <div className="flex-1 bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
              <span className="text-xs uppercase text-gray-400 tracking-wider mb-2 block">⭐ Best Seller</span>
              <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Hanken Grotesk, sans-serif' }}>
                Premium Stock Trackers
              </h2>
              <p className="text-sm text-gray-500 mt-2">Reliable tools for your inventory needs</p>
            </div>
            <div className="flex-1 bg-blue-50 rounded-2xl p-6 border border-blue-100 shadow-sm">
              <h2 className="text-xl font-bold text-blue-800" style={{ fontFamily: 'Hanken Grotesk, sans-serif' }}>
                20% Off Essentials
              </h2>
              <p className="text-sm text-blue-600 mt-1 font-mono">Use code: ALIMRUGI20</p>
              <button className="mt-3 text-blue-600 text-sm font-bold underline hover:opacity-70">
                Browse Deals →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Filter */}
      <section className="px-8 py-3 sticky top-[65px] bg-[#f7f9fb]/90 backdrop-blur-md z-40 border-b border-gray-200">
        <div className="flex justify-between items-center gap-4">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                  activeCategory === cat
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Products */}
      <section className="px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold" style={{ fontFamily: 'Hanken Grotesk, sans-serif' }}>
            {search ? `Hasil: "${search}"` : activeCategory === 'All' ? 'Semua Produk' : activeCategory}
          </h2>
          <p className="text-sm text-gray-400">{filtered.length} produk</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-200 overflow-hidden animate-pulse">
                <div className="aspect-square bg-gray-100" />
                <div className="p-4 flex flex-col gap-2">
                  <div className="h-4 bg-gray-100 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                  <div className="h-8 bg-gray-100 rounded mt-2" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">🔍</p>
            <p className="text-gray-400">Produk tidak ditemukan</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {filtered.map((product) => (
              <div key={product.id} className="bg-white border border-gray-200 rounded-2xl flex flex-col overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-200 group">
                <div className="relative aspect-square bg-gray-50 p-4 flex items-center justify-center overflow-hidden">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <span className="text-6xl group-hover:scale-110 transition-transform">📦</span>
                  )}
                  {product.stock < 10 && product.stock > 0 && (
                    <span className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                      LOW STOCK
                    </span>
                  )}
                  {product.stock === 0 && (
                    <span className="absolute top-2 right-2 bg-gray-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                      HABIS
                    </span>
                  )}
                </div>
                <div className="p-4 flex flex-col gap-1 flex-1">
                  <span className="text-xs text-blue-600 font-bold uppercase tracking-wider">{product.category}</span>
                  <h3 className="font-bold text-sm text-gray-900 line-clamp-2 leading-snug" style={{ fontFamily: 'Hanken Grotesk, sans-serif' }}>
                    {product.name}
                  </h3>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-blue-600 font-bold text-base">${product.price}</span>
                    <span className="text-xs text-gray-400">{product.stock} stok</span>
                  </div>
                  <button
                    onClick={() => addToCart(product.id)}
                    disabled={product.stock === 0}
                    className="mt-3 w-full py-2 bg-gray-100 hover:bg-blue-600 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all rounded-xl text-xs font-bold flex justify-center items-center gap-1"
                  >
                    🛒 Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Newsletter */}
      <section className="px-8 py-8">
        <div className="bg-gray-900 text-white rounded-2xl p-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="max-w-md">
            <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Hanken Grotesk, sans-serif' }}>
              Join the Alim Rugi Network
            </h2>
            <p className="text-gray-400 text-sm">
              Get weekly insights on SME management and exclusive early access.
            </p>
          </div>
          <div className="flex w-full md:w-auto gap-2">
            <input
              className="flex-1 md:w-64 bg-white/10 border border-white/20 rounded-full px-4 py-2 text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Email address"
              type="email"
            />
            <button className="bg-blue-600 text-white px-6 py-2 rounded-full font-bold hover:bg-blue-500 transition-all">
              Join
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 px-8 py-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <p className="font-bold text-gray-900" style={{ fontFamily: 'Hanken Grotesk, sans-serif' }}>Alim Rugi</p>
          <p className="text-xs text-gray-400">© 2024 Alim Rugi UMKM ERP. Built for efficiency.</p>
        </div>
        <div className="flex gap-6">
          <a className="text-xs text-gray-400 hover:text-blue-600 transition-colors" href="#">Support</a>
          <a className="text-xs text-gray-400 hover:text-blue-600 transition-colors" href="#">Privacy Policy</a>
          <a className="text-xs text-gray-400 hover:text-blue-600 transition-colors" href="#">Terms of Service</a>
        </div>
      </footer>
    </main>
  )
}