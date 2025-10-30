import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export type ChecklistItem = {
  id: string;
  title: string;
  category: string;
  isRecurring: boolean;
  orderIndex: number;
};

export type ChecklistCompletion = {
  id: string;
  checklistItemId: string;
  completedAt: string;
  notes?: string;
  date: string;
};

export type KPI = {
  id: string;
  name: string;
  description?: string;
  targetValue: number;
  unit: string;
  frequency: 'daily' | 'weekly' | 'monthly';
};

export type KPIEntry = {
  id: string;
  kpiId: string;
  value: number;
  date: string;
  notes?: string;
};

export const useDillonDaily = () => {
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [completions, setCompletions] = useState<ChecklistCompletion[]>([]);
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [kpiEntries, setKpiEntries] = useState<KPIEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchChecklistItems(),
        fetchTodayCompletions(),
        fetchKPIs(),
        fetchRecentKPIEntries(),
      ]);
    } catch (error) {
      console.error('Error fetching Dillon Daily data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchChecklistItems = async () => {
    try {
      const { data, error } = await supabase
        .from('dillon_checklist_items')
        .select('*')
        .order('order_index', { ascending: true });

      if (error) throw error;

      const formattedItems = (data || []).map((item: any) => ({
        id: item.id,
        title: item.title,
        category: item.category,
        isRecurring: item.is_recurring,
        orderIndex: item.order_index,
      }));

      setChecklistItems(formattedItems);
    } catch (error) {
      console.error('Error fetching checklist items:', error);
    }
  };

  const fetchTodayCompletions = async () => {
    const today = getTodayDate();
    try {
      const { data, error } = await supabase
        .from('dillon_checklist_completions')
        .select('*')
        .eq('date', today);

      if (error) throw error;

      const formattedCompletions = (data || []).map((completion: any) => ({
        id: completion.id,
        checklistItemId: completion.checklist_item_id,
        completedAt: completion.completed_at,
        notes: completion.notes,
        date: completion.date,
      }));

      setCompletions(formattedCompletions);
    } catch (error) {
      console.error('Error fetching today completions:', error);
    }
  };

  const fetchKPIs = async () => {
    try {
      const { data, error } = await supabase
        .from('dillon_kpis')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;

      const formattedKPIs = (data || []).map((kpi: any) => ({
        id: kpi.id,
        name: kpi.name,
        description: kpi.description,
        targetValue: kpi.target_value,
        unit: kpi.unit,
        frequency: kpi.frequency,
      }));

      setKpis(formattedKPIs);
    } catch (error) {
      console.error('Error fetching KPIs:', error);
    }
  };

  const fetchRecentKPIEntries = async () => {
    // Fetch last 30 days of KPI entries
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const fromDate = thirtyDaysAgo.toISOString().split('T')[0];

    try {
      const { data, error } = await supabase
        .from('dillon_kpi_entries')
        .select('*')
        .gte('date', fromDate)
        .order('date', { ascending: false });

      if (error) throw error;

      const formattedEntries = (data || []).map((entry: any) => ({
        id: entry.id,
        kpiId: entry.kpi_id,
        value: entry.value,
        date: entry.date,
        notes: entry.notes,
      }));

      setKpiEntries(formattedEntries);
    } catch (error) {
      console.error('Error fetching KPI entries:', error);
    }
  };

  const saveChecklistItem = async (item: Omit<ChecklistItem, 'id'>) => {
    try {
      await supabase.auth.getUser();

      const itemData = {
        title: item.title,
        category: item.category,
        is_recurring: item.isRecurring,
        order_index: item.orderIndex,
      };

      const { data, error } = await supabase
        .from('dillon_checklist_items')
        .insert(itemData)
        .select()
        .single();

      if (error) throw error;

      const newItem: ChecklistItem = {
        id: data.id,
        title: data.title,
        category: data.category,
        isRecurring: data.is_recurring,
        orderIndex: data.order_index,
      };

      setChecklistItems([...checklistItems, newItem]);
      return newItem;
    } catch (error) {
      console.error('Error saving checklist item:', error);
      throw error;
    }
  };

  const updateChecklistItem = async (id: string, updates: Partial<ChecklistItem>) => {
    try {
      const updateData: any = {};
      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.category !== undefined) updateData.category = updates.category;
      if (updates.isRecurring !== undefined) updateData.is_recurring = updates.isRecurring;
      if (updates.orderIndex !== undefined) updateData.order_index = updates.orderIndex;

      const { error } = await supabase
        .from('dillon_checklist_items')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      setChecklistItems(checklistItems.map(item =>
        item.id === id ? { ...item, ...updates } : item
      ));
    } catch (error) {
      console.error('Error updating checklist item:', error);
      throw error;
    }
  };

  const deleteChecklistItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('dillon_checklist_items')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setChecklistItems(checklistItems.filter(item => item.id !== id));
    } catch (error) {
      console.error('Error deleting checklist item:', error);
      throw error;
    }
  };

  const toggleChecklistCompletion = async (checklistItemId: string) => {
    const today = getTodayDate();
    const existingCompletion = completions.find(
      c => c.checklistItemId === checklistItemId && c.date === today
    );

    try {
      if (existingCompletion) {
        // Remove completion
        const { error } = await supabase
          .from('dillon_checklist_completions')
          .delete()
          .eq('id', existingCompletion.id);

        if (error) throw error;

        setCompletions(completions.filter(c => c.id !== existingCompletion.id));
      } else {
        // Add completion
        const { data, error } = await supabase
          .from('dillon_checklist_completions')
          .insert({
            checklist_item_id: checklistItemId,
            completed_at: new Date().toISOString(),
            date: today,
          })
          .select()
          .single();

        if (error) throw error;

        const newCompletion: ChecklistCompletion = {
          id: data.id,
          checklistItemId: data.checklist_item_id,
          completedAt: data.completed_at,
          date: data.date,
          notes: data.notes,
        };

        setCompletions([...completions, newCompletion]);
      }
    } catch (error) {
      console.error('Error toggling checklist completion:', error);
      throw error;
    }
  };

  const saveKPI = async (kpi: Omit<KPI, 'id'>) => {
    try {
      const kpiData = {
        name: kpi.name,
        description: kpi.description,
        target_value: kpi.targetValue,
        unit: kpi.unit,
        frequency: kpi.frequency,
      };

      const { data, error } = await supabase
        .from('dillon_kpis')
        .insert(kpiData)
        .select()
        .single();

      if (error) throw error;

      const newKPI: KPI = {
        id: data.id,
        name: data.name,
        description: data.description,
        targetValue: data.target_value,
        unit: data.unit,
        frequency: data.frequency,
      };

      setKpis([...kpis, newKPI]);
      return newKPI;
    } catch (error) {
      console.error('Error saving KPI:', error);
      throw error;
    }
  };

  const updateKPI = async (id: string, updates: Partial<KPI>) => {
    try {
      const updateData: any = {};
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.targetValue !== undefined) updateData.target_value = updates.targetValue;
      if (updates.unit !== undefined) updateData.unit = updates.unit;
      if (updates.frequency !== undefined) updateData.frequency = updates.frequency;

      const { error } = await supabase
        .from('dillon_kpis')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      setKpis(kpis.map(kpi =>
        kpi.id === id ? { ...kpi, ...updates } : kpi
      ));
    } catch (error) {
      console.error('Error updating KPI:', error);
      throw error;
    }
  };

  const deleteKPI = async (id: string) => {
    try {
      const { error } = await supabase
        .from('dillon_kpis')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setKpis(kpis.filter(kpi => kpi.id !== id));
    } catch (error) {
      console.error('Error deleting KPI:', error);
      throw error;
    }
  };

  const addKPIEntry = async (kpiId: string, value: number, notes?: string) => {
    const today = getTodayDate();

    try {
      const entryData = {
        kpi_id: kpiId,
        value: value,
        date: today,
        notes: notes,
      };

      const { data, error } = await supabase
        .from('dillon_kpi_entries')
        .insert(entryData)
        .select()
        .single();

      if (error) throw error;

      const newEntry: KPIEntry = {
        id: data.id,
        kpiId: data.kpi_id,
        value: data.value,
        date: data.date,
        notes: data.notes,
      };

      setKpiEntries([newEntry, ...kpiEntries]);
      return newEntry;
    } catch (error) {
      console.error('Error adding KPI entry:', error);
      throw error;
    }
  };

  const getWeeklyStats = () => {
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Calculate stats based on completions
    // This would need more complex logic based on actual data structure
    const weeklyCompletions = completions.filter(c => {
      const completionDate = new Date(c.date);
      return completionDate >= sevenDaysAgo && completionDate <= today;
    });

    return {
      totalCompleted: weeklyCompletions.length,
      averageCompletion: Math.round((weeklyCompletions.length / (checklistItems.length * 7)) * 100),
      currentStreak: calculateStreak(),
    };
  };

  const calculateStreak = () => {
    // Calculate current streak of days with completions
    // This would need implementation based on actual data
    return 0;
  };

  return {
    checklistItems,
    completions,
    kpis,
    kpiEntries,
    loading,

    // Checklist methods
    saveChecklistItem,
    updateChecklistItem,
    deleteChecklistItem,
    toggleChecklistCompletion,

    // KPI methods
    saveKPI,
    updateKPI,
    deleteKPI,
    addKPIEntry,

    // Stats
    getWeeklyStats,

    // Utility
    refetch: fetchAllData,
  };
};