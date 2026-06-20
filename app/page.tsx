'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ThemeToggle } from './components/ThemeToggle'

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
  const [menuOpen, setMenuOpen] = useState(false)

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
    if (!user) { router.push('/login'); return }
    const { data: existing } = await supabase
      .from('carts').select('*')
      .eq('user_id', user.id).eq('product_id', productId).single()
    if (existing) {
      await supabase.from('carts').update({ quantity: existing.quantity + 1 }).eq('id', existing.id)
    } else {
      await supabase.from('carts').insert([{ user_id: user.id, product_id: productId, quantity: 1 }])
    }
    fetchCartCount(user.id)
    alert('Produk ditambahkan ke keranjang! 🛒')
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    setUser(null)
    setCartCount(0)
    setMenuOpen(false)
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
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 w-full shadow-sm">
        <div className="flex justify-between items-center px-4 md:px-8 py-3">
          <Link className="text-xl md:text-2xl font-bold text-gray-900" href="/" style={{ fontFamily: 'Hanken Grotesk, sans-serif' }}>
            Alim Rugi
          </Link>

          {/* Search Desktop */}
          <div className="flex-1 max-w-md mx-8 hidden md:block">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
              <input
                className="w-full bg-gray-100 border border-gray-200 rounded-full py-2 pl-9 pr-4 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none focus:bg-white transition-all"
                placeholder="Search products..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/" className="text-blue-600 font-bold text-sm">Store</Link>
            <Link href="/orders" className="text-gray-500 hover:text-gray-900 text-sm">Pesanan</Link>
            <ThemeToggle />
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
                <Link href="/profile" className="flex items-center gap-2 border border-gray-200 rounded-full px-3 py-1.5 hover:bg-gray-50 transition-all">
                  <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {(user.user_metadata?.name || user.email || 'U').charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-bold text-gray-700">{user.user_metadata?.name || 'Profil'}</span>
                </Link>
                <Link href="/admin" className="text-sm text-blue-600 font-bold hover:underline">Admin</Link>
                <button onClick={handleLogout} className="text-sm text-gray-400 hover:text-red-500">Logout</button>
              </div>
            ) : (
              <Link href="/login" className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-bold hover:bg-blue-700">
                Login
              </Link>
            )}
          </div>

          {/* Mobile Right */}
          <div className="flex md:hidden items-center gap-2">
            <ThemeToggle />
            <Link href="/cart" className="relative p-2 text-gray-500">
              🛒
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full font-bold">
                  {cartCount}
                </span>
              )}
            </Link>
            <button onClick={() => setMenuOpen(!menuOpen)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
              {menuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>

        {/* Mobile Search */}
        <div className="md:hidden px-4 pb-3">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
            <input
              className="w-full bg-gray-100 border border-gray-200 rounded-full py-2 pl-9 pr-4 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Search products..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 px-4 py-4 flex flex-col gap-2">
            <Link href="/" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 font-bold text-blue-600">
              🏠 Store
            </Link>
            <Link href="/orders" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 text-gray-700">
              📋 Pesanan Saya
            </Link>
            {user ? (
              <>
                <Link href="/profile" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 text-gray-700">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    {(user.user_metadata?.name || user.email || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-sm">{user.user_metadata?.name || 'User'}</p>
                    <p className="text-xs text-gray-400">{user.email}</p>
                  </div>
                </Link>
                <Link href="/admin" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 text-gray-700">
                  ⚙️ Admin Panel
                </Link>
                <button onClick={handleLogout} className="flex items-center gap-3 p-3 rounded-xl hover:bg-red-50 text-red-500 text-left w-full">
                  🚪 Logout
                </button>
              </>
            ) : (
              <Link href="/login" onClick={() => setMenuOpen(false)} className="bg-blue-600 text-white px-4 py-3 rounded-xl font-bold text-center">
                Login / Register
              </Link>
            )}
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="px-4 md:px-8 py-6 md:py-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-5">
          <div className="md:col-span-8 relative overflow-hidden rounded-2xl h-[300px] md:h-[440px] flex flex-col justify-end p-6 md:p-10 bg-blue-700">
            <img
              src="https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1400&q=80"
              alt="Hero"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-blue-900 via-blue-800/70 to-blue-600/30" />
            <div className="relative z-10">
              <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-xs font-bold rounded-full mb-3 border border-white/30">
                NEW COLLECTION
              </span>
              <h1 className="text-white font-bold mb-3 leading-tight text-2xl md:text-4xl" style={{ fontFamily: 'Hanken Grotesk, sans-serif' }}>
                Elevate Your SME Efficiency.
              </h1>
              <p className="text-blue-100 text-sm md:text-base mb-5 max-w-lg hidden md:block">
                Experience the next generation of inventory management tools.
              </p>
              <Link className="bg-white text-blue-700 px-5 py-2.5 md:px-6 md:py-3 rounded-full font-bold hover:bg-blue-50 transition-all inline-flex items-center gap-2 shadow-lg text-sm md:text-base" href="/cart">
                Shop Now →
              </Link>
            </div>
          </div>
          <div className="md:col-span-4 grid grid-cols-2 md:grid-cols-1 gap-4 md:gap-5">
            <div className="bg-white rounded-2xl p-4 md:p-6 border border-gray-200 shadow-sm">
              <span className="text-xs uppercase text-gray-400 tracking-wider mb-1 block font-bold">⭐ Best Seller</span>
              <h2 className="text-base md:text-xl font-bold text-gray-900" style={{ fontFamily: 'Hanken Grotesk, sans-serif' }}>
                Premium Stock Trackers
              </h2>
              <p className="text-xs md:text-sm text-gray-500 mt-1 hidden md:block">Reliable tools for your inventory</p>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-4 md:p-6 border border-blue-100 shadow-sm">
              <span className="text-xs uppercase text-blue-400 tracking-wider mb-1 block font-bold">🏷️ Special Offer</span>
              <h2 className="text-base md:text-xl font-bold text-blue-800" style={{ fontFamily: 'Hanken Grotesk, sans-serif' }}>
                20% Off Essentials
              </h2>
              <p className="text-xs md:text-sm font-mono bg-blue-200/50 inline-block px-2 py-0.5 rounded mt-1 text-blue-600">
                ALIMRUGI20
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Filter */}
      <section className="px-4 md:px-8 py-2 sticky top-[105px] md:top-[65px] bg-[#f7f9fb]/90 backdrop-blur-md z-40 border-b border-gray-200">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 md:px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all flex-shrink-0 ${
                activeCategory === cat
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* Products */}
      <section className="px-4 md:px-8 py-6 md:py-8">
        <div className="flex justify-between items-center mb-4 md:mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900" style={{ fontFamily: 'Hanken Grotesk, sans-serif' }}>
            {search ? `Hasil: "${search}"` : activeCategory === 'All' ? 'Semua Produk' : activeCategory}
          </h2>
          <p className="text-sm text-gray-400">{filtered.length} produk</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-200 overflow-hidden animate-pulse">
                <div className="aspect-square bg-gray-100" />
                <div className="p-3 md:p-4 flex flex-col gap-2">
                  <div className="h-3 bg-gray-100 rounded w-1/3" />
                  <div className="h-4 bg-gray-100 rounded w-3/4" />
                  <div className="h-8 bg-gray-100 rounded mt-2" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">🔍</p>
            <p className="text-gray-400 mb-3">Produk tidak ditemukan</p>
            <button onClick={() => { setSearch(''); setActiveCategory('All') }} className="text-blue-600 text-sm hover:underline">
              Reset filter
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
            {filtered.map((product) => (
              <div key={product.id} className="bg-white border border-gray-200 rounded-2xl flex flex-col overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-200 group">
                <div className="relative aspect-square bg-gray-50 p-3 md:p-4 flex items-center justify-center overflow-hidden">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <span className="text-4xl md:text-6xl group-hover:scale-110 transition-transform duration-300">📦</span>
                  )}
                  {product.stock > 0 && product.stock < 10 && (
                    <span className="absolute top-2 right-2 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full font-bold">LOW</span>
                  )}
                  {product.stock === 0 && (
                    <span className="absolute top-2 right-2 bg-gray-500 text-white text-xs px-1.5 py-0.5 rounded-full font-bold">HABIS</span>
                  )}
                </div>
                <div className="p-3 md:p-4 flex flex-col gap-1 flex-1">
                  <span className="text-xs text-blue-600 font-bold uppercase tracking-wider">{product.category}</span>
                  <h3 className="font-bold text-xs md:text-sm text-gray-900 line-clamp-2 leading-snug" style={{ fontFamily: 'Hanken Grotesk, sans-serif' }}>
                    {product.name}
                  </h3>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-blue-600 font-bold text-sm md:text-base">${product.price}</span>
                    <span className="text-xs text-gray-400 hidden md:block">{product.stock} stok</span>
                  </div>
                  <button
                    onClick={() => addToCart(product.id)}
                    disabled={product.stock === 0}
                    className="mt-2 w-full py-2 bg-gray-100 hover:bg-blue-600 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all rounded-xl text-xs font-bold flex justify-center items-center gap-1"
                  >
                    {product.stock === 0 ? 'Habis' : '🛒 Add to Cart'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Newsletter */}
      <section className="px-4 md:px-8 py-6 md:py-8">
        <div className="relative overflow-hidden bg-gray-900 text-white rounded-2xl p-6 md:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 10% 50%, #3b82f6 0%, transparent 50%)' }} />
          <div className="relative">
            <h2 className="text-xl md:text-2xl font-bold mb-1" style={{ fontFamily: 'Hanken Grotesk, sans-serif' }}>
              Join the Alim Rugi Network
            </h2>
            <p className="text-gray-400 text-sm">Get weekly insights and exclusive early access.</p>
          </div>
          <div className="relative flex w-full md:w-auto gap-2">
            <input
              className="flex-1 md:w-56 bg-white/10 border border-white/20 rounded-full px-4 py-2.5 text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Email address"
              type="email"
            />
            <button className="bg-blue-600 text-white px-4 md:px-6 py-2.5 rounded-full font-bold hover:bg-blue-500 transition-all whitespace-nowrap text-sm">
              Join
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 px-4 md:px-8 py-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="text-center md:text-left">
          <p className="font-bold text-gray-900" style={{ fontFamily: 'Hanken Grotesk, sans-serif' }}>Alim Rugi</p>
          <p className="text-xs text-gray-400 mt-0.5">© 2024 Alim Rugi UMKM ERP. Built for efficiency.</p>
        </div>
        <div className="flex gap-4 md:gap-6 flex-wrap justify-center">
          <a className="text-xs text-gray-400 hover:text-blue-600 transition-colors" href="#">Support</a>
          <a className="text-xs text-gray-400 hover:text-blue-600 transition-colors" href="#">Privacy Policy</a>
          <a className="text-xs text-gray-400 hover:text-blue-600 transition-colors" href="#">Terms of Service</a>
        </div>
      </footer>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 grid grid-cols-4 py-2 z-50 shadow-lg">
        <Link href="/" className="flex flex-col items-center gap-0.5 text-blue-600">
          <span className="text-xl">🏠</span>
          <span className="text-[10px] font-bold">Store</span>
        </Link>
        <Link href="/cart" className="flex flex-col items-center gap-0.5 text-gray-400 relative">
          <span className="text-xl">🛒</span>
          <span className="text-[10px] font-bold">Cart</span>
          {cartCount > 0 && (
            <span className="absolute top-0 right-6 bg-blue-600 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full font-bold">
              {cartCount}
            </span>
          )}
        </Link>
        <Link href="/orders" className="flex flex-col items-center gap-0.5 text-gray-400">
          <span className="text-xl">📋</span>
          <span className="text-[10px] font-bold">Pesanan</span>
        </Link>
        <Link href={user ? '/profile' : '/login'} className="flex flex-col items-center gap-0.5 text-gray-400">
          <span className="text-xl">👤</span>
          <span className="text-[10px] font-bold">{user ? 'Profil' : 'Login'}</span>
        </Link>
      </div>

      <div className="md:hidden h-16" />
    </main>
  )
}