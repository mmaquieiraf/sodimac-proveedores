import { supabase } from '../../supabase';

export const signInService = async (email, password) => {
  return await supabase.auth.signInWithPassword({ email, password });
};

export const signOutService = async () => {
  return await supabase.auth.signOut();
};

export const resetPasswordService = async (email) => {
  return await supabase.auth.resetPasswordForEmail(email);
};