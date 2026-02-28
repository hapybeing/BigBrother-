import './globals.css'
import TerminalOverlay from './TerminalOverlay'

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
      {/* Removed 'overflow-hidden'. 
        The body is now allowed to scroll naturally on tablets. 
      */}
      <body className="bg-[#020202] text-[#e5e5e5] font-mono antialiased overflow-x-hidden">
        {children}
        <TerminalOverlay />
      </body>
    </html>
  )
}
