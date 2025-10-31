// Lender Type Selector Modal
// Allows user to select which lender type to add
import { X } from 'lucide-react';
import { getAllLenderTypes } from '../../config/lenderTypeSchema';
import type { LenderTypeSchema } from '../../types/schema';

interface LenderTypeSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (typeId: string) => void;
  selectedRelationship?: 'Huge Capital' | 'IFS' | 'all';
}

export default function LenderTypeSelectorModal({
  isOpen,
  onClose,
  onSelect,
  selectedRelationship = 'Huge Capital',
}: LenderTypeSelectorModalProps) {
  const allTypes = getAllLenderTypes();

  // Group types by category
  const typesByCategory = allTypes.reduce(
    (acc, type) => {
      if (!acc[type.category]) {
        acc[type.category] = [];
      }
      acc[type.category].push(type);
      return acc;
    },
    {} as Record<string, LenderTypeSchema[]>
  );

  const categoryTitles: Record<string, string> = {
    basic: 'Traditional & Basic',
    'real-estate': 'Real Estate & Construction',
    equipment: 'Equipment & Specialized',
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-white">Select Lender Type</h2>
            <p className="text-gray-400 text-sm mt-1">Choose which type of lender you want to add</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-6 space-y-8">
          {Object.entries(typesByCategory).map(([category, types]) => (
            <div key={category}>
              <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4 px-2">
                {categoryTitles[category] || category}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {types.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => {
                      onSelect(type.id);
                      onClose();
                    }}
                    className="group relative bg-gray-900/30 hover:bg-gray-900/60 border border-gray-700/50 hover:border-brand-500/50 rounded-lg p-4 transition-all text-left"
                  >
                    {/* Hover indicator */}
                    <div className="absolute inset-0 bg-brand-500/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" />

                    <div className="relative">
                      <h4 className="font-semibold text-white group-hover:text-brand-400 transition-colors mb-1">
                        {type.displayName}
                      </h4>
                      {type.description && (
                        <p className="text-xs text-gray-400 group-hover:text-gray-300 transition-colors line-clamp-2">
                          {type.description}
                        </p>
                      )}

                      {/* Field count */}
                      <div className="flex items-center gap-1 mt-2 text-xs text-gray-500 group-hover:text-gray-400">
                        <span className="inline-block w-1 h-1 bg-brand-500 rounded-full" />
                        {type.fields.length} fields
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-700 p-6 bg-gray-900/20">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-400">
              Total {allTypes.length} lender types available
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
