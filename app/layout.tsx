import type { Metadata } from "next"
import { ORPCProvider } from "@/lib/orpc/provider"
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
        <ORPCProvider>{children}</ORPCProvider>
      </body>
    </html>
  )
}
