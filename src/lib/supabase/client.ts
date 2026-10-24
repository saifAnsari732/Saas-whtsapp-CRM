// ============================================================
// Safe Stub Supabase Client — 100% Pure Firebase Architecture
// Prevents ERR_NAME_NOT_RESOLVED & dead WebSocket connections
// ============================================================

interface QueryResult {
  data: any[] | any | null;
  count: number | null;
  error: null;
}

function createQueryBuilder(_table: string) {
  const result: QueryResult = { data: [], count: 0, error: null };

  const builder: any = {
    select: () => builder,
    insert: () => builder,
    update: () => builder,
    upsert: () => builder,
    delete: () => builder,
    eq: () => builder,
    neq: () => builder,
    gt: () => builder,
    gte: () => builder,
    lt: () => builder,
    lte: () => builder,
    is: () => builder,
    in: () => builder,
    contains: () => builder,
    containedBy: () => builder,
    rangeGt: () => builder,
    rangeGte: () => builder,
    rangeLt: () => builder,
    rangeLte: () => builder,
    rangeAdjacent: () => builder,
    overlaps: () => builder,
    like: () => builder,
    ilike: () => builder,
    not: () => builder,
    match: () => builder,
    filter: () => builder,
    order: () => builder,
    limit: () => builder,
    range: () => builder,
    abortSignal: () => builder,
    single: () => Promise.resolve({ data: null, error: null }),
    maybeSingle: () => Promise.resolve({ data: null, error: null }),
    then: (resolve: (val: QueryResult) => any) => Promise.resolve(result).then(resolve),
    catch: (reject: (err: any) => any) => Promise.resolve(result).catch(reject),
  };

  return builder;
}

function createMockChannel(name: string) {
  const channel: any = {
    name,
    on: (_type: string, _filter: any, _callback?: (payload: any) => void) => channel,
    subscribe: (callback?: (status: any) => void) => {
      if (typeof callback === 'function') {
        setTimeout(() => callback('SUBSCRIBED'), 0);
      }
      return channel;
    },
    unsubscribe: () => Promise.resolve('ok'),
  };
  return channel;
}

const stubClient: any = {
  from: (table: string) => createQueryBuilder(table),
  channel: (name: string) => createMockChannel(name),
  removeChannel: (_ch: any) => Promise.resolve('ok'),
  removeAllChannels: () => Promise.resolve([]),
  getChannels: () => [],
  rpc: (_fn: string, _args?: any) => Promise.resolve({ data: null, error: null }),
  auth: {
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    getUser: () => Promise.resolve({ data: { user: null }, error: null }),
    onAuthStateChange: () => ({
      data: {
        subscription: {
          id: 'mock-sub',
          callback: () => {},
          unsubscribe: () => {},
        },
      },
    }),
    signOut: () => Promise.resolve({ error: null }),
    signInWithPassword: () => Promise.resolve({ data: { user: null, session: null }, error: null }),
    signUp: () => Promise.resolve({ data: { user: null, session: null }, error: null }),
  },
  storage: {
    from: (_bucket: string) => ({
      upload: () => Promise.resolve({ data: { path: '' }, error: null }),
      download: () => Promise.resolve({ data: new Blob(), error: null }),
      getPublicUrl: () => ({ data: { publicUrl: '' } }),
      remove: () => Promise.resolve({ data: [], error: null }),
      list: () => Promise.resolve({ data: [], error: null }),
    }),
  },
};

export function createClient() {
  return stubClient;
}
