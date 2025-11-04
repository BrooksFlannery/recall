import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { TRPCReactProvider } from "@/components/providers";
import { Navbar } from "@/components/navbar";
import { FlowgladProvider } from '@flowglad/react';
import { PropsWithChildren } from "react";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Recall",
  description: "A recall application for learning through spaced recall",
};

export default async function RootLayout({
  children,
}: PropsWithChildren) {
  const session = await auth.api.getSession({ headers: await headers() });
  const user = session?.user;
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <TRPCReactProvider>
          <FlowgladProvider loadBilling={!!user}>
            <Navbar />
            {children}
          </FlowgladProvider>
        </TRPCReactProvider>
      </body>
    </html>
  );
}
