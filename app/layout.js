import './globals.css';
import { Providers } from './providers';
import BottomNavigation from './components/BottomNavigation';
import ClientToaster from './components/ClientToaster';
import PWAInstallPopup from './components/PWAInstallPopup';

export const metadata = {
    title: 'Financia - Gestion des Finances Personnelles',
    description:
        'Application de gestion des finances personnelles. Suivez vos revenus, dépenses et analysez vos habitudes financières.',
    manifest: '/manifest.json',
    appleWebApp: {
        capable: true,
        statusBarStyle: 'default',
        title: 'Financia',
    },
};

export const viewport = {
    themeColor: '#0ea5e9',
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
};

export default function RootLayout({ children }) {
    return (
        <html lang="fr">
            <head>
                <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
                <meta name="apple-mobile-web-app-capable" content="yes" />
                <meta
                    name="apple-mobile-web-app-status-bar-style"
                    content="default"
                />
                <meta name="mobile-web-app-capable" content="yes" />
            </head>
            <body className="bg-slate-50 min-h-screen">
                <Providers>
                    <div className="max-w-md mx-auto bg-white min-h-screen shadow-xl relative">
                        <main className="px-4 pt-4">{children}</main>
                        <BottomNavigation />
                    </div>
                    <ClientToaster />
                    <PWAInstallPopup />
                </Providers>
            </body>
        </html>
    );
}
