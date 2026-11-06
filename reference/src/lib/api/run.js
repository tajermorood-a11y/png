import { mapError } from '../errors';

// Every API call returns { data, error, raw } and never throws.
// error = Arabic message to show; raw = the original error (e.g. to detect 'not_verified').
export async function run(fn) {
  try {
    const { data, error } = await fn();
    if (error) return { data: null, error: mapError(error), raw: error };
    return { data, error: null, raw: null };
  } catch (e) {
    return { data: null, error: mapError(e), raw: e };
  }
}
