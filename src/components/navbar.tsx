'use client';

import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';

export function Navbar() {
  const router = useRouter();
  const { data: session } = authClient.useSession();

  return (
    <div className="w-full border-b bg-card">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <div className="text-sm font-medium">Recall</div>
        <div className="flex items-center gap-3">
          {session?.user ? (
            <>
              <span className="text-sm text-muted-foreground truncate max-w-48">
                {session.user.email ?? session.user.id}
              </span>
              <Button
                variant="outline"
                onClick={async () => {
                  await authClient.signOut({
                    fetchOptions: {
                      onSuccess: () => router.push('/sign-in'),
                    },
                  });
                }}
              >
                Sign out
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => router.push('/sign-in')}>
                Sign in
              </Button>
              <Button onClick={() => router.push('/sign-up')}>Sign up</Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}


