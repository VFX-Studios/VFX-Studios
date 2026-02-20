import { withSecurity } from './_security.ts';
import { getClient } from './_client.ts';
import { attachSupabaseServiceRole } from './_supabaseServiceRole.ts';

export function getClient(req: Request) {
  const base44 = getClient(req);
  return attachSupabaseServiceRole(base44);
}


