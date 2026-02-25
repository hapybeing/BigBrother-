import './globals.css'

export const metadata = {
  title: 'BigBrother // Global Node',
  description: 'Real-time global intelligence and telemetry dashboard.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-[#050505] text-[#e5e5e5] font-mono antialiased">
        {children}
      </body>
    </html>
  )
}
