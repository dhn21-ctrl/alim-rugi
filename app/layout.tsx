import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Alim Rugi - Efficiency in Every Purchase",
  description: "Next generation inventory management tools for SME",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body suppressHydrationWarning className="min-h-full flex flex-col">
        {children}
      </body>
    </html>
  );
}