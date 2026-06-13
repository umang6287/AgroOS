import "./globals.css";

export const metadata = {
  title: "AgriOS",
  description: "Autonomous Farm Operating System"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
