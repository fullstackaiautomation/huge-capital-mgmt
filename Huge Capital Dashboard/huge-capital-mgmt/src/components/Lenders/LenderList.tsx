// LenderList Component
// Epic 2: Lenders Dashboard (LD-001)

import { Building2, MapPin, Star, ExternalLink, MoreVertical } from 'lucide-react';
import type { Lender } from '../../types/lender';
import { COMPANY_TYPE_LABELS, STATUS_COLORS } from '../../types/lender';

interface LenderListProps {
  lenders: Lender[];
  loading: boolean;
  onRefresh: () => void;
}

export default function LenderList({ lenders, loading }: LenderListProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  if (lenders.length === 0) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-12 text-center">
        <Building2 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">No lenders found</h3>
        <p className="text-gray-400 mb-4">
          Get started by adding your first lender to the database
        </p>
        <button
          onClick={() => console.log('Add lender')}
          className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors"
        >
          Add Your First Lender
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Table View for Desktop */}
      <div className="hidden md:block bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Company
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Coverage
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Rating
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {lenders.map((lender) => (
              <tr
                key={lender.id}
                className="hover:bg-gray-750 transition-colors cursor-pointer"
                onClick={() => console.log('View lender:', lender.id)}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 bg-brand-500/10 rounded-lg flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-brand-500" />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-white">
                        {lender.companyName}
                      </div>
                      {lender.website && (
                        <a
                          href={lender.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-brand-500 hover:text-brand-400 flex items-center gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Website
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-300">
                    {COMPANY_TYPE_LABELS[lender.companyType]}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center text-sm text-gray-300">
                    <MapPin className="w-4 h-4 mr-1 text-gray-500" />
                    {lender.geographicCoverage.length > 0 ? (
                      <span>
                        {lender.geographicCoverage.slice(0, 3).join(', ')}
                        {lender.geographicCoverage.length > 3 && (
                          <span className="text-gray-500">
                            {' '}+{lender.geographicCoverage.length - 3} more
                          </span>
                        )}
                      </span>
                    ) : (
                      <span className="text-gray-500">Not specified</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {lender.rating ? (
                    <div className="flex items-center">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 mr-1" />
                      <span className="text-sm text-white">{lender.rating.toFixed(1)}</span>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-500">No rating</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${STATUS_COLORS[lender.status]}`}
                  >
                    {lender.status.charAt(0).toUpperCase() + lender.status.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log('More actions:', lender.id);
                    }}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Card View for Mobile */}
      <div className="md:hidden space-y-4">
        {lenders.map((lender) => (
          <div
            key={lender.id}
            className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-brand-500 transition-colors cursor-pointer"
            onClick={() => console.log('View lender:', lender.id)}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center">
                <div className="flex-shrink-0 h-10 w-10 bg-brand-500/10 rounded-lg flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-brand-500" />
                </div>
                <div className="ml-3">
                  <h3 className="text-white font-semibold">{lender.companyName}</h3>
                  <p className="text-sm text-gray-400">{COMPANY_TYPE_LABELS[lender.companyType]}</p>
                </div>
              </div>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${STATUS_COLORS[lender.status]}`}
              >
                {lender.status.charAt(0).toUpperCase() + lender.status.slice(1)}
              </span>
            </div>

            {lender.rating && (
              <div className="flex items-center mb-2">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 mr-1" />
                <span className="text-sm text-white">{lender.rating.toFixed(1)}</span>
              </div>
            )}

            {lender.geographicCoverage.length > 0 && (
              <div className="flex items-center text-sm text-gray-300 mb-2">
                <MapPin className="w-4 h-4 mr-1 text-gray-500" />
                {lender.geographicCoverage.slice(0, 3).join(', ')}
                {lender.geographicCoverage.length > 3 && (
                  <span className="text-gray-500 ml-1">
                    +{lender.geographicCoverage.length - 3} more
                  </span>
                )}
              </div>
            )}

            {lender.website && (
              <a
                href={lender.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-brand-500 hover:text-brand-400 flex items-center gap-1"
                onClick={(e) => e.stopPropagation()}
              >
                Visit Website
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
