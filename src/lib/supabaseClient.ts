import { createClient } from '@supabase/supabase-js';

// Get Supabase credentials from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase configuration. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local'
  );
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Form submission interface
export interface FormSubmission {
  id: string;
  platform: string;
  full_name: string;
  work_email: string;
  company_name?: string;
  project_details?: string;
  additional_details?: string;
  llm_provider?: string;
  monthly_spend?: string;
  created_at: string;
  metadata?: Record<string, any>;
}

// Get all form submissions
export async function getFormSubmissions() {
  try {
    const { data, error } = await supabase
      .from('form_submissions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      throw new Error(error.message || 'Failed to fetch submissions');
    }

    return data as FormSubmission[];
  } catch (error) {
    console.error('Form submissions fetch error:', error);
    throw error;
  }
}

// Get submissions by platform
export async function getSubmissionsByPlatform(platform: string) {
  try {
    const { data, error } = await supabase
      .from('form_submissions')
      .select('*')
      .eq('platform', platform)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      throw new Error(error.message || 'Failed to fetch submissions');
    }

    return data as FormSubmission[];
  } catch (error) {
    console.error('Form submissions fetch error:', error);
    throw error;
  }
}

// Get submission by ID
export async function getSubmissionById(id: string) {
  try {
    const { data, error } = await supabase
      .from('form_submissions')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Supabase error:', error);
      throw new Error(error.message || 'Failed to fetch submission');
    }

    return data as FormSubmission;
  } catch (error) {
    console.error('Form submission fetch error:', error);
    throw error;
  }
}

// Get statistics by platform
export async function getSubmissionStats() {
  try {
    const { data, error } = await supabase
      .from('form_submissions')
      .select('platform, created_at');

    if (error) {
      console.error('Supabase error:', error);
      throw new Error(error.message || 'Failed to fetch stats');
    }

    // Group by platform
    const stats = data.reduce((acc: Record<string, number>, item) => {
      acc[item.platform] = (acc[item.platform] || 0) + 1;
      return acc;
    }, {});

    return {
      total: data.length,
      byPlatform: Object.entries(stats).map(([key, count]) => ({ key, count })),
      submissions: data,
    };
  } catch (error) {
    console.error('Stats fetch error:', error);
    throw error;
  }
}

// Contact message interface. Written by the public site's contact form and the
// CTA section, both of which insert into contact_messages.
export interface ContactMessage {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  subject?: string;
  message: string;
  created_at: string;
}

// Get all contact messages, newest first
export async function getContactMessages() {
  const { data, error } = await supabase
    .from('contact_messages')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Supabase error:', error);
    throw new Error(error.message || 'Failed to fetch contact messages');
  }

  return data as ContactMessage[];
}

// Subscribe to new contact messages
export function subscribeToContactMessages(callback: (message: ContactMessage) => void) {
  const channel = supabase
    .channel('contact_messages_changes')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'contact_messages',
      },
      (payload) => {
        callback(payload.new as ContactMessage);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// Subscribe to real-time updates
export function subscribeToSubmissions(callback: (submission: FormSubmission) => void) {
  const channel = supabase
    .channel('form_submissions_changes')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'form_submissions',
      },
      (payload) => {
        callback(payload.new as FormSubmission);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
