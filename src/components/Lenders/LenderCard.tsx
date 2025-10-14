// LenderCard - Expandable card with contact details
import { useState } from 'react';
import { Building2, ChevronDown, ChevronUp, Mail, Phone, User, Edit } from 'lucide-react';
import type { LenderWithDetails } from '../../types/lender';
import { COMPANY_TYPE_LABELS, STATUS_COLORS } from '../../types/lender';

interface LenderCardProps {
  lender: LenderWithDetails;
  onClick?: () => void;
  onEdit?: (lender: LenderWithDetails) => void;
}

export default function LenderCard({ lender, onClick, onEdit }: LenderCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const primaryContact = lender.contacts.find(c => c.isPrimary) || lender.contacts[0];

  return (
    <div
      className="bg-gray-800 border border-gray-700 rounded-lg hover:border-brand-500 transition-colors"
    >
      {/* Card Header - Always Visible */}
      <div
        className="p-4 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div className="flex-shrink-0 h-12 w-12 bg-brand-500/10 rounded-lg flex items-center justify-center">
              <Building2 className="h-6 w-6 text-brand-500" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-semibold text-lg truncate">
                {lender.companyName}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                {lender.fundingType && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-brand-500/20 text-brand-400 border border-brand-500/30">
                    {lender.fundingType}
                  </span>
                )}
                <p className="text-sm text-gray-400">
                  {COMPANY_TYPE_LABELS[lender.companyType]}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${STATUS_COLORS[lender.status]}`}
            >
              {lender.status}
            </span>
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </div>
        </div>

        {/* Quick Contact Info - Always Visible */}
        {primaryContact && (
          <div className="mt-3 flex items-center gap-4 text-sm text-gray-400">
            {primaryContact.firstName && (
              <div className="flex items-center gap-1">
                <User className="w-4 h-4" />
                <span>{primaryContact.firstName} {primaryContact.lastName}</span>
              </div>
            )}
            {primaryContact.phone && (
              <div className="flex items-center gap-1">
                <Phone className="w-4 h-4" />
                <span>{primaryContact.phone}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="border-t border-gray-700 p-4 space-y-4">
          {/* Contact Details */}
          {primaryContact && (
            <div>
              <h4 className="text-sm font-semibold text-gray-300 mb-2">Primary Contact</h4>
              <div className="space-y-2 text-sm">
                {primaryContact.email && (
                  <div className="flex items-center gap-2 text-gray-400">
                    <Mail className="w-4 h-4" />
                    <a
                      href={`mailto:${primaryContact.email}`}
                      className="text-brand-500 hover:text-brand-400"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {primaryContact.email}
                    </a>
                  </div>
                )}
                {primaryContact.phone && (
                  <div className="flex items-center gap-2 text-gray-400">
                    <Phone className="w-4 h-4" />
                    <a
                      href={`tel:${primaryContact.phone}`}
                      className="text-brand-500 hover:text-brand-400"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {primaryContact.phone}
                    </a>
                  </div>
                )}
                {primaryContact.title && (
                  <div className="text-gray-400">
                    <span className="font-medium">Title:</span> {primaryContact.title}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Website */}
          {lender.website && (
            <div>
              <h4 className="text-sm font-semibold text-gray-300 mb-2">Website</h4>
              <a
                href={lender.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-500 hover:text-brand-400 text-sm"
                onClick={(e) => e.stopPropagation()}
              >
                {lender.website}
              </a>
            </div>
          )}

          {/* Programs */}
          {lender.programs && lender.programs.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-300 mb-2">
                Programs ({lender.programs.length})
              </h4>
              <div className="space-y-2">
                {lender.programs.map((program) => (
                  <div
                    key={program.id}
                    className="bg-gray-900/50 rounded p-2 text-sm"
                  >
                    <div className="text-white font-medium">{program.programName}</div>
                    {program.minLoanAmount && program.maxLoanAmount && (
                      <div className="text-gray-400 text-xs">
                        ${program.minLoanAmount.toLocaleString()} - ${program.maxLoanAmount.toLocaleString()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Additional Details from Spreadsheet */}
          {lender.notes && (
            <div>
              <h4 className="text-sm font-semibold text-gray-300 mb-2">Lender Details</h4>
              <div className="bg-gray-900/50 rounded p-3 space-y-1 text-sm">
                {lender.notes.split('\n').filter(line => line.trim() && !line.startsWith('From')).map((line, idx) => {
                  const [key, ...valueParts] = line.split(':');
                  const value = valueParts.join(':').trim();
                  if (!value) return null;
                  return (
                    <div key={idx} className="flex gap-2">
                      <span className="text-gray-400 font-medium min-w-[140px]">{key}:</span>
                      <span className="text-gray-300">{value}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Geographic Coverage */}
          {lender.geographicCoverage && lender.geographicCoverage.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-300 mb-2">Geographic Coverage</h4>
              <div className="flex flex-wrap gap-1">
                {lender.geographicCoverage.map((state) => (
                  <span
                    key={state}
                    className="px-2 py-1 bg-gray-900 text-gray-300 text-xs rounded"
                  >
                    {state}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onEdit) onEdit(lender);
              }}
              className="flex-1 py-2 px-4 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm font-medium flex items-center justify-center gap-2"
            >
              <Edit className="w-4 h-4" />
              Edit
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onClick) onClick();
              }}
              className="flex-1 py-2 px-4 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors text-sm font-medium"
            >
              View Full Details
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
