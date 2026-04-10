import { createClient } from '@supabase/supabase-js';

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig();

  const supabase = createClient(
    config.public.supabaseUrl as string,
    config.public.supabaseAnonKey as string,
    { auth: { autoRefreshToken: true, persistSession: true } }
  );

  return { provide: { supabase } };
});
