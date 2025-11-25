import { useState, useEffect } from 'react';
import { ClipboardCheck, Calendar, CheckCircle2, Circle, BarChart3, Clock, Award, ChevronRight, ChevronDown, FileText, Users, MessageSquare } from 'lucide-react';
import { supabase } from '../lib/supabase';

type ChecklistItem = {
  id: string;
  title: string;
  category: string;
  frequency?: string;
  notes: string;
  monday: boolean;
  tuesday: boolean;
  wednesday: boolean;
  thursday: boolean;
  friday: boolean;
};

type ViewMode = 'daily' | 'kpi' | 'weekly';
type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday';

interface WeeklyRecapData {
  category: string;
  whatWasDone: string;
  quantity: string;
  winsHighlights: string;
  issuesNotes: string;
}

export const DillonDaily = () => {
  // Determine current week
  const getCurrentWeek = (): number => {
    const today = new Date();
    const weeks = [
      { week: 1, start: new Date(2025, 9, 27), end: new Date(2025, 9, 31) },
      { week: 2, start: new Date(2025, 10, 3), end: new Date(2025, 10, 7) },
      { week: 3, start: new Date(2025, 10, 10), end: new Date(2025, 10, 14) },
      { week: 4, start: new Date(2025, 10, 17), end: new Date(2025, 10, 21) },
    ];

    const currentWeek = weeks.find(w => today >= w.start && today <= w.end);
    return currentWeek ? currentWeek.week : 1;
  };

  const [currentView, setCurrentView] = useState<ViewMode>('daily');
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  const [selectedWeek, setSelectedWeek] = useState<number | 'all'>(getCurrentWeek());

  // Weekly Recap form data
  const [weeklyRecapData, setWeeklyRecapData] = useState<WeeklyRecapData[]>([
    { category: 'Social & Content', whatWasDone: '', quantity: '', winsHighlights: '', issuesNotes: '' },
    { category: 'Pipeline & Follow-ups', whatWasDone: '', quantity: '', winsHighlights: '', issuesNotes: '' },
    { category: 'Referral Outreach', whatWasDone: '', quantity: '', winsHighlights: '', issuesNotes: '' },
    { category: 'Internal Ops', whatWasDone: '', quantity: '', winsHighlights: '', issuesNotes: '' },
    { category: 'Training & Development', whatWasDone: '', quantity: '', winsHighlights: '', issuesNotes: '' },
  ]);

  // Get current day of week
  const getCurrentDay = (): DayOfWeek => {
    const day = new Date().getDay();
    const days: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
    return day >= 1 && day <= 5 ? days[day - 1] : 'monday';
  };

  // Get week information
  const getWeekInfo = (weekNumber: number | 'all') => {
    const weeks = [
      { week: 1, start: '10/27/25', end: '10/31/25', startDate: new Date(2025, 9, 27) },
      { week: 2, start: '11/3/25', end: '11/7/25', startDate: new Date(2025, 10, 3) },
      { week: 3, start: '11/10/25', end: '11/14/25', startDate: new Date(2025, 10, 10) },
      { week: 4, start: '11/17/25', end: '11/21/25', startDate: new Date(2025, 10, 17) },
    ];

    if (weekNumber === 'all') {
      return { week: 'all' as const, start: '10/27/25', end: '11/21/25', startDate: new Date(2025, 9, 27) };
    }

    return weeks.find(w => w.week === weekNumber) || weeks[0];
  };

  // Get dates for each day in the selected week
  const getDayDate = (day: DayOfWeek): string => {
    const weekInfo = getWeekInfo(selectedWeek);
    const weekStart = weekInfo.startDate;
    const days: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
    const dayIndex = days.indexOf(day);

    const date = new Date(weekStart);
    date.setDate(date.getDate() + dayIndex);

    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  useEffect(() => {
    loadDailyChecklistData();
  }, [selectedWeek]);

  // Load daily checklist data from Supabase
  const loadDailyChecklistData = async () => {
    try {
      // Determine which week to load
      const weekNumber = selectedWeek === 'all' ? 1 : selectedWeek;

      const { data, error } = await supabase
        .from('daily_checklist')
        .select('*')
        .eq('user_id', 'dillon')
        .eq('week_number', weekNumber);

      if (error) {
        console.error('Error loading checklist data:', error);
        return;
      }

      if (data && data.length > 0) {
        // Update local state with saved data
        setChecklistItems(prev => prev.map(item => {
          const savedItem = data.find(d => d.task_id === item.id);
          if (savedItem) {
            return {
              ...item,
              monday: savedItem.monday || false,
              tuesday: savedItem.tuesday || false,
              wednesday: savedItem.wednesday || false,
              thursday: savedItem.thursday || false,
              friday: savedItem.friday || false,
              notes: savedItem.notes || item.notes
            };
          }
          return item;
        }));
      } else {
        // Reset to unchecked if no data exists for this week
        setChecklistItems(prev => prev.map(item => ({
          ...item,
          monday: false,
          tuesday: false,
          wednesday: false,
          thursday: false,
          friday: false
        })));
      }
    } catch (error) {
      console.error('Error loading checklist data:', error);
    }
  };

  // Load existing weekly recap data when week changes
  useEffect(() => {
    const loadWeeklyRecapData = async () => {
      if (currentView !== 'weekly' || selectedWeek === 'all') return;

      try {
        const { data, error } = await supabase
          .from('weekly_recaps')
          .select('*')
          .eq('week_number', selectedWeek)
          .eq('user_id', 'dillon');

        if (error) {
          console.error('Error loading weekly recap:', error);
          return;
        }

        if (data && data.length > 0) {
          // Update the state with loaded data
          setWeeklyRecapData(prev => prev.map(item => {
            const savedData = data.find(d => d.category === item.category);
            if (savedData) {
              return {
                ...item,
                whatWasDone: savedData.what_was_done || '',
                quantity: savedData.quantity || '',
                winsHighlights: savedData.wins_highlights || '',
                issuesNotes: savedData.issues_notes || ''
              };
            }
            return item;
          }));
        } else {
          // Clear form if no data exists for this week
          setWeeklyRecapData([
            { category: 'Social & Content', whatWasDone: '', quantity: '', winsHighlights: '', issuesNotes: '' },
            { category: 'Pipeline & Follow-ups', whatWasDone: '', quantity: '', winsHighlights: '', issuesNotes: '' },
            { category: 'Referral Outreach', whatWasDone: '', quantity: '', winsHighlights: '', issuesNotes: '' },
            { category: 'Internal Ops', whatWasDone: '', quantity: '', winsHighlights: '', issuesNotes: '' },
            { category: 'Training & Development', whatWasDone: '', quantity: '', winsHighlights: '', issuesNotes: '' },
          ]);
        }
      } catch (error) {
        console.error('Error loading weekly recap:', error);
      }
    };

    loadWeeklyRecapData();
  }, [selectedWeek, currentView]);

  // State for Daily Checklist - Based on actual CSV data
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([
    // Social & Content
    { id: '1', title: 'Post on FB + LinkedIn', category: 'Social & Content', notes: '', monday: false, tuesday: false, wednesday: false, thursday: false, friday: false },
    { id: '2', title: 'Track Content Metrics - AM', category: 'Social & Content', notes: '', monday: false, tuesday: false, wednesday: false, thursday: false, friday: false },
    { id: '3', title: 'Track Content Metrics - PM', category: 'Social & Content', notes: '', monday: false, tuesday: false, wednesday: false, thursday: false, friday: false },
    { id: '4', title: 'Work on Newsletter Section (progress)', category: 'Social & Content', notes: '', monday: false, tuesday: false, wednesday: false, thursday: false, friday: false },
    { id: '5', title: 'Submit Blog Idea or Draft', category: 'Social & Content', notes: '', monday: false, tuesday: false, wednesday: false, thursday: false, friday: false },
    { id: '6', title: 'Collect / Request 1 Review Weekly', category: 'Social & Content', notes: '', monday: false, tuesday: false, wednesday: false, thursday: false, friday: false },
    { id: '7', title: 'Engage With Comments / Messages', category: 'Social & Content', notes: '', monday: false, tuesday: false, wednesday: false, thursday: false, friday: false },

    // Pipelines & Follow-Ups
    { id: '8', title: 'Check Slack for Wins', category: 'Pipelines & Follow-Ups', notes: '', monday: false, tuesday: false, wednesday: false, thursday: false, friday: false },
    { id: '9', title: 'Pull New Leads from FB', category: 'Pipelines & Follow-Ups', notes: '', monday: false, tuesday: false, wednesday: false, thursday: false, friday: false },
    { id: '10', title: 'Call/Text/Email Follow-Ups (per cadence)', category: 'Pipelines & Follow-Ups', notes: '', monday: false, tuesday: false, wednesday: false, thursday: false, friday: false },
    { id: '11', title: 'Update Deal Notes (self + remind Luke/Zac)', category: 'Pipelines & Follow-Ups', notes: '', monday: false, tuesday: false, wednesday: false, thursday: false, friday: false },
    { id: '12', title: 'Verify Tags & Deal Accuracy in GHL', category: 'Pipelines & Follow-Ups', notes: '', monday: false, tuesday: false, wednesday: false, thursday: false, friday: false },
    { id: '13', title: 'Daily Recap Text to Group', category: 'Pipelines & Follow-Ups', notes: '', monday: false, tuesday: false, wednesday: false, thursday: false, friday: false },

    // Referral & Partner Development
    { id: '14', title: 'Reach Out to BRMs', category: 'Referral & Partner Development', notes: '', monday: false, tuesday: false, wednesday: false, thursday: false, friday: false },
    { id: '15', title: 'Reach Out to CPAs / Bookkeepers', category: 'Referral & Partner Development', notes: '', monday: false, tuesday: false, wednesday: false, thursday: false, friday: false },
    { id: '16', title: 'Follow-Up / Schedule Next Touch (Task in GHL)', category: 'Referral & Partner Development', notes: '', monday: false, tuesday: false, wednesday: false, thursday: false, friday: false },
    { id: '17', title: 'Partner Check-Ins (Touch Base with Ours Too)', category: 'Referral & Partner Development', notes: '', monday: false, tuesday: false, wednesday: false, thursday: false, friday: false },
    { id: '18', title: 'Shadow Calls with Luke/Zac', category: 'Referral & Partner Development', notes: '', monday: false, tuesday: false, wednesday: false, thursday: false, friday: false },
    { id: '19', title: 'Onboard New Referral Partner (Every Other Week)', category: 'Referral & Partner Development', notes: '', monday: false, tuesday: false, wednesday: false, thursday: false, friday: false },

    // Ops & Reporting
    { id: '20', title: 'Check Dashboard Tasks', category: 'Ops & Reporting', notes: '', monday: false, tuesday: false, wednesday: false, thursday: false, friday: false },
    { id: '21', title: 'Help With Deal Submission', category: 'Ops & Reporting', notes: '', monday: false, tuesday: false, wednesday: false, thursday: false, friday: false },
    { id: '22', title: 'End-of-Week Submit Recap', category: 'Ops & Reporting', notes: '', monday: false, tuesday: false, wednesday: false, thursday: false, friday: false },
    { id: '23', title: 'Weekly KPI Review', category: 'Ops & Reporting', notes: '', monday: false, tuesday: false, wednesday: false, thursday: false, friday: false },
  ]);

  // Calculate KPI values from checklist data
  const calculateKPIs = (weekView: number | 'all' = selectedWeek) => {
    const days: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
    const weekMultiplier = weekView === 'all' ? 4 : 1;

    // Helper function to count completed tasks
    const countCompleted = (taskTitle: string) => {
      const item = checklistItems.find(i => i.title === taskTitle);
      if (!item) return 0;

      let count = 0;
      days.forEach(day => {
        // Check if task is available for this day
        if (taskTitle === 'Post on FB + LinkedIn') {
          if ((day === 'monday' || day === 'wednesday' || day === 'friday') && item[day]) {
            count++;
          }
        } else if (taskTitle.includes('End-of-Week') || taskTitle.includes('Weekly KPI')) {
          if (day === 'friday' && item[day]) {
            count++;
          }
        } else if (item[day]) {
          count++;
        }
      });

      // Multiply by number of weeks for "All Weeks" view
      return count * weekMultiplier;
    };

    return [
      // Social & Content
      { id: '1', category: 'Social & Content', name: 'Posts Published (FB+LinkedIn)',
        current: countCompleted('Post on FB + LinkedIn'), target: 3 * weekMultiplier, unit: 'posts', trend: 'stable', percentageChange: 0 },
      { id: '2', category: 'Social & Content', name: 'Newsletter Section Drafted',
        current: countCompleted('Work on Newsletter Section (progress)'), target: 5 * weekMultiplier, unit: 'days', trend: 'stable', percentageChange: 0 },
      { id: '3', category: 'Social & Content', name: 'Blog Idea Submitted',
        current: countCompleted('Submit Blog Idea or Draft'), target: 5 * weekMultiplier, unit: 'days', trend: 'stable', percentageChange: 0 },
      { id: '4', category: 'Social & Content', name: 'Reviews Collected',
        current: countCompleted('Collect / Request 1 Review Weekly'), target: 5 * weekMultiplier, unit: 'days', trend: 'stable', percentageChange: 0 },
      { id: '5', category: 'Social & Content', name: 'Engagement Checks (2x/day)',
        current: countCompleted('Track Content Metrics - AM') + countCompleted('Track Content Metrics - PM'),
        target: 10 * weekMultiplier, unit: 'checks', trend: 'stable', percentageChange: 0 },

      // Pipeline
      { id: '6', category: 'Pipeline', name: 'New FB Leads Pulled',
        current: countCompleted('Pull New Leads from FB'), target: 5 * weekMultiplier, unit: 'days', trend: 'stable', percentageChange: 0 },
      { id: '7', category: 'Pipeline', name: 'Follow-Ups Completed',
        current: countCompleted('Call/Text/Email Follow-Ups (per cadence)'), target: 5 * weekMultiplier, unit: 'days', trend: 'stable', percentageChange: 0 },
      { id: '8', category: 'Pipeline', name: 'Slack Wins Checked',
        current: countCompleted('Check Slack for Wins'), target: 5 * weekMultiplier, unit: 'days', trend: 'stable', percentageChange: 0 },
      { id: '9', category: 'Pipeline', name: 'Deals Updated',
        current: countCompleted('Update Deal Notes (self + remind Luke/Zac)'), target: 5 * weekMultiplier, unit: 'days', trend: 'stable', percentageChange: 0 },
      { id: '10', category: 'Pipeline', name: 'Daily Recap Sent',
        current: countCompleted('Daily Recap Text to Group'), target: 5 * weekMultiplier, unit: 'days', trend: 'stable', percentageChange: 0 },

      // Referral Development
      { id: '11', category: 'Referral Development', name: 'BRMs Contacted',
        current: countCompleted('Reach Out to BRMs'), target: 5 * weekMultiplier, unit: 'days', trend: 'stable', percentageChange: 0 },
      { id: '12', category: 'Referral Development', name: 'CPAs Contacted',
        current: countCompleted('Reach Out to CPAs / Bookkeepers'), target: 5 * weekMultiplier, unit: 'days', trend: 'stable', percentageChange: 0 },
      { id: '13', category: 'Referral Development', name: 'Partner Check-Ins',
        current: countCompleted('Partner Check-Ins (Touch Base with Ours Too)'), target: 5 * weekMultiplier, unit: 'days', trend: 'stable', percentageChange: 0 },
      { id: '14', category: 'Referral Development', name: 'Shadow Calls',
        current: countCompleted('Shadow Calls with Luke/Zac'), target: 5 * weekMultiplier, unit: 'days', trend: 'stable', percentageChange: 0 },

      // Ops & Reporting
      { id: '15', category: 'Ops & Reporting', name: 'Dashboard Tasks Checked',
        current: countCompleted('Check Dashboard Tasks'), target: 5 * weekMultiplier, unit: 'days', trend: 'stable', percentageChange: 0 },
      { id: '16', category: 'Ops & Reporting', name: 'Weekly Recap Submitted',
        current: countCompleted('End-of-Week Submit Recap') + countCompleted('Weekly KPI Review'),
        target: 2 * weekMultiplier, unit: 'tasks', trend: 'stable', percentageChange: 0 },
    ];
  };

  // Use calculated KPIs
  const kpis = calculateKPIs(selectedWeek);

  // Toggle checklist item for a specific day
  const toggleChecklistItem = async (itemId: string, day: DayOfWeek) => {
    // Update local state immediately for responsive UI
    const currentItem = checklistItems.find(item => item.id === itemId);
    if (!currentItem) return;

    const newValue = !currentItem[day];

    setChecklistItems(prev => prev.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          [day]: newValue
        };
      }
      return item;
    }));

    // Save to Supabase
    try {
      // Use the currently selected week, or default to 1 if "all" is selected
      const weekNumber = selectedWeek === 'all' ? 1 : selectedWeek;
      const weekInfo = getWeekInfo(weekNumber);

      // Check if record exists
      const { data: existing } = await supabase
        .from('daily_checklist')
        .select('id')
        .eq('task_id', itemId)
        .eq('user_id', 'dillon')
        .eq('week_number', weekNumber)
        .single();

      if (existing) {
        // Update existing record
        await supabase
          .from('daily_checklist')
          .update({
            [day]: newValue,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);
      } else {
        // Insert new record
        await supabase
          .from('daily_checklist')
          .insert({
            task_id: itemId,
            title: currentItem.title,
            category: currentItem.category,
            frequency: currentItem.frequency || '',
            notes: currentItem.notes,
            monday: day === 'monday' ? newValue : false,
            tuesday: day === 'tuesday' ? newValue : false,
            wednesday: day === 'wednesday' ? newValue : false,
            thursday: day === 'thursday' ? newValue : false,
            friday: day === 'friday' ? newValue : false,
            week_number: weekNumber,
            week_start: weekInfo.startDate,
            user_id: 'dillon'
          });
      }
    } catch (error) {
      console.error('Error saving checklist item:', error);
    }
  };

  // Update notes for a task
  // Toggle category collapsed state
  const toggleCategoryCollapse = (category: string) => {
    setCollapsedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  // Update weekly recap form data
  const updateWeeklyRecap = (category: string, field: keyof WeeklyRecapData, value: string) => {
    setWeeklyRecapData(prev => prev.map(item =>
      item.category === category ? { ...item, [field]: value } : item
    ));
  };

  // Get completion stats for a specific day
  const getDayCompletion = (day: DayOfWeek) => {
    const dayTasks = checklistItems.filter(item => {
      // Check if task is scheduled for this day
      if (item.title === 'Post on FB + LinkedIn') {
        return day === 'monday' || day === 'wednesday' || day === 'friday';
      }
      // Friday only tasks
      if (item.title.includes('End-of-Week') || item.title.includes('Weekly KPI')) {
        return day === 'friday';
      }
      // Default to all days for daily tasks
      return true;
    });

    const completed = dayTasks.filter(item => item[day]).length;
    return {
      completed,
      total: dayTasks.length,
      percentage: dayTasks.length > 0 ? Math.round((completed / dayTasks.length) * 100) : 0
    };
  };

  // Get weekly completion stats
  const getWeeklyCompletion = () => {
    const days: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
    let totalCompleted = 0;
    let totalTasks = 0;

    days.forEach(day => {
      const stats = getDayCompletion(day);
      totalCompleted += stats.completed;
      totalTasks += stats.total;
    });

    return {
      completed: totalCompleted,
      total: totalTasks,
      percentage: totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0
    };
  };

  // Group checklist items by category
  const groupedChecklist = checklistItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, ChecklistItem[]>);

  // Get category icon
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Social & Content': return <MessageSquare className="w-4 h-4" />;
      case 'Pipelines & Follow-Ups': return <Users className="w-4 h-4" />;
      case 'Referral & Partner Development': return <Users className="w-4 h-4" />;
      case 'Ops & Reporting': return <FileText className="w-4 h-4" />;
      default: return <CheckCircle2 className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Social & Content':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'Pipeline':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'Referral Development':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'Ops & Reporting':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  // Get dynamic page title based on current view
  const getPageTitle = () => {
    switch (currentView) {
      case 'daily':
        return "Dillon's Daily Checklist";
      case 'kpi':
        return "Dillon's KPI Tracker";
      case 'weekly':
        return "Dillon's Weekly Recap";
      default:
        return "Dillon's Daily Dashboard";
    }
  };

  return (
    <div className="w-full px-10 space-y-6">
      {/* Header with View Toggle */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <ClipboardCheck className="w-8 h-8 text-white" />
          <h1 className="text-3xl font-bold text-white">{getPageTitle()}</h1>
        </div>

        {/* View Toggle - Matching Task Tracker Style */}
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-gray-800/50 rounded-lg p-1 border border-gray-700/50">
            <button
              onClick={() => setCurrentView('daily')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all text-sm ${
                currentView === 'daily'
                  ? 'bg-gray-700 text-gray-100'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              Daily Checklist
            </button>
            <button
              onClick={() => setCurrentView('kpi')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all text-sm ${
                currentView === 'kpi'
                  ? 'bg-gray-700 text-gray-100'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              KPI Tracker
            </button>
            <button
              onClick={() => setCurrentView('weekly')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all text-sm ${
                currentView === 'weekly'
                  ? 'bg-gray-700 text-gray-100'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              <Calendar className="w-4 h-4" />
              Weekly Recap
            </button>
          </div>

          {/* Week Selector */}
          <select
            value={selectedWeek}
            onChange={(e) => setSelectedWeek(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
            className="px-4 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-gray-100 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50"
          >
            <option value={1}>Week 1 (10/27 - 10/31)</option>
            <option value={2}>Week 2 (11/3 - 11/7)</option>
            <option value={3}>Week 3 (11/10 - 11/14)</option>
            <option value={4}>Week 4 (11/17 - 11/21)</option>
            <option value="all">All Weeks</option>
          </select>
        </div>
      </div>

      {/* Daily Checklist View - Weekly Grid */}
      {currentView === 'daily' && (
        <div className="space-y-6">
          {/* Weekly Total Summary - Compact Version */}
          <div className="bg-gray-800/30 backdrop-blur-sm rounded-lg border border-gray-700/30 p-4">
            <div className="flex items-center">
              <h3 className="text-lg font-semibold text-gray-100 flex items-center gap-2">
                <Award className="w-5 h-5 text-brand-500" />
                Weekly Total
              </h3>
            </div>

            {/* Daily breakdown with weekly total */}
            <div className="mt-4">
              <div className="flex items-center gap-2">
                {/* Daily columns */}
                {(['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as DayOfWeek[]).map(day => {
                  const stats = getDayCompletion(day);
                  const isToday = day === getCurrentDay();
                  const dayDate = getDayDate(day);
                  return (
                    <div key={day} className={`flex-1 text-center p-2 rounded-lg ${
                      isToday ? 'bg-brand-500/10 border border-brand-500/20' : 'bg-gray-800/50'
                    }`}>
                      <div className="text-xs text-gray-500 capitalize">{day.slice(0, 3)} - {dayDate}</div>
                      <div className="text-base font-bold text-gray-200">{stats.completed}/{stats.total}</div>
                    </div>
                  );
                })}

                {/* Divider */}
                <div className="w-px h-12 bg-gray-700/50 mx-2"></div>

                {/* Weekly Total Column */}
                <div className="flex-1 text-center p-2 rounded-lg bg-brand-500/10 border border-brand-500/20">
                  <div className="text-xs text-brand-400 font-medium">This Week</div>
                  <div className="text-base font-bold text-brand-400">{getWeeklyCompletion().completed}/{getWeeklyCompletion().total}</div>
                  <div className="text-xs font-medium text-brand-400">
                    {getWeeklyCompletion().percentage}%
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Weekly Task Grid by Category */}
          {Object.entries(groupedChecklist).map(([category, items]) => (
            <div key={category} className="bg-gray-800/30 backdrop-blur-sm rounded-lg border border-gray-700/30 overflow-hidden">
              <div className="bg-gray-800/50 border-b border-gray-700/50">
                {/* Category header with totals aligned to columns */}
                <table className="w-full">
                  <tbody>
                    <tr>
                      {/* Category name - matches task column width */}
                      <td className="px-6 py-4">
                        <button
                          onClick={() => toggleCategoryCollapse(category)}
                          className="flex items-center gap-2 hover:bg-gray-700/30 -mx-2 px-2 py-1 rounded-lg transition-colors"
                        >
                          {collapsedCategories.has(category) ? (
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                          )}
                          {getCategoryIcon(category)}
                          <h3 className="text-lg font-semibold text-gray-100">{category}</h3>
                        </button>
                      </td>

                      {/* Daily totals - aligned with day columns */}
                      {(['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as DayOfWeek[]).map(day => {
                        const categoryItems = items.filter(item => {
                          if (item.title === 'Post on FB + LinkedIn') {
                            return day === 'monday' || day === 'wednesday' || day === 'friday';
                          }
                          if (item.title.includes('End-of-Week') || item.title.includes('Weekly KPI')) {
                            return day === 'friday';
                          }
                          return true;
                        });
                        const completed = categoryItems.filter(item => item[day]).length;

                        return (
                          <td key={day} className="w-[10%] text-center px-3 py-4">
                            <div className="text-xs text-gray-500 capitalize">{day.slice(0, 1)}</div>
                            <div className={`text-xs font-medium ${
                              completed > 0 ? 'text-emerald-400' : 'text-gray-600'
                            }`}>
                              {completed}/{categoryItems.length}
                            </div>
                          </td>
                        );
                      })}

                      {/* Weekly total - aligned with This Week column */}
                      <td className="w-[12%] text-center px-3 py-4 border-l border-gray-700/50">
                        <div className="text-xs text-brand-400">This Week</div>
                        <div className="text-xs font-medium text-brand-400">
                          {(() => {
                            const days: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
                            let totalCompleted = 0;
                            let totalTasks = 0;

                            days.forEach(day => {
                              items.forEach(item => {
                                if (item.title === 'Post on FB + LinkedIn' && (day === 'monday' || day === 'wednesday' || day === 'friday')) {
                                  totalTasks++;
                                  if (item[day]) totalCompleted++;
                                } else if ((item.title.includes('End-of-Week') || item.title.includes('Weekly KPI')) && day === 'friday') {
                                  totalTasks++;
                                  if (item[day]) totalCompleted++;
                                } else if (item.title !== 'Post on FB + LinkedIn' && !item.title.includes('End-of-Week') && !item.title.includes('Weekly KPI')) {
                                  totalTasks++;
                                  if (item[day]) totalCompleted++;
                                }
                              });
                            });

                            return `${totalCompleted}/${totalTasks}`;
                          })()}
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {!collapsedCategories.has(category) && (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-700/50">
                        <th className="text-left px-6 py-3 text-sm font-medium text-gray-400">Task</th>
                        <th className="text-center px-3 py-3 text-sm font-medium text-gray-400 w-[10%]">Mon</th>
                        <th className="text-center px-3 py-3 text-sm font-medium text-gray-400 w-[10%]">Tue</th>
                        <th className="text-center px-3 py-3 text-sm font-medium text-gray-400 w-[10%]">Wed</th>
                        <th className="text-center px-3 py-3 text-sm font-medium text-gray-400 w-[10%]">Thu</th>
                        <th className="text-center px-3 py-3 text-sm font-medium text-gray-400 w-[10%]">Fri</th>
                        <th className="text-center px-3 py-3 text-sm font-medium text-brand-400 w-[12%]">This Week</th>
                      </tr>
                    </thead>
                    <tbody>
                    {items.map((item, index) => {
                      const days: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

                      // Calculate weekly total for this task
                      let weekCompleted = 0;
                      let weekTotal = 0;
                      days.forEach(day => {
                        const isAvailable = (() => {
                          if (item.title === 'Post on FB + LinkedIn') {
                            return day === 'monday' || day === 'wednesday' || day === 'friday';
                          }
                          if (item.title.includes('End-of-Week') || item.title.includes('Weekly KPI')) {
                            return day === 'friday';
                          }
                          return true;
                        })();

                        if (isAvailable) {
                          weekTotal++;
                          if (item[day]) weekCompleted++;
                        }
                      });

                      return (
                        <tr
                          key={item.id}
                          className={`border-b border-gray-700/30 hover:bg-gray-800/50 transition-colors ${
                            index % 2 === 0 ? '' : 'bg-gray-900/20'
                          }`}
                        >
                          <td className="px-6 py-3">
                            <div className="flex flex-col">
                              <span className="text-base font-medium text-gray-200">{item.title}</span>
                              {item.frequency && (
                                <span className="text-xs text-gray-500 mt-0.5">{item.frequency}</span>
                              )}
                            </div>
                          </td>
                          {days.map(day => {
                            // Check if this task should be available for this day
                            const isAvailable = (() => {
                              if (item.title === 'Post on FB + LinkedIn') {
                                return day === 'monday' || day === 'wednesday' || day === 'friday';
                              }
                              if (item.title.includes('End-of-Week') || item.title.includes('Weekly KPI')) {
                                return day === 'friday';
                              }
                              return true; // Daily tasks available all days
                            })();

                            const isToday = day === getCurrentDay();

                            if (!isAvailable) {
                              return (
                                <td key={day} className="text-center px-3 py-3">
                                  <span className="text-gray-700">-</span>
                                </td>
                              );
                            }

                            return (
                              <td key={day} className={`text-center px-3 py-3 ${
                                isToday ? 'bg-brand-500/5' : ''
                              }`}>
                                <button
                                  onClick={() => toggleChecklistItem(item.id, day)}
                                  className="inline-flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-700/50 transition-all"
                                >
                                  {item[day] ? (
                                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                  ) : (
                                    <Circle className="w-5 h-5 text-gray-500 hover:text-gray-400" />
                                  )}
                                </button>
                              </td>
                            );
                          })}
                          {/* Week Total Column for each task */}
                          <td className="text-center px-3 py-3 bg-brand-500/5 border-l border-gray-700/50">
                            <span className="text-sm font-medium text-brand-400">
                              {weekCompleted}/{weekTotal}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* KPI Tracker View */}
      {currentView === 'kpi' && (
        <div className="space-y-6">
          {/* Week Selector */}
          <div className="flex items-center justify-between bg-gray-800/30 backdrop-blur-sm rounded-lg border border-gray-700/30 p-4">
            <div className="flex items-center gap-4">
              <h3 className="text-lg font-semibold text-gray-100">
                {selectedWeek === 'all' ? 'All Weeks' : `Week ${selectedWeek}`}
              </h3>
              <span className="text-sm text-gray-400">
                {getWeekInfo(selectedWeek).start} - {getWeekInfo(selectedWeek).end}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedWeek('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-all text-sm ${
                  selectedWeek === 'all'
                    ? 'bg-blue-600 text-white border-2 border-blue-500'
                    : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 border border-gray-700/50'
                }`}
              >
                All Weeks
              </button>
              {[1, 2, 3, 4].map((week) => (
                <button
                  key={week}
                  onClick={() => setSelectedWeek(week)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all text-sm ${
                    selectedWeek === week
                      ? 'bg-blue-600 text-white border-2 border-blue-500'
                      : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 border border-gray-700/50'
                  }`}
                >
                  Week {week}
                </button>
              ))}
            </div>
          </div>

          {/* KPI Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {kpis.map(kpi => {
            const percentage = Math.min(Math.round((kpi.current / kpi.target) * 100), 100);
            const isOnTarget = percentage >= 80;

            return (
              <div key={kpi.id} className="bg-gray-800/30 backdrop-blur-sm rounded-lg border border-gray-700/30 p-6">
                {/* Category Badge and Week Info */}
                <div className="mb-3 flex items-center justify-between">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold border ${getCategoryColor(kpi.category)}`}>
                    {kpi.category}
                  </span>
                  <span className="text-xs text-gray-500">
                    {selectedWeek === 'all' ? 'All Weeks' : `Week ${selectedWeek}`}
                  </span>
                </div>

                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-300 mb-2">{kpi.name}</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-gray-100">
                      {kpi.unit === '$' ? `$${kpi.current.toLocaleString()}` : kpi.current}
                    </span>
                    <span className="text-sm text-gray-500">
                      / {kpi.unit === '$' ? `$${kpi.target.toLocaleString()}` : kpi.target}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">{percentage}% of target</span>
                    {isOnTarget ? (
                      <span className="text-emerald-400">On Track</span>
                    ) : (
                      <span className="text-amber-400">Needs Focus</span>
                    )}
                  </div>
                  <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        isOnTarget ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
          </div>
        </div>
      )}

      {/* Weekly Recap View */}
      {currentView === 'weekly' && (
        <div className="space-y-6">
          {/* Weekly Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-800/30 backdrop-blur-sm rounded-lg border border-gray-700/30 p-6">
              <div className="flex items-center gap-3 mb-2">
                <BarChart3 className="w-5 h-5 text-purple-500" />
                <span className="text-sm font-medium text-gray-400">Weekly Completion</span>
              </div>
              <div className="text-3xl font-bold text-gray-100">{getWeeklyCompletion().percentage}%</div>
              <div className="text-sm text-gray-500 mt-1">
                {getWeeklyCompletion().completed} of {getWeeklyCompletion().total} tasks
              </div>
            </div>

            <div className="bg-gray-800/30 backdrop-blur-sm rounded-lg border border-gray-700/30 p-6">
              <div className="flex items-center gap-3 mb-2">
                <Award className="w-5 h-5 text-amber-500" />
                <span className="text-sm font-medium text-gray-400">Best Day</span>
              </div>
              <div className="text-3xl font-bold text-gray-100">
                {(() => {
                  const days: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
                  let bestDay = days[0];
                  let bestPercentage = 0;
                  days.forEach(day => {
                    const percentage = getDayCompletion(day).percentage;
                    if (percentage > bestPercentage) {
                      bestPercentage = percentage;
                      bestDay = day;
                    }
                  });
                  return bestDay.charAt(0).toUpperCase() + bestDay.slice(1);
                })()}
              </div>
              <div className="text-sm text-gray-500 mt-1">Highest completion rate</div>
            </div>

            <div className="bg-gray-800/30 backdrop-blur-sm rounded-lg border border-gray-700/30 p-6">
              <div className="flex items-center gap-3 mb-2">
                <Clock className="w-5 h-5 text-blue-500" />
                <span className="text-sm font-medium text-gray-400">Tasks This Week</span>
              </div>
              <div className="text-3xl font-bold text-gray-100">{getWeeklyCompletion().completed}</div>
              <div className="text-sm text-gray-500 mt-1">Completed tasks</div>
            </div>
          </div>

          {/* Category Performance */}
          <div className="bg-gray-800/30 backdrop-blur-sm rounded-lg border border-gray-700/30 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(groupedChecklist).map(([category, items]) => {
                const days: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
                let totalCompleted = 0;
                let totalTasks = 0;

                days.forEach(day => {
                  items.forEach(item => {
                    // Check if task applies to this day
                    if (item.title === 'Post on FB + LinkedIn' && (day === 'monday' || day === 'wednesday' || day === 'friday')) {
                      totalTasks++;
                      if (item[day]) totalCompleted++;
                    } else if ((item.title.includes('End-of-Week') || item.title.includes('Weekly KPI')) && day === 'friday') {
                      totalTasks++;
                      if (item[day]) totalCompleted++;
                    } else if (item.title !== 'Post on FB + LinkedIn' && !item.title.includes('End-of-Week') && !item.title.includes('Weekly KPI')) {
                      totalTasks++;
                      if (item[day]) totalCompleted++;
                    }
                  });
                });

                const percentage = totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0;

                return (
                  <div key={category} className="flex items-center gap-4 p-4 bg-gray-800/50 rounded-lg border border-gray-700/50">
                    <div className="flex items-center gap-2 flex-1">
                      {getCategoryIcon(category)}
                      <span className="text-sm font-medium text-gray-300">{category}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${
                            percentage >= 80 ? 'bg-emerald-500' :
                            percentage >= 50 ? 'bg-amber-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className={`text-sm font-bold ${
                        percentage >= 80 ? 'text-emerald-400' :
                        percentage >= 50 ? 'text-amber-400' : 'text-red-400'
                      }`}>
                        {percentage}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Weekly Recap Forms */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-100">Weekly Recap by Category</h3>

            {weeklyRecapData.map((recap) => (
              <div key={recap.category} className={`rounded-lg p-6 ${
                recap.category === 'Social & Content' ? 'bg-purple-500/20 border border-purple-500/30' :
                recap.category === 'Pipeline & Follow-ups' ? 'bg-blue-500/20 border border-blue-500/30' :
                recap.category === 'Referral Outreach' ? 'bg-emerald-500/20 border border-emerald-500/30' :
                recap.category === 'Internal Ops' ? 'bg-amber-500/20 border border-amber-500/30' :
                'bg-rose-500/20 border border-rose-500/30'
              }`}>
                <div className="flex items-center gap-2 mb-6">
                  <span className={`inline-flex items-center px-3 py-1.5 rounded-md text-sm font-semibold border ${
                    recap.category === 'Social & Content' ? 'bg-purple-600/30 text-purple-200 border-purple-500/50' :
                    recap.category === 'Pipeline & Follow-ups' ? 'bg-blue-600/30 text-blue-200 border-blue-500/50' :
                    recap.category === 'Referral Outreach' ? 'bg-emerald-600/30 text-emerald-200 border-emerald-500/50' :
                    recap.category === 'Internal Ops' ? 'bg-amber-600/30 text-amber-200 border-amber-500/50' :
                    'bg-rose-600/30 text-rose-200 border-rose-500/50'
                  }`}>
                    {recap.category}
                  </span>
                </div>

                <div className="space-y-5">
                  {/* Question 1: What was done? */}
                  <div>
                    <label className="block text-xl font-semibold text-gray-100 mb-3">
                      1. What was done this week?
                    </label>
                    <textarea
                      value={recap.whatWasDone}
                      onChange={(e) => updateWeeklyRecap(recap.category, 'whatWasDone', e.target.value)}
                      placeholder="List the main activities and tasks completed..."
                      className="w-full px-5 py-4 bg-gray-900/60 border border-gray-700/30 rounded-lg text-lg text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent resize-none backdrop-blur-sm"
                      rows={3}
                    />
                  </div>

                  {/* Question 2: Quantity */}
                  <div>
                    <label className="block text-xl font-semibold text-gray-100 mb-3">
                      2. Quantity (How much was accomplished?)
                    </label>
                    <input
                      type="text"
                      value={recap.quantity}
                      onChange={(e) => updateWeeklyRecap(recap.category, 'quantity', e.target.value)}
                      placeholder="e.g., 15 leads contacted, 3 posts published, 5 meetings scheduled..."
                      className="w-full px-5 py-4 bg-gray-900/60 border border-gray-700/30 rounded-lg text-lg text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent backdrop-blur-sm"
                    />
                  </div>

                  {/* Question 3: Wins and Highlights */}
                  <div>
                    <label className="block text-xl font-semibold text-gray-100 mb-3">
                      3. Wins and Highlights
                    </label>
                    <textarea
                      value={recap.winsHighlights}
                      onChange={(e) => updateWeeklyRecap(recap.category, 'winsHighlights', e.target.value)}
                      placeholder="What went well? Any notable achievements or positive feedback?"
                      className="w-full px-5 py-4 bg-gray-900/60 border border-gray-700/30 rounded-lg text-lg text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent resize-none backdrop-blur-sm"
                      rows={3}
                    />
                  </div>

                  {/* Question 4: Issues and Notes */}
                  <div>
                    <label className="block text-xl font-semibold text-gray-100 mb-3">
                      4. Issues and Notes
                    </label>
                    <textarea
                      value={recap.issuesNotes}
                      onChange={(e) => updateWeeklyRecap(recap.category, 'issuesNotes', e.target.value)}
                      placeholder="Any challenges, blockers, or important notes for next week?"
                      className="w-full px-5 py-4 bg-gray-900/60 border border-gray-700/30 rounded-lg text-lg text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent resize-none backdrop-blur-sm"
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            ))}

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                onClick={async () => {
                  try {
                    // Get the current week info
                    const weekInfo = getWeekInfo(selectedWeek === 'all' ? 1 : selectedWeek);

                    // Prepare the data for each category
                    const promises = weeklyRecapData.map(async (recap) => {
                      const data = {
                        week_number: selectedWeek === 'all' ? 0 : selectedWeek,
                        week_start: weekInfo.startDate,
                        week_end: new Date(weekInfo.startDate.getTime() + 4 * 24 * 60 * 60 * 1000), // Add 4 days to get Friday
                        category: recap.category,
                        what_was_done: recap.whatWasDone,
                        quantity: recap.quantity,
                        wins_highlights: recap.winsHighlights,
                        issues_notes: recap.issuesNotes,
                        user_id: 'dillon'
                      };

                      // Check if a recap already exists for this week and category
                      const { data: existingRecap } = await supabase
                        .from('weekly_recaps')
                        .select('id')
                        .eq('week_number', data.week_number)
                        .eq('category', data.category)
                        .eq('user_id', 'dillon')
                        .single();

                      if (existingRecap) {
                        // Update existing recap
                        return supabase
                          .from('weekly_recaps')
                          .update(data)
                          .eq('id', existingRecap.id);
                      } else {
                        // Insert new recap
                        return supabase
                          .from('weekly_recaps')
                          .insert(data);
                      }
                    });

                    // Execute all operations
                    const results = await Promise.all(promises);

                    // Check if all operations were successful
                    const hasError = results.some(result => result.error);

                    if (hasError) {
                      console.error('Error saving weekly recap:', results);
                      alert('Error saving weekly recap. Please try again.');
                    } else {
                      console.log('Weekly Recap saved successfully!');
                      alert('Weekly Recap saved successfully!');

                      // Clear the form
                      setWeeklyRecapData([
                        { category: 'Social & Content', whatWasDone: '', quantity: '', winsHighlights: '', issuesNotes: '' },
                        { category: 'Pipeline & Follow-ups', whatWasDone: '', quantity: '', winsHighlights: '', issuesNotes: '' },
                        { category: 'Referral Outreach', whatWasDone: '', quantity: '', winsHighlights: '', issuesNotes: '' },
                        { category: 'Internal Ops', whatWasDone: '', quantity: '', winsHighlights: '', issuesNotes: '' },
                        { category: 'Training & Development', whatWasDone: '', quantity: '', winsHighlights: '', issuesNotes: '' },
                      ]);
                    }
                  } catch (error) {
                    console.error('Error saving weekly recap:', error);
                    alert('Error saving weekly recap. Please try again.');
                  }
                }}
                className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Submit Weekly Recap
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};