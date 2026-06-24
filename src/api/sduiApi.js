// src/api/sduiApi.js
// Adapter: Supabase → sdui_layout table
// The screen never changes if we swap the backend.

import { supabase } from "./supabaseClient";

export async function fetchSduiLayout() {
  const { data, error } = await supabase
    .from("sdui_layout")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) throw new Error(error.message);
  return data;
}
