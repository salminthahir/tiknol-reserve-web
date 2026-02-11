'use client';

import { useState, useEffect } from 'react';
import { X, Sparkles, Clock, Layers, MapPin } from 'lucide-react';
import { Voucher, VoucherType } from '@/types/voucher';

interface VoucherFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  voucher?: Voucher | null;
}

export default function VoucherFormModal({ isOpen, onClose, onSuccess, voucher }: VoucherFormModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    type: 'PERCENTAGE' as VoucherType,
    value: '',
    minPurchase: '',
    maxDiscount: '',
    usageLimit: '',
    perUserLimit: '',
    validFrom: '',
    validUntil: '',
    active: true,
    applicableCategories: [] as string[],
    happyHourStart: '',
    happyHourEnd: ''
  });

  const categories = ['COFFEE', 'NON-COFFEE', 'SNACK', 'FOOD', 'DESSERT']; // Pre-defined for quick select

  // Branch State
  const [branches, setBranches] = useState<{ id: string, name: string }[]>([]);
  const [applicableBranches, setApplicableBranches] = useState<string[]>([]);

  // Fetch branches on mount
  useEffect(() => {
    fetch('/api/branches')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setBranches(data);
      })
      .catch(err => console.error("Failed to fetch branches", err));
  }, []);

  useEffect(() => {
    if (voucher) {
      setFormData({
        code: voucher.code,
        name: voucher.name,
        description: voucher.description || '',
        type: voucher.type,
        value: voucher.value.toString(),
        minPurchase: voucher.minPurchase.toString(),
        maxDiscount: voucher.maxDiscount?.toString() || '',
        usageLimit: voucher.usageLimit?.toString() || '',
        perUserLimit: voucher.perUserLimit?.toString() || '',
        validFrom: voucher.validFrom.split('T')[0],
        validUntil: voucher.validUntil.split('T')[0],
        active: voucher.active,
        applicableCategories: Array.isArray(voucher.applicableCategories) ? voucher.applicableCategories as string[] : [],
        happyHourStart: voucher.happyHourStart || '',
        happyHourEnd: voucher.happyHourEnd || ''
      });

      // Set branches
      if (voucher.applicableBranches && Array.isArray(voucher.applicableBranches)) {
        setApplicableBranches(voucher.applicableBranches as string[]);
      } else {
        setApplicableBranches([]);
      }
    } else {
      // Reset form for new voucher
      const today = new Date().toISOString().split('T')[0];
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);

      setFormData({
        code: '',
        name: '',
        description: '',
        type: 'PERCENTAGE',
        value: '',
        minPurchase: '0',
        maxDiscount: '',
        usageLimit: '',
        perUserLimit: '',
        validFrom: today,
        validUntil: nextMonth.toISOString().split('T')[0],
        active: true,
        applicableCategories: [],
        happyHourStart: '',
        happyHourEnd: ''
      });
      setApplicableBranches([]);
    }
  }, [voucher, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload: any = {
        code: formData.code.toUpperCase(),
        name: formData.name,
        description: formData.description || null,
        type: formData.type,
        value: parseFloat(formData.value),
        minPurchase: parseFloat(formData.minPurchase) || 0,
        maxDiscount: formData.maxDiscount ? parseFloat(formData.maxDiscount) : null,
        usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : null,
        perUserLimit: formData.perUserLimit ? parseInt(formData.perUserLimit) : null,
        validFrom: new Date(formData.validFrom).toISOString(),
        validUntil: new Date(formData.validUntil).toISOString(),
        active: formData.active,
        applicableCategories: formData.applicableCategories,
        applicableBranches: applicableBranches.length > 0 ? applicableBranches : null,
        happyHourStart: formData.happyHourStart || null,
        happyHourEnd: formData.happyHourEnd || null
      };

      const url = voucher
        ? `/api/admin/vouchers/${voucher.id}`
        : '/api/admin/vouchers';

      const method = voucher ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save voucher');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, code });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-[0_8px_32px_rgba(0,0,0,0.16)] border-2 border-gray-200">

        {/* Header - Fixed */}
        <div className="bg-gradient-to-r from-[#552CB7] to-[#6B3FD9] px-4 sm:px-6 py-4 rounded-t-2xl flex justify-between items-center border-b-2 border-black flex-shrink-0">
          <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
            {voucher ? 'Edit Voucher' : 'Create Voucher'}
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 p-2 rounded-lg transition-all"
            type="button"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form - Scrollable */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6">
            {error && (
              <div className="bg-red-50 border-2 border-red-400 text-red-700 px-4 py-3 rounded-xl mb-4 font-bold">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              {/* Code */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-black text-gray-600 mb-2 uppercase tracking-wider">
                  Kode Voucher *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-[#552CB7] focus:ring-2 focus:ring-[#552CB7]/20 transition-all font-mono font-bold text-lg"
                    placeholder="PROMO10"
                    maxLength={20}
                  />
                  <button
                    type="button"
                    onClick={generateCode}
                    className="px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold text-sm transition-all border-2 border-gray-300 flex items-center gap-2 whitespace-nowrap"
                  >
                    <Sparkles size={16} />
                    <span className="hidden sm:inline">Generate</span>
                  </button>
                </div>
              </div>

              {/* Name */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-black text-gray-600 mb-2 uppercase tracking-wider">
                  Nama Voucher *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-[#552CB7] focus:ring-2 focus:ring-[#552CB7]/20 transition-all"
                  placeholder="Diskon Hari Kemerdekaan"
                />
              </div>

              {/* Description */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-black text-gray-600 mb-2 uppercase tracking-wider">
                  Deskripsi
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-[#552CB7] focus:ring-2 focus:ring-[#552CB7]/20 transition-all resize-none"
                  rows={3}
                  placeholder="Deskripsi singkat tentang voucher..."
                />
              </div>

              {/* Divider */}
              <div className="sm:col-span-2 border-t-2 border-dashed border-gray-300 my-2"></div>

              {/* Type */}
              <div>
                <label className="block text-xs font-black text-gray-600 mb-2 uppercase tracking-wider">
                  Tipe Voucher *
                </label>
                <select
                  required
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as VoucherType })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-[#552CB7] focus:ring-2 focus:ring-[#552CB7]/20 transition-all font-bold"
                >
                  <option value="PERCENTAGE">Percentage Discount</option>
                  <option value="FIXED_AMOUNT">Fixed Amount</option>
                  <option value="FREE_ITEM">Free Item</option>
                  <option value="BUY_X_GET_Y">Buy X Get Y</option>
                </select>
              </div>

              {/* Value */}
              <div>
                <label className="block text-xs font-black text-gray-600 mb-2 uppercase tracking-wider">
                  {formData.type === 'PERCENTAGE' ? 'Percentage (%)' : 'Nilai (Rp)'} *
                </label>
                <input
                  type="number"
                  required
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-[#552CB7] focus:ring-2 focus:ring-[#552CB7]/20 transition-all font-bold"
                  placeholder={formData.type === 'PERCENTAGE' ? '10' : '50000'}
                  min="0"
                  max={formData.type === 'PERCENTAGE' ? '100' : undefined}
                  step={formData.type === 'PERCENTAGE' ? '0.1' : '1000'}
                />
              </div>

              {/* Min Purchase */}
              <div>
                <label className="block text-xs font-black text-gray-600 mb-2 uppercase tracking-wider">
                  Min. Pembelian (Rp)
                </label>
                <input
                  type="number"
                  value={formData.minPurchase}
                  onChange={(e) => setFormData({ ...formData, minPurchase: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-[#552CB7] focus:ring-2 focus:ring-[#552CB7]/20 transition-all"
                  placeholder="0"
                  min="0"
                  step="1000"
                />
              </div>

              {/* Max Discount (for percentage) */}
              {formData.type === 'PERCENTAGE' && (
                <div>
                  <label className="block text-xs font-black text-gray-600 mb-2 uppercase tracking-wider">
                    Max Diskon (Rp)
                  </label>
                  <input
                    type="number"
                    value={formData.maxDiscount}
                    onChange={(e) => setFormData({ ...formData, maxDiscount: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-[#552CB7] focus:ring-2 focus:ring-[#552CB7]/20 transition-all"
                    placeholder="Tidak terbatas"
                    min="0"
                    step="1000"
                  />
                </div>
              )}

              {/* Divider */}
              <div className="sm:col-span-2 border-t-2 border-dashed border-gray-300 my-2"></div>

              {/* Usage Limit */}
              <div>
                <label className="block text-xs font-black text-gray-600 mb-2 uppercase tracking-wider">
                  Batas Total Penggunaan
                </label>
                <input
                  type="number"
                  value={formData.usageLimit}
                  onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-[#552CB7] focus:ring-2 focus:ring-[#552CB7]/20 transition-all"
                  placeholder="Unlimited"
                  min="1"
                />
              </div>

              {/* Per User Limit */}
              <div>
                <label className="block text-xs font-black text-gray-600 mb-2 uppercase tracking-wider">
                  Batas Per Customer
                </label>
                <input
                  type="number"
                  value={formData.perUserLimit}
                  onChange={(e) => setFormData({ ...formData, perUserLimit: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-[#552CB7] focus:ring-2 focus:ring-[#552CB7]/20 transition-all"
                  placeholder="Unlimited"
                  min="1"
                />
              </div>

              {/* Valid From */}
              <div>
                <label className="block text-xs font-black text-gray-600 mb-2 uppercase tracking-wider">
                  Berlaku Dari *
                </label>
                <input
                  type="date"
                  required
                  value={formData.validFrom}
                  onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-[#552CB7] focus:ring-2 focus:ring-[#552CB7]/20 transition-all"
                />
              </div>

              {/* Valid Until */}
              <div>
                <label className="block text-xs font-black text-gray-600 mb-2 uppercase tracking-wider">
                  Berlaku Sampai *
                </label>
                <input
                  type="date"
                  required
                  value={formData.validUntil}
                  onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-[#552CB7] focus:ring-2 focus:ring-[#552CB7]/20 transition-all"
                />
              </div>

              {/* Divider */}
              <div className="sm:col-span-2 border-t-2 border-dashed border-gray-300 my-2"></div>

              {/* Advanced Promotional Rules (Phase 4) */}
              <div className="sm:col-span-2">
                <h3 className="text-sm font-black text-[#552CB7] uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Sparkles size={18} />
                  Advanced Promotional Rules
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 bg-[#552CB7]/5 border-2 border-[#552CB7]/20 rounded-2xl">
                  {/* Applicable Categories */}
                  <div>
                    <label className="block text-xs font-black text-gray-600 mb-3 uppercase tracking-wider flex items-center gap-2">
                      <Layers size={14} />
                      Kategori Berlaku
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {categories.map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => {
                            const newCats = formData.applicableCategories.includes(cat)
                              ? formData.applicableCategories.filter(c => c !== cat)
                              : [...formData.applicableCategories, cat];
                            setFormData({ ...formData, applicableCategories: newCats });
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition-all ${formData.applicableCategories.includes(cat)
                              ? 'bg-[#552CB7] text-white border-black shadow-[2px_2px_0px_rgba(0,0,0,1)]'
                              : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                            }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                    <p className="text-[10px] text-gray-400 mt-2 font-bold italic">* Kosongkan untuk semua kategori</p>
                  </div>

                  {/* Happy Hour */}
                  <div>
                    <label className="block text-xs font-black text-gray-600 mb-3 uppercase tracking-wider flex items-center gap-2">
                      <Clock size={14} />
                      Happy Hour (Jam)
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 mb-1">DARI</p>
                        <input
                          type="time"
                          value={formData.happyHourStart}
                          onChange={(e) => setFormData({ ...formData, happyHourStart: e.target.value })}
                          className="w-full px-3 py-2 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-[#552CB7] font-bold text-sm"
                        />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 mb-1">SAMPAI</p>
                        <input
                          type="time"
                          value={formData.happyHourEnd}
                          onChange={(e) => setFormData({ ...formData, happyHourEnd: e.target.value })}
                          className="w-full px-3 py-2 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-[#552CB7] font-bold text-sm"
                        />
                      </div>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-2 font-bold italic">* Kosongkan untuk berlaku sepanjang hari</p>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="sm:col-span-2 border-t-2 border-dashed border-gray-300 my-2"></div>

              {/* Branch Selection */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-black text-gray-600 mb-3 uppercase tracking-wider flex items-center gap-2">
                  <MapPin size={14} />
                  Berlaku di Cabang
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setApplicableBranches([])}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition-all ${applicableBranches.length === 0
                        ? 'bg-[#552CB7] text-white border-black shadow-[2px_2px_0px_rgba(0,0,0,1)]'
                        : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                      }`}
                  >
                    SEMUA CABANG
                  </button>
                  {branches.map((branch) => (
                    <button
                      key={branch.id}
                      type="button"
                      onClick={() => {
                        const newBranches = applicableBranches.includes(branch.id)
                          ? applicableBranches.filter(b => b !== branch.id)
                          : [...applicableBranches, branch.id];
                        setApplicableBranches(newBranches);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition-all ${applicableBranches.includes(branch.id)
                          ? 'bg-[#552CB7] text-white border-black shadow-[2px_2px_0px_rgba(0,0,0,1)]'
                          : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                        }`}
                    >
                      {branch.name}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-gray-400 mt-2 font-bold italic">* Jika "SEMUA CABANG" dipilih, voucher berlaku global.</p>
              </div>

              {/* Active Status */}
              <div className="sm:col-span-2 pt-2">
                <label className="flex items-center gap-3 cursor-pointer p-4 bg-gray-50 rounded-xl border-2 border-gray-200 hover:border-[#552CB7] transition-all">
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="w-5 h-5 rounded border-2 border-gray-400 text-[#552CB7] focus:ring-2 focus:ring-[#552CB7]/20"
                  />
                  <span className="font-bold text-gray-700">Aktifkan voucher sekarang</span>
                </label>
              </div>
            </div>
          </div>

          {/* Actions - Fixed at bottom */}
          <div className="flex gap-3 p-4 sm:p-6 pt-0 border-t-2 border-gray-200 bg-gray-50 rounded-b-2xl flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-white hover:bg-gray-100 rounded-xl font-bold transition-all border-2 border-gray-300"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-gradient-to-r from-[#552CB7] to-[#6B3FD9] text-white rounded-xl font-bold shadow-[0_4px_12px_rgba(85,44,183,0.3)] hover:shadow-[0_6px_16px_rgba(85,44,183,0.4)] transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed border-2 border-black"
              disabled={loading}
            >
              {loading ? 'Saving...' : voucher ? 'Update Voucher' : 'Create Voucher'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
