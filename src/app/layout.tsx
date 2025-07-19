import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ConfigProvider } from "antd";
import theme from "../theme/themeConfig";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Weatherly",
  description: "Weather App using Next.js and Ant Design",
  icons: {
    // Option 1: Basic .ico favicon (most common)
    icon: "/favicon.svg", // Path relative to the public directory

    // Option 2: More comprehensive icons for different devices/sizes
    // You can provide an object or an array of objects
    // If you have multiple sizes/types, it's good to list them
    
    apple: '/favicon.svg', // For Apple devices
    // safariPinnedTab: { // For Safari pinned tabs (requires SVG)
    //   url: '/safari-pinned-tab.svg',
    //   color: '#5bbad5',
    // },
  },
  // You can also add a theme color for mobile browsers
  // themeColor: '#ffffff',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased h-screen`}
      >
        <ConfigProvider theme={theme}>
          {children}
        </ConfigProvider>
      </body>
    </html>
  );
}