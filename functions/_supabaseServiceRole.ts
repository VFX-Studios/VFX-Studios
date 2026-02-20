import { withSecurity } from './_security.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';

// Supabase service-role shim to mimic base44.asServiceRole for entity/function access.
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const SUPABASE_STORAGE_BUCKET = Deno.env.get('SUPABASE_STORAGE_BUCKET') || 'uploads';

function toSnakeCase(name: string) {
  return String(name || '')
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[\s-]+/g, '_')
    .toLowerCase();
}

function tableCandidates(entityName: string) {
  const exact = String(entityName);
  const snake = toSnakeCase(entityName);
  const pluralSnake = snake.endsWith('s') ? snake : `${snake}s`;
  return [exact, snake, pluralSnake].filter((value, index, arr) => arr.indexOf(value) === index);
}

function orderFromSort(sort?: string | null) {
  if (!sort) return null;
  const raw = String(sort);
  const ascending = !raw.startsWith('-');
  const column = raw.replace(/^-/, '');
  return { column, ascending };
}

function normalizeResult(data: unknown, isSingle: boolean) {
  if (isSingle) return data || null;
  return Array.isArray(data) ? data : [];
}

function isMissingTableError(error: any) {
  return error?.code === '42P01' || String(error?.message || '').toLowerCase().includes('does not exist');
}

async function runTableFallback<T>(
  supabase: any,
  entityName: string,
  execute: (table: any, tableName: string) => Promise<{ data: T; error: any }>
) {
  const candidates = tableCandidates(entityName);
  let lastError: any = null;

  for (const table of candidates) {
    const { data, error } = await execute(supabase.from(table), table);
    if (!error) {
      return data;
    }
    lastError = error;
    if (!isMissingTableError(error)) {
      throw error;
    }
  }

  throw lastError || new Error(`No table resolved for entity "${entityName}".`);
}

function buildEntityApi(supabase: any, entityName: string) {
  return {
    async list(sort: string | null = null, limit: number | null = null) {
      return runTableFallback(supabase, entityName, async (table) => {
        let query = table.select('*');
        const ordering = orderFromSort(sort);
        if (ordering) {
          query = query.order(ordering.column, { ascending: ordering.ascending });
        }
        if (typeof limit === 'number') {
          query = query.limit(limit);
        }
        const result = await query;
        return {
          data: normalizeResult(result.data, false),
          error: result.error
        } as any;
      });
    },

    async filter(filters: Record<string, any> = {}, sort: string | null = null, limit: number | null = null) {
      return runTableFallback(supabase, entityName, async (table) => {
        let query = table.select('*');
        Object.entries(filters || {}).forEach(([key, value]) => {
          if (value === null) {
            query = query.is(key, null);
          } else if (Array.isArray(value)) {
            query = query.in(key, value);
          } else {
            query = query.eq(key, value);
          }
        });

        const ordering = orderFromSort(sort);
        if (ordering) {
          query = query.order(ordering.column, { ascending: ordering.ascending });
        }
        if (typeof limit === 'number') {
          query = query.limit(limit);
        }

        const result = await query;
        return {
          data: normalizeResult(result.data, false),
          error: result.error
        } as any;
      });
    },

    async get(id: string) {
      return runTableFallback(supabase, entityName, async (table) => {
        const result = await table.select('*').eq('id', id).maybeSingle();
        return {
          data: normalizeResult(result.data, true),
          error: result.error
        } as any;
      });
    },

    async create(payload: any) {
      return runTableFallback(supabase, entityName, async (table) => {
        const result = await table.insert(payload).select('*').maybeSingle();
        return {
          data: normalizeResult(result.data, true),
          error: result.error
        } as any;
      });
    },

    async update(id: string, payload: any) {
      return runTableFallback(supabase, entityName, async (table) => {
        const result = await table.update(payload).eq('id', id).select('*').maybeSingle();
        return {
          data: normalizeResult(result.data, true),
          error: result.error
        } as any;
      });
    },

    async delete(id: string) {
      return runTableFallback(supabase, entityName, async (table) => {
        const result = await table.delete().eq('id', id).select('*').maybeSingle();
        return {
          data: normalizeResult(result.data, true),
          error: result.error
        } as any;
      });
    }
  };
}

function createEntitiesProxy(supabase: any) {
  return new Proxy(
    {},
    {
      get(_target, prop) {
        return buildEntityApi(supabase, String(prop));
      }
    }
  );
}

async function generateViaProviders(task: 'image' | 'video' | 'asset3d', params: any) {
  // Lazy import to avoid bundling issues if not used.
  const { generateWithProviders } = await import('../src/lib/ai-providers/index.js');
  return generateWithProviders({ ...params, generation_type: task });
}

export function attachSupabaseServiceRole(base44: any) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return base44;
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const entities = createEntitiesProxy(supabase);

  base44.asServiceRole = {
    entities,
    functions: {
      async invoke(name: string, payload = {}) {
        const { data, error } = await supabase.functions.invoke(name, { body: payload });
        if (error) throw error;
        return { data };
      }
    },
    integrations: {
      Core: {
        async GenerateImage(params = {}) {
          return generateViaProviders('image', params);
        },
        async InvokeLLM(params = {}) {
          const { invokeLLMWithProviders } = await import('../src/lib/ai-providers/index.js');
          return invokeLLMWithProviders(params);
        },
        async GenerateVideo(params = {}) {
          return generateViaProviders('video', params);
        },
        async Generate3DAsset(params = {}) {
          return generateViaProviders('asset3d', params);
        }
      }
    },
    storageBucket: SUPABASE_STORAGE_BUCKET,
    connectors: {
      async getAccessToken(_provider: string) {
        throw new Error('connectors.getAccessToken is not supported in Supabase mode.');
      }
    },
    users: {
      async inviteUser(email: string, role = 'user') {
        return entities.UserInvite.create({
          email,
          role,
          status: 'pending'
        });
      }
    }
  };

  return base44;
}


