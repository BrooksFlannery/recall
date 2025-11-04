'use client';

import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';

export function Navbar() {
  const router = useRouter();
  const { data: session } = authClient.useSession();

  async function handleSignOut() {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push('/sign-in');
        },
      },
    });
  }

  if (!session?.user) {
    return null;
  }

  return (
    <nav className="flex justify-end items-center gap-4 p-4">
      {session.user.name && (
        <span className="text-sm text-muted-foreground">
          {session.user.name}
        </span>
      )}
      <Button onClick={handleSignOut} variant="outline" size="sm">
        Sign out
      </Button>
    </nav>
  );
}

