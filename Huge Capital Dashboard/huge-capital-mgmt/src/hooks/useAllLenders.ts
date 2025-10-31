import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { BusinessLineOfCreditLender } from '../types/lenders/businessLineOfCredit';
import type { McaLender } from '../types/lenders/mca';
import type { SbaLender } from '../types/lenders/sba';

export interface UnifiedLender {
  id: string;
  lender_type: 'Business Line of Credit' | 'MCA' | 'SBA' | 'CBA' | 'Term Loans' | 'Line of Credit' | 'Equipment Financing' | 'MCA Debt Restructuring' | 'DSCR' | 'Fix & Flip' | 'New Construction' | 'Commercial Real Estate';
  lender_name: string;
  website: string | null;
  phone: string | null;
  email: string | null;
  iso_rep: string | null;
  credit_requirement: number | null;
  minimum_loan_amount: string | null;
  max_loan_amount: string | null;
  products_offered: string | null;
  preferred_industries: string | null;
  restricted_industries: string | null;
  submission_type: string | null;
  google_drive: string | null;
  status: 'active' | 'inactive' | 'pending' | 'archived';
  relationship: 'Huge Capital' | 'IFS';
  created_at: string;
  sort_order: number;
  raw_data: BusinessLineOfCreditLender | McaLender | SbaLender;
}

export function useAllLenders(filterType?: string) {
  const [lenders, setLenders] = useState<UnifiedLender[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAllLenders = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch from all 3 tables in parallel
      const [blcData, mcaData, sbaData] = await Promise.all([
        supabase
          .from('lenders_business_line_of_credit')
          .select('*')
          .eq('status', 'active'),
        supabase
          .from('lenders_mca')
          .select('*')
          .eq('status', 'active'),
        supabase
          .from('lenders_sba')
          .select('*')
          .eq('status', 'active'),
      ]);

      const allLenders: UnifiedLender[] = [];

      // Process Business Line of Credit lenders
      if (blcData.data) {
        blcData.data.forEach((lender: BusinessLineOfCreditLender) => {
          allLenders.push({
            id: lender.id,
            lender_type: 'Business Line of Credit',
            lender_name: lender.lender_name,
            website: lender.website || null,
            phone: lender.phone || null,
            email: lender.email || null,
            iso_rep: (lender as any).iso_contacts || (lender as any).iso_rep || null,
            credit_requirement: lender.credit_requirement || null,
            minimum_loan_amount: null,
            max_loan_amount: lender.max_loan || null,
            products_offered: lender.products_offered || null,
            preferred_industries: lender.preferred_industries || null,
            restricted_industries: lender.restricted_industries || null,
            submission_type: lender.submission_type || null,
            google_drive: lender.drive_link || null,
            status: lender.status,
            relationship: lender.relationship,
            created_at: lender.created_at,
            raw_data: lender,
          });
        });
      }

      // Process MCA lenders
      if (mcaData.data) {
        mcaData.data.forEach((lender: McaLender) => {
          allLenders.push({
            id: lender.id,
            lender_type: 'MCA',
            lender_name: lender.lender_name,
            website: lender.website,
            phone: lender.phone,
            email: lender.email,
            iso_rep: lender.iso_rep,
            credit_requirement: lender.minimum_credit_requirement,
            minimum_loan_amount: lender.minimum_loan_amount,
            max_loan_amount: lender.max_loan_amount,
            products_offered: lender.products_offered,
            preferred_industries: lender.preferred_industries,
            restricted_industries: lender.restricted_industries,
            submission_type: lender.submission_type,
            google_drive: lender.google_drive,
            status: lender.status,
            relationship: lender.relationship,
            created_at: lender.created_at,
            raw_data: lender,
          });
        });
      }

      // Process SBA lenders
      if (sbaData.data) {
        sbaData.data.forEach((lender: SbaLender) => {
          allLenders.push({
            id: lender.id,
            lender_type: 'SBA',
            lender_name: lender.lender_name,
            website: lender.website,
            phone: lender.phone,
            email: lender.email,
            iso_rep: (lender as any).iso_rep || (lender as any).contact_person || null,
            credit_requirement: lender.credit_requirement,
            minimum_loan_amount: lender.minimum_loan_amount,
            max_loan_amount: lender.max_loan_amount,
            products_offered: lender.products_offered,
            preferred_industries: lender.preferred_industries,
            restricted_industries: lender.industry_restrictions,
            submission_type: lender.submission_type,
            google_drive: lender.google_drive,
            status: lender.status,
            relationship: lender.relationship,
            created_at: lender.created_at,
            raw_data: lender,
          });
        });
      }

      // Filter by type if specified
      let filtered = allLenders;
      if (filterType && filterType !== 'all') {
        filtered = allLenders.filter(l => l.lender_type === filterType);
      }

      // Sort by sort_order (if set), then by lender name
      filtered.sort((a, b) => {
        if (a.sort_order !== 0 || b.sort_order !== 0) {
          return a.sort_order - b.sort_order;
        }
        return a.lender_name.localeCompare(b.lender_name);
      });

      setLenders(filtered);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch lenders';
      setError(message);
      console.error('Error fetching all lenders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllLenders();

    // Subscribe to changes in all three tables
    const blcSubscription = supabase
      .channel('all_lenders_changes_blc')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lenders_business_line_of_credit' }, () => {
        fetchAllLenders();
      })
      .subscribe();

    const mcaSubscription = supabase
      .channel('all_lenders_changes_mca')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lenders_mca' }, () => {
        fetchAllLenders();
      })
      .subscribe();

    const sbaSubscription = supabase
      .channel('all_lenders_changes_sba')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lenders_sba' }, () => {
        fetchAllLenders();
      })
      .subscribe();

    return () => {
      blcSubscription.unsubscribe();
      mcaSubscription.unsubscribe();
      sbaSubscription.unsubscribe();
    };
  }, [filterType]);

  return {
    lenders,
    loading,
    error,
    fetchAllLenders,
  };
}
