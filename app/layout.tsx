import type React from "react"
import type { Metadata } from "next"
import { Figtree } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/contexts/auth-context"
import { StoreInitializer } from "@/stores/components/StoreInitializer"

const figtree = Figtree({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Passr - AI Resume Optimization",
  description: "Optimize your resume with AI precision",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={figtree.className}>
        <StoreInitializer />
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
