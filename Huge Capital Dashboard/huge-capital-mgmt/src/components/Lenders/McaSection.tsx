import { useState } from 'react';
import { Plus, Edit2, Trash2, ExternalLink } from 'lucide-react';
import { useMcaLenders } from '../../hooks/useMcaLenders';
import { McaForm } from './McaForm';
import type { McaLender, McaLenderFormData } from '../../types/lenders/mca';

export function McaSection() {
  const { lenders, loading, error, addLender, updateLender, deleteLender } = useMcaLenders();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleAddLender = async (formData: McaLenderFormData) => {
    try {
      setIsSaving(true);
      await addLender(formData);
      setShowAddForm(false);
    } catch (err) {
      console.error('Failed to add lender:', err);
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateLender = async (formData: McaLenderFormData) => {
    if (!editingId) return;
    try {
      setIsSaving(true);
      await updateLender(editingId, formData);
      setEditingId(null);
    } catch (err) {
      console.error('Failed to update lender:', err);
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (lender: McaLender) => {
    setEditingId(lender.id);
    setShowAddForm(true);
  };

  const handleCancel = () => {
    setEditingId(null);
    setShowAddForm(false);
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Delete "${name}"?`)) {
      try {
        setIsSaving(true);
        await deleteLender(id);
      } catch (err) {
        console.error('Failed to delete:', err);
        alert('Failed to delete lender');
      } finally {
        setIsSaving(false);
      }
    }
  };

  const editingLender = editingId ? lenders.find(l => l.id === editingId) : undefined;

  if (loading) {
    return <div className="text-gray-400">Loading MCA lenders...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">MCA</h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          disabled={isSaving}
        >
          <Plus className="w-5 h-5" />
          Add Lender
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500 rounded-lg p-4 text-red-400">
          Error: {error}
        </div>
      )}

      {showAddForm && (
        <McaForm
          lender={editingLender}
          onSubmit={editingId ? handleUpdateLender : handleAddLender}
          onCancel={handleCancel}
          isLoading={isSaving}
        />
      )}

      {lenders.length === 0 ? (
        <div className="text-center py-8 text-gray-400 border border-dashed border-gray-700 rounded-lg">
          No MCA lenders yet
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-gray-300">
            <thead className="border-b border-gray-700">
              <tr>
                <th className="text-left py-3 px-4 font-semibold">Lender Name</th>
                <th className="text-left py-3 px-4 font-semibold">Paper</th>
                <th className="text-left py-3 px-4 font-semibold">Contact</th>
                <th className="text-left py-3 px-4 font-semibold">Min Loan</th>
                <th className="text-left py-3 px-4 font-semibold">Max Loan</th>
                <th className="text-left py-3 px-4 font-semibold">Min Revenue</th>
                <th className="text-left py-3 px-4 font-semibold">Website</th>
                <th className="text-center py-3 px-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {lenders.map(lender => (
                <tr key={lender.id} className="border-b border-gray-700 hover:bg-gray-800/30 transition-colors">
                  <td className="py-3 px-4 font-medium text-white">{lender.lender_name}</td>
                  <td className="py-3 px-4">
                    {lender.paper ? (
                      <span className="px-2 py-1 rounded text-xs font-semibold bg-purple-500/20 text-purple-300">
                        {lender.paper}
                      </span>
                    ) : (
                      'N/A'
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-sm">
                      {lender.iso_rep && <div>{lender.iso_rep}</div>}
                      {lender.email && <div className="text-gray-400">{lender.email}</div>}
                    </div>
                  </td>
                  <td className="py-3 px-4">{lender.minimum_loan_amount || 'N/A'}</td>
                  <td className="py-3 px-4">{lender.max_loan_amount || 'N/A'}</td>
                  <td className="py-3 px-4">{lender.minimum_monthly_revenue || 'N/A'}</td>
                  <td className="py-3 px-4">
                    {lender.website ? (
                      <a
                        href={lender.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 flex items-center gap-1"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    ) : (
                      'N/A'
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleEdit(lender)}
                        className="p-1 text-gray-400 hover:text-blue-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={isSaving}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(lender.id, lender.lender_name)}
                        className="p-1 text-gray-400 hover:text-red-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={isSaving}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="text-xs text-gray-400 mt-2">
        Total: {lenders.length} lender{lenders.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
}
