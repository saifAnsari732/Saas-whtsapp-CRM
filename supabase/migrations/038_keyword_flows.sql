CREATE TABLE keyword_flows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  keywords TEXT[] NOT NULL,
  template_id UUID NOT NULL REFERENCES message_templates(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Basic RLS
ALTER TABLE keyword_flows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own keyword flows" ON keyword_flows
  FOR ALL
  USING (auth.uid() = user_id);
