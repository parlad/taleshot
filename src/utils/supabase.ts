import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
    flowType: 'pkce'
  },
  global: {
    headers: {
      'X-Client-Info': 'memory-app'
    }
  }
});

// Set up auth state change listener
supabase.auth.onAuthStateChange(async (event, session) => {
  if (event === 'SIGNED_IN' && session?.user) {
    try {
      // Ensure profile exists when user signs in
      const { error } = await supabase
        .from('profiles')
        .upsert({ 
          id: session.user.id,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error ensuring profile exists:', error);
      }
    } catch (error) {
      console.error('Error in auth state change handler:', error);
    }
  }
});