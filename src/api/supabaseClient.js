// src/api/supabaseClient.js
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://ttvbsesbxsykarwfjkih.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR0dmJzZXNieHN5a2Fyd2Zqa2loIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE5ODUxMTUsImV4cCI6MjA5NzU2MTExNX0.D-gOEP-8NbBxsHdcEUVq70uCn34ZRfmnXmZGpbxRtFI";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
