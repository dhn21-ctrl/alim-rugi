'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function OrderSuccessContent() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('order_id')
  const total = searchParams.get('total')
  const [show, setShow] = useState(false)

  useEffect(() => {
    setTimeout(() => setShow(true), 100)
  }, [])

  return (
    <div className="min-h-screen bg-[#f7f9fb] flex items-center justify-center px-4 py-8">
      {/* Confetti effect */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-bounce"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${1 + Math.random() * 2}s`,
              fontSize: '1.5rem',
              opacity: 0.6,
            }}
          >
            {['🎉', '✨', '🎊', '⭐', '🎈'][Math.floor(Math.random() * 5)]}
          </div>
        ))}
      </div>

      <div className={`max-w-md w-full transition-all duration-700 ${show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        {/* Success Card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-lg text-center mb-4">
          {/* Icon animasi */}
          <div className={`w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 transition-all duration-500 ${show ? 'scale-100' : 'scale-0'}`}>
            <span className="text-4xl">✅</span>
          </div>

          <h1 className="text-2xl md:text-3xl font-bold mb-2 text-gray-900" style={{ fontFamily: 'Hanken Grotesk, sans-serif' }}>
            Pesanan Berhasil!
          </h1>
          <p className="text-gray-400 text-sm mb-6">
            Terima kasih! Pesanan Anda sedang diproses.
          </p>

          {/* Order Info */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
            <div className="flex justify-between items-center mb-3">
              <div>
                <p className="text-xs text-gray-400 uppercase font-bold mb-1">Nomor Pesanan</p>
                <p className="font-bold text-blue-600 font-mono text-lg">
                  #{orderId ? orderId.slice(0, 8).toUpperCase() : 'AR-XXXXXX'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400 uppercase font-bold mb-1">Total Bayar</p>
                <p className="font-bold text-green-600 text-lg">${total || '0.00'}</p>
              </div>
            </div>
            <div className="border-t border-gray-200 pt-3 grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-400 uppercase font-bold mb-1">Estimasi Tiba</p>
                <p className="text-sm font-bold text-gray-700">2-3 Hari Kerja</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase font-bold mb-1">Status</p>
                <span className="text-xs font-bold px-2 py-1 bg-yellow-100 text-yellow-600 rounded-full">
                  Menunggu Proses
                </span>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="flex items-center justify-between mb-6 px-2">
            {[
              { icon: '✅', label: 'Diterima', active: true },
              { icon: '📦', label: 'Dikemas', active: false },
              { icon: '🚚', label: 'Dikirim', active: false },
              { icon: '🏠', label: 'Tiba', active: false },
            ].map((step, i) => (
              <div key={i} className="flex flex-col items-center gap-1 flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${step.active ? 'bg-green-100' : 'bg-gray-100'}`}>
                  {step.icon}
                </div>
                <p className="text-xs text-gray-400">{step.label}</p>
                {i < 3 && (
                  <div className="absolute" style={{ width: '0' }}>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <Link
              href="/orders"
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 flex items-center justify-center gap-2 transition-all"
            >
              📋 Lihat Riwayat Pesanan
            </Link>
            <Link
              href="/"
              className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 flex items-center justify-center gap-2 transition-all"
            >
              🏠 Lanjut Belanja
            </Link>
          </div>
        </div>

        {/* Support */}
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-start gap-3">
          <span className="text-2xl">💬</span>
          <div>
            <p className="font-bold text-blue-700 text-sm">Butuh bantuan?</p>
            <p className="text-xs text-blue-500 mt-0.5">
              Tim Alim Rugi siap membantu jika ada kendala pada pesanan Anda.
            </p>
            <Link href="/" className="text-xs text-blue-600 font-bold hover:underline mt-1 inline-block">
              Hubungi Support →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <OrderSuccessContent />
    </Suspense>
  )
}