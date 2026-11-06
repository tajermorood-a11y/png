import { supabase } from '../supabase';
import { run } from './run';

export const getLeaderboard = () =>
  run(() =>
    supabase
      .from('prediction_users')
      .select('id, display_name, username, total_points, rank, avatar_option_id')
      .order('total_points', { ascending: false })
      .order('id', { ascending: true })
      .limit(100)
  );

export const listAvatarOptions = () =>
  run(() => supabase.from('avatar_options').select('*').eq('is_active', true).order('sort_order', { ascending: true }));

export const listFriends = (userId) =>
  run(() =>
    supabase
      .from('friend_challenges')
      .select('id, friend:prediction_users!friend_challenges_friend_id_fkey(id, display_name, username, total_points, rank, avatar_option_id)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
  );

export const addFriend = (userId, username) =>
  run(async () => {
    const name = username.trim().toLowerCase();
    const { data: friend, error: e1 } = await supabase.from('prediction_users').select('id').eq('username', name).maybeSingle();
    if (e1) return { data: null, error: e1 };
    if (!friend) return { data: null, error: { message: 'friend_not_found' } };
    if (friend.id === userId) return { data: null, error: { message: 'friend_self' } };
    return supabase.from('friend_challenges').insert({ user_id: userId, friend_id: friend.id }).select().single();
  });

export const removeFriend = (id) => run(() => supabase.from('friend_challenges').delete().eq('id', id));

export const latestAnnouncement = () =>
  run(() =>
    supabase.from('announcements').select('*').eq('is_active', true).order('id', { ascending: false }).limit(1).maybeSingle()
  );
