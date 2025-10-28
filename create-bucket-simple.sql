-- Simple bucket creation without RLS policies
INSERT INTO storage.buckets (id, name, public) 
VALUES ('deposit-proofs', 'deposit-proofs', true);
