import { supabase } from '../supabase';
import { run } from './run';

export const listMatches = () =>
  run(() =>
    supabase.from('matches').select('*').order('match_date', { ascending: true }).order('id', { ascending: true }).limit(200)
  );

export const myPredictions = (userId) => run(() => supabase.from('predictions').select('*').eq('user_id', userId));

// The server enforces: verified account (not_verified) and open match (match_locked), and freezes the odds.
export const savePrediction = (userId, matchId, home, away) =>
  run(() =>
    supabase
      .from('predictions')
      .upsert({ user_id: userId, match_id: matchId, predicted_home: home, predicted_away: away }, { onConflict: 'user_id,match_id' })
      .select()
      .single()
  );
