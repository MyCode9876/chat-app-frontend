import './globals.css'

export const metadata = {
  title: 'MYCHATBOX — Secure Chat Space',
  description: 'Premium WhatsApp-style real-time purple dark chat client space.',
  icons: {
    icon: '/icon.svg',
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var savedTheme = localStorage.getItem("theme") || "system";
                  var isDark = savedTheme === "dark" || (savedTheme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
                  if (!isDark) {
                    document.documentElement.classList.add("light");
                  } else {
                    document.documentElement.classList.remove("light");
                  }
                } catch(e) {}
              })();
            `
          }}
        />
      </head>
      <body className="bg-themeDark-bg text-gray-100 min-h-screen overflow-x-hidden antialiased">
        {children}
      </body>
    </html>
  )
}
