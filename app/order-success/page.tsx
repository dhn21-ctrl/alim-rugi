import Link from 'next/link'

export default function OrderSuccessPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-8">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">
          ✓
        </div>
        <h1 className="text-3xl font-bold mb-2">Pesanan Berhasil!</h1>
        <p className="text-gray-400 mb-2">Terima kasih atas pesanan Anda.</p>
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6 text-left">
          <p className="text-xs text-gray-400 uppercase mb-1">Nomor Pesanan</p>
          <p className="text-xl font-bold text-blue-600">#AR-99284102</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6 grid grid-cols-2 gap-4 text-left">
          <div>
            <p className="text-xs text-gray-400 uppercase mb-1">Estimasi Tiba</p>
            <p className="font-bold text-sm">Besok, 14:00 - 18:00</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase mb-1">Total Bayar</p>
            <p className="font-bold text-sm text-blue-600">$528.70</p>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <Link href="/" className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700">
            Lanjut Belanja
          </Link>
          <Link href="/admin" className="w-full bg-gray-100 text-gray-600 py-3 rounded-lg font-bold hover:bg-gray-200">
            Lihat Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}