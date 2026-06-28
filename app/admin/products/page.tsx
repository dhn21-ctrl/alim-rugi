'use client'
import { useEffect, useState, useRef } from 'react'
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

function formatRupiah(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', minimumFractionDigits: 0
  }).format(amount)
}

export default function AdminProductsPage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [form, setForm] = useState({ name: '', sku: '', price: '', stock: '', category: '' })
  const [search, setSearch] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { fetchProducts() }, [])

  function showToast(message: string, type: 'success' | 'error') {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  async function fetchProducts() {
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false })
    setProducts(data || [])
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
    const { error } = await supabase.storage.from('products').upload(fileName, file)
    if (error) return null
    const { data } = supabase.storage.from('products').getPublicUrl(fileName)
    return data.publicUrl
  }

  async function handleSave() {
    if (!form.name || !form.sku || !form.price || !form.stock) {
      showToast('Semua field harus diisi!', 'error')
      return
    }
    setUploading(true)

    let imageUrl = editProduct?.image_url || null
    if (imageFile) imageUrl = await uploadImage(imageFile)

    if (editProduct) {
      const { error } = await supabase.from('products')
        .update({ name: form.name, sku: form.sku, price: parseFloat(form.price), stock: parseInt(form.stock), category: form.category, image_url: imageUrl })
        .eq('id', editProduct.id)
      if (error) showToast('Gagal mengupdate produk!', 'error')
      else { showToast('Produk berhasil diupdate!', 'success'); resetForm(); fetchProducts() }
    } else {
      const { error } = await supabase.from('products')
        .insert([{ name: form.name, sku: form.sku, price: parseFloat(form.price), stock: parseInt(form.stock), category: form.category, image_url: imageUrl }])
      if (error) showToast('Gagal menambahkan produk!', 'error')
      else { showToast('Produk berhasil ditambahkan!', 'success'); resetForm(); fetchProducts() }
    }
    setUploading(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Yakin hapus produk ini?')) return
    const { error } = await supabase.from('products').delete().eq('id', id)
    if (error) showToast('Gagal menghapus produk!', 'error')
    else { showToast('Produk berhasil dihapus!', 'success'); fetchProducts() }
  }

  function handleEdit(product: Product) {
    setEditProduct(product)
    setForm({ name: product.name, sku: product.sku, price: product.price.toString(), stock: product.stock.toString(), category: product.category || '' })
    setImagePreview(product.image_url)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
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
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-4 z-[100] flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-white text-sm font-bold ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
          <span>{toast.type === 'success' ? '✅' : '❌'}</span>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Sidebar */}
      <aside className="w-60 bg-white border-r border-gray-200 flex flex-col p-4 gap-2 fixed h-screen z-40 hidden md:flex">
        <div className="mb-6">
          <p className="font-bold text-lg text-gray-900" style={{ fontFamily: 'Hanken Grotesk, sans-serif' }}>Alim Rugi Admin</p>
          <p className="text-xs text-gray-400">Manajemen Produk</p>
        </div>
        <Link href="/admin" className="flex items-center gap-2 p-3 text-gray-500 hover:bg-gray-100 rounded-xl text-sm transition-all">
          📊 Dashboard
        </Link>
        <Link href="/admin/products" className="flex items-center gap-2 p-3 bg-blue-50 text-blue-600 rounded-xl text-sm font-bold">
          📦 Kelola Produk
        </Link>
        <Link href="/" className="flex items-center gap-2 p-3 text-gray-500 hover:bg-gray-100 rounded-xl text-sm transition-all">
          🏠 Kembali ke Toko
        </Link>
        <button onClick={() => { resetForm(); setShowForm(true) }} className="mt-auto bg-blue-600 text-white py-2.5 px-4 rounded-xl text-sm font-bold hover:bg-blue-700 transition-all">
          + Tambah Produk
        </button>
      </aside>

      {/* Main */}
      <main className="md:ml-60 flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-20 flex justify-between items-center px-4 md:px-8 py-3 shadow-sm">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 text-sm transition-all flex items-center gap-1">
              ← Kembali
            </button>
            <h1 className="font-bold text-gray-900 text-lg" style={{ fontFamily: 'Hanken Grotesk, sans-serif' }}>
              Kelola Produk
            </h1>
          </div>
          <div className="flex gap-2 md:gap-3">
            <input
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none w-40 md:w-64"
              placeholder="Cari produk..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <button onClick={() => { resetForm(); setShowForm(true) }} className="bg-blue-600 text-white px-3 md:px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-700 whitespace-nowrap">
              + Tambah
            </button>
          </div>
        </header>

        <div className="p-4 md:p-8">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
            {[
              { label: 'Total Produk', value: products.length, color: 'text-blue-600' },
              { label: 'Stok Menipis', value: products.filter(p => p.stock < 10).length, color: 'text-red-500' },
              { label: 'Kategori', value: new Set(products.map(p => p.category)).size, color: 'text-green-600' },
              { label: 'Nilai Total', value: formatRupiah(products.reduce((sum, p) => sum + p.price * p.stock, 0)), color: 'text-purple-600', small: true },
            ].map((stat, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                <p className="text-xs text-gray-400 uppercase font-bold mb-1">{stat.label}</p>
                <p className={`font-bold ${stat.small ? 'text-sm md:text-base' : 'text-xl md:text-2xl'} ${stat.color}`}>{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Form */}
          {showForm && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 md:p-6 mb-6 shadow-sm">
              <h2 className="font-bold text-lg mb-4 text-gray-900">
                {editProduct ? '✏️ Edit Produk' : '➕ Tambah Produk Baru'}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Upload Foto */}
                <div>
                  <label className="text-xs text-gray-500 uppercase font-bold block mb-2">Foto Produk</label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-blue-300 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all"
                    style={{ minHeight: '160px' }}
                  >
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="w-full h-36 object-cover rounded-lg" />
                    ) : (
                      <>
                        <span className="text-4xl mb-2">📷</span>
                        <p className="text-xs text-gray-400 text-center">Klik untuk upload foto</p>
                        <p className="text-xs text-gray-300 text-center mt-1">JPG, PNG, WEBP</p>
                      </>
                    )}
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                  {imagePreview && (
                    <button onClick={() => { setImageFile(null); setImagePreview(null) }} className="mt-2 text-xs text-red-400 hover:text-red-600 w-full text-center">
                      Hapus foto
                    </button>
                  )}
                </div>

                {/* Form Fields */}
                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { label: 'Nama Produk', key: 'name', placeholder: 'Nama produk', type: 'text' },
                    { label: 'SKU', key: 'sku', placeholder: 'AR-XXX-000', type: 'text' },
                    { label: 'Harga (Rp)', key: 'price', placeholder: '50000', type: 'number' },
                    { label: 'Stok', key: 'stock', placeholder: '100', type: 'number' },
                  ].map(field => (
                    <div key={field.key} className="flex flex-col gap-1">
                      <label className="text-xs text-gray-500 uppercase font-bold">{field.label}</label>
                      <input
                        className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                        placeholder={field.placeholder}
                        type={field.type}
                        value={form[field.key as keyof typeof form]}
                        onChange={e => setForm({ ...form, [field.key]: e.target.value })}
                      />
                    </div>
                  ))}
                  <div className="flex flex-col gap-1 md:col-span-2">
                    <label className="text-xs text-gray-500 uppercase font-bold">Kategori</label>
                    <select
                      className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
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
                  <div className="md:col-span-2 flex gap-2">
                    <button onClick={handleSave} disabled={uploading} className="bg-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 disabled:opacity-70 flex items-center gap-2 transition-all">
                      {uploading ? (
                        <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Menyimpan...</>
                      ) : editProduct ? '💾 Update Produk' : '💾 Simpan Produk'}
                    </button>
                    <button onClick={resetForm} className="bg-gray-200 text-gray-600 px-6 py-2.5 rounded-xl text-sm hover:bg-gray-300 transition-all">
                      Batal
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tabel */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 md:px-6 py-3 text-xs text-gray-400 uppercase">Produk</th>
                  <th className="px-4 md:px-6 py-3 text-xs text-gray-400 uppercase hidden md:table-cell">SKU</th>
                  <th className="px-4 md:px-6 py-3 text-xs text-gray-400 uppercase hidden md:table-cell">Kategori</th>
                  <th className="px-4 md:px-6 py-3 text-xs text-gray-400 uppercase text-right">Harga</th>
                  <th className="px-4 md:px-6 py-3 text-xs text-gray-400 uppercase">Stok</th>
                  <th className="px-4 md:px-6 py-3 text-xs text-gray-400 uppercase text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      Memuat...
                    </div>
                  </td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-400">Tidak ada produk ditemukan</td></tr>
                ) : filtered.map(product => (
                  <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-4 md:px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 md:w-12 md:h-12 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0 border border-gray-200">
                          {product.image_url ? (
                            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xl">📦</div>
                          )}
                        </div>
                        <p className="font-semibold text-sm text-gray-900">{product.name}</p>
                      </div>
                    </td>
                    <td className="px-4 md:px-6 py-4 text-xs text-gray-400 font-mono hidden md:table-cell">{product.sku}</td>
                    <td className="px-4 md:px-6 py-4 hidden md:table-cell">
                      <span className="bg-blue-50 text-blue-600 text-xs px-2 py-1 rounded-full font-bold">{product.category || '-'}</span>
                    </td>
                    <td className="px-4 md:px-6 py-4 text-sm font-bold text-right text-gray-900">{formatRupiah(product.price)}</td>
                    <td className="px-4 md:px-6 py-4">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                        product.stock === 0 ? 'bg-gray-100 text-gray-500' :
                        product.stock < 10 ? 'bg-red-100 text-red-600' :
                        product.stock < 30 ? 'bg-yellow-100 text-yellow-600' :
                        'bg-green-100 text-green-600'
                      }`}>
                        {product.stock === 0 ? 'HABIS' : `${product.stock} unit`}
                      </span>
                    </td>
                    <td className="px-4 md:px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => handleEdit(product)} className="text-blue-400 hover:text-blue-600 text-xs md:text-sm px-2 md:px-3 py-1 border border-blue-200 rounded-lg hover:bg-blue-50 transition-all">
                          ✏️ Edit
                        </button>
                        <button onClick={() => handleDelete(product.id)} className="text-red-400 hover:text-red-600 text-xs md:text-sm px-2 md:px-3 py-1 border border-red-200 rounded-lg hover:bg-red-50 transition-all">
                          🗑 Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-4 md:px-6 py-3 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
              <p className="text-xs text-gray-400">Menampilkan {filtered.length} dari {products.length} produk</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}