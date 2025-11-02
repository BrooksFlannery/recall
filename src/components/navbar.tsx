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
    <nav className="flex justify-end p-4">
      <Button onClick={handleSignOut} variant="outline" size="sm">
        Sign out
      </Button>
    </nav>
  );
}

