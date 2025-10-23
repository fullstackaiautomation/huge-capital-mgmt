// Lenders Page
// Epic 2: Lenders Dashboard (LD-001)

import { useState } from 'react';
import { Plus, Search, Building2 } from 'lucide-react';
import { useLenders } from '../hooks/useLenders';
import type { LenderFilters } from '../types/lender';
import LenderList from '../components/Lenders/LenderList';

export default function Lenders() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<LenderFilters>({});

  // Debounced search
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setFilters({ ...filters, search: value });
  };

  const { lenders, loading, error, refetch } = useLenders(filters);

  return (
    <div className="w-full px-10 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Building2 className="w-8 h-8 text-white" />
            Lenders
          </h1>
          <p className="text-gray-400 mt-1">
            Manage your lender database and relationships
          </p>
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors"
          onClick={() => {
            // TODO: Open add lender modal
            console.log('Add lender clicked');
          }}
        >
          <Plus className="w-5 h-5" />
          Add Lender
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search lenders by name or notes..."
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="text-gray-400 text-sm">Total Lenders</div>
          <div className="text-2xl font-bold text-white mt-1">
            {loading ? '...' : lenders.length}
          </div>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="text-gray-400 text-sm">Active Lenders</div>
          <div className="text-2xl font-bold text-green-500 mt-1">
            {loading ? '...' : lenders.filter(l => l.status === 'active').length}
          </div>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="text-gray-400 text-sm">Average Rating</div>
          <div className="text-2xl font-bold text-brand-500 mt-1">
            {loading ? '...' : (
              lenders.filter(l => l.rating).length > 0
                ? (lenders.reduce((sum, l) => sum + (l.rating || 0), 0) / lenders.filter(l => l.rating).length).toFixed(1)
                : 'N/A'
            )}
          </div>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="text-gray-400 text-sm">Inactive</div>
          <div className="text-2xl font-bold text-gray-400 mt-1">
            {loading ? '...' : lenders.filter(l => l.status === 'inactive').length}
          </div>
        </div>
      </div>

      {/* Lender List */}
      {error && (
        <div className="bg-red-500/10 border border-red-500 rounded-lg p-4 text-red-400">
          Error: {error}
        </div>
      )}

      <LenderList lenders={lenders} loading={loading} onRefresh={refetch} />
    </div>
  );
}
