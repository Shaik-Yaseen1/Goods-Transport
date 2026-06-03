import type { Metadata } from "next";
import { Barlow_Condensed, DM_Sans } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Providers from "@/components/Providers";
import { getSiteUrl } from "@/lib/db-config";

const barlow = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-barlow",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-dm",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Heavy Hulk — Heavy Load Transport, Booked Fast",
  description:
    "Pan-India heavy load transport booking platform. Medium, Heavy and Trailer fleets with live fare estimates and verified owners.",
  metadataBase: new URL(getSiteUrl()),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${barlow.variable} ${dmSans.variable}`}>
      <body className="min-h-screen bg-bg text-ink font-body">
        <Providers>
          <div className="flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
          <Toaster
            theme="dark"
            position="top-right"
            toastOptions={{
              style: {
                background: "#171B24",
                border: "1px solid #222836",
                color: "#E7ECF3",
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
