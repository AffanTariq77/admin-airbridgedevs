import { supabase } from '../../lib/supabaseClient';

// Simple token generator for demo (do NOT use in production)
function generateToken(email: string) {
  return btoa(`${email}:${Date.now()}`);
}

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    // Query the admin_logins table directly
    const { data, error } = await supabase
      .from('admin_logins')
      .select('*')
      .eq('email', email)
      .eq('password', password) // In production, compare hashed passwords!
      .single();

    if (error || !data) {
      return new Response(JSON.stringify({ error: 'Invalid credentials' }), { status: 401 });
    }

    // Generate a token (for demo only)
    const token = generateToken(email);

    return new Response(JSON.stringify({ token }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
}
