import type { Metadata } from "next"
import { TRPCProvider } from "@/lib/trpc/provider"
import "./globals.css"

export const metadata: Metadata = {
  title: "Template",
  description: "Template application",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        <TRPCProvider>{children}</TRPCProvider>
      </body>
    </html>
  )
}
