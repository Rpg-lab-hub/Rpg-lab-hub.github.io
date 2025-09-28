import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Substitua pelos dados do seu projeto Supabase
const supabaseUrl = "https://omuthxobocmqpgbcusgl.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9tdXRoeG9ib2NtcXBnYmN1c2dsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwMzQwMTYsImV4cCI6MjA3NDYxMDAxNn0.N6uMTLfFH41JfyW_rl2951eFmZvIEm_Gna5UI4xu0CU";

export const supabase = createClient(supabaseUrl, supabaseKey);
