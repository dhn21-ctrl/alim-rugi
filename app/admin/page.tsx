'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

type Product = {
  id: string
  name: string
  sku: string
  price: number
  stock: number
  category: string
}

export default function AdminPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', sku: '', price: '', stock: '', category: '' })

  useEffect(() => {
    fetchProducts()
  }, [])

  async function fetchProducts() {
    const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false })
    if (error) console.error(error)
    else setProducts(data || [])
    setLoading(false)
  }

  async function handleAdd() {
    const { error } = await supabase.from('products').insert([{
      name: form.name,
      sku: form.sku,
      price: parseFloat(form.price),
      stock: parseInt(form.stock),
      category: form.category,
    }])
    if (error) alert('Error: ' + error.message)
    else {
      alert('Produk berhasil ditambahkan!')
      setForm({ name: '', sku: '', price: '', stock: '', category: '' })
      setShowForm(false)
      fetchProducts()
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Hapus produk ini?')) return
    const { error } = await supabase.from('products').delete().eq('id', id)
    if (error) alert('Error: ' + error.message)
    else fetchProducts()
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-60 bg-gray-50 border-r border-gray-200 flex flex-col p-4 gap-2 fixed h-screen">
        <div className="mb-6">
          <p className="font-bold text-lg">Alim Rugi Admin</p>
          <p className="text-xs text-gray-400">Dashboard</p>
        </div>
        <Link href="/admin" className="flex items-center gap-2 p-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-bold">
          📊 Dashboard
        </Link>
        <Link href="/admin/products" className="flex items-center gap-2 p-2 text-gray-500 hover:bg-gray-100 rounded-lg text-sm">
          📦 Products
        </Link>
        <Link href="/" className="flex items-center gap-2 p-2 text-gray-500 hover:bg-gray-100 rounded-lg text-sm">
          🏠 Back to Store
        </Link>
        <button
          onClick={() => setShowForm(true)}
          className="mt-auto bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-bold hover:bg-blue-700"
        >
          + Add Product
        </button>
      </aside>

      {/* Main */}
      <main className="ml-60 flex-1 p-8">
        <h1 className="text-3xl font-bold mb-2">Inventory Management</h1>
        <p className="text-gray-400 text-sm mb-6">Real-time tracking for product catalog.</p>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-xs text-gray-400 uppercase mb-1">Total Products</p>
            <p className="text-2xl font-bold text-blue-600">{products.length}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-xs text-gray-400 uppercase mb-1">Low Stock</p>
            <p className="text-2xl font-bold text-red-500">{products.filter(p => p.stock < 10).length}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-xs text-gray-400 uppercase mb-1">Total Value</p>
            <p className="text-2xl font-bold text-green-600">
              ${products.reduce((sum, p) => sum + p.price * p.stock, 0).toFixed(0)}
            </p>
          </div>
        </div>

        {/* Add Form */}
        {showForm && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <h2 className="font-bold text-lg mb-4">Tambah Produk Baru</h2>
            <div className="grid grid-cols-2 gap-4">
              <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="Nama Produk" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
              <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="SKU" value={form.sku} onChange={e => setForm({...form, sku: e.target.value})} />
              <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="Harga" type="number" value={form.price} onChange={e => setForm({...form, price: e.target.value})} />
              <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="Stok" type="number" value={form.stock} onChange={e => setForm({...form, stock: e.target.value})} />
              <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm col-span-2" placeholder="Kategori" value={form.category} onChange={e => setForm({...form, category: e.target.value})} />
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={handleAdd} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700">Simpan</button>
              <button onClick={() => setShowForm(false)} className="bg-gray-200 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-300">Batal</button>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-xs text-gray-400 uppercase">Produk</th>
                <th className="px-6 py-3 text-xs text-gray-400 uppercase">SKU</th>
                <th className="px-6 py-3 text-xs text-gray-400 uppercase">Kategori</th>
                <th className="px-6 py-3 text-xs text-gray-400 uppercase text-right">Harga</th>
                <th className="px-6 py-3 text-xs text-gray-400 uppercase">Stok</th>
                <th className="px-6 py-3 text-xs text-gray-400 uppercase text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-4 text-center text-gray-400">Loading...</td></tr>
              ) : products.map((product) => (
                <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-6 py-4 font-semibold text-sm">{product.name}</td>
                  <td className="px-6 py-4 text-xs text-gray-400 font-mono">{product.sku}</td>
                  <td className="px-6 py-4 text-sm">{product.category}</td>
                  <td className="px-6 py-4 text-sm text-right font-bold">${product.price}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${product.stock < 10 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                      {product.stock} unit
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button onClick={() => handleDelete(product.id)} className="text-red-400 hover:text-red-600 text-sm">🗑 Hapus</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  )
}