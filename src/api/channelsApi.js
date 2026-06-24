// src/api/channelsApi.js
// Adapter: Supabase → channels table

import { supabase } from "./supabaseClient";

export async function fetchChannels() {
  const { data, error } = await supabase
    .from("channels")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) throw new Error(error.message);
  return data;
}
