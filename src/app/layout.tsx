import './globals.css';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import SmoothScroll from './smooth-scroll';
import { Cormorant_Garamond } from 'next/font/google';

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'C+J Wedding',
  description: 'Household RSVP portal for wedding guests'
};

export default function RootLayout({
  children
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en" className={cormorant.variable}>
      <body>
        <SmoothScroll />
        {children}
      </body>
    </html>
  );
}
