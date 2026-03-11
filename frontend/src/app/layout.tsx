import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

export const metadata: Metadata = {
  title: "Blackbox Systems",
  description: "Elite Blockchain Infrastructure",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className="font-mono antialiased flex flex-col min-h-screen bg-[#050505]"
      >
        <Providers>
          <Navbar />
          <div className="grow flex flex-col">
          {children}
          </div>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
