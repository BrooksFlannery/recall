'use client';

import { api } from '@/components/providers';
import { Button } from '@/components/ui/button';

export function HomeClient() {
  const hello = api.example.hello.useQuery({ text: 'from tRPC!' });
  const getAll = api.example.getAll.useQuery();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background font-sans">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-center py-32 px-16">
        <div className="flex flex-col items-center gap-6 text-center">
          <h1 className="text-3xl font-semibold leading-10 tracking-tight text-foreground">
            Recall
          </h1>
          <p className="text-lg leading-8 text-muted-foreground">
            A recall application for learning through spaced recall
          </p>
        </div>
      </main>
    </div>
  );
}


