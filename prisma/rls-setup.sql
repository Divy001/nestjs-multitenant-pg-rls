-- Enable Row-Level Security
ALTER TABLE "patient_records" ENABLE ROW LEVEL SECURITY;

-- Force RLS for table owners to avoid superuser bypass
ALTER TABLE "patient_records" FORCE ROW LEVEL SECURITY;

-- Drop policy if exists
DROP POLICY IF EXISTS tenant_isolation_policy ON "patient_records";

-- Create Restrictive Isolation Policy
CREATE POLICY tenant_isolation_policy ON "patient_records"
FOR ALL
USING (
  tenant_id = NULLIF(current_setting('app.current_tenant', true), '')::text
)
WITH CHECK (
  tenant_id = NULLIF(current_setting('app.current_tenant', true), '')::text
);
