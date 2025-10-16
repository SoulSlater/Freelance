
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://exayvdgzscklkhrtdnpj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4YXl2ZGd6c2NrbGtocnRkbnBqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1MzU3MzAsImV4cCI6MjA3NjExMTczMH0.chO-1hpoCaNwvLACobCjhd51JSqixjLm0qDl13JfiGY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
