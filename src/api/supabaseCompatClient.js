import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const ENV = import.meta?.env || {};

function toSnakeCase(name) {
  return String(name || '')
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[\s-]+/g, '_')
    .toLowerCase();
}

function tableCandidates(entityName) {
  const exact = String(entityName);
  const snake = toSnakeCase(entityName);
  const pluralSnake = snake.endsWith('s') ? snake : `${snake}s`;
  return [exact, snake, pluralSnake].filter((value, index, arr) => arr.indexOf(value) === index);
}

function orderFromSort(sort) {
  if (!sort) return null;
  const raw = String(sort);
  const ascending = !raw.startsWith('-');
  const column = raw.replace(/^-/, '');
  return { column, ascending };
}

function normalizeResult(data, isSingle) {
  if (isSingle) return data || null;
  return Array.isArray(data) ? data : [];
}

function isMissingTableError(error) {
  return error?.code === '42P01' || String(error?.message || '').toLowerCase().includes('does not exist');
}

async function runTableFallback(supabase, entityName, execute) {
  const candidates = tableCandidates(entityName);
  let lastError = null;

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

function buildEntityApi(supabase, entityName) {
  return {
    async list(sort = null, limit = null) {
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
        };
      });
    },

    async filter(filters = {}, sort = null, limit = null) {
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
        };
      });
    },

    async get(id) {
      return runTableFallback(supabase, entityName, async (table) => {
        const result = await table.select('*').eq('id', id).maybeSingle();
        return {
          data: normalizeResult(result.data, true),
          error: result.error
        };
      });
    },

    async create(payload) {
      return runTableFallback(supabase, entityName, async (table) => {
        const result = await table.insert(payload).select('*').maybeSingle();
        return {
          data: normalizeResult(result.data, true),
          error: result.error
        };
      });
    },

    async update(id, payload) {
      return runTableFallback(supabase, entityName, async (table) => {
        const result = await table.update(payload).eq('id', id).select('*').maybeSingle();
        return {
          data: normalizeResult(result.data, true),
          error: result.error
        };
      });
    },

    async delete(id) {
      return runTableFallback(supabase, entityName, async (table) => {
        const result = await table.delete().eq('id', id).select('*').maybeSingle();
        return {
          data: normalizeResult(result.data, true),
          error: result.error
        };
      });
    },

    subscribe(callback) {
      const channelName = `entity:${entityName}:${Date.now()}`;
      const table = toSnakeCase(entityName);

      const channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table },
          (payload) => {
            callback?.(payload);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  };
}

function createEntitiesProxy(supabase) {
  return new Proxy(
    {},
    {
      get(_target, prop) {
        return buildEntityApi(supabase, String(prop));
      }
    }
  );
}

function buildStoragePath(userId, fileName = 'file') {
  const safeName = String(fileName).replace(/[^\w.\-]/g, '_');
  return `${userId || 'anon'}/${Date.now()}_${safeName}`;
}

export function isSupabaseConfigured() {
  return Boolean(ENV.VITE_SUPABASE_URL && ENV.VITE_SUPABASE_ANON_KEY);
}

export function createSupabaseCompatClient() {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase client cannot initialize: missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY.');
  }

  const supabase = createSupabaseClient(ENV.VITE_SUPABASE_URL, ENV.VITE_SUPABASE_ANON_KEY);
  const entities = createEntitiesProxy(supabase);
  const storageBucket = ENV.VITE_SUPABASE_STORAGE_BUCKET || 'uploads';

  return {
    _provider: 'supabase',
    _supabase: supabase,

    auth: {
      async me() {
        const { data, error } = await supabase.auth.getUser();
        if (error) throw error;
        if (!data?.user) throw new Error('Not authenticated.');
        return {
          id: data.user.id,
          email: data.user.email,
          full_name: data.user.user_metadata?.full_name || data.user.email,
          ...data.user.user_metadata
        };
      },

      async logout(redirectTo = null) {
        await supabase.auth.signOut();
        if (typeof window !== 'undefined') {
          const destination = redirectTo || '/auth';
          window.location.href = destination;
        }
      },

      redirectToLogin(fromUrl) {
        if (typeof window === 'undefined') return;
        const returnTo = encodeURIComponent(fromUrl || window.location.href);
        window.location.href = `/auth?from_url=${returnTo}`;
      },

      async updateMe(payload) {
        const { data, error } = await supabase.auth.updateUser({ data: payload });
        if (error) throw error;
        return {
          id: data.user?.id,
          email: data.user?.email,
          ...data.user?.user_metadata
        };
      }
    },

    users: {
      async inviteUser(email, role = 'user') {
        return entities.UserInvite.create({
          email,
          role,
          status: 'pending'
        });
      }
    },

    entities,

    functions: {
      async invoke(name, payload = {}) {
        const { data, error } = await supabase.functions.invoke(name, { body: payload });
        if (error) throw error;
        return { data };
      }
    },

    integrations: {
      Core: {
        async UploadFile({ file }) {
          if (!file) throw new Error('UploadFile requires a file.');
          const user = await supabase.auth.getUser();
          const userId = user.data?.user?.id || 'anon';
          const path = buildStoragePath(userId, file.name);
          const { error } = await supabase.storage.from(storageBucket).upload(path, file, {
            upsert: false
          });
          if (error) throw error;
          const publicUrl = supabase.storage.from(storageBucket).getPublicUrl(path).data.publicUrl;
          return { file_url: publicUrl, path };
        },

        async SendEmail(payload = {}) {
          const { data, error } = await supabase.functions.invoke('send-email', { body: payload });
          if (error) throw error;
          return data;
        }
      }
    },

    appLogs: {
      async logUserInApp(pageName) {
        try {
          const user = await supabase.auth.getUser();
          const userId = user.data?.user?.id || null;
          await entities.AppLog.create({
            user_id: userId,
            page_name: pageName,
            logged_at: new Date().toISOString()
          });
        } catch {
          // Logging must never block UX.
        }
      }
    },

    analytics: {
      track(event) {
        entities.AnalyticsEvent.create({
          event_name: event?.event || event?.name || 'unknown',
          payload: event || {},
          created_at: new Date().toISOString()
        }).catch(() => {});
      }
    },

    agents: {
      getWhatsAppConnectURL(agentId) {
        const baseMessage = encodeURIComponent(`Connect me to agent: ${agentId}`);
        return `https://wa.me/?text=${baseMessage}`;
      }
    }
  };
}
