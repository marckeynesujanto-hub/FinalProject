// app/marketplace/page.tsx
'use client'
import { useMarketplaceLogic } from './logic';
// import { BottomNav } from '@/components/layout/BottomNav'

const DISPLAY = "'Bricolage Grotesque', sans-serif"

const CATEGORY_ICONS: Record<string, string> = {
  Kardus: '📦', Plastik: '🥤', Kertas: '📰',
  Logam: '🔧', Kaca: '🫙', Lainnya: '♻️',
};
const CATEGORY_TINT: Record<string, string> = {
  Kardus: '#E8EEDD', Plastik: '#F0E0D3', Kertas: '#E4ECEF',
  Logam: '#EDE7D8', Kaca: '#E8EEDD', Lainnya: '#F0E0D3',
};
const CATEGORIES = ['Semua', 'Kardus', 'Plastik', 'Kertas', 'Logam', 'Kaca', 'Lainnya'];
const FORM_FIELDS = [
  { key: 'product_name', label: 'Nama Sampah *', placeholder: 'Contoh: Kardus Bekas Tebal...', type: 'text' },
  { key: 'seller_name', label: 'Nama Penjual *', placeholder: 'Nama lengkap Anda', type: 'text' },
  { key: 'seller_phone', label: 'No. WhatsApp / HP', placeholder: '08xxxxxxxxxx', type: 'tel' },
  { key: 'product_price', label: 'Harga per kg (Rp) *', placeholder: 'Contoh: 2000', type: 'number' },
  { key: 'weight_kg', label: 'Estimasi Berat (kg)', placeholder: 'Contoh: 10', type: 'number' },
  { key: 'product_stock', label: 'Stok Tersedia (kg)', placeholder: 'Contoh: 50', type: 'number' },
  { key: 'location_area', label: 'Area / Kelurahan Lokasi', placeholder: 'Contoh: Jakarta Selatan', type: 'text' },
];

export default function MarketplacePage() {
  const {
    tab,
    setTab,
    loading,
    categoryFilter,
    setCategoryFilter,
    filteredProducts,
    form,
    setForm,
    handleSubmitJual,
    submitting,
    submitSuccess,
    setSubmitSuccess,
    orderModal,
    setOrderModal,
    selectedProduct,
    handleOrder,
    confirmOrder,
    ordering,
    orderSuccess
  } = useMarketplaceLogic();

  return (
    <div className="min-h-screen bg-[#F5F1E6] flex flex-col pb-32">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#4E6A41] to-[#3C5331] px-5 pt-16 pb-6 rounded-b-[34px] shadow-[0_20px_40px_-24px_rgba(40,38,28,0.5)] flex-shrink-0 relative overflow-hidden">
        <div className="absolute right-[-10%] top-[-20%] w-44 h-44 bg-[#56724A] rounded-full opacity-55 pointer-events-none"></div>
        <h1 className="text-[#FFFDF7] text-[22px] font-extrabold tracking-tight relative z-10" style={{ fontFamily: DISPLAY }}>Marketplace Sampah</h1>
        <p className="text-[#AFC09C] text-xs mt-1 font-medium relative z-10">Jual &amp; beli sampah daur ulang, driver kami yang jemput 🚛</p>

        {/* Tabs */}
        <div className="flex gap-2 mt-5 bg-[#FFFDF7]/12 rounded-2xl p-1.5 relative z-10">
          <button onClick={() => setTab('beli')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold transition-all pressable
              ${tab === 'beli' ? 'bg-[#FFFDF7] text-[#47613A]' : 'text-[#D7E2C8] hover:text-white'}`}>
            🛍️ Beli Sampah
          </button>
          <button onClick={() => setTab('jual')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold transition-all pressable
              ${tab === 'jual' ? 'bg-[#FFFDF7] text-[#47613A]' : 'text-[#D7E2C8] hover:text-white'}`}>
            📦 Jual Sampah
          </button>
        </div>
      </div>

      {/* ── BELI TAB ── */}
      {tab === 'beli' && (
        <div className="px-4 mt-4 pb-6 flex flex-col gap-4 animate-fade-in-up">
          {/* Category filter */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setCategoryFilter(cat)}
                className={`px-4 py-2 rounded-full text-xs font-extrabold whitespace-nowrap border-[1.5px] transition-all pressable
                  ${categoryFilter === cat ? 'bg-[#47613A] border-[#47613A] text-[#F5F1E6]' : 'bg-[#FFFDF7] text-[#6F6C5E] border-[#E2DAC6]'}`}>
                {cat !== 'Semua' && CATEGORY_ICONS[cat]} {cat}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <div className="w-10 h-10 border-4 border-[#47613A] border-t-transparent rounded-full animate-spin" />
              <p className="text-[#A8A492] text-xs font-bold uppercase tracking-widest">Memuat Katalog...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-20 animate-fade-in-up">
              <div className="w-20 h-20 bg-[#EDE7D8] rounded-full flex items-center justify-center text-5xl mx-auto mb-4">📭</div>
              <p className="text-[#42402F] font-extrabold" style={{ fontFamily: DISPLAY }}>Belum Ada Produk Daur Ulang</p>
              <p className="text-[#A8A492] text-xs mt-1 mb-6">Jadilah kontributor pertama yang menjual!</p>
              <button onClick={() => setTab('jual')}
                style={{ fontFamily: DISPLAY }}
                className="bg-[#47613A] text-white px-6 py-3 rounded-2xl font-bold text-xs shadow-[0_14px_24px_-12px_rgba(71,97,58,0.7)] pressable">
                + Jual Sampah Sekarang
              </button>
            </div>
          ) : (
            filteredProducts.map(p => (
              <div key={p.recycle_product_id} className="bg-[#FFFDF7] rounded-[24px] p-5 border border-[#ECE4D2] shadow-[0_10px_24px_-16px_rgba(40,38,28,0.3)] transition-all hover:scale-[1.01]">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0" style={{ background: CATEGORY_TINT[p.category] || '#E8EEDD' }}>
                    {CATEGORY_ICONS[p.category] || '♻️'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-extrabold text-[#2B2A23] text-base leading-snug" style={{ fontFamily: DISPLAY }}>{p.product_name}</p>
                    <span className="inline-block text-[9.5px] font-extrabold uppercase tracking-wide bg-[#E8EEDD] text-[#3F5733] px-2.5 py-1 rounded-full mt-1.5">
                      {p.category}
                    </span>
                    {p.description && (
                      <p className="text-xs text-[#A8A492] mt-2 font-medium leading-relaxed line-clamp-2">{p.description}</p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-base font-extrabold text-[#47613A]" style={{ fontFamily: DISPLAY }}>
                      Rp {p.product_price.toLocaleString('id')}
                    </p>
                    <span className="text-[10px] text-[#A8A492] font-extrabold block">per kg</span>
                  </div>
                </div>

                <div className="flex gap-2.5 text-[10px] text-[#7C7A6E] mb-4 flex-wrap font-bold bg-[#F5F1E6] p-3 rounded-2xl border border-[#ECE4D2]">
                  <span className="text-[#42402F]">👤 {p.seller_name}</span>
                  <span>·</span>
                  <span>⚖️ {p.weight_kg} kg</span>
                  <span>·</span>
                  <span>📍 {p.location_area}</span>
                  <span>·</span>
                  <span className="text-[#47613A]">📦 Stok: {p.product_stock} kg</span>
                </div>

                <div className="flex gap-3">
                  <a href={`tel:${p.seller_phone}`}
                    className="flex-1 bg-[#F5F1E6] hover:bg-[#EFE9DA] text-[#5C5A4C] py-3.5 rounded-2xl text-xs font-extrabold text-center transition-all pressable border border-[#E2DAC6]">
                    📞 Hubungi Penjual
                  </a>
                  <button onClick={() => handleOrder(p)}
                    className="flex-1 bg-[#47613A] text-white py-3.5 rounded-2xl text-xs font-extrabold transition-all pressable shadow-[0_10px_20px_-12px_rgba(71,97,58,0.7)]">
                    🚛 Pesan &amp; Antar
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── JUAL TAB ── */}
      {tab === 'jual' && (
        <div className="px-4 mt-5 pb-6 animate-fade-in-up">
          {submitSuccess ? (
            <div className="text-center py-16 animate-fade-in-up">
              <div className="w-20 h-20 bg-[#E8EEDD] rounded-full flex items-center justify-center text-4xl mx-auto mb-4">🎉</div>
              <h2 className="text-2xl font-extrabold text-[#2B2A23] mb-2" style={{ fontFamily: DISPLAY }}>Berhasil Diposting!</h2>
              <p className="text-[#6F6C5E] text-xs mb-8 font-semibold leading-relaxed">
                Bahan daur ulang Anda sudah terdaftar di katalog. Pembeli akan segera menghubungi Anda secara langsung.
              </p>
              <button onClick={() => { setSubmitSuccess(false); setTab('beli') }}
                style={{ fontFamily: DISPLAY }}
                className="bg-[#47613A] text-white px-8 py-3.5 rounded-2xl font-bold text-xs shadow-[0_14px_24px_-12px_rgba(71,97,58,0.7)] pressable">
                Lihat Katalog Toko 🛍️
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              {/* Info banner */}
              <div className="bg-[#E8EEDD] rounded-[22px] p-4 border border-[#D6E0C5] flex gap-3.5">
                <span className="text-2xl">💡</span>
                <div>
                  <p className="text-xs font-extrabold text-[#2F4A24] uppercase tracking-wide mb-0.5">Mekanisme Transaksi</p>
                  <p className="text-[11px] text-[#3F5733] font-semibold leading-relaxed">
                    Posting iklan daur ulang Anda → pembeli melakukan order → driver ThrashIn menjemput ke lokasi Anda → diantarkan langsung ke pembeli. Anda mendapat bayaran dari pembeli!
                  </p>
                </div>
              </div>

              {/* Form fields */}
              {FORM_FIELDS.map(field => (
                <div key={field.key} className="space-y-1.5">
                  <label className="block text-sm font-bold text-[#42402F] ml-1">{field.label}</label>
                  <input
                    type={field.type}
                    placeholder={field.placeholder}
                    value={(form as any)[field.key]}
                    onChange={e => setForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                    className="w-full bg-[#FFFDF7] border-[1.5px] border-[#E2DAC6] rounded-2xl px-4 py-3 text-sm font-medium text-[#2B2A23] focus:border-[#47613A] focus:ring-4 focus:ring-[#47613A]/10 focus:outline-none transition-all placeholder-[#A8A492]"
                  />
                </div>
              ))}

              {/* Category picker */}
              <div>
                <label className="block text-sm font-bold text-[#42402F] mb-2.5 ml-1">Kategori Sampah *</label>
                <div className="grid grid-cols-3 gap-2">
                  {CATEGORIES.filter(c => c !== 'Semua').map(cat => (
                    <button key={cat} onClick={() => setForm(prev => ({ ...prev, category: cat }))}
                      className={`py-3 rounded-2xl text-xs font-bold border-[1.5px] transition-all pressable
                        ${form.category === cat
                          ? 'bg-[#47613A] border-transparent text-white shadow-[0_8px_16px_-10px_rgba(71,97,58,0.7)]'
                          : 'bg-[#FFFDF7] border-[#E2DAC6] text-[#5C5A4C] hover:bg-[#F5F1E6]'}`}>
                      {CATEGORY_ICONS[cat]} {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="block text-sm font-bold text-[#42402F] ml-1">Deskripsi Tambahan</label>
                <textarea
                  placeholder="Deskripsikan kondisi sampah daur ulang, metode packing, atau penempatan..."
                  value={form.description}
                  onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full bg-[#FFFDF7] border-[1.5px] border-[#E2DAC6] rounded-2xl px-4 py-3 text-sm font-medium text-[#2B2A23] focus:border-[#47613A] focus:outline-none resize-none placeholder-[#A8A492]"
                />
              </div>

              <button onClick={handleSubmitJual} disabled={submitting}
                style={{ fontFamily: DISPLAY }}
                className="w-full mt-3 bg-[#47613A] disabled:bg-[#C5C0AE] disabled:shadow-none text-white py-4 rounded-2xl font-bold text-base shadow-[0_16px_28px_-12px_rgba(71,97,58,0.7)] active:scale-[0.98] transition-all flex items-center justify-center gap-2 pressable">
                {submitting ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Memposting Sampah...
                  </>
                ) : (
                  '✅ Posting Katalog Sekarang'
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Order Modal */}
      {orderModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/60 flex items-end justify-center z-50 animate-fade-in" onClick={() => { if (!ordering) setOrderModal(false) }}>
          <div className="bg-[#FFFDF7] w-full max-w-md rounded-t-[28px] p-6 shadow-2xl animate-slide-in-up" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1 bg-[#E2DAC6] rounded-full mx-auto mb-4"></div>
            {orderSuccess ? (
              <div className="text-center py-6 animate-fade-in-up">
                <div className="w-16 h-16 bg-[#E8EEDD] rounded-full flex items-center justify-center text-4xl mx-auto mb-4">🎉</div>
                <h3 className="font-extrabold text-[#2B2A23] text-lg mb-1" style={{ fontFamily: DISPLAY }}>Pesanan Sukses Dibuat!</h3>
                <p className="text-[#6F6C5E] text-xs mb-6 font-semibold leading-relaxed">
                  Driver ThrashIn akan segera menjemput barang daur ulang dari penjual ({selectedProduct.seller_name}) dan mengantarkannya langsung ke lokasi Anda.
                </p>
                <button onClick={() => setOrderModal(false)}
                  className="w-full bg-[#47613A] text-white py-3.5 rounded-2xl font-bold text-xs shadow-[0_12px_22px_-12px_rgba(71,97,58,0.7)] pressable">
                  Tutup Notifikasi
                </button>
              </div>
            ) : (
              <>
                <h3 className="font-extrabold text-[#2B2A23] text-lg mb-1" style={{ fontFamily: DISPLAY }}>Konfirmasi Pesanan</h3>
                <p className="text-[#A8A492] text-xs mb-5 font-semibold">
                  Driver kami akan menjemput dari penjual dan mengirimkannya ke titik lokasi Anda
                </p>

                {/* Invoice Receipt Detail */}
                <div className="bg-[#F5F1E6] rounded-[22px] p-5 border border-[#ECE4D2] mb-5 relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#8FA67C] to-[#47613A]"></div>
                  <div className="space-y-2.5 text-xs">
                    {[
                      { label: 'Nama Produk',    value: selectedProduct.product_name },
                      { label: 'Kategori Sampah', value: selectedProduct.category },
                      { label: 'Nama Penjual',    value: selectedProduct.seller_name },
                      { label: 'Area Lokasi',     value: selectedProduct.location_area },
                      { label: 'Estimasi Berat',  value: `${selectedProduct.weight_kg} kg` },
                    ].map(item => (
                      <div key={item.label} className="flex justify-between">
                        <span className="text-[#A8A492] font-bold uppercase">{item.label}</span>
                        <span className="font-extrabold text-[#42402F] truncate max-w-[200px]">{item.value}</span>
                      </div>
                    ))}
                    <div className="flex justify-between pt-3 border-t border-[#E2DAC6] mt-2">
                      <span className="text-xs font-bold text-[#42402F] uppercase">Harga Satuan</span>
                      <span className="text-sm font-extrabold text-[#47613A]" style={{ fontFamily: DISPLAY }}>
                        Rp {selectedProduct.product_price.toLocaleString('id')} / kg
                      </span>
                    </div>
                  </div>
                </div>

                <button onClick={confirmOrder} disabled={ordering}
                  style={{ fontFamily: DISPLAY }}
                  className="w-full bg-[#47613A] disabled:bg-[#C5C0AE] disabled:shadow-none text-white py-4 rounded-2xl font-bold text-sm shadow-[0_16px_28px_-12px_rgba(71,97,58,0.7)] active:scale-[0.98] transition-all flex items-center justify-center gap-2 pressable mb-2">
                  {ordering ? (
                    <>
                      <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      Memproses Transaksi...
                    </>
                  ) : (
                    '🚛 Konfirmasi & Jadwalkan Antar'
                  )}
                </button>
                <button onClick={() => setOrderModal(false)}
                  className="w-full text-[#A8A492] hover:text-[#6F6C5E] text-xs font-bold py-2.5 transition-colors">
                  Batalkan Pesanan
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Bottom Navigation
      <BottomNav /> */}
    </div>
  )
}
