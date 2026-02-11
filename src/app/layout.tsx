import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MyTime - Client Workday Manager",
  description: "Automatically generate weekly work schedules based on availability, clients, and targets",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
