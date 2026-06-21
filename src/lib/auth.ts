/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { supabase } from "./supabaseClient";

export interface LoggedInUser {
  email: string;
  role: string;
}

// Fallback admin credentials for evaluation
export const FALLBACK_ADMIN = {
  email: "admin@bavidex.com",
  password: "admin123"
};

export async function loginAdmin(email: string, password: string): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Clean trim inputs
    const cleanEmail = email.trim();
    const cleanPass = password.trim();

    // 2. Try Supabase Auth first
    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password: cleanPass
    });

    if (!error && data?.user) {
      localStorage.setItem("bavidex_admin_logged_in", "true");
      localStorage.setItem("bavidex_admin_email", cleanEmail);
      return { success: true };
    }

    // 3. Fallback to Local Sandbox Account (admin123) for easy testing
    if (cleanEmail.toLowerCase() === FALLBACK_ADMIN.email && cleanPass === FALLBACK_ADMIN.password) {
      localStorage.setItem("bavidex_admin_logged_in", "true");
      localStorage.setItem("bavidex_admin_email", cleanEmail);
      return { success: true };
    }

    return { 
      success: false, 
      error: error?.message || "Invalid credentials. Try our local sandbox demo account: admin@bavidex.com / admin123" 
    };
  } catch (err: any) {
    // Local fallback check in case of general connection errors
    if (email.trim().toLowerCase() === FALLBACK_ADMIN.email && password.trim() === FALLBACK_ADMIN.password) {
      localStorage.setItem("bavidex_admin_logged_in", "true");
      localStorage.setItem("bavidex_admin_email", email.trim());
      return { success: true };
    }
    return { success: false, error: err.message || "Failed to make authentication request." };
  }
}

export function logoutAdmin() {
  localStorage.removeItem("bavidex_admin_logged_in");
  localStorage.removeItem("bavidex_admin_email");
  supabase.auth.signOut().catch(() => {});
}

export function getLoggedInAdmin(): LoggedInUser | null {
  const loggedIn = localStorage.getItem("bavidex_admin_logged_in") === "true";
  const email = localStorage.getItem("bavidex_admin_email");

  if (loggedIn && email) {
    return { email, role: "Administrator" };
  }
  return null;
}
