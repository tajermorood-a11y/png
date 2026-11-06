import { supabase } from '../supabase';
import { run } from './run';

export const register = (username, password, displayName) =>
  run(() => supabase.rpc('phantom_register', { p_username: username, p_password: password, p_display_name: displayName || null }));

export const login = (username, password) =>
  run(() => supabase.rpc('phantom_login', { p_username: username, p_password: password }));

export const getUser = (id) =>
  run(() =>
    supabase
      .from('prediction_users')
      .select('id, username, display_name, avatar_option_id, total_points, rank, last_seen_announcement_id')
      .eq('id', id)
      .single()
  );

export const updateProfile = (id, name, avatarOptionId) =>
  run(() => supabase.rpc('update_profile', { p_user_id: id, p_display_name: name, p_avatar_option_id: avatarOptionId }));

export const markAnnouncementSeen = (userId, announcementId) =>
  run(() => supabase.rpc('mark_announcement_seen', { p_user_id: userId, p_id: announcementId }));
