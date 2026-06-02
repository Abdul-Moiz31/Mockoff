import "../styles/globals.css";
import { Metadata } from "next";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://mockoff.onrender.com";

const DESCRIPTION =
  "Mockoff is an AI-powered mock interview platform that helps you practice for your next job interview with instant, structured feedback.";

export const metadata: Metadata = {
  title: "Mockoff - AI-Powered Mock Interviews",
  description: DESCRIPTION,
  openGraph: {
    title: "Mockoff - AI-Powered Mock Interviews",
    description: DESCRIPTION,
    images: [{ url: "/opengraph-image" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Mockoff - AI-Powered Mock Interviews",
    description: DESCRIPTION,
    images: ["/opengraph-image"],
  },
  metadataBase: new URL(SITE_URL),
  themeColor: "#FFF",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="scroll-smooth antialiased [font-feature-settings:'ss01']">
        {children}
      </body>
    </html>
  );
}
