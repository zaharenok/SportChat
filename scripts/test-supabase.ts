import { createClient } from '@supabase/supabase-js';

async function testSupabaseConnection() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  console.log('🔍 Testing Supabase Connection...');

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Supabase environment variables not set');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  try {
    console.log('📊 Attempting to fetch data from Days table...');

    const { data, error } = await supabase
      .from('Days')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Error fetching data:', error);
      return;
    }

    console.log('✅ Successfully connected to Supabase!');
    console.log('📝 Sample Day data:', data);
  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

testSupabaseConnection();