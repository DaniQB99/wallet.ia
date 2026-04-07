import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || "https://effvqibnbdfczalunhvx.supabase.co";
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmZnZxaWJuYmRmY3phbHVuaHZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzOTA2MzUsImV4cCI6MjA4OTk2NjYzNX0.d733nyeJdfV-qRFg4vbFR0o3wikJ6VXV1bxqoJj5PzA";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
