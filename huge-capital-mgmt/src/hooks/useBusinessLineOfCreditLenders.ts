import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { BusinessLineOfCreditLender, BusinessLineOfCreditLenderFormData } from '../types/lenders/businessLineOfCredit';

export function useBusinessLineOfCreditLenders() {
  const [lenders, setLenders] = useState<BusinessLineOfCreditLender[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all lenders
  const fetchLenders = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('lenders_business_line_of_credit')
        .select('*')
        .order('lender_name', { ascending: true });

      if (fetchError) throw fetchError;

      setLenders(data || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch lenders';
      setError(message);
      console.error('Error fetching business line of credit lenders:', err);
    } finally {
      setLoading(false);
    }
  };

  // Add new lender
  const addLender = async (lenderData: BusinessLineOfCreditLenderFormData) => {
    try {
      const { data, error: insertError } = await supabase
        .from('lenders_business_line_of_credit')
        .insert([lenderData])
        .select();

      if (insertError) throw insertError;

      if (data && data.length > 0) {
        setLenders([...lenders, data[0]]);
      }

      return data?.[0];
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add lender';
      setError(message);
      console.error('Error adding business line of credit lender:', err);
      throw err;
    }
  };

  // Update existing lender
  const updateLender = async (id: string, lenderData: Partial<BusinessLineOfCreditLenderFormData>) => {
    try {
      const { data, error: updateError } = await supabase
        .from('lenders_business_line_of_credit')
        .update({
          ...lenderData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select();

      if (updateError) throw updateError;

      if (data && data.length > 0) {
        setLenders(lenders.map(l => l.id === id ? data[0] : l));
      }

      return data?.[0];
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update lender';
      setError(message);
      console.error('Error updating business line of credit lender:', err);
      throw err;
    }
  };

  // Delete lender
  const deleteLender = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('lenders_business_line_of_credit')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      setLenders(lenders.filter(l => l.id !== id));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete lender';
      setError(message);
      console.error('Error deleting business line of credit lender:', err);
      throw err;
    }
  };

  // Fetch lenders on mount
  useEffect(() => {
    fetchLenders();
  }, []);

  // Set up real-time subscription
  useEffect(() => {
    const subscription = supabase
      .channel('lenders_business_line_of_credit_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lenders_business_line_of_credit',
        },
        () => {
          fetchLenders();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return {
    lenders,
    loading,
    error,
    fetchLenders,
    addLender,
    updateLender,
    deleteLender,
  };
}
