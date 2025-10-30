import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { SbaLender, SbaLenderFormData } from '../types/lenders/sba';

export function useSbaLenders() {
  const [lenders, setLenders] = useState<SbaLender[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLenders = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error: fetchError } = await supabase
        .from('lenders_sba')
        .select('*')
        .order('lender_name', { ascending: true });

      if (fetchError) throw fetchError;
      setLenders(data || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch lenders';
      setError(message);
      console.error('Error fetching SBA lenders:', err);
    } finally {
      setLoading(false);
    }
  };

  const addLender = async (lenderData: SbaLenderFormData) => {
    try {
      const { data, error: insertError } = await supabase
        .from('lenders_sba')
        .insert([lenderData])
        .select()
        .single();

      if (insertError) throw insertError;
      if (data) {
        setLenders(prev => [...prev, data].sort((a, b) =>
          a.lender_name.localeCompare(b.lender_name)
        ));
      }
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add lender';
      console.error('Error adding SBA lender:', err);
      throw new Error(message);
    }
  };

  const updateLender = async (id: string, lenderData: SbaLenderFormData) => {
    try {
      const { data, error: updateError } = await supabase
        .from('lenders_sba')
        .update(lenderData)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;
      if (data) {
        setLenders(prev =>
          prev.map(l => (l.id === id ? data : l))
            .sort((a, b) => a.lender_name.localeCompare(b.lender_name))
        );
      }
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update lender';
      console.error('Error updating SBA lender:', err);
      throw new Error(message);
    }
  };

  const deleteLender = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('lenders_sba')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      setLenders(prev => prev.filter(l => l.id !== id));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete lender';
      console.error('Error deleting SBA lender:', err);
      throw new Error(message);
    }
  };

  useEffect(() => {
    fetchLenders();

    // Subscribe to real-time changes
    const subscription = supabase
      .channel('lenders_sba_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lenders_sba',
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
