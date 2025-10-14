// useLenders Hook
// Epic 2: Lenders Dashboard (LD-001)
// Custom hook for managing lender data with Supabase

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type {
  Lender,
  LenderWithDetails,
  LenderProgram,
  LenderContact,
  LenderCommunication,
  LenderPerformance,
  LenderFilters,
  LenderDB,
  LenderProgramDB,
  LenderContactDB,
  LenderCommunicationDB,
  LenderPerformanceDB,
  LenderFormData,
  ProgramFormData,
  ContactFormData,
  CommunicationFormData,
} from '../types/lender';

// =====================================================
// TRANSFORM FUNCTIONS (DB ↔ APP)
// =====================================================

function transformLenderFromDB(db: LenderDB): Lender {
  return {
    id: db.id,
    companyName: db.company_name,
    website: db.website,
    companyType: db.company_type,
    headquartersLocation: db.headquarters_location,
    geographicCoverage: db.geographic_coverage || [],
    licenseNumbers: db.license_numbers,
    status: db.status,
    rating: db.rating,
    notes: db.notes,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
    createdBy: db.created_by,
    lastSynced: db.last_synced,
  };
}

function transformLenderToDB(lender: Partial<LenderFormData>): Partial<LenderDB> {
  return {
    company_name: lender.companyName!,
    website: lender.website,
    company_type: lender.companyType!,
    headquarters_location: lender.headquartersLocation,
    geographic_coverage: lender.geographicCoverage || [],
    status: lender.status!,
    rating: lender.rating,
    notes: lender.notes,
  };
}

function transformProgramFromDB(db: LenderProgramDB): LenderProgram {
  return {
    id: db.id,
    lenderId: db.lender_id,
    programName: db.program_name,
    loanTypes: db.loan_types || [],
    minLoanAmount: db.min_loan_amount,
    maxLoanAmount: db.max_loan_amount,
    minCreditScore: db.min_credit_score,
    minDscr: db.min_dscr,
    maxLtv: db.max_ltv,
    propertyTypes: db.property_types || [],
    interestRateMin: db.interest_rate_min,
    interestRateMax: db.interest_rate_max,
    rateType: db.rate_type,
    termMonths: db.term_months,
    closingDays: db.closing_days,
    requirements: db.requirements,
    specialFeatures: db.special_features || [],
    status: db.status,
    effectiveDate: db.effective_date,
    expirationDate: db.expiration_date,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  };
}

function transformProgramToDB(program: Partial<ProgramFormData>): Partial<LenderProgramDB> {
  return {
    program_name: program.programName!,
    loan_types: program.loanTypes || [],
    min_loan_amount: program.minLoanAmount,
    max_loan_amount: program.maxLoanAmount,
    min_credit_score: program.minCreditScore,
    min_dscr: program.minDscr,
    max_ltv: program.maxLtv,
    property_types: program.propertyTypes || [],
    interest_rate_min: program.interestRateMin,
    interest_rate_max: program.interestRateMax,
    rate_type: program.rateType!,
    term_months: program.termMonths,
    closing_days: program.closingDays,
    requirements: program.requirements,
    special_features: program.specialFeatures || [],
    status: program.status!,
    effective_date: program.effectiveDate,
    expiration_date: program.expirationDate,
  };
}

function transformContactFromDB(db: LenderContactDB): LenderContact {
  return {
    id: db.id,
    lenderId: db.lender_id,
    firstName: db.first_name,
    lastName: db.last_name,
    title: db.title,
    department: db.department,
    email: db.email,
    phone: db.phone,
    mobile: db.mobile,
    preferredContactMethod: db.preferred_contact_method,
    isPrimary: db.is_primary,
    status: db.status,
    notes: db.notes,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  };
}

function transformContactToDB(contact: Partial<ContactFormData>): Partial<LenderContactDB> {
  return {
    first_name: contact.firstName!,
    last_name: contact.lastName!,
    title: contact.title,
    department: contact.department,
    email: contact.email,
    phone: contact.phone,
    mobile: contact.mobile,
    preferred_contact_method: contact.preferredContactMethod,
    is_primary: contact.isPrimary!,
    notes: contact.notes,
  };
}

function transformCommunicationFromDB(db: LenderCommunicationDB): LenderCommunication {
  return {
    id: db.id,
    lenderId: db.lender_id,
    contactId: db.contact_id,
    communicationType: db.communication_type,
    subject: db.subject,
    summary: db.summary,
    date: db.date,
    direction: db.direction,
    outcome: db.outcome,
    followUpRequired: db.follow_up_required,
    followUpDate: db.follow_up_date,
    createdBy: db.created_by,
    createdAt: db.created_at,
  };
}

function transformPerformanceFromDB(db: LenderPerformanceDB): LenderPerformance {
  return {
    id: db.id,
    lenderId: db.lender_id,
    totalDealsSubmitted: db.total_deals_submitted,
    totalDealsApproved: db.total_deals_approved,
    totalDealsFunded: db.total_deals_funded,
    approvalRate: db.approval_rate,
    averageApprovalDays: db.average_approval_days,
    averageClosingDays: db.average_closing_days,
    totalFundedAmount: db.total_funded_amount,
    lastDealDate: db.last_deal_date,
    lastUpdated: db.last_updated,
  };
}

// =====================================================
// MAIN HOOK
// =====================================================

export function useLenders(filters?: LenderFilters) {
  const [lenders, setLenders] = useState<Lender[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLenders = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase.from('lenders').select('*');

      // Apply filters
      if (filters) {
        if (filters.search) {
          query = query.or(`company_name.ilike.%${filters.search}%,notes.ilike.%${filters.search}%`);
        }

        if (filters.companyTypes && filters.companyTypes.length > 0) {
          query = query.in('company_type', filters.companyTypes);
        }

        if (filters.status) {
          query = query.eq('status', filters.status);
        }

        if (filters.minRating) {
          query = query.gte('rating', filters.minRating);
        }

        if (filters.geographicCoverage && filters.geographicCoverage.length > 0) {
          query = query.overlaps('geographic_coverage', filters.geographicCoverage);
        }
      }

      query = query.order('company_name', { ascending: true });

      const { data, error: queryError } = await query;

      if (queryError) throw queryError;

      const transformedLenders = (data as LenderDB[]).map(transformLenderFromDB);
      setLenders(transformedLenders);
    } catch (err) {
      console.error('Error fetching lenders:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch lenders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLenders();
  }, [JSON.stringify(filters)]);

  return {
    lenders,
    loading,
    error,
    refetch: fetchLenders,
  };
}

// =====================================================
// SINGLE LENDER WITH DETAILS HOOK
// =====================================================

export function useLenderDetails(lenderId: string | null) {
  const [lender, setLender] = useState<LenderWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLenderDetails = async () => {
    if (!lenderId) {
      setLender(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch lender
      const { data: lenderData, error: lenderError } = await supabase
        .from('lenders')
        .select('*')
        .eq('id', lenderId)
        .single();

      if (lenderError) throw lenderError;

      // Fetch programs
      const { data: programsData, error: programsError } = await supabase
        .from('lender_programs')
        .select('*')
        .eq('lender_id', lenderId);

      if (programsError) throw programsError;

      // Fetch contacts
      const { data: contactsData, error: contactsError } = await supabase
        .from('lender_contacts')
        .select('*')
        .eq('lender_id', lenderId);

      if (contactsError) throw contactsError;

      // Fetch performance
      const { data: performanceData, error: performanceError } = await supabase
        .from('lender_performance')
        .select('*')
        .eq('lender_id', lenderId)
        .maybeSingle();

      if (performanceError) throw performanceError;

      // Fetch communications
      const { data: communicationsData, error: communicationsError } = await supabase
        .from('lender_communications')
        .select('*')
        .eq('lender_id', lenderId)
        .order('date', { ascending: false });

      if (communicationsError) throw communicationsError;

      // Transform and combine
      const lenderWithDetails: LenderWithDetails = {
        ...transformLenderFromDB(lenderData as LenderDB),
        programs: (programsData as LenderProgramDB[]).map(transformProgramFromDB),
        contacts: (contactsData as LenderContactDB[]).map(transformContactFromDB),
        performance: performanceData ? transformPerformanceFromDB(performanceData as LenderPerformanceDB) : undefined,
        communicationCount: communicationsData?.length || 0,
        lastCommunication: communicationsData?.[0] ? transformCommunicationFromDB(communicationsData[0] as LenderCommunicationDB) : undefined,
      };

      setLender(lenderWithDetails);
    } catch (err) {
      console.error('Error fetching lender details:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch lender details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLenderDetails();
  }, [lenderId]);

  return {
    lender,
    loading,
    error,
    refetch: fetchLenderDetails,
  };
}

// =====================================================
// CRUD OPERATIONS
// =====================================================

export async function createLender(data: LenderFormData): Promise<Lender> {
  const { data: lenderData, error } = await supabase
    .from('lenders')
    .insert([transformLenderToDB(data)])
    .select()
    .single();

  if (error) throw error;

  return transformLenderFromDB(lenderData as LenderDB);
}

export async function updateLender(id: string, data: Partial<LenderFormData>): Promise<Lender> {
  const { data: lenderData, error } = await supabase
    .from('lenders')
    .update(transformLenderToDB(data))
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  return transformLenderFromDB(lenderData as LenderDB);
}

export async function deleteLender(id: string): Promise<void> {
  const { error } = await supabase
    .from('lenders')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// =====================================================
// PROGRAM OPERATIONS
// =====================================================

export async function createProgram(lenderId: string, data: ProgramFormData): Promise<LenderProgram> {
  const { data: programData, error } = await supabase
    .from('lender_programs')
    .insert([{ ...transformProgramToDB(data), lender_id: lenderId }])
    .select()
    .single();

  if (error) throw error;

  return transformProgramFromDB(programData as LenderProgramDB);
}

export async function updateProgram(id: string, data: Partial<ProgramFormData>): Promise<LenderProgram> {
  const { data: programData, error } = await supabase
    .from('lender_programs')
    .update(transformProgramToDB(data))
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  return transformProgramFromDB(programData as LenderProgramDB);
}

export async function deleteProgram(id: string): Promise<void> {
  const { error } = await supabase
    .from('lender_programs')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// =====================================================
// CONTACT OPERATIONS
// =====================================================

export async function createContact(lenderId: string, data: ContactFormData): Promise<LenderContact> {
  const { data: contactData, error } = await supabase
    .from('lender_contacts')
    .insert([{ ...transformContactToDB(data), lender_id: lenderId }])
    .select()
    .single();

  if (error) throw error;

  return transformContactFromDB(contactData as LenderContactDB);
}

export async function updateContact(id: string, data: Partial<ContactFormData>): Promise<LenderContact> {
  const { data: contactData, error } = await supabase
    .from('lender_contacts')
    .update(transformContactToDB(data))
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  return transformContactFromDB(contactData as LenderContactDB);
}

export async function deleteContact(id: string): Promise<void> {
  const { error } = await supabase
    .from('lender_contacts')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// =====================================================
// COMMUNICATION OPERATIONS
// =====================================================

export async function createCommunication(lenderId: string, data: CommunicationFormData): Promise<LenderCommunication> {
  const { data: commData, error } = await supabase
    .from('lender_communications')
    .insert([{
      lender_id: lenderId,
      contact_id: data.contactId,
      communication_type: data.communicationType,
      subject: data.subject,
      summary: data.summary,
      date: data.date,
      direction: data.direction,
      outcome: data.outcome,
      follow_up_required: data.followUpRequired,
      follow_up_date: data.followUpDate,
    }])
    .select()
    .single();

  if (error) throw error;

  return transformCommunicationFromDB(commData as LenderCommunicationDB);
}

// =====================================================
// BULK OPERATIONS
// =====================================================

export async function bulkDeleteLenders(ids: string[]): Promise<void> {
  const { error } = await supabase
    .from('lenders')
    .delete()
    .in('id', ids);

  if (error) throw error;
}

export async function bulkUpdateLenderStatus(ids: string[], status: string): Promise<void> {
  const { error } = await supabase
    .from('lenders')
    .update({ status })
    .in('id', ids);

  if (error) throw error;
}
