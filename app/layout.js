import './globals.css';
import { Providers } from './providers';
import ClientToaster from './components/ClientToaster';
import PWAInstallPopup from './components/PWAInstallPopup';
import ClientLayout from './client-layout';

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
                <link rel="icon" href="/finance-logo.jpg" />
                <link rel="apple-touch-icon" href="/finance-logo.jpg" />
                <meta name="apple-mobile-web-app-capable" content="yes" />
                <meta
                    name="apple-mobile-web-app-status-bar-style"
                    content="default"
                />
                <meta name="mobile-web-app-capable" content="yes" />
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link
                    href="https://fonts.googleapis.com/css2?family=Ubuntu:wght@300;400;500;700&display=swap"
                    rel="stylesheet"
                />
            </head>
            <body className="bg-slate-50 min-h-screen">
                <Providers>
                    <ClientLayout>{children}</ClientLayout>
                    <ClientToaster />
                    <PWAInstallPopup />
                </Providers>
            </body>
        </html>
    );
}