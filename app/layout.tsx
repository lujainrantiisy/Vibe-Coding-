import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Feature Requests Board",
  description: "Temporary Supabase connection check",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
