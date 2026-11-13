"use client";

import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";

/**
 * データ取得のキャッシュ。ブラウザでは 1 つのクライアントを使い回す。
 * meta.persist が付いたクエリ（店舗マスタ・進捗など）だけを端末に保存し、
 * 次に開いたとき電波が弱くてもすぐ表示できるようにする（裏で最新に更新する）。
 */
let browserClient: QueryClient | undefined;

function makeClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 24 * 60 * 60 * 1000,
        retry: 1,
        refetchOnWindowFocus: true,
      },
    },
  });
}

function getClient() {
  if (typeof window === "undefined") return makeClient();
  browserClient ??= makeClient();
  return browserClient;
}

const persister =
  typeof window === "undefined"
    ? undefined
    : createSyncStoragePersister({ storage: window.localStorage, key: "bansan-cup-sales:query-cache" });

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const client = getClient();
  if (!persister) return <>{children}</>;
  return (
    <PersistQueryClientProvider
      client={client}
      persistOptions={{
        persister,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        buster: "v1",
        dehydrateOptions: {
          shouldDehydrateQuery: (query) => query.meta?.persist === true && query.state.status === "success",
        },
      }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}
