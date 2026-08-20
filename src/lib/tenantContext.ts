interface TenantContext {
  organizationId: string;
}

class DummyAsyncLocalStorage<T> {
  getStore(): T | undefined {
    return undefined;
  }
  run<R>(_store: T, callback: () => R): R {
    return callback();
  }
}

let tenantAsyncLocalStorageInstance: any;
if (typeof window === "undefined") {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { AsyncLocalStorage } = require("async_hooks");
    tenantAsyncLocalStorageInstance = new AsyncLocalStorage<TenantContext>();
  } catch {
    tenantAsyncLocalStorageInstance = new DummyAsyncLocalStorage<TenantContext>();
  }
} else {
  tenantAsyncLocalStorageInstance = new DummyAsyncLocalStorage<TenantContext>();
}

export const tenantAsyncLocalStorage = tenantAsyncLocalStorageInstance;

export function getTenantContext(): string | undefined {
  const store = tenantAsyncLocalStorage.getStore();
  return store?.organizationId;
}

export function runWithTenant<R>(organizationId: string, callback: () => R): R {
  return tenantAsyncLocalStorage.run({ organizationId }, callback);
}
