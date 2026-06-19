'use client'
import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
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

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [form, setForm] = useState({ name: '', sku: '', price: '', stock: '', category: '' })
  const [search, setSearch] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchProducts()
  }, [])

  async function fetchProducts() {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) console.error(error)
    else setProducts(data || [])
    setLoading(false)
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  async function uploadImage(file: File): Promise<string | null> {
    const ext = file.name.split('.').pop()
    const fileName = `${Date.now()}.${ext}`
    const { error } = await supabase.storage
      .from('products')
      .upload(fileName, file)
    if (error) {
      console.error(error)
      return null
    }
    const { data } = supabase.storage.from('products').getPublicUrl(fileName)
    return data.publicUrl
  }

  async function handleSave() {
    if (!form.name || !form.sku || !form.price || !form.stock) {
      alert('Semua field harus diisi!')
      return
    }
    setUploading(true)

    let imageUrl = editProduct?.image_url || null
    if (imageFile) {
      imageUrl = await uploadImage(imageFile)
    }

    if (editProduct) {
      const { error } = await supabase
        .from('products')
        .update({
          name: form.name,
          sku: form.sku,
          price: parseFloat(form.price),
          stock: parseInt(form.stock),
          category: form.category,
          image_url: imageUrl,
        })
        .eq('id', editProduct.id)
      if (error) alert('Error: ' + error.message)
      else {
        alert('Produk berhasil diupdate!')
        resetForm()
        fetchProducts()
      }
    } else {
      const { error } = await supabase
        .from('products')
        .insert([{
          name: form.name,
          sku: form.sku,
          price: parseFloat(form.price),
          stock: parseInt(form.stock),
          category: form.category,
          image_url: imageUrl,
        }])
      if (error) alert('Error: ' + error.message)
      else {
        alert('Produk berhasil ditambahkan!')
        resetForm()
        fetchProducts()
      }
    }
    setUploading(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Yakin hapus produk ini?')) return
    await supabase.from('products').delete().eq('id', id)
    fetchProducts()
  }

  function handleEdit(product: Product) {
    setEditProduct(product)
    setForm({
      name: product.name,
      sku: product.sku,
      price: product.price.toString(),
      stock: product.stock.toString(),
      category: product.category || '',
    })
    setImagePreview(product.image_url)
    setShowForm(true)
  }

  function resetForm() {
    setForm({ name: '', sku: '', price: '', stock: '', category: '' })
    setEditProduct(null)
    setShowForm(false)
    setImageFile(null)
    setImagePreview(null)
  }

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase()) ||
    p.category?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex min-h-screen bg-[#f7f9fb]">
      {/* Sidebar */}
      <aside className="w-60 bg-white border-r border-gray-200 flex flex-col p-4 gap-2 fixed h-screen z-40">
        <div className="mb-6">
          <p className="font-bold text-lg" style={{ fontFamily: 'Hanken Grotesk, sans-serif' }}>Alim Rugi Admin</p>
          <p className="text-xs text-gray-400">Product Management</p>
        </div>
        <Link href="/admin" className="flex items-center gap-2 p-2 text-gray-500 hover:bg-gray-100 rounded-xl text-sm transition-all">
          📊 Dashboard
        </Link>
        <Link href="/admin/products" className="flex items-center gap-2 p-2 bg-blue-50 text-blue-600 rounded-xl text-sm font-bold">
          📦 Products
        </Link>
        <Link href="/" className="flex items-center gap-2 p-2 text-gray-500 hover:bg-gray-100 rounded-xl text-sm transition-all">
          🏠 Back to Store
        </Link>
        <button
          onClick={() => { resetForm(); setShowForm(true) }}
          className="mt-auto bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-bold hover:bg-blue-700"
        >
          + Add Product
        </button>
      </aside>

      {/* Main */}
      <main className="ml-60 flex-1 p-8">
        <div className="flex justify-between items-end mb-6">
          <div>
            <h1 className="text-3xl font-bold" style={{ fontFamily: 'Hanken Grotesk, sans-serif' }}>Kelola Produk</h1>
            <p className="text-gray-400 text-sm mt-1">Total {products.length} produk terdaftar</p>
          </div>
          <div className="flex gap-3">
            <input
              className="border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none w-64"
              placeholder="Cari produk, SKU, kategori..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <button
              onClick={() => { resetForm(); setShowForm(true) }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700"
            >
              + Tambah Produk
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-xs text-gray-400 uppercase mb-1">Total Produk</p>
            <p className="text-2xl font-bold text-blue-600">{products.length}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-xs text-gray-400 uppercase mb-1">Stok Rendah</p>
            <p className="text-2xl font-bold text-red-500">{products.filter(p => p.stock < 10).length}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-xs text-gray-400 uppercase mb-1">Kategori</p>
            <p className="text-2xl font-bold text-green-600">{new Set(products.map(p => p.category)).size}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-xs text-gray-400 uppercase mb-1">Total Nilai</p>
            <p className="text-2xl font-bold text-purple-600">
              ${products.reduce((sum, p) => sum + p.price * p.stock, 0).toFixed(0)}
            </p>
          </div>
        </div>

        {/* Form Tambah/Edit */}
        {showForm && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
            <h2 className="font-bold text-lg mb-4">
              {editProduct ? '✏️ Edit Produk' : '➕ Tambah Produk Baru'}
            </h2>
            <div className="grid grid-cols-3 gap-6">
              {/* Upload Foto */}
              <div className="col-span-1">
                <label className="text-xs text-gray-500 uppercase block mb-2">Foto Produk</label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-blue-300 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all"
                  style={{ minHeight: '160px' }}
                >
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-36 object-cover rounded-lg"
                    />
                  ) : (
                    <>
                      <span className="text-4xl mb-2">📷</span>
                      <p className="text-xs text-gray-400 text-center">Klik untuk upload foto</p>
                      <p className="text-xs text-gray-300 text-center mt-1">JPG, PNG, WEBP</p>
                    </>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
                {imagePreview && (
                  <button
                    onClick={() => { setImageFile(null); setImagePreview(null) }}
                    className="mt-2 text-xs text-red-400 hover:text-red-600 w-full text-center"
                  >
                    Hapus foto
                  </button>
                )}
              </div>

              {/* Form Fields */}
              <div className="col-span-2 grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-500 uppercase">Nama Produk</label>
                  <input
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                    placeholder="Nama Produk"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-500 uppercase">SKU</label>
                  <input
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                    placeholder="AR-XXX-000"
                    value={form.sku}
                    onChange={e => setForm({ ...form, sku: e.target.value })}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-500 uppercase">Harga ($)</label>
                  <input
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                    placeholder="0.00"
                    type="number"
                    value={form.price}
                    onChange={e => setForm({ ...form, price: e.target.value })}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-500 uppercase">Stok</label>
                  <input
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                    placeholder="0"
                    type="number"
                    value={form.stock}
                    onChange={e => setForm({ ...form, stock: e.target.value })}
                  />
                </div>
                <div className="flex flex-col gap-1 col-span-2">
                  <label className="text-xs text-gray-500 uppercase">Kategori</label>
                  <select
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                    value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value })}
                  >
                    <option value="">Pilih Kategori</option>
                    <option value="Hardware">Hardware</option>
                    <option value="Software">Software</option>
                    <option value="Aksesori">Aksesori</option>
                    <option value="F&B">F&B</option>
                    <option value="Home & Living">Home & Living</option>
                    <option value="Apparel">Apparel</option>
                  </select>
                </div>
                <div className="col-span-2 flex gap-2 mt-2">
                  <button
                    onClick={handleSave}
                    disabled={uploading}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 disabled:opacity-70 flex items-center gap-2"
                  >
                    {uploading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Menyimpan...
                      </>
                    ) : editProduct ? 'Update Produk' : 'Simpan Produk'}
                  </button>
                  <button
                    onClick={resetForm}
                    className="bg-gray-200 text-gray-600 px-6 py-2 rounded-lg text-sm hover:bg-gray-300"
                  >
                    Batal
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tabel Produk */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
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
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      Loading...
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                    Tidak ada produk ditemukan
                  </td>
                </tr>
              ) : filtered.map((product) => (
                <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 border border-gray-200">
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xl">📦</div>
                        )}
                      </div>
                      <p className="font-semibold text-sm">{product.name}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-400 font-mono">{product.sku}</td>
                  <td className="px-6 py-4">
                    <span className="bg-blue-50 text-blue-600 text-xs px-2 py-1 rounded-full">
                      {product.category || '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-right">${product.price}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                      product.stock < 10
                        ? 'bg-red-100 text-red-600'
                        : product.stock < 30
                        ? 'bg-yellow-100 text-yellow-600'
                        : 'bg-green-100 text-green-600'
                    }`}>
                      {product.stock} unit
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleEdit(product)}
                        className="text-blue-400 hover:text-blue-600 text-sm px-3 py-1 border border-blue-200 rounded-lg hover:bg-blue-50 transition-all"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="text-red-400 hover:text-red-600 text-sm px-3 py-1 border border-red-200 rounded-lg hover:bg-red-50 transition-all"
                      >
                        🗑 Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
            <p className="text-xs text-gray-400">
              Menampilkan {filtered.length} dari {products.length} produk
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}