-- Agent run logging table to capture multi-agent pipeline executions

CREATE TABLE agent_run_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
  agent_name TEXT NOT NULL,
  agent_stage TEXT NOT NULL,
  invocation_source TEXT DEFAULT 'edge_function',
  user_id UUID REFERENCES auth.users(id),
  deal_id UUID REFERENCES deals(id),
  request_payload JSONB,
  response_payload JSONB,
  request_summary TEXT,
  response_summary TEXT,
  success BOOLEAN NOT NULL DEFAULT FALSE,
  error_message TEXT,
  duration_ms INTEGER,
  flagged BOOLEAN NOT NULL DEFAULT FALSE,
  flagged_at TIMESTAMP WITH TIME ZONE,
  flagged_by UUID REFERENCES auth.users(id),
  flag_reason TEXT,
  notes TEXT,
  CHECK (flagged = FALSE OR flagged_by IS NOT NULL)
);

CREATE INDEX idx_agent_run_logs_agent ON agent_run_logs(agent_name);
CREATE INDEX idx_agent_run_logs_stage ON agent_run_logs(agent_stage);
CREATE INDEX idx_agent_run_logs_deal ON agent_run_logs(deal_id);
CREATE INDEX idx_agent_run_logs_flagged ON agent_run_logs(flagged) WHERE flagged = TRUE;
CREATE INDEX idx_agent_run_logs_created_at ON agent_run_logs(created_at DESC);

ALTER TABLE agent_run_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their agent logs"
  ON agent_run_logs FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can flag their agent logs"
  ON agent_run_logs FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
