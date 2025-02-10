import type { Metadata } from "next";
import "./globals.css";
import { ViewlessProvider } from "./services";

export const metadata: Metadata = {
  title: "Create Next App",
  description: "Generated by create next app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ViewlessProvider>{children}</ViewlessProvider>
      </body>
    </html>
  );
}
