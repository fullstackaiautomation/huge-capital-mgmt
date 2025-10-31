// Generic Hook for All Lender Types
// Uses the schema registry to dynamically handle any lender type
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { getLenderTypeSchema } from '../config/lenderTypeSchema';
import type { UnifiedLenderRow } from '../types/schema';

export interface UseLenderTypeOptions {
  typeId: string;
  autoLoad?: boolean;
}

export interface UseLenderTypeReturn<T = UnifiedLenderRow> {
  // Data
  lenders: T[];
  loading: boolean;
  error: string | null;

  // Actions
  fetchLenders: (filters?: Record<string, any>) => Promise<void>;
  addLender: (data: Record<string, any>) => Promise<T | null>;
  updateLender: (id: string, data: Record<string, any>) => Promise<T | null>;
  deleteLender: (id: string) => Promise<boolean>;

  // Utilities
  refetch: () => Promise<void>;
  clearError: () => void;
}

export function useLenderType<T extends UnifiedLenderRow = UnifiedLenderRow>({
  typeId,
  autoLoad = true,
}: UseLenderTypeOptions): UseLenderTypeReturn<T> {
  const [lenders, setLenders] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const schema = getLenderTypeSchema(typeId);

  if (!schema) {
    throw new Error(`Lender type "${typeId}" not found in schema registry`);
  }

  // ============================================================================
  // FETCH LENDERS
  // ============================================================================

  const fetchLenders = useCallback(
    async (filters?: Record<string, any>) => {
      try {
        setLoading(true);
        setError(null);

        let query = supabase.from(schema.tableName).select('*');

        // Apply filters if provided
        if (filters) {
          Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
              if (typeof value === 'string') {
                query = query.ilike(key, `%${value}%`);
              } else if (Array.isArray(value)) {
                query = query.in(key, value);
              } else {
                query = query.eq(key, value);
              }
            }
          });
        }

        // Default: fetch by relationship filter
        if (!filters?.relationship) {
          query = query.eq('relationship', 'Huge Capital');
        }

        // Sort by lender name
        query = query.order('lender_name', { ascending: true });

        const { data, error: fetchError } = await query;

        if (fetchError) {
          throw new Error(fetchError.message);
        }

        setLenders(data as T[]);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch lenders';
        setError(message);
        console.error(`Error fetching ${schema.displayName}:`, err);
      } finally {
        setLoading(false);
      }
    },
    [schema]
  );

  // ============================================================================
  // ADD LENDER
  // ============================================================================

  const addLender = useCallback(
    async (data: Record<string, any>): Promise<T | null> => {
      try {
        setError(null);

        // Add metadata
        const lenderData = {
          ...data,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          created_by: 'user', // TODO: Get from auth context
          updated_by: 'user',
          status: data.status || 'active',
          relationship: data.relationship || 'Huge Capital',
        };

        const { data: newLender, error: insertError } = await supabase
          .from(schema.tableName)
          .insert([lenderData])
          .select()
          .single();

        if (insertError) {
          throw new Error(insertError.message);
        }

        // Add to local state
        setLenders([...lenders, newLender as T]);

        return newLender as T;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to add lender';
        setError(message);
        console.error(`Error adding ${schema.displayName}:`, err);
        return null;
      }
    },
    [schema, lenders]
  );

  // ============================================================================
  // UPDATE LENDER
  // ============================================================================

  const updateLender = useCallback(
    async (id: string, data: Record<string, any>): Promise<T | null> => {
      try {
        setError(null);

        // Add update metadata
        const updateData = {
          ...data,
          updated_at: new Date().toISOString(),
          updated_by: 'user',
        };

        const { data: updatedLender, error: updateError } = await supabase
          .from(schema.tableName)
          .update(updateData)
          .eq('id', id)
          .select()
          .single();

        if (updateError) {
          throw new Error(updateError.message);
        }

        // Update local state
        setLenders(
          lenders.map((l) => (l.id === id ? (updatedLender as T) : l))
        );

        return updatedLender as T;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update lender';
        setError(message);
        console.error(`Error updating ${schema.displayName}:`, err);
        return null;
      }
    },
    [schema, lenders]
  );

  // ============================================================================
  // DELETE LENDER
  // ============================================================================

  const deleteLender = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        setError(null);

        const { error: deleteError } = await supabase
          .from(schema.tableName)
          .delete()
          .eq('id', id);

        if (deleteError) {
          throw new Error(deleteError.message);
        }

        // Remove from local state
        setLenders(lenders.filter((l) => l.id !== id));

        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete lender';
        setError(message);
        console.error(`Error deleting ${schema.displayName}:`, err);
        return false;
      }
    },
    [schema, lenders]
  );

  // ============================================================================
  // UTILITIES
  // ============================================================================

  const refetch = useCallback(() => fetchLenders(), [fetchLenders]);

  const clearError = useCallback(() => setError(null), []);

  // ============================================================================
  // AUTO LOAD
  // ============================================================================

  useEffect(() => {
    if (autoLoad) {
      fetchLenders();
    }
  }, [autoLoad, fetchLenders]);

  return {
    lenders,
    loading,
    error,
    fetchLenders,
    addLender,
    updateLender,
    deleteLender,
    refetch,
    clearError,
  };
}
