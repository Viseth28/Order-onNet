import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://pvnqdqujrmjuexkiqilm.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2bnFkcXVqcm1qdWV4a2lxaWxtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzMjY5NDUsImV4cCI6MjA4NTkwMjk0NX0.JIn_NqJzURayrz2N3t8-KohWtpDs6VRK2zCxRgCKhf4';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
