import './globals.css'

export const metadata = {
  title: 'Colorado Family Picks',
  description: 'Discover and share the best family activities across Colorado.',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "'Lato', sans-serif", background: '#f9f9f7', color: '#111', margin: 0, padding: 0 }}>
        {children}
      </body>
    </html>
  )
}
