import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SimpleInvoice",
  description: "Secure invoice management app for the 101 Digital assessment"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
