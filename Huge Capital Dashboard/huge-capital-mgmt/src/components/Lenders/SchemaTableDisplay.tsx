// Schema-Based Table Display Component
// Automatically renders table columns based on lender type schema
import { Building2, MapPin, Star, ExternalLink, MoreVertical, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { getLenderTypeSchema } from '../../config/lenderTypeSchema';
import type { UnifiedLenderRow } from '../../types/schema';

interface SchemaTableDisplayProps {
  typeId: string;
  lenders: UnifiedLenderRow[];
  loading: boolean;
  onRowClick?: (lender: UnifiedLenderRow) => void;
  onEdit?: (lender: UnifiedLenderRow) => void;
  onDelete?: (id: string) => void;
  onRefresh?: () => void;
}

export default function SchemaTableDisplay({
  typeId,
  lenders,
  loading,
  onRowClick,
  onEdit,
  onDelete,
  onRefresh,
}: SchemaTableDisplayProps) {
  const schema = getLenderTypeSchema(typeId);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  if (!schema) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
        <p className="text-red-400">Invalid lender type: {typeId}</p>
      </div>
    );
  }

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
        <h3 className="text-xl font-semibold text-white mb-2">No {schema.displayName} lenders found</h3>
        <p className="text-gray-400 mb-4">Get started by adding your first {schema.displayName.toLowerCase()} to the database</p>
        <button
          onClick={onRefresh}
          className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors"
        >
          Refresh
        </button>
      </div>
    );
  }

  // Get fields to display in table
  const displayFields = schema.fields.filter((f) => f.displayInTable && f.visible !== false);
  const expandableFields = schema.fields.filter((f) => f.displayInExpanded && f.visible !== false);

  const toggleExpandRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  // ============================================================================
  // RENDER CELL VALUE
  // ============================================================================

  const renderCellValue = (value: any, fieldType?: string): string => {
    if (value === null || value === undefined || value === '') {
      return '—';
    }

    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }

    if (Array.isArray(value)) {
      return value.join(', ');
    }

    if (fieldType === 'currency' && typeof value === 'number') {
      return `$${value.toLocaleString()}`;
    }

    // Truncate long strings
    const str = String(value);
    return str.length > 50 ? str.substring(0, 47) + '...' : str;
  };

  // Format phone/email as links
  const isPhone = (str: string) => /^[\d\s\-().+]{10,}$/.test(str);
  const isEmail = (str: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);
  const isUrl = (str: string) => str.startsWith('http://') || str.startsWith('https://');

  // ============================================================================
  // DESKTOP TABLE VIEW
  // ============================================================================

  return (
    <div className="space-y-4">
      {/* Desktop Table */}
      <div className="hidden md:block bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-8"></th>
              {displayFields.map((field) => (
                <th
                  key={field.dbColumnName}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
                >
                  {field.displayName}
                </th>
              ))}
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {lenders.map((lender) => (
              <tbody key={lender.id}>
                {/* Main Row */}
                <tr className="hover:bg-gray-750 transition-colors">
                  {/* Expand Button */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    {expandableFields.length > 0 && (
                      <button
                        onClick={() => toggleExpandRow(lender.id)}
                        className="text-gray-400 hover:text-white transition-colors"
                      >
                        {expandedRows.has(lender.id) ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    )}
                  </td>

                  {/* Display Columns */}
                  {displayFields.map((field) => (
                    <td key={field.dbColumnName} className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-300">
                        {field.dbColumnName === 'lender_name' && (
                          <div className="flex items-center gap-2">
                            <div className="flex-shrink-0 h-10 w-10 bg-brand-500/10 rounded-lg flex items-center justify-center">
                              <Building2 className="h-5 w-5 text-brand-500" />
                            </div>
                            <span className="font-medium text-white">
                              {renderCellValue(lender[field.dbColumnName])}
                            </span>
                          </div>
                        )}
                        {field.dbColumnName === 'email' && lender[field.dbColumnName] && (
                          <a
                            href={`mailto:${lender[field.dbColumnName]}`}
                            className="text-brand-500 hover:text-brand-400 flex items-center gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {renderCellValue(lender[field.dbColumnName])}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                        {field.dbColumnName === 'phone' && lender[field.dbColumnName] && isPhone(String(lender[field.dbColumnName])) && (
                          <a
                            href={`tel:${lender[field.dbColumnName]}`}
                            className="text-brand-500 hover:text-brand-400"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {renderCellValue(lender[field.dbColumnName])}
                          </a>
                        )}
                        {field.dbColumnName === 'website' && lender[field.dbColumnName] && isUrl(String(lender[field.dbColumnName])) && (
                          <a
                            href={String(lender[field.dbColumnName])}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-brand-500 hover:text-brand-400 flex items-center gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Website
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                        {!['lender_name', 'email', 'phone', 'website'].includes(field.dbColumnName) && (
                          <span>{renderCellValue(lender[field.dbColumnName], field.type)}</span>
                        )}
                      </div>
                    </td>
                  ))}

                  {/* Actions */}
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Menu dropdown would go here
                      }}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </td>
                </tr>

                {/* Expanded Row */}
                {expandedRows.has(lender.id) && expandableFields.length > 0 && (
                  <tr className="bg-gray-900/50">
                    <td colSpan={displayFields.length + 2} className="px-6 py-4">
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {expandableFields.map((field) => {
                            const value = lender[field.dbColumnName];
                            if (!value) return null;

                            return (
                              <div key={field.dbColumnName} className="bg-gray-800/50 rounded p-3 border border-gray-700/30">
                                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">
                                  {field.displayName}
                                </p>
                                <div className="text-sm text-gray-300">
                                  {field.dbColumnName === 'website' || field.dbColumnName === 'drive_link' || field.dbColumnName === 'portal_url' ? (
                                    isUrl(String(value)) ? (
                                      <a
                                        href={String(value)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-brand-500 hover:text-brand-400 flex items-center gap-1 break-all"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        {field.dbColumnName === 'drive_link' ? 'Google Drive' : field.displayName}
                                        <ExternalLink className="w-3 h-3 flex-shrink-0" />
                                      </a>
                                    ) : (
                                      <span className="text-gray-500">{renderCellValue(value)}</span>
                                    )
                                  ) : (
                                    <span className="whitespace-pre-wrap break-words">
                                      {renderCellValue(value, field.type)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Expanded Row Actions */}
                        <div className="flex gap-2 pt-2 border-t border-gray-700/30">
                          {onEdit && (
                            <button
                              onClick={() => onEdit(lender)}
                              className="flex-1 py-2 px-3 text-sm bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors font-medium"
                            >
                              Edit
                            </button>
                          )}
                          {onDelete && (
                            <button
                              onClick={() => onDelete(lender.id)}
                              className="flex-1 py-2 px-3 text-sm bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors font-medium"
                            >
                              Delete
                            </button>
                          )}
                          {onRowClick && (
                            <button
                              onClick={() => onRowClick(lender)}
                              className="flex-1 py-2 px-3 text-sm bg-brand-500/20 text-brand-400 rounded hover:bg-brand-500/30 transition-colors font-medium"
                            >
                              View Details
                            </button>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {lenders.map((lender) => (
          <div
            key={lender.id}
            className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-brand-500 transition-colors"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3 flex-1">
                <div className="flex-shrink-0 h-10 w-10 bg-brand-500/10 rounded-lg flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-brand-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-semibold truncate">{lender.lender_name}</h3>
                  {lender.contact_person && (
                    <p className="text-sm text-gray-400">{lender.contact_person}</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => toggleExpandRow(lender.id)}
                className="ml-2 text-gray-400 hover:text-white"
              >
                {expandedRows.has(lender.id) ? (
                  <ChevronUp className="w-5 h-5" />
                ) : (
                  <ChevronDown className="w-5 h-5" />
                )}
              </button>
            </div>

            {/* Mobile Display Fields */}
            <div className="space-y-2 mb-3">
              {displayFields
                .filter((f) => f.dbColumnName !== 'lender_name')
                .slice(0, 2)
                .map((field) => {
                  const value = lender[field.dbColumnName];
                  if (!value) return null;

                  return (
                    <div key={field.dbColumnName} className="text-sm">
                      <span className="text-gray-500">{field.displayName}:</span>
                      <span className="text-gray-300 ml-2">{renderCellValue(value)}</span>
                    </div>
                  );
                })}
            </div>

            {/* Mobile Expandable */}
            {expandedRows.has(lender.id) && (
              <div className="bg-gray-900/50 rounded p-3 mb-3 space-y-2 border border-gray-700/30">
                {expandableFields.map((field) => {
                  const value = lender[field.dbColumnName];
                  if (!value) return null;

                  return (
                    <div key={field.dbColumnName} className="text-sm">
                      <span className="text-gray-500">{field.displayName}:</span>
                      <span className="text-gray-300 ml-2">{renderCellValue(value)}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Mobile Actions */}
            <div className="flex gap-2">
              {onEdit && (
                <button
                  onClick={() => onEdit(lender)}
                  className="flex-1 py-2 px-3 text-sm bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors font-medium"
                >
                  Edit
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => onDelete(lender.id)}
                  className="flex-1 py-2 px-3 text-sm bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors font-medium"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
