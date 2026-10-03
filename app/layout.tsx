import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SIP Compass | A clearer next step",
  description: "A decision-time co-pilot for SIP pause and reduction decisions.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
