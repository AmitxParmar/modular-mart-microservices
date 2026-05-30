import { AsyncLocalStorage } from 'node:async_hooks';

type Store = Map<string, string>;

export const correlationStorage = new AsyncLocalStorage<Store>();

export function getCorrelationId(): string {
  return correlationStorage.getStore()?.get('correlationId') ?? 'unknown';
}

export function setCorrelationId(correlationId: string) {
  const store = correlationStorage.getStore();
  if (store) store.set('correlationId', correlationId);
}
