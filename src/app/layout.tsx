import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Maw3id - Appointment Booking Platform",
  description: "Trilingual SaaS appointment booking platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}