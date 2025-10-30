-- Create tables for Dillon's Daily Dashboard

-- 1. Daily Checklist Items table
CREATE TABLE IF NOT EXISTS dillon_checklist_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    is_recurring BOOLEAN DEFAULT true,
    order_index INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Daily Checklist Completions table
CREATE TABLE IF NOT EXISTS dillon_checklist_completions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    checklist_item_id UUID NOT NULL REFERENCES dillon_checklist_items(id) ON DELETE CASCADE,
    completed_at TIMESTAMP WITH TIME ZONE NOT NULL,
    notes TEXT,
    date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(checklist_item_id, date) -- Ensure one completion per item per day
);

-- 3. KPIs table
CREATE TABLE IF NOT EXISTS dillon_kpis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    target_value NUMERIC NOT NULL,
    unit TEXT NOT NULL,
    frequency TEXT CHECK (frequency IN ('daily', 'weekly', 'monthly')) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. KPI Entries table
CREATE TABLE IF NOT EXISTS dillon_kpi_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    kpi_id UUID NOT NULL REFERENCES dillon_kpis(id) ON DELETE CASCADE,
    value NUMERIC NOT NULL,
    date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_checklist_completions_date ON dillon_checklist_completions(date);
CREATE INDEX IF NOT EXISTS idx_checklist_completions_item_id ON dillon_checklist_completions(checklist_item_id);
CREATE INDEX IF NOT EXISTS idx_kpi_entries_date ON dillon_kpi_entries(date);
CREATE INDEX IF NOT EXISTS idx_kpi_entries_kpi_id ON dillon_kpi_entries(kpi_id);

-- Enable Row Level Security (RLS)
ALTER TABLE dillon_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE dillon_checklist_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE dillon_kpis ENABLE ROW LEVEL SECURITY;
ALTER TABLE dillon_kpi_entries ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users (adjust as needed)
-- For checklist items (all authenticated users can read, only admins can modify)
CREATE POLICY "Users can view checklist items" ON dillon_checklist_items
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can create checklist items" ON dillon_checklist_items
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update checklist items" ON dillon_checklist_items
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete checklist items" ON dillon_checklist_items
    FOR DELETE USING (auth.role() = 'authenticated');

-- For checklist completions
CREATE POLICY "Users can view completions" ON dillon_checklist_completions
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can create completions" ON dillon_checklist_completions
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update completions" ON dillon_checklist_completions
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete completions" ON dillon_checklist_completions
    FOR DELETE USING (auth.role() = 'authenticated');

-- For KPIs
CREATE POLICY "Users can view KPIs" ON dillon_kpis
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can create KPIs" ON dillon_kpis
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update KPIs" ON dillon_kpis
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete KPIs" ON dillon_kpis
    FOR DELETE USING (auth.role() = 'authenticated');

-- For KPI entries
CREATE POLICY "Users can view KPI entries" ON dillon_kpi_entries
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can create KPI entries" ON dillon_kpi_entries
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update KPI entries" ON dillon_kpi_entries
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete KPI entries" ON dillon_kpi_entries
    FOR DELETE USING (auth.role() = 'authenticated');

-- Insert default checklist items for Dillon
INSERT INTO dillon_checklist_items (title, category, is_recurring, order_index) VALUES
-- Morning Routine
('Review calendar and priorities', 'Morning Routine', true, 1),
('Check and respond to urgent emails', 'Morning Routine', true, 2),
('Team standup preparation', 'Morning Routine', true, 3),

-- Sales & Outreach
('Make 10 sales calls', 'Sales & Outreach', true, 4),
('Follow up on pending proposals', 'Sales & Outreach', true, 5),
('Update CRM with call notes', 'Sales & Outreach', true, 6),

-- Administrative
('Process new applications', 'Administrative', true, 7),
('Review and approve documents', 'Administrative', true, 8),
('Update task tracker', 'Administrative', true, 9),

-- End of Day
('Plan tomorrow''s priorities', 'End of Day', true, 10),
('Update KPI metrics', 'End of Day', true, 11),
('Send daily summary report', 'End of Day', true, 12)
ON CONFLICT DO NOTHING;

-- Insert default KPIs for Dillon
INSERT INTO dillon_kpis (name, description, target_value, unit, frequency) VALUES
('Daily Calls Made', 'Number of sales calls completed per day', 10, 'calls', 'daily'),
('Applications Processed', 'Number of funding applications processed', 8, 'apps', 'daily'),
('Revenue Generated', 'Total revenue generated from closed deals', 30000, '$', 'weekly'),
('Client Meetings', 'Number of client meetings conducted', 5, 'meetings', 'daily'),
('Deals Closed', 'Number of deals successfully closed', 3, 'deals', 'weekly'),
('Response Time', 'Average time to respond to client inquiries', 1, 'hours', 'daily')
ON CONFLICT DO NOTHING;