import type { Metadata, Viewport } from "next";
import "@clinic/ui/styles.css";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "CuraFlow — Care, right on time",
    template: "%s · CuraFlow"
  },
  description:
    "Appointments, live clinic queues, and calmer care journeys for patients and care teams."
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f5f7f3"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
