'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function ProtectedLayout({ children }) {
    const router = useRouter();
    const pathname = usePathname();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);

    // Pages publiques qui ne nécessitent pas d'authentification
    const publicPages = ['/login', '/register'];

    useEffect(() => {
        const checkAuth = () => {
            const token = localStorage.getItem('token');
            const user = localStorage.getItem('user');

            if (token && user) {
                setIsAuthenticated(true);
            } else {
                setIsAuthenticated(false);
                // Rediriger vers login si pas sur une page publique
                if (!publicPages.includes(pathname)) {
                    router.push('/login');
                }
            }
            setLoading(false);
        };

        checkAuth();
    }, [pathname, router]);

    // Afficher un loader pendant la vérification
    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="relative inline-flex items-center justify-center mb-4">
                        {/* Spinner autour du logo */}
                        <div className="animate-spin rounded-full h-20 w-20 border-4 border-gray-200 border-t-blue-600 absolute"></div>
                        {/* Logo au centre */}
                        <div className="flex items-center justify-center h-20 w-20">
                            <img
                                src="/finance-logo.jpg"
                                alt="Financia Logo"
                                className="w-12 h-12 rounded-xl object-cover"
                            />
                        </div>
                    </div>
                    <p className="text-gray-500">Chargement...</p>
                </div>
            </div>
        );
    }

    // Si c'est une page publique, afficher directement
    if (publicPages.includes(pathname)) {
        return children;
    }

    // Si authentifié, afficher le contenu
    if (isAuthenticated) {
        return children;
    }

    // Sinon ne rien afficher (redirection en cours)
    return null;
}