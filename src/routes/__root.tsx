import { HeadContent, Outlet, Scripts, createRootRoute } from '@tanstack/react-router'
import '../styles.css'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'OSFUSA USMC — United States Marine Corps' },
    ],
  }),
  component: RootDocument,
})

function RootDocument() {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="min-h-screen" style={{ backgroundColor: 'var(--marine-bg)', color: 'var(--marine-tan-light)' }}>
        <Outlet />
        <Scripts />
      </body>
    </html>
  )
}
