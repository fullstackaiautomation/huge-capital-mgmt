// Lenders Page
// Epic 2: Lenders Dashboard (LD-001)

import { useState } from 'react';
import { Building2, Plus, X, GripVertical, ChevronDown } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useAllLenders, type UnifiedLender } from '../hooks/useAllLenders';
import { useBusinessLineOfCreditLenders } from '../hooks/useBusinessLineOfCreditLenders';
import { useMcaLenders } from '../hooks/useMcaLenders';
import { useSbaLenders } from '../hooks/useSbaLenders';
import { supabase } from '../lib/supabase';
import type { BusinessLineOfCreditLenderFormData } from '../types/lenders/businessLineOfCredit';
import type { McaLenderFormData } from '../types/lenders/mca';
import type { SbaLenderFormData } from '../types/lenders/sba';

export default function Lenders() {
  const [activeFilter, setActiveFilter] = useState('all');
  const [relationshipFilter, setRelationshipFilter] = useState<'all' | 'Huge Capital' | 'IFS'>('Huge Capital');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedLenderType, setSelectedLenderType] = useState<'Business Line of Credit' | 'MCA' | 'SBA' | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const { lenders: allLenders, loading, error, fetchAllLenders } = useAllLenders();
  const { addLender: addBLCLender } = useBusinessLineOfCreditLenders();
  const { addLender: addMCALender } = useMcaLenders();
  const { addLender: addSBALender } = useSbaLenders();

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Form state for all lender types
  const [formData, setFormData] = useState<any>({});

  const filters = [
    { id: 'Business Line of Credit', label: 'Business Line\nof Credit' },
    { id: 'MCA', label: 'MCA' },
    { id: 'SBA', label: 'SBA' },
    { id: 'Term Loans', label: 'Term Loans' },
    { id: 'CBA', label: 'Conventional Bank\n(TL/LOC)' },
    { id: 'Equipment Financing', label: 'Equipment\nFinancing' },
    { id: 'MCA Debt Restructuring', label: 'MCA Debt\nRestructuring' },
    { id: 'DSCR', label: 'DSCR' },
    { id: 'Fix & Flip', label: 'Fix & Flip' },
    { id: 'New Construction', label: 'New\nConstruction' },
    { id: 'Commercial Real Estate', label: 'Commercial\nReal Estate' },
  ];

  // Apply both active filter (by type) and relationship filter to lenders for display
  let lenders = allLenders;

  // Filter by lender type if activeFilter is set
  if (activeFilter && activeFilter !== 'all') {
    lenders = lenders.filter((l: UnifiedLender) => l.lender_type === activeFilter);
  }

  // Filter by relationship
  lenders = relationshipFilter === 'all'
    ? lenders
    : lenders.filter((l: UnifiedLender) => l.relationship === relationshipFilter);

  // Filter allLenders by relationship for stats
  const relationshipFilteredLenders = relationshipFilter === 'all'
    ? allLenders
    : allLenders.filter((l: UnifiedLender) => l.relationship === relationshipFilter);

  const stats = {
    total: relationshipFilteredLenders.length,
    byType: {
      'Business Line of Credit': relationshipFilteredLenders.filter((l: UnifiedLender) => l.lender_type === 'Business Line of Credit').length,
      'MCA': relationshipFilteredLenders.filter((l: UnifiedLender) => l.lender_type === 'MCA').length,
      'SBA': relationshipFilteredLenders.filter((l: UnifiedLender) => l.lender_type === 'SBA').length,
      'Term Loans': relationshipFilteredLenders.filter((l: UnifiedLender) => l.lender_type === 'Term Loans').length,
      'CBA': relationshipFilteredLenders.filter((l: UnifiedLender) => l.lender_type === 'CBA').length,
      'Equipment Financing': relationshipFilteredLenders.filter((l: UnifiedLender) => l.lender_type === 'Equipment Financing').length,
      'MCA Debt Restructuring': relationshipFilteredLenders.filter((l: UnifiedLender) => l.lender_type === 'MCA Debt Restructuring').length,
      'DSCR': relationshipFilteredLenders.filter((l: UnifiedLender) => l.lender_type === 'DSCR').length,
      'Fix & Flip': relationshipFilteredLenders.filter((l: UnifiedLender) => l.lender_type === 'Fix & Flip').length,
      'New Construction': relationshipFilteredLenders.filter((l: UnifiedLender) => l.lender_type === 'New Construction').length,
      'Commercial Real Estate': relationshipFilteredLenders.filter((l: UnifiedLender) => l.lender_type === 'Commercial Real Estate').length,
    },
  };

  // Handle drag end for lender reordering
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = lenders.findIndex(lender => lender.id === active.id);
      const newIndex = lenders.findIndex(lender => lender.id === over.id);

      // Save the new sort order to the database
      try {
        const currentLender = lenders.find(l => l.id === active.id);
        if (currentLender) {
          const table =
            currentLender.lender_type === 'Business Line of Credit' ? 'lenders_business_line_of_credit' :
            currentLender.lender_type === 'MCA' ? 'lenders_mca' :
            currentLender.lender_type === 'SBA' ? 'lenders_sba' : null;

          if (table) {
            // Update sort_order for the moved lender
            const { error } = await supabase
              .from(table)
              .update({ sort_order: newIndex + 1 })
              .eq('id', active.id);

            if (error) {
              console.error('Error updating sort order:', error);
            }
          }
        }
      } catch (err) {
        console.error('Error saving sort order:', err);
      }
    }
  };

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({
      ...prev,
      [name]: value === '' ? undefined : value,
    }));
  };

  // Handle form submission
  const handleAddLender = async () => {
    setSaveError(null);
    setIsSaving(true);

    try {
      // Build the form data with required fields and status
      const dataToSubmit = {
        ...formData,
        status: formData.status || 'active',
      };

      if (selectedLenderType === 'Business Line of Credit') {
        await addBLCLender(dataToSubmit as BusinessLineOfCreditLenderFormData);
      } else if (selectedLenderType === 'MCA') {
        await addMCALender(dataToSubmit as McaLenderFormData);
      } else if (selectedLenderType === 'SBA') {
        await addSBALender(dataToSubmit as SbaLenderFormData);
      }

      // Reset form and close modal
      setFormData({});
      setShowAddModal(false);
      setSelectedLenderType(null);
      await fetchAllLenders(); // Refresh the lender list
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add lender';
      setSaveError(message);
      console.error('Error adding lender:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Reset form when modal closes
  const handleCloseModal = () => {
    setFormData({});
    setSaveError(null);
    if (selectedLenderType) {
      setSelectedLenderType(null);
    } else {
      setShowAddModal(false);
    }
  };

  // Sortable lender row component
  function SortableLenderRow({ lender }: { lender: UnifiedLender }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: lender.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };

    const rawData = lender.raw_data as any;
    const isoPhone = rawData?.phone || null;
    const isoEmail = rawData?.iso_email || null;
    const minMonthlyRevenue = rawData?.minimum_monthly_revenue || rawData?.min_monthly_revenue_amount || null;
    const adbMin = rawData?.minimum_daily_balances || rawData?.min_avg_daily_balance || null;
    const stateRestrictions = rawData?.states_restrictions || rawData?.ineligible_states || lender.restricted_industries || null;
    const submissionEmail = rawData?.email || lender.email || null;

    const handleCopyEmail = (email: string) => {
      navigator.clipboard.writeText(email);
      setCopiedEmail(email);
      setTimeout(() => setCopiedEmail(null), 2000);
    };

    return (
      <>
        <tr
          ref={setNodeRef}
          style={style}
          key={`${lender.lender_type}-${lender.id}`}
          className="border-b border-gray-700 hover:bg-gray-800/30 transition-colors"
        >
          <td className="py-3 px-2 text-center">
            <div className="flex items-center justify-center gap-1">
              <div
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing"
              >
                <GripVertical className="w-4 h-4 text-gray-400" />
              </div>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-gray-400 hover:text-gray-300 transition-colors"
              >
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${
                    isExpanded ? 'rotate-180' : ''
                  }`}
                />
              </button>
            </div>
          </td>
          <td className="text-left py-3 pr-2 pl-4 font-medium text-white">
            <div>
              <div className="text-gray-300 text-base font-semibold">{lender.lender_name}</div>
              {lender.lender_type === 'MCA' && (
                <div className="text-gray-500 text-sm">
                  {rawData?.paper || '—'}
                </div>
              )}
            </div>
          </td>
          <td className="text-left py-3 px-4">
            {lender.iso_rep ? (
              <div>
                <div className="text-gray-300 text-base font-semibold">{lender.iso_rep}</div>
                {isoPhone && <div className="text-gray-500 text-sm">{isoPhone}</div>}
                {isoEmail && (
                  <button
                    onClick={() => handleCopyEmail(isoEmail)}
                    className="text-blue-400 hover:text-blue-300 transition-colors cursor-pointer text-sm"
                    title="Click to copy ISO email"
                  >
                    {copiedEmail === isoEmail ? (
                      <span className="text-green-400">Copied!</span>
                    ) : (
                      isoEmail
                    )}
                  </button>
                )}
              </div>
            ) : (
              <div className="text-gray-500">—</div>
            )}
          </td>
          <td className="text-left py-3 px-4">
            {submissionEmail ? (
              <button
                onClick={() => handleCopyEmail(submissionEmail)}
                className="text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
                title="Click to copy email"
              >
                {copiedEmail === submissionEmail ? (
                  <span className="text-green-400">Copied!</span>
                ) : (
                  submissionEmail
                )}
              </button>
            ) : (
              <span className="text-gray-500">—</span>
            )}
          </td>
          <td className="text-center py-3 px-4">{lender.credit_requirement || <span className="text-gray-500">—</span>}</td>
          <td className="text-center py-3 px-4">{minMonthlyRevenue || <span className="text-gray-500">—</span>}</td>
          <td className="text-center py-3 px-4">{adbMin || <span className="text-gray-500">—</span>}</td>
          <td className="text-left py-3 px-4 text-xs">
            {lender.restricted_industries ? (
              rawData?.restricted_industries_doc_link ? (
                <span>
                  {lender.restricted_industries.includes('Industry List') ? (
                    <>
                      {lender.restricted_industries.replace(/Industry List/g, '')}
                      <a href={rawData.restricted_industries_doc_link} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline">
                        Industry List
                      </a>
                    </>
                  ) : lender.restricted_industries.includes('Full List') ? (
                    <>
                      {lender.restricted_industries.replace(/Full List/g, '')}
                      <a href={rawData.restricted_industries_doc_link} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline">
                        Full List
                      </a>
                    </>
                  ) : (
                    lender.restricted_industries
                  )}
                </span>
              ) : (
                lender.restricted_industries
              )
            ) : (
              <span className="text-gray-500">—</span>
            )}
          </td>
          <td className="text-center py-3 px-4 text-xs">{stateRestrictions || <span className="text-gray-500">—</span>}</td>
          <td className="text-center py-3 px-4">
            {lender.submission_type === 'Online Portal' ? (
              <a href={rawData?.portal_url || rawData?.google_drive || '#'} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline">
                {lender.submission_type}
              </a>
            ) : lender.submission_type === 'Email' ? (
              <button
                onClick={() => {
                  if (rawData?.submission_process) {
                    const emailText = rawData.submission_process
                      .replace(/^Email:\s*/i, '')
                      .split(/,\s*|\+\s*|\s+and\s+/i)
                      .map((email: string) => email.trim().replace(/^CC\s+/i, ''))
                      .filter((email: string) => email)
                      .join(', ');
                    navigator.clipboard.writeText(emailText);
                    setCopiedEmail('emails');
                    setTimeout(() => setCopiedEmail(null), 2000);
                  }
                }}
                className="text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
                title="Click to copy submission emails"
              >
                {copiedEmail === 'emails' ? (
                  <span className="text-green-400">Copied!</span>
                ) : (
                  lender.submission_type
                )}
              </button>
            ) : (
              lender.submission_type || <span className="text-gray-500">—</span>
            )}
          </td>
        </tr>
        {isExpanded && (
          <tr className="border-b border-gray-700 bg-gray-800/20">
            <td colSpan={10} className="py-4 px-4">
              {lender.lender_type === 'Business Line of Credit' ? (
                <div className="grid grid-cols-4 gap-4 text-sm">
                  {/* Column 1: Lender Info */}
                  <div className="bg-gray-900/40 border border-gray-700/50 rounded-lg p-4">
                    <div className="text-blue-400 font-semibold text-xs uppercase mb-4 pb-3 border-b border-gray-700/30">Lender Info</div>
                    <div className="space-y-3">
                      <div>
                        <div className="text-gray-500 text-xs uppercase mb-1 font-semibold">Lender Type</div>
                        <div className="text-gray-300">{lender.lender_type}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 text-xs uppercase mb-1 font-semibold">Bank / Non Bank</div>
                        <div className="text-gray-300">{rawData?.bank_non_bank || '—'}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 text-xs uppercase mb-1 font-semibold">Products Offered</div>
                        <div className="text-gray-300 text-xs">{rawData?.products_offered || '—'}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 text-xs uppercase mb-1 font-semibold">Preferred Industries</div>
                        <div className="text-gray-300 text-xs">
                          {rawData?.preferred_industries ? (
                            rawData?.preferred_industries_doc_link ? (
                              <a href={rawData.preferred_industries_doc_link} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline">
                                {rawData.preferred_industries}
                              </a>
                            ) : (
                              rawData.preferred_industries
                            )
                          ) : (
                            '—'
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-500 text-xs uppercase mb-1 font-semibold">Restricted Industries</div>
                        <div className="text-gray-300 text-xs">
                          {rawData?.restricted_industries_doc_link ? (
                            <a href={rawData.restricted_industries_doc_link} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline">
                              Full List
                            </a>
                          ) : (
                            '—'
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-500 text-xs uppercase mb-1 font-semibold">Links</div>
                        <div className="flex gap-4">
                          <div className="text-gray-300">
                            {lender.website ? (
                              <a href={lender.website} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                                Website
                              </a>
                            ) : (
                              <span className="text-gray-500">—</span>
                            )}
                          </div>
                          <div className="text-gray-300">
                            {rawData?.drive_link ? (
                              <a href={rawData.drive_link} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                                Drive
                              </a>
                            ) : (
                              <span className="text-gray-500">—</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Column 2: Requirements */}
                  <div className="bg-gray-900/40 border border-gray-700/50 rounded-lg p-4">
                    <div className="text-purple-400 font-semibold text-xs uppercase mb-4 pb-3 border-b border-gray-700/30">Requirements</div>
                    <div className="space-y-3">
                      <div>
                        <div className="text-gray-500 text-xs uppercase mb-1 font-semibold">Credit Requirement & Used</div>
                        <div className="text-gray-300">
                          <span className="font-medium">{lender.credit_requirement || '—'}</span>
                          {rawData?.credit_used && <span className="text-gray-500"> / {rawData.credit_used}</span>}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-500 text-xs uppercase mb-1 font-semibold">Min Monthly Revenue</div>
                        <div className="text-gray-300">{rawData?.min_monthly_revenue_amount || '—'}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 text-xs uppercase mb-1 font-semibold">Min Avg Daily Balance</div>
                        <div className="text-gray-300">{rawData?.min_avg_daily_balance || '—'}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 text-xs uppercase mb-1 font-semibold">Min Time in Business</div>
                        <div className="text-gray-300">{rawData?.min_time_in_business || '—'}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 text-xs uppercase mb-1 font-semibold">Min Deposit Count</div>
                        <div className="text-gray-300">{rawData?.minimum_deposit_count || '—'}</div>
                      </div>
                    </div>
                  </div>

                  {/* Column 3: Terms */}
                  <div className="bg-gray-900/40 border border-gray-700/50 rounded-lg p-4">
                    <div className="text-green-400 font-semibold text-xs uppercase mb-4 pb-3 border-b border-gray-700/30">Terms</div>
                    <div className="space-y-3">
                      <div>
                        <div className="text-gray-500 text-xs uppercase mb-1 font-semibold">Terms</div>
                        <div className="text-gray-300">{rawData?.terms || '—'}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 text-xs uppercase mb-1 font-semibold">Payments</div>
                        <div className="text-gray-300">{rawData?.payments || '—'}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 text-xs uppercase mb-1 font-semibold">Draw Fees</div>
                        <div className="text-gray-300">{rawData?.draw_fees || '—'}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 text-xs uppercase mb-1 font-semibold">Max Loan</div>
                        <div className="text-gray-300">{rawData?.max_loan || '—'}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 text-xs uppercase mb-1 font-semibold">Positions</div>
                        <div className="text-gray-300">{rawData?.positions || '—'}</div>
                      </div>
                    </div>
                  </div>

                  {/* Column 4: Submissions */}
                  <div className="bg-gray-900/40 border border-gray-700/50 rounded-lg p-4">
                    <div className="text-orange-400 font-semibold text-xs uppercase mb-4 pb-3 border-b border-gray-700/30">Submissions</div>
                    <div className="space-y-3">
                      <div>
                        <div className="text-gray-500 text-xs uppercase mb-1 font-semibold">Submission Type</div>
                        <div className="text-gray-300">{lender.submission_type || '—'}</div>
                      </div>
                      {lender.submission_type === 'Online Portal' && rawData?.portal_url ? (
                        <div>
                          <div className="text-gray-500 text-xs uppercase mb-1 font-semibold">Portal URL</div>
                          <div className="text-gray-300">
                            <a href={rawData.portal_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline">
                              Open Portal
                            </a>
                          </div>
                        </div>
                      ) : null}
                      <div>
                        <div className="text-gray-500 text-xs uppercase mb-1 font-semibold">Submission Docs</div>
                        <div className="text-gray-300 text-xs space-y-1">
                          {rawData?.submission_docs ? (
                            rawData.submission_docs
                              .split(/,\s*|\+\s*|\s+and\s+/i)
                              .map((doc: string, idx: number) => (
                                doc.trim() && (
                                  <div key={idx}>{doc.trim()}</div>
                                )
                              ))
                          ) : (
                            <div>—</div>
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-500 text-xs uppercase mb-1 font-semibold">Emails</div>
                        <div className="text-gray-300 text-xs space-y-1">
                          {rawData?.submission_process ? (
                            rawData.submission_process
                              .replace(/^Email:\s*/i, '')
                              .split(/,\s*|\+\s*/)
                              .map((email: string, idx: number) => (
                                email.trim() && (
                                  <div key={idx}>{email.trim()}</div>
                                )
                              ))
                          ) : (
                            <div>—</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : lender.lender_type === 'MCA' ? (
                <div className="grid grid-cols-4 gap-4 text-sm">
                  {/* Column 1: Lender Info (MCA) */}
                  <div className="bg-gray-900/40 border border-gray-700/50 rounded-lg p-4">
                    <div className="text-blue-400 font-semibold text-xs uppercase mb-4 pb-3 border-b border-gray-700/30">Lender Info</div>
                    <div className="space-y-3">
                      <div>
                        <div className="text-gray-500 text-xs uppercase mb-1 font-semibold">Lender Type</div>
                        <div className="text-gray-300">{lender.lender_type}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 text-xs uppercase mb-1 font-semibold">Paper</div>
                        <div className="text-gray-300">{rawData?.paper || '—'}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 text-xs uppercase mb-1 font-semibold">Products Offered</div>
                        <div className="text-gray-300 text-xs">{rawData?.products_offered || '—'}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 text-xs uppercase mb-1 font-semibold">Preferred Industries</div>
                        <div className="text-gray-300 text-xs">
                          {rawData?.preferred_industries ? (
                            rawData?.preferred_industries_doc_link ? (
                              <a href={rawData.preferred_industries_doc_link} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline">
                                {rawData.preferred_industries}
                              </a>
                            ) : (
                              rawData.preferred_industries
                            )
                          ) : (
                            '—'
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-500 text-xs uppercase mb-1 font-semibold">Restricted Industries</div>
                        <div className="text-gray-300 text-xs">
                          {rawData?.restricted_industries_doc_link ? (
                            <a href={rawData.restricted_industries_doc_link} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline">
                              Full List
                            </a>
                          ) : (
                            '—'
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-500 text-xs uppercase mb-1 font-semibold">Links</div>
                        <div className="flex gap-4">
                          <div className="text-gray-300">
                            {lender.website ? (
                              <a href={lender.website} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                                Website
                              </a>
                            ) : (
                              <span className="text-gray-500">—</span>
                            )}
                          </div>
                          <div className="text-gray-300">
                            {rawData?.google_drive ? (
                              <a href={rawData.google_drive} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                                Drive
                              </a>
                            ) : (
                              <span className="text-gray-500">—</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Column 2: Requirements (MCA) */}
                  <div className="bg-gray-900/40 border border-gray-700/50 rounded-lg p-4">
                    <div className="text-purple-400 font-semibold text-xs uppercase mb-4 pb-3 border-b border-gray-700/30">Requirements</div>
                    <div className="space-y-3">
                      <div>
                        <div className="text-gray-500 text-xs uppercase mb-1 font-semibold">Credit Requirement</div>
                        <div className="text-gray-300">{lender.credit_requirement || '—'}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 text-xs uppercase mb-1 font-semibold">Min Monthly Revenue</div>
                        <div className="text-gray-300">{rawData?.minimum_monthly_revenue || '—'}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 text-xs uppercase mb-1 font-semibold">Min Daily Balance</div>
                        <div className="text-gray-300">{rawData?.minimum_daily_balances || '—'}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 text-xs uppercase mb-1 font-semibold">Min Time in Business</div>
                        <div className="text-gray-300">{rawData?.minimum_time_in_business || '—'}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 text-xs uppercase mb-1 font-semibold">Max NSF Days</div>
                        <div className="text-gray-300">{rawData?.max_nsf_negative_days || '—'}</div>
                      </div>
                    </div>
                  </div>

                  {/* Column 3: Terms (MCA) */}
                  <div className="bg-gray-900/40 border border-gray-700/50 rounded-lg p-4">
                    <div className="text-green-400 font-semibold text-xs uppercase mb-4 pb-3 border-b border-gray-700/30">Terms</div>
                    <div className="space-y-3">
                      <div>
                        <div className="text-gray-500 text-xs uppercase mb-1 font-semibold">Terms</div>
                        <div className="text-gray-300">{rawData?.terms || '—'}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 text-xs uppercase mb-1 font-semibold">Positions</div>
                        <div className="text-gray-300">{rawData?.positions || '—'}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 text-xs uppercase mb-1 font-semibold">Buyouts</div>
                        <div className="text-gray-300">{rawData?.buyouts || '—'}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 text-xs uppercase mb-1 font-semibold">Min Loan</div>
                        <div className="text-gray-300">{rawData?.minimum_loan_amount || '—'}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 text-xs uppercase mb-1 font-semibold">Max Loan</div>
                        <div className="text-gray-300">{rawData?.max_loan_amount || '—'}</div>
                      </div>
                    </div>
                  </div>

                  {/* Column 4: Submissions (MCA) */}
                  <div className="bg-gray-900/40 border border-gray-700/50 rounded-lg p-4">
                    <div className="text-orange-400 font-semibold text-xs uppercase mb-4 pb-3 border-b border-gray-700/30">Submissions</div>
                    <div className="space-y-3">
                      <div>
                        <div className="text-gray-500 text-xs uppercase mb-1 font-semibold">Submission Type</div>
                        <div className="text-gray-300">{lender.submission_type || '—'}</div>
                      </div>
                      {lender.submission_type === 'Online Portal' && rawData?.portal_url ? (
                        <div>
                          <div className="text-gray-500 text-xs uppercase mb-1 font-semibold">Portal URL</div>
                          <div className="text-gray-300">
                            <a href={rawData.portal_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline">
                              Open Portal
                            </a>
                          </div>
                        </div>
                      ) : null}
                      <div>
                        <div className="text-gray-500 text-xs uppercase mb-1 font-semibold">Submission Docs</div>
                        <div className="text-gray-300 text-xs space-y-1">
                          {rawData?.submission_docs ? (
                            rawData.submission_docs
                              .split(/,\s*|\+\s*|\s+and\s+/i)
                              .map((doc: string, idx: number) => (
                                doc.trim() && (
                                  <div key={idx}>{doc.trim()}</div>
                                )
                              ))
                          ) : (
                            <div>—</div>
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-500 text-xs uppercase mb-1 font-semibold">Emails</div>
                        <div className="text-gray-300 text-xs space-y-1">
                          {rawData?.submission_process ? (
                            rawData.submission_process
                              .replace(/^Email:\s*/i, '')
                              .split(/,\s*|\+\s*/)
                              .map((email: string, idx: number) => (
                                email.trim() && (
                                  <div key={idx}>{email.trim()}</div>
                                )
                              ))
                          ) : (
                            <div>—</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : lender.lender_type === 'SBA' ? (
                <div className="grid grid-cols-4 gap-4 text-sm">
                  {/* Column 1: Lender Info (SBA) */}
                  <div className="bg-gray-900/40 border border-gray-700/50 rounded-lg p-4">
                    <div className="text-blue-400 font-semibold text-xs uppercase mb-4 pb-3 border-b border-gray-700/30">Lender Info</div>
                    <div className="space-y-3">
                      <div>
                        <div className="text-gray-500 text-xs uppercase mb-1 font-semibold">Lender Type</div>
                        <div className="text-gray-300">{lender.lender_type}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 text-xs uppercase mb-1 font-semibold">Contact Person</div>
                        <div className="text-gray-300">{rawData?.contact_person || '—'}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 text-xs uppercase mb-1 font-semibold">Products Offered</div>
                        <div className="text-gray-300 text-xs">{rawData?.products_offered || '—'}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 text-xs uppercase mb-1 font-semibold">Preferred Industries</div>
                        <div className="text-gray-300 text-xs">
                          {rawData?.preferred_industries ? (
                            rawData?.preferred_industries_doc_link ? (
                              <a href={rawData.preferred_industries_doc_link} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline">
                                {rawData.preferred_industries}
                              </a>
                            ) : (
                              rawData.preferred_industries
                            )
                          ) : (
                            '—'
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-500 text-xs uppercase mb-1 font-semibold">Industry Restrictions</div>
                        <div className="text-gray-300 text-xs">
                          {rawData?.restricted_industries_doc_link ? (
                            <a href={rawData.restricted_industries_doc_link} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline">
                              Full List
                            </a>
                          ) : (
                            '—'
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-500 text-xs uppercase mb-1 font-semibold">Links</div>
                        <div className="flex gap-4">
                          <div className="text-gray-300">
                            {lender.website ? (
                              <a href={lender.website} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                                Website
                              </a>
                            ) : (
                              <span className="text-gray-500">—</span>
                            )}
                          </div>
                          <div className="text-gray-300">
                            {rawData?.google_drive ? (
                              <a href={rawData.google_drive} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                                Drive
                              </a>
                            ) : (
                              <span className="text-gray-500">—</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Column 2: Requirements (SBA) */}
                  <div className="bg-gray-900/40 border border-gray-700/50 rounded-lg p-4">
                    <div className="text-purple-400 font-semibold text-xs uppercase mb-4 pb-3 border-b border-gray-700/30">Requirements</div>
                    <div className="space-y-3">
                      <div>
                        <div className="text-gray-500 text-xs uppercase mb-1 font-semibold">Credit Requirement</div>
                        <div className="text-gray-300">{lender.credit_requirement || '—'}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 text-xs uppercase mb-1 font-semibold">States Available</div>
                        <div className="text-gray-300">{rawData?.states_available || '—'}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 text-xs uppercase mb-1 font-semibold">Timeline</div>
                        <div className="text-gray-300">{rawData?.timeline || '—'}</div>
                      </div>
                    </div>
                  </div>

                  {/* Column 3: Terms (SBA) */}
                  <div className="bg-gray-900/40 border border-gray-700/50 rounded-lg p-4">
                    <div className="text-green-400 font-semibold text-xs uppercase mb-4 pb-3 border-b border-gray-700/30">Terms</div>
                    <div className="space-y-3">
                      <div>
                        <div className="text-gray-500 text-xs uppercase mb-1 font-semibold">Use of Funds</div>
                        <div className="text-gray-300">{rawData?.use_of_funds || '—'}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 text-xs uppercase mb-1 font-semibold">Min Loan</div>
                        <div className="text-gray-300">{rawData?.minimum_loan_amount || '—'}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 text-xs uppercase mb-1 font-semibold">Max Loan</div>
                        <div className="text-gray-300">{rawData?.max_loan_amount || '—'}</div>
                      </div>
                    </div>
                  </div>

                  {/* Column 4: Submissions (SBA) */}
                  <div className="bg-gray-900/40 border border-gray-700/50 rounded-lg p-4">
                    <div className="text-orange-400 font-semibold text-xs uppercase mb-4 pb-3 border-b border-gray-700/30">Submissions</div>
                    <div className="space-y-3">
                      <div>
                        <div className="text-gray-500 text-xs uppercase mb-1 font-semibold">Submission Type</div>
                        <div className="text-gray-300">{lender.submission_type || '—'}</div>
                      </div>
                      {lender.submission_type === 'Online Portal' && rawData?.portal_url ? (
                        <div>
                          <div className="text-gray-500 text-xs uppercase mb-1 font-semibold">Portal URL</div>
                          <div className="text-gray-300">
                            <a href={rawData.portal_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline">
                              Open Portal
                            </a>
                          </div>
                        </div>
                      ) : null}
                      <div>
                        <div className="text-gray-500 text-xs uppercase mb-1 font-semibold">Submission Docs</div>
                        <div className="text-gray-300 text-xs space-y-1">
                          {rawData?.submission_docs ? (
                            rawData.submission_docs
                              .split(/,\s*|\+\s*|\s+and\s+/i)
                              .map((doc: string, idx: number) => (
                                doc.trim() && (
                                  <div key={idx}>{doc.trim()}</div>
                                )
                              ))
                          ) : (
                            <div>—</div>
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-500 text-xs uppercase mb-1 font-semibold">Emails</div>
                        <div className="text-gray-300 text-xs space-y-1">
                          {rawData?.submission_process ? (
                            rawData.submission_process
                              .replace(/^Email:\s*/i, '')
                              .split(/,\s*|\+\s*/)
                              .map((email: string, idx: number) => (
                                email.trim() && (
                                  <div key={idx}>{email.trim()}</div>
                                )
                              ))
                          ) : (
                            <div>—</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                // Default layout for other lender types
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6 text-sm">
                  <div>
                    <div className="text-gray-500 text-xs uppercase mb-1">Lender Type</div>
                    <div className="text-gray-300">{lender.lender_type}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-xs uppercase mb-1">Website</div>
                    <div className="text-gray-300">
                      {lender.website ? (
                        <a href={lender.website} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                          Visit
                        </a>
                      ) : (
                        <span className="text-gray-500">—</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-xs uppercase mb-1">Relationship</div>
                    <div className="text-gray-300">{lender.relationship}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-xs uppercase mb-1">Status</div>
                    <div className="text-gray-300 capitalize">{lender.status}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-xs uppercase mb-1">Min Loan</div>
                    <div className="text-gray-300">{lender.minimum_loan_amount || '—'}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-xs uppercase mb-1">Max Loan</div>
                    <div className="text-gray-300">{lender.max_loan_amount || '—'}</div>
                  </div>
                </div>
              )}
            </td>
          </tr>
        )}
      </>
    );
  }

  return (
    <div className="w-full px-10 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Building2 className="w-8 h-8 text-white" />
          <h1 className="text-3xl font-bold text-white">Lenders</h1>
        </div>
        <div className="flex items-center gap-4">
          {/* Relationship Filter */}
          <div className="flex gap-2 bg-gray-800/30 border border-gray-700/50 rounded-lg p-1">
            {[
              { id: 'Huge Capital', label: 'Huge Capital', activeColor: 'bg-blue-600' },
              { id: 'IFS', label: 'IFS', activeColor: 'bg-orange-600' },
              { id: 'all', label: 'All', activeColor: 'bg-green-600' }
            ].map(rel => (
              <button
                key={rel.id}
                onClick={() => setRelationshipFilter(rel.id as 'all' | 'Huge Capital' | 'IFS')}
                className={`px-3 py-1.5 rounded font-medium text-sm transition-colors ${
                  relationshipFilter === rel.id
                    ? `${rel.activeColor} text-white`
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                {rel.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Lender
          </button>
        </div>
      </div>


      {/* Filter Buttons - Single Row with Counts */}
      <div className="overflow-x-auto">
        <div className="flex gap-1 pb-2">
          {filters.map(filter => {
          const isPrimary = ['Business Line of Credit', 'MCA', 'SBA'].includes(filter.id);
          let bgColor = 'bg-gray-500/10';
          let borderColor = 'border-gray-400/30';
          let textColor = 'text-gray-300';
          const count = (stats.byType as any)[filter.id] || 0;

          if (filter.id === 'Business Line of Credit') {
            bgColor = 'bg-blue-500/10';
            borderColor = 'border-blue-400/30';
            textColor = 'text-blue-300';
          } else if (filter.id === 'MCA') {
            bgColor = 'bg-purple-500/10';
            borderColor = 'border-purple-400/30';
            textColor = 'text-purple-300';
          } else if (filter.id === 'SBA') {
            bgColor = 'bg-green-500/10';
            borderColor = 'border-green-400/30';
            textColor = 'text-green-300';
          } else if (filter.id === 'Term Loans') {
            bgColor = 'bg-cyan-500/10';
            borderColor = 'border-cyan-400/30';
            textColor = 'text-cyan-300';
          } else if (filter.id === 'CBA') {
            bgColor = 'bg-teal-500/10';
            borderColor = 'border-teal-400/30';
            textColor = 'text-teal-300';
          } else if (filter.id === 'Equipment Financing') {
            bgColor = 'bg-indigo-500/10';
            borderColor = 'border-indigo-400/30';
            textColor = 'text-indigo-300';
          } else if (filter.id === 'MCA Debt Restructuring') {
            bgColor = 'bg-rose-500/10';
            borderColor = 'border-rose-400/30';
            textColor = 'text-rose-300';
          } else if (filter.id === 'DSCR') {
            bgColor = 'bg-amber-500/10';
            borderColor = 'border-amber-400/30';
            textColor = 'text-amber-300';
          } else if (filter.id === 'Fix & Flip') {
            bgColor = 'bg-orange-500/10';
            borderColor = 'border-orange-400/30';
            textColor = 'text-orange-300';
          } else if (filter.id === 'New Construction') {
            bgColor = 'bg-lime-500/10';
            borderColor = 'border-lime-400/30';
            textColor = 'text-lime-300';
          } else if (filter.id === 'Commercial Real Estate') {
            bgColor = 'bg-pink-500/10';
            borderColor = 'border-pink-400/30';
            textColor = 'text-pink-300';
          }

          return (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={`flex-1 px-4 py-3 rounded-lg transition-all ${
                activeFilter === filter.id
                  ? `${bgColor} ${borderColor} border-2 ${textColor} font-semibold`
                  : `${bgColor} ${borderColor} border border-transparent ${textColor}`
              }`}
            >
              <div className="flex flex-col items-center gap-2">
                <span className="text-sm font-medium h-8 flex items-center">{filter.label}</span>
                <span className="text-2xl font-bold h-8 flex items-center">{count}</span>
              </div>
            </button>
          );
          })}
        </div>
      </div>


      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500 rounded-lg p-4 text-red-400">
          Error: {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12 text-gray-400">
          Loading lenders...
        </div>
      )}

      {/* Lenders Table */}
      {!loading && lenders.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-gray-300" style={{ tableLayout: 'fixed' }}>
              <thead className="border-b border-gray-700 bg-gray-800/50">
                <tr>
                  <th className="text-center py-3 px-2 font-semibold w-8">Drag</th>
                  <th className="text-left py-3 pr-2 pl-4 font-semibold w-32">Lender Name</th>
                  <th className="text-left py-3 px-4 font-semibold w-40">ISO Rep</th>
                  <th className="text-left py-3 px-4 font-semibold w-40">ISO Email</th>
                  <th className="text-center py-3 px-4 font-semibold w-20">Credit Min</th>
                  <th className="text-center py-3 px-4 font-semibold w-20">Revenue Min</th>
                  <th className="text-center py-3 px-4 font-semibold w-20">ADB<br />Min</th>
                  <th className="text-left py-3 px-4 font-semibold w-96">Restricted Industries</th>
                  <th className="text-center py-3 px-4 font-semibold w-24">State Restriction</th>
                  <th className="text-center py-3 px-4 font-semibold w-32">Submission Type</th>
                </tr>
              </thead>
              <tbody>
                <SortableContext
                  items={lenders.map(l => l.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {lenders.map(lender => (
                    <SortableLenderRow key={lender.id} lender={lender} />
                  ))}
                </SortableContext>
              </tbody>
            </table>
          </div>
        </DndContext>
      )}

      {/* Empty State */}
      {!loading && lenders.length === 0 && (
        <div className="text-center py-12 text-gray-400 border border-dashed border-gray-700 rounded-lg">
          No lenders found for the selected filter
        </div>
      )}

      {/* Summary */}
      {!loading && lenders.length > 0 && (
        <div className="text-xs text-gray-400">
          Showing {lenders.length} lender{lenders.length !== 1 ? 's' : ''}
        </div>
      )}

      {/* Add Lender Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-lg w-[95vw] max-w-2xl max-h-[95vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className={`flex items-center justify-between p-6 border-b sticky top-0 bg-gray-800 ${
              selectedLenderType === 'Business Line of Credit' ? 'border-blue-500' :
              selectedLenderType === 'MCA' ? 'border-purple-500' :
              selectedLenderType === 'SBA' ? 'border-green-500' :
              'border-gray-700'
            }`}>
              <h3 className="text-xl font-bold text-white">
                {selectedLenderType ? `Add ${selectedLenderType} Lender` : 'Select Lender Type'}
              </h3>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6">
              {saveError && (
                <div className="bg-red-500/10 border border-red-500 rounded-lg p-3 mb-4 text-red-400 text-sm">
                  Error: {saveError}
                </div>
              )}
              {!selectedLenderType ? (
                <div className="space-y-3">
                  <p className="text-gray-400 mb-4">Choose a lender type to add:</p>
                  {['Business Line of Credit', 'MCA', 'SBA'].map(lenderType => {
                    let bgColor = 'bg-blue-600/20';
                    let borderColor = 'border-blue-500';
                    let hoverColor = 'hover:bg-blue-600/30';
                    let textColor = 'text-blue-300';

                    if (lenderType === 'Business Line of Credit') {
                      bgColor = 'bg-blue-600/20';
                      borderColor = 'border-blue-500';
                      hoverColor = 'hover:bg-blue-600/30';
                      textColor = 'text-blue-300';
                    } else if (lenderType === 'MCA') {
                      bgColor = 'bg-purple-600/20';
                      borderColor = 'border-purple-500';
                      hoverColor = 'hover:bg-purple-600/30';
                      textColor = 'text-purple-300';
                    } else if (lenderType === 'SBA') {
                      bgColor = 'bg-green-600/20';
                      borderColor = 'border-green-500';
                      hoverColor = 'hover:bg-green-600/30';
                      textColor = 'text-green-300';
                    }

                    return (
                      <button
                        key={lenderType}
                        onClick={() => setSelectedLenderType(lenderType as 'Business Line of Credit' | 'MCA' | 'SBA')}
                        className={`w-full p-4 ${bgColor} border ${borderColor} rounded-lg ${textColor} text-left font-medium transition-colors ${hoverColor}`}
                      >
                        {lenderType}
                      </button>
                    );
                  })}
                </div>
              ) : null}

              {selectedLenderType === 'Business Line of Credit' ? (
                <div className="space-y-5">
                  {/* Company Information Section */}
                  <div className="bg-gray-700/30 border border-gray-600 rounded-lg p-4">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase mb-3">Company Information</h3>
                    <div className="grid grid-cols-2 gap-y-2 gap-x-5">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Lender Name *</label>
                        <input type="text" name="lender_name" value={formData.lender_name || ''} onChange={handleInputChange} placeholder="Enter lender name" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Bank / Non-Bank *</label>
                        <select name="bank_non_bank" value={formData.bank_non_bank || ''} onChange={handleInputChange} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-blue-500">
                          <option value="">Select Type</option>
                          <option value="Bank">Bank</option>
                          <option value="Non-Bank">Non-Bank</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">ISO Contacts *</label>
                        <input type="text" name="iso_contacts" value={formData.iso_contacts || ''} onChange={handleInputChange} placeholder="Contact names" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Email *</label>
                        <input type="email" name="email" value={formData.email || ''} onChange={handleInputChange} placeholder="email@example.com" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Phone *</label>
                        <input type="tel" name="phone" value={formData.phone || ''} onChange={handleInputChange} placeholder="(555) 123-4567" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Website</label>
                        <input type="url" name="website" value={formData.website || ''} onChange={handleInputChange} placeholder="https://example.com" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500" />
                      </div>
                    </div>
                  </div>

                  {/* Row 4: Requirements & Criteria */}
                  <div className="bg-gray-700/30 border border-gray-600 rounded-lg p-4">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase mb-3">Requirements & Criteria</h3>
                    <div className="grid grid-cols-2 gap-y-2 gap-x-5">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Credit Requirement</label>
                        <input type="number" name="credit_requirement" value={formData.credit_requirement || ''} onChange={handleInputChange} placeholder="e.g., 500" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Credit Used</label>
                        <input type="text" name="credit_used" value={formData.credit_used || ''} onChange={handleInputChange} placeholder="e.g., FICO" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Min Time in Business</label>
                        <input type="text" name="min_time_in_business" value={formData.min_time_in_business || ''} onChange={handleInputChange} placeholder="e.g., 2 years" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Min Monthly Revenue</label>
                        <input type="text" name="min_monthly_revenue_amount" value={formData.min_monthly_revenue_amount || ''} onChange={handleInputChange} placeholder="e.g., $10,000" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Min Deposit Count</label>
                        <input type="number" name="minimum_deposit_count" value={formData.minimum_deposit_count || ''} onChange={handleInputChange} placeholder="e.g., 6" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Min Avg Daily Balance</label>
                        <input type="text" name="min_avg_daily_balance" value={formData.min_avg_daily_balance || ''} onChange={handleInputChange} placeholder="e.g., $5,000" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500" />
                      </div>
                    </div>
                  </div>

                  {/* Row 5: Product & Offers */}
                  <div className="bg-gray-700/30 border border-gray-600 rounded-lg p-4">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase mb-3">Product & Offers</h3>
                    <div className="grid grid-cols-2 gap-y-2 gap-x-5">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Products Offered</label>
                        <input type="text" name="products_offered" value={formData.products_offered || ''} onChange={handleInputChange} placeholder="e.g., Line of Credit, Term Loan" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Max Loan</label>
                        <input type="text" name="max_loan" value={formData.max_loan || ''} onChange={handleInputChange} placeholder="e.g., $1,500,000" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Positions</label>
                        <input type="text" name="positions" value={formData.positions || ''} onChange={handleInputChange} placeholder="e.g., 1st, 2nd" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Terms</label>
                        <input type="text" name="terms" value={formData.terms || ''} onChange={handleInputChange} placeholder="e.g., 12-60 months" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Payments</label>
                        <input type="text" name="payments" value={formData.payments || ''} onChange={handleInputChange} placeholder="e.g., Monthly, Weekly" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Draw Fees</label>
                        <input type="text" name="draw_fees" value={formData.draw_fees || ''} onChange={handleInputChange} placeholder="e.g., 1-2%" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500" />
                      </div>
                    </div>
                  </div>

                  {/* Row 6: Submission Information */}
                  <div className="bg-gray-700/30 border border-gray-600 rounded-lg p-4">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase mb-3">Submission Information</h3>
                    <div className="grid grid-cols-2 gap-y-2 gap-x-5">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Submission Type</label>
                        <select name="submission_type" value={formData.submission_type || ''} onChange={handleInputChange} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-blue-500">
                          <option value="">Select Submission Type</option>
                          <option value="Email">Email</option>
                          <option value="Online Portal">Online Portal</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Submission Documents</label>
                        <input type="text" name="submission_docs" value={formData.submission_docs || ''} onChange={handleInputChange} placeholder="e.g., Bank statements, Tax returns" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500" />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-300 mb-1">Submission Process</label>
                        <input type="text" name="submission_process" value={formData.submission_process || ''} onChange={handleInputChange} placeholder="Description of submission process" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500" />
                      </div>
                    </div>
                  </div>

                  {/* Row 7: Industry Info */}
                  <div className="bg-gray-700/30 border border-gray-600 rounded-lg p-4">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase mb-3">Industry Information</h3>
                    <div className="grid grid-cols-2 gap-y-2 gap-x-5">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Preferred Industries</label>
                        <input type="text" name="preferred_industries" value={formData.preferred_industries || ''} onChange={handleInputChange} placeholder="e.g., Retail, Services" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Restricted Industries</label>
                        <input type="text" name="restricted_industries" value={formData.restricted_industries || ''} onChange={handleInputChange} placeholder="e.g., Healthcare, Finance" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Ineligible States</label>
                        <input type="text" name="ineligible_states" value={formData.ineligible_states || ''} onChange={handleInputChange} placeholder="e.g., NY, CA" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500" />
                      </div>
                    </div>
                  </div>

                  {/* Row 8: Links & Documentation */}
                  <div className="bg-gray-700/30 border border-gray-600 rounded-lg p-4">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase mb-3">Links & Documentation</h3>
                    <div className="grid grid-cols-2 gap-y-2 gap-x-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Google Drive Link</label>
                      <input type="url" name="drive_link" value={formData.drive_link || ''} onChange={handleInputChange} placeholder="https://drive.google.com/..." className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Status</label>
                      <select name="status" value={formData.status || 'active'} onChange={handleInputChange} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-blue-500">
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="pending">Pending</option>
                        <option value="archived">Archived</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-300 mb-1">Notes</label>
                      <textarea name="notes" value={formData.notes || ''} onChange={handleInputChange} placeholder="Additional notes" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500 resize-none" rows={2} />
                    </div>
                    </div>
                  </div>
                </div>
              ) : null}

              {selectedLenderType === 'MCA' ? (
                <div className="space-y-5">
                  {/* Basic Info */}
                  <div className="bg-gray-700/30 border border-gray-600 rounded-lg p-4">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase mb-3">Basic Information</h3>
                    <div className="grid grid-cols-2 gap-y-2 gap-x-5">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Lender Name *</label>
                        <input type="text" name="lender_name" value={formData.lender_name || ''} onChange={handleInputChange} placeholder="Enter lender name" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:border-purple-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Paper</label>
                        <input type="text" name="paper" value={formData.paper || ''} onChange={handleInputChange} placeholder="e.g., Direct" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:border-purple-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Website</label>
                        <input type="url" name="website" value={formData.website || ''} onChange={handleInputChange} placeholder="https://example.com" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:border-purple-500" />
                      </div>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="bg-gray-700/30 border border-gray-600 rounded-lg p-4">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase mb-3">Contact Information</h3>
                    <div className="grid grid-cols-2 gap-y-2 gap-x-5">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">ISO Rep</label>
                        <input type="text" name="iso_rep" value={formData.iso_rep || ''} onChange={handleInputChange} placeholder="Rep name" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:border-purple-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                        <input type="email" name="email" value={formData.email || ''} onChange={handleInputChange} placeholder="email@example.com" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:border-purple-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Phone</label>
                        <input type="tel" name="phone" value={formData.phone || ''} onChange={handleInputChange} placeholder="(555) 123-4567" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:border-purple-500" />
                      </div>
                    </div>
                  </div>

                  {/* Requirements & Criteria */}
                  <div className="bg-gray-700/30 border border-gray-600 rounded-lg p-4">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase mb-3">Requirements & Criteria</h3>
                    <div className="grid grid-cols-2 gap-y-2 gap-x-5">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Min Credit</label>
                        <input type="number" name="minimum_credit_requirement" value={formData.minimum_credit_requirement || ''} onChange={handleInputChange} placeholder="e.g., 500" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:border-purple-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Min Monthly Revenue</label>
                        <input type="text" name="minimum_monthly_revenue" value={formData.minimum_monthly_revenue || ''} onChange={handleInputChange} placeholder="e.g., $10,000" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:border-purple-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Min Business Years</label>
                        <input type="text" name="minimum_time_in_business" value={formData.minimum_time_in_business || ''} onChange={handleInputChange} placeholder="e.g., 2 years" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:border-purple-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Max NSF Days</label>
                        <input type="text" name="max_nsf_negative_days" value={formData.max_nsf_negative_days || ''} onChange={handleInputChange} placeholder="e.g., 5 days" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:border-purple-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Min Daily Balance</label>
                        <input type="text" name="minimum_daily_balances" value={formData.minimum_daily_balances || ''} onChange={handleInputChange} placeholder="e.g., $2,500" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:border-purple-500" />
                      </div>
                    </div>
                  </div>

                  {/* Product & Limits */}
                  <div className="bg-gray-700/30 border border-gray-600 rounded-lg p-4">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase mb-3">Product & Limits</h3>
                    <div className="grid grid-cols-2 gap-y-2 gap-x-5">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Min Loan</label>
                        <input type="text" name="minimum_loan_amount" value={formData.minimum_loan_amount || ''} onChange={handleInputChange} placeholder="e.g., $5,000" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:border-purple-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Max Loan</label>
                        <input type="text" name="max_loan_amount" value={formData.max_loan_amount || ''} onChange={handleInputChange} placeholder="e.g., $500,000" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:border-purple-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Products</label>
                        <input type="text" name="products_offered" value={formData.products_offered || ''} onChange={handleInputChange} placeholder="e.g., MCA" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:border-purple-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Positions</label>
                        <input type="text" name="positions" value={formData.positions || ''} onChange={handleInputChange} placeholder="e.g., 1st, 2nd" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:border-purple-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Buyouts</label>
                        <input type="text" name="buyouts" value={formData.buyouts || ''} onChange={handleInputChange} placeholder="e.g., Yes/No" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:border-purple-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Terms</label>
                        <input type="text" name="terms" value={formData.terms || ''} onChange={handleInputChange} placeholder="e.g., 3-24mo" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:border-purple-500" />
                      </div>
                    </div>
                  </div>

                  {/* Industry Info */}
                  <div className="bg-gray-700/30 border border-gray-600 rounded-lg p-4">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase mb-3">Industry Information</h3>
                    <div className="grid grid-cols-2 gap-y-2 gap-x-5">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Restricted States</label>
                        <input type="text" name="states_restrictions" value={formData.states_restrictions || ''} onChange={handleInputChange} placeholder="e.g., NY, CA" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:border-purple-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Preferred Industries</label>
                        <input type="text" name="preferred_industries" value={formData.preferred_industries || ''} onChange={handleInputChange} placeholder="e.g., Retail" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:border-purple-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Restricted Industries</label>
                        <input type="text" name="restricted_industries" value={formData.restricted_industries || ''} onChange={handleInputChange} placeholder="e.g., Healthcare" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:border-purple-500" />
                      </div>
                    </div>
                  </div>

                  {/* Links & Documentation */}
                  <div className="bg-gray-700/30 border border-gray-600 rounded-lg p-4">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase mb-3">Links & Documentation</h3>
                    <div className="grid grid-cols-2 gap-y-2 gap-x-5">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Google Drive Link</label>
                        <input type="url" name="google_drive" value={formData.google_drive || ''} onChange={handleInputChange} placeholder="https://drive.google.com/..." className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:border-purple-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Status</label>
                        <select name="status" value={formData.status || 'active'} onChange={handleInputChange} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-purple-500">
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                          <option value="pending">Pending</option>
                          <option value="archived">Archived</option>
                        </select>
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-300 mb-1">Notes</label>
                        <textarea name="note" value={formData.note || ''} onChange={handleInputChange} placeholder="Additional notes" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:border-purple-500 resize-none" rows={2} />
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              {selectedLenderType === 'SBA' ? (
                <div className="space-y-5">
                  {/* Basic Info */}
                  <div className="bg-gray-700/30 border border-gray-600 rounded-lg p-4">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase mb-3">Basic Information</h3>
                    <div className="grid grid-cols-2 gap-y-2 gap-x-5">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Lender Name *</label>
                        <input type="text" name="lender_name" value={formData.lender_name || ''} onChange={handleInputChange} placeholder="Enter lender name" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:border-green-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Website</label>
                        <input type="url" name="website" value={formData.website || ''} onChange={handleInputChange} placeholder="https://example.com" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:border-green-500" />
                      </div>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="bg-gray-700/30 border border-gray-600 rounded-lg p-4">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase mb-3">Contact Information</h3>
                    <div className="grid grid-cols-2 gap-y-2 gap-x-5">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Contact Person</label>
                        <input type="text" name="contact_person" value={formData.contact_person || ''} onChange={handleInputChange} placeholder="Name of contact" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:border-green-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                        <input type="email" name="email" value={formData.email || ''} onChange={handleInputChange} placeholder="email@example.com" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:border-green-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Phone</label>
                        <input type="tel" name="phone" value={formData.phone || ''} onChange={handleInputChange} placeholder="(555) 123-4567" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:border-green-500" />
                      </div>
                    </div>
                  </div>

                  {/* Requirements & Criteria */}
                  <div className="bg-gray-700/30 border border-gray-600 rounded-lg p-4">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase mb-3">Requirements & Criteria</h3>
                    <div className="grid grid-cols-2 gap-y-2 gap-x-5">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Credit Requirement</label>
                        <input type="number" name="credit_requirement" value={formData.credit_requirement || ''} onChange={handleInputChange} placeholder="e.g., 680" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:border-green-500" />
                      </div>
                    </div>
                  </div>

                  {/* Product & Limits */}
                  <div className="bg-gray-700/30 border border-gray-600 rounded-lg p-4">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase mb-3">Product & Limits</h3>
                    <div className="grid grid-cols-2 gap-y-2 gap-x-5">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Min Loan</label>
                        <input type="text" name="minimum_loan_amount" value={formData.minimum_loan_amount || ''} onChange={handleInputChange} placeholder="e.g., $50,000" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:border-green-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Max Loan</label>
                        <input type="text" name="max_loan_amount" value={formData.max_loan_amount || ''} onChange={handleInputChange} placeholder="e.g., $5,000,000" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:border-green-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Products</label>
                        <input type="text" name="products_offered" value={formData.products_offered || ''} onChange={handleInputChange} placeholder="e.g., 7(a) Loan" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:border-green-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Use of Funds</label>
                        <input type="text" name="use_of_funds" value={formData.use_of_funds || ''} onChange={handleInputChange} placeholder="e.g., Working Capital" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:border-green-500" />
                      </div>
                    </div>
                  </div>

                  {/* Location Information */}
                  <div className="bg-gray-700/30 border border-gray-600 rounded-lg p-4">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase mb-3">Location Information</h3>
                    <div className="grid grid-cols-2 gap-y-2 gap-x-5">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">States Available</label>
                        <input type="text" name="states_available" value={formData.states_available || ''} onChange={handleInputChange} placeholder="e.g., All except NY" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:border-green-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Timeline</label>
                        <input type="text" name="timeline" value={formData.timeline || ''} onChange={handleInputChange} placeholder="e.g., 30-45 days" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:border-green-500" />
                      </div>
                    </div>
                  </div>

                  {/* Industry Info */}
                  <div className="bg-gray-700/30 border border-gray-600 rounded-lg p-4">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase mb-3">Industry Information</h3>
                    <div className="grid grid-cols-2 gap-y-2 gap-x-5">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Preferred Industries</label>
                        <input type="text" name="preferred_industries" value={formData.preferred_industries || ''} onChange={handleInputChange} placeholder="e.g., Retail" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:border-green-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Restricted Industries</label>
                        <input type="text" name="industry_restrictions" value={formData.industry_restrictions || ''} onChange={handleInputChange} placeholder="e.g., Healthcare" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:border-green-500" />
                      </div>
                    </div>
                  </div>

                  {/* Links & Documentation */}
                  <div className="bg-gray-700/30 border border-gray-600 rounded-lg p-4">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase mb-3">Links & Documentation</h3>
                    <div className="grid grid-cols-2 gap-y-2 gap-x-5">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Google Drive Link</label>
                        <input type="url" name="google_drive" value={formData.google_drive || ''} onChange={handleInputChange} placeholder="https://drive.google.com/..." className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:border-green-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Status</label>
                        <select name="status" value={formData.status || 'active'} onChange={handleInputChange} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-green-500">
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                          <option value="pending">Pending</option>
                          <option value="archived">Archived</option>
                        </select>
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-300 mb-1">Notes</label>
                        <textarea name="note" value={formData.note || ''} onChange={handleInputChange} placeholder="Additional notes" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:border-green-500 resize-none" rows={2} />
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Modal Footer */}
            <div className="flex gap-3 p-6 border-t border-gray-700 bg-gray-800/50 sticky bottom-0">
              <button
                onClick={handleCloseModal}
                disabled={isSaving}
                className="flex-1 px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {selectedLenderType ? 'Back' : 'Cancel'}
              </button>
              {selectedLenderType && (
                <button
                  onClick={handleAddLender}
                  disabled={isSaving || !formData.lender_name}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? 'Saving...' : 'Add Lender'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
