import { Providers } from '@/components/providers';
import './globals.css';

// Polyfill Buffer for browser environment
if (typeof globalThis.Buffer === 'undefined') {
  globalThis.Buffer = require('buffer').Buffer;
}
 
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}