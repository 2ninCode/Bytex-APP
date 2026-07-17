import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function run() {
  console.log("Checking if customer_devices table exists...");
  const { data, error } = await supabase.from('customer_devices').select('*').limit(1);
  if (error) {
    console.error("Error querying customer_devices:", error);
  } else {
    console.log("Table customer_devices exists! Data:", data);
  }

  // Also let's test a login to see if it works now.
  console.log("Attempting test login for Jorgin...");
  const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
    email: 'jlrjunior10@gmail.com',
    password: '@Jlrj2005'
  });
  if (loginError) {
    console.error("Jorgin Login Failed:", loginError.message);
  } else {
    console.log("Jorgin Login Succeeded! User ID:", loginData.user.id);
  }
}
run();
