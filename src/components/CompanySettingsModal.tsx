import React, { useState } from 'react';
import { Company } from '../types/payroll';
import { Building2, X, Check } from 'lucide-react';

interface CompanySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  company: Company;
  onSaveCompany: (company: Company) => void;
}

export const CompanySettingsModal: React.FC<CompanySettingsModalProps> = ({
  isOpen,
  onClose,
  company,
  onSaveCompany,
}) => {
  const [formData, setFormData] = useState<Company>(company);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveCompany(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-xl max-w-xl w-full overflow-hidden border border-neutral-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-neutral-900 text-white flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-neutral-900 text-sm">
                Company & Utah Tax Profile
              </h3>
              <p className="text-[11px] text-neutral-500">
                Employer tax identifiers and corporate stub branding
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-700 p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 text-xs space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block font-medium text-neutral-700 mb-1">Company Legal Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5 text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block font-medium text-neutral-700 mb-1">Federal EIN (Employer ID)</label>
              <input
                type="text"
                required
                value={formData.ein}
                onChange={(e) => setFormData({ ...formData, ein: e.target.value })}
                className="w-full bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5 text-xs font-mono text-neutral-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                placeholder="XX-XXXXXXX"
              />
            </div>

            <div>
              <label className="block font-medium text-neutral-700 mb-1">
                Utah Tax Commission Account # (WTH)
              </label>
              <input
                type="text"
                required
                value={formData.utahTaxId}
                onChange={(e) => setFormData({ ...formData, utahTaxId: e.target.value })}
                className="w-full bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5 text-xs font-mono text-neutral-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                placeholder="WTH-XXXXXXX"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-medium text-neutral-700 mb-1">Street Address</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5 text-xs text-neutral-900"
              />
            </div>

            <div>
              <label className="block font-medium text-neutral-700 mb-1">City</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5 text-xs text-neutral-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-medium text-neutral-700 mb-1">State</label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="w-full bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5 text-xs font-mono text-neutral-900"
                />
              </div>
              <div>
                <label className="block font-medium text-neutral-700 mb-1">ZIP Code</label>
                <input
                  type="text"
                  value={formData.zip}
                  onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                  className="w-full bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5 text-xs font-mono text-neutral-900"
                />
              </div>
            </div>

            <div>
              <label className="block font-medium text-neutral-700 mb-1">Payroll Contact Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5 text-xs font-mono text-neutral-900"
              />
            </div>

            <div>
              <label className="block font-medium text-neutral-700 mb-1">Company Phone</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5 text-xs text-neutral-900"
              />
            </div>

            <div>
              <label className="block font-medium text-neutral-700 mb-1">Utah SUI Employer Rate</label>
              <input
                type="number"
                step="0.001"
                min="0.001"
                max="0.09"
                value={formData.sutaRate}
                onChange={(e) => setFormData({ ...formData, sutaRate: parseFloat(e.target.value) || 0.011 })}
                className="w-full bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5 text-xs font-mono text-neutral-900"
              />
              <span className="text-[10px] text-neutral-400 mt-0.5 block">
                Default Utah new employer rate is ~1.1% (0.011)
              </span>
            </div>

            <div>
              <label className="block font-medium text-neutral-700 mb-1">Watermark Overlay</label>
              <select
                value={formData.watermarkText || ''}
                onChange={(e) => setFormData({ ...formData, watermarkText: e.target.value })}
                className="w-full bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5 text-xs text-neutral-900"
              >
                <option value="">None (Official Statement)</option>
                <option value="SAMPLE">SAMPLE</option>
                <option value="VOID">VOID</option>
                <option value="CONFIDENTIAL">CONFIDENTIAL</option>
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-neutral-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 border border-neutral-300 rounded-lg text-neutral-700 hover:bg-neutral-50 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg font-semibold transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save Changes</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
