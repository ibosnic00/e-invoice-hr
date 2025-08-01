import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "PDF Obrt / Barkod",
  description: "Generirajte PDF417 barkodove za plaćanja i PDF račune",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="hr">
      <body className={inter.className}>{children}</body>
    </html>
  )
} 