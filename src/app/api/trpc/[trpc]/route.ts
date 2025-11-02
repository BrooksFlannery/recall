import { fetchRequestHandler } from '@trpc/server/adapters/fetch';

import { appRouter } from '@/server/api/root';
import { createTRPCContext } from '@/server/api/trpc';

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: () => createTRPCContext({ req }),
    ...(process.env.NODE_ENV === 'development'
      ? {
          onError: (opts) => {
            const path = (opts as { path?: string }).path;
            const error = (opts as { error: Error }).error;
            console.error(
              `❌ tRPC failed on ${path ?? '<no-path>'}: ${error.message}`,
            );
          },
        }
      : {}),
  });

export { handler as GET, handler as POST };
