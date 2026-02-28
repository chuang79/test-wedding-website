import './globals.css';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import SmoothScroll from './smooth-scroll';

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
    <html lang="en">
      <body>
        <SmoothScroll />
        {children}
      </body>
    </html>
  );
}
