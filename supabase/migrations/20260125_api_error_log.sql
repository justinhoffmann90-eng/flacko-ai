-- API Error Log - Track failed API requests
CREATE TABLE api_error_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint text NOT NULL,
  method text NOT NULL,
  status_code integer,
  error_message text,
  error_stack text,
  user_id uuid REFERENCES auth.users(id),
  request_body jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_api_error_log_created_at ON api_error_log(created_at DESC);
CREATE INDEX idx_api_error_log_endpoint ON api_error_log(endpoint);

-- Report Generation Log - Track report creation/parsing
CREATE TABLE report_generation_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_date date NOT NULL,
  status text NOT NULL CHECK (status IN ('success', 'failed', 'partial')),
  source text, -- 'manual', 'parse', 'api'
  error_message text,
  parse_warnings jsonb, -- Array of non-fatal issues
  fields_parsed integer,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_report_generation_log_created_at ON report_generation_log(created_at DESC);
