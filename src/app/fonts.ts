import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// The serif voice for moments of ceremony (DESIGN.md: The Ceremony Rule).
const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  weight: "400",
  style: ["italic"],
  subsets: ["latin"],
});

// Shared by the locale layout and the global error page, which renders its own <body>.
export const fontVariables = `${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable}`;
