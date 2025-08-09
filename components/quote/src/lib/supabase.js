import { createClient } from '@supabase/supabase-js';

// Global cache for Supabase client instances
const clientCache = new Map();

export const getSupabaseClient = (supabaseUrl, supabaseAnonKey) => {
  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  // Create a unique key for this configuration
  const configKey = `${supabaseUrl}-${supabaseAnonKey}`;
  
  // Check if we already have a client for this configuration
  if (clientCache.has(configKey)) {
    return clientCache.get(configKey);
  }
  
  // Create new client and cache it
  const client = createClient(supabaseUrl, supabaseAnonKey);
  clientCache.set(configKey, client);
  
  return client;
};

// Clean up function for testing or when needed
export const clearSupabaseCache = () => {
  clientCache.clear();
};

// Export a default client for backward compatibility
export const supabase = null; // This will be set by the component that uses it
