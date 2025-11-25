import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { McaLender, McaLenderFormData } from '../types/lenders/mca';

export function useMcaLenders() {
  const [lenders, setLenders] = useState<McaLender[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLenders = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error: fetchError } = await supabase
        .from('lenders_mca')
        .select('*');

      if (fetchError) throw fetchError;

      // Sort by paper type (A Paper, A-B Paper, B Paper, C-D Paper) then by lender name
      const paperOrder: Record<string, number> = {
        'A Paper': 1,
        'A-B Paper': 2,
        'A Paper / B Paper': 2,
        'A/B Paper': 2,
        'B Paper': 3,
        'B/C Paper': 3.5,
        'C-D Paper': 4,
        'C Paper / D Paper': 4,
        'A/C Paper': 2.5,
        'A/B/C Paper': 2.5,
      };

      const sortedData = (data || []).sort((a, b) => {
        const paperA = paperOrder[a.paper || ''] || 999;
        const paperB = paperOrder[b.paper || ''] || 999;

        if (paperA !== paperB) {
          return paperA - paperB;
        }

        return (a.lender_name || '').localeCompare(b.lender_name || '');
      });

      setLenders(sortedData);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch lenders';
      setError(message);
      console.error('Error fetching MCA lenders:', err);
    } finally {
      setLoading(false);
    }
  };

  const addLender = async (lenderData: McaLenderFormData) => {
    try {
      const { data, error: insertError } = await supabase
        .from('lenders_mca')
        .insert([lenderData])
        .select()
        .single();

      if (insertError) throw insertError;
      if (data) {
        const paperOrder: Record<string, number> = {
          'A Paper': 1,
          'A-B Paper': 2,
          'A Paper / B Paper': 2,
          'A/B Paper': 2,
          'B Paper': 3,
          'B/C Paper': 3.5,
          'C-D Paper': 4,
          'C Paper / D Paper': 4,
          'A/C Paper': 2.5,
          'A/B/C Paper': 2.5,
        };

        setLenders(prev => [...prev, data].sort((a, b) => {
          const paperA = paperOrder[a.paper || ''] || 999;
          const paperB = paperOrder[b.paper || ''] || 999;

          if (paperA !== paperB) {
            return paperA - paperB;
          }

          return (a.lender_name || '').localeCompare(b.lender_name || '');
        }));
      }
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add lender';
      console.error('Error adding MCA lender:', err);
      throw new Error(message);
    }
  };

  const updateLender = async (id: string, lenderData: McaLenderFormData) => {
    try {
      const { data, error: updateError } = await supabase
        .from('lenders_mca')
        .update(lenderData)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;
      if (data) {
        const paperOrder: Record<string, number> = {
          'A Paper': 1,
          'A-B Paper': 2,
          'A Paper / B Paper': 2,
          'A/B Paper': 2,
          'B Paper': 3,
          'B/C Paper': 3.5,
          'C-D Paper': 4,
          'C Paper / D Paper': 4,
          'A/C Paper': 2.5,
          'A/B/C Paper': 2.5,
        };

        setLenders(prev =>
          prev.map(l => (l.id === id ? data : l))
            .sort((a, b) => {
              const paperA = paperOrder[a.paper || ''] || 999;
              const paperB = paperOrder[b.paper || ''] || 999;

              if (paperA !== paperB) {
                return paperA - paperB;
              }

              return (a.lender_name || '').localeCompare(b.lender_name || '');
            })
        );
      }
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update lender';
      console.error('Error updating MCA lender:', err);
      throw new Error(message);
    }
  };

  const deleteLender = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('lenders_mca')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      setLenders(prev => prev.filter(l => l.id !== id));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete lender';
      console.error('Error deleting MCA lender:', err);
      throw new Error(message);
    }
  };

  useEffect(() => {
    fetchLenders();

    // Subscribe to real-time changes
    const subscription = supabase
      .channel('lenders_mca_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lenders_mca',
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
