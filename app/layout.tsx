import './globals.css'
import TerminalOverlay from './TerminalOverlay' // Injecting the Client Component

export const metadata = {
  title: 'OASIS // Global Node',
  description: 'Real-time global intelligence and telemetry dashboard.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-[#050505] text-[#e5e5e5] font-mono antialiased overflow-hidden">
        {/* Main Application Content */}
        {children}
        
        {/* The Persistent Global Terminal System */}
        <TerminalOverlay />
      </body>
    </html>
  )
}
