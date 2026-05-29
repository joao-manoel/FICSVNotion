import "../src/styles/globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FiCSVNotion",
  description: "Importe extratos CSV para o Notion.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
