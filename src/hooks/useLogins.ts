import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface LoginEntry {
  id: number;
  site_name: string;
  link: string;
  username: string;
  password: string;
  two_fa: string;
  purpose: string;
  created_at?: string;
  updated_at?: string;
}

export const useLogins = () => {
  const [logins, setLogins] = useState<LoginEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all logins
  const fetchLogins = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error: fetchError } = await supabase
        .from('logins')
        .select('*')
        .order('site_name', { ascending: true });

      if (fetchError) throw fetchError;
      setLogins(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch logins';
      setError(errorMessage);
      console.error('Error fetching logins:', err);
    } finally {
      setLoading(false);
    }
  };

  // Add new login
  const addLogin = async (login: Omit<LoginEntry, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      setError(null);
      const { data, error: insertError } = await supabase
        .from('logins')
        .insert([login])
        .select()
        .single();

      if (insertError) throw insertError;

      // Add to local state and re-sort
      if (data) {
        setLogins([...logins, data].sort((a, b) => a.site_name.localeCompare(b.site_name)));
      }
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add login';
      setError(errorMessage);
      console.error('Error adding login:', err);
      throw err;
    }
  };

  // Update login
  const updateLogin = async (id: number, updates: Partial<LoginEntry>) => {
    try {
      setError(null);
      const { data, error: updateError } = await supabase
        .from('logins')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      // Update local state and re-sort
      if (data) {
        setLogins(
          logins
            .map(login => (login.id === id ? data : login))
            .sort((a, b) => a.site_name.localeCompare(b.site_name))
        );
      }
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update login';
      setError(errorMessage);
      console.error('Error updating login:', err);
      throw err;
    }
  };

  // Delete login
  const deleteLogin = async (id: number) => {
    try {
      setError(null);
      const { error: deleteError } = await supabase
        .from('logins')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      // Remove from local state
      setLogins(logins.filter(login => login.id !== id));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete login';
      setError(errorMessage);
      console.error('Error deleting login:', err);
      throw err;
    }
  };

  // Fetch logins on mount
  useEffect(() => {
    fetchLogins();
  }, []);

  return {
    logins,
    loading,
    error,
    addLogin,
    updateLogin,
    deleteLogin,
    refetch: fetchLogins,
  };
};
