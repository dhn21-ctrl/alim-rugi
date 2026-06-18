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

type User = {
  id: string
  email?: string
}

export default function Home() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [search, setSearch] = useState('')
  const [cartCount, setCartCount] = useState(0)
  const [addedId, setAddedId] = useState<string | null>(null)

  useEffect(() => {
    fetchProducts()

    const authKey = 'alim-rugi-auth'
    const stored = localStorage.getItem(authKey)
    console.log('stored auth:', stored)

    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('SESSION:', session)
      if (session?.user) {
        setUser(session.user)
        fetchCartCount(session.user.id)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('AUTH CHANGE EVENT:', _event)
      console.log('AUTH CHANGE SESSION:', session?.user?.email)
      if (session?.user) {
        setUser(session.user)
        fetchCartCount(session.user.id)
      } else {
        setUser(null)
        setCartCount(0)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchCartCount(userId: string) {
    const { data } = await supabase
      .from('carts')
      .select('id')
      .eq('user_id', userId)
    setCartCount(data?.length || 0)
  }

  async function fetchProducts() {
    const { data, error } = await supabase
      .from('products')
      .select('*')
    if (error) console.error(error)
    else setProducts(data || [])
    setLoading(false)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    setUser(null)
    setCartCount(0)
    window.location.href = '/'
  }

  async function addToCart(productId: string) {
    if (!user) {
      window.location.href = '/login'
      return
    }

    console.log('user id:', user.id)
    console.log('product id:', productId)

    const { data: existing, error: fetchError } = await supabase
      .from('carts')
      .select('*')
      .eq('user_id', user.id)
      .eq('product_id', productId)
      .maybeSingle()

    console.log('existing:', existing, 'fetchError:', fetchError)

    if (existing) {
      const { error: updateError } = await supabase
        .from('carts')
        .update({ quantity: existing.quantity + 1 })
        .eq('id', existing.id)
      console.log('updateError:', updateError)
    } else {
      const { data: insertData, error: insertError } = await supabase
        .from('carts')
        .insert([{ user_id: user.id, product_id: productId, quantity: 1 }])
        .select()
      console.log('insertData:', insertData, 'insertError:', insertError)
    }

    setAddedId(productId)
    setTimeout(() => setAddedId(null), 1500)
    fetchCartCount(user.id)
  }

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <main className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 flex justify-between items-center px-8 py-3 w-full">
        <div className="flex items-center gap-6">
          <Link className="text-2xl font-bold text-blue-600" href="/">Alim Rugi</Link>
          <div className="hidden md:flex gap-4">
            <Link className="text-blue-600 font-bold border-b-2 border-blue-600 text-sm px-1" href="/">Store</Link>
          </div>
        </div>
        <div className="flex-1 max-w-md mx-8 hidden md:block">
          <input
            className="w-full bg-gray-100 border border-gray-200 rounded-lg py-2 pl-4 pr-4 focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
            placeholder="Cari produk..."
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3">
          <Link className="relative text-gray-500 hover:bg-gray-100 p-2 rounded-full" href="/cart">
            🛒
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full font-bold">
                {cartCount}
              </span>
            )}
          </Link>
          {user ? (
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400 hidden md:block">{user.email}</span>
              <Link href="/orders" className="text-sm text-gray-500 hover:text-blue-600">Pesanan</Link>
              <Link href="/admin" className="text-sm text-blue-600 font-bold hover:underline">Admin</Link>
              <button onClick={handleLogout} className="text-sm text-red-400 hover:text-red-600">Logout</button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login" className="text-sm text-gray-500 hover:text-blue-600">Login</Link>
              <Link href="/register" className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-bold hover:bg-blue-700">
                Daftar
              </Link>
            </div>
          )}
        </div>
      </nav>

      <section className="px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          <div className="md:col-span-8 bg-blue-600 rounded-xl h-[400px] flex flex-col justify-end p-8">
            <span className="inline-block px-2 py-1 bg-white text-blue-600 text-xs font-bold rounded-lg mb-2 w-fit">NEW COLLECTION</span>
            <h1 className="text-white text-4xl font-bold mb-4">Elevate Your SME Efficiency.</h1>
            <p className="text-white/90 text-base mb-6">Next generation inventory management tools.</p>
            <Link className="bg-white text-blue-600 px-6 py-3 rounded-lg font-bold hover:bg-gray-100 w-fit" href="/cart">
              Shop Now →
            </Link>
          </div>
          <div className="md:col-span-4 flex flex-col gap-5">
            <div className="flex-1 bg-gray-100 rounded-xl p-6 border border-gray-200">
              <span className="text-xs uppercase text-gray-400 mb-1 block">Best Seller</span>
              <h2 className="text-xl font-bold">Premium Stock Trackers</h2>
            </div>
            <div className="flex-1 bg-blue-50 rounded-xl p-6 border border-gray-200">
              <h2 className="text-xl font-bold text-blue-800">20% Off Essentials</h2>
              <p className="text-sm text-blue-600 mt-1">Use code: ALIMRUGI20</p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">
            {search ? `Hasil: "${search}"` : 'Semua Produk'}
          </h2>
          <span className="text-sm text-gray-400">{filtered.length} produk</span>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {[1,2,3,4].map(i => (
              <div key={i} className="border border-gray-200 bg-white rounded-lg animate-pulse">
                <div className="aspect-square bg-gray-200 rounded-t-lg" />
                <div className="p-4 flex flex-col gap-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
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
              <div key={product.id} className="border border-gray-200 bg-white rounded-lg flex flex-col hover:shadow-md transition-shadow">
                <div className="relative aspect-square bg-gray-100 p-4 flex items-center justify-center rounded-t-lg">
                  <div className="text-5xl">📦</div>
                  {product.stock < 10 && product.stock > 0 && (
                    <span className="absolute top-2 right-2 bg-red-500 text-white text-xs px-1 py-0.5 rounded">
                      LOW STOCK
                    </span>
                  )}
                  {product.stock === 0 && (
                    <div className="absolute inset-0 bg-white/70 flex items-center justify-center rounded-t-lg">
                      <span className="text-sm font-bold text-gray-400">HABIS</span>
                    </div>
                  )}
                </div>
                <div className="p-4 flex flex-col gap-1 flex-1">
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="font-semibold text-sm text-gray-900 line-clamp-2">{product.name}</h3>
                    <span className="text-sm text-blue-600 font-bold whitespace-nowrap">${product.price}</span>
                  </div>
                  <span className="text-xs text-gray-400">{product.category}</span>
                  <span className="text-xs text-gray-400">Stok: {product.stock}</span>
                  <button
                    onClick={() => addToCart(product.id)}
                    disabled={product.stock === 0}
                    className={`mt-auto w-full py-2 transition-colors rounded-lg text-xs flex justify-center items-center gap-1 font-bold
                      ${addedId === product.id
                        ? 'bg-green-500 text-white'
                        : product.stock === 0
                        ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                        : 'bg-gray-100 hover:bg-blue-600 hover:text-white'
                      }`}
                  >
                    {addedId === product.id ? '✓ Ditambahkan!' : '+ Add to Cart'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <footer className="bg-white border-t border-gray-200 px-8 py-6 mt-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <p className="font-bold text-blue-600">Alim Rugi</p>
            <p className="text-xs text-gray-400">© 2024 Alim Rugi UMKM ERP</p>
          </div>
          <div className="flex gap-6">
            <Link href="#" className="text-xs text-gray-400 hover:text-blue-600">Support</Link>
            <Link href="#" className="text-xs text-gray-400 hover:text-blue-600">Privacy Policy</Link>
            <Link href="#" className="text-xs text-gray-400 hover:text-blue-600">Terms</Link>
          </div>
        </div>
      </footer>
    </main>
  )
}