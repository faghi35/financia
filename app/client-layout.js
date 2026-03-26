'use client';

import { usePathname } from 'next/navigation';
import BottomNavigation from './components/BottomNavigation';
import ProtectedLayout from './protected-layout';
import PWAInstallPopup from './components/PWAInstallPopup';

export default function ClientLayout({ children }) {
    const pathname = usePathname();
    const publicPages = ['/login', '/register'];
    const showNavigation = !publicPages.includes(pathname);

    return (
        <ProtectedLayout>
            <div className="w-full max-w-[420px] mx-auto bg-gray-50 min-h-screen relative flex flex-col">
                {showNavigation && (
                    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
                        <div className="flex items-center justify-center h-14 px-4">
                            <div className="flex items-center gap-2">
                                <img
                                    src="/finance-logo.jpg"
                                    alt="Financia Logo"
                                    className="w-8 h-8 rounded-lg object-cover"
                                />
                                <h1 className="text-lg font-bold text-gray-800">Financia</h1>
                            </div>
                        </div>
                    </header>
                )}
                <main className="flex-1 overflow-y-auto pb-20">
                    {children}
                </main>
                {showNavigation && <BottomNavigation />}
                <PWAInstallPopup />
            </div>
        </ProtectedLayout>
    );
}
