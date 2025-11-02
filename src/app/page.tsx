import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { HomeClient } from './home-client';

export default async function Home() {
  // Session check is handled by middleware, but we can still access it if needed
  const session = await auth.api.getSession({ headers: await headers() });
  return <HomeClient />;
}
