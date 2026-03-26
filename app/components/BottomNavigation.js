'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Settings, Plus, BarChart3 } from 'lucide-react';

const navItems = [
    {
        href: '/',
        label: 'Accueil',
        icon: Home,
    },
    {
        href: '/add',
        label: 'Ajouter',
        icon: Plus,
    },
    {
        href: '/reports',
        label: 'Statistiques',
        icon: BarChart3,
    },
    {
        href: '/profile',
        label: 'Paramètres',
        icon: Settings,
    },
];

export default function BottomNavigation() {
    const pathname = usePathname();

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-light-200 z-50">
            <div className="max-w-[420px] mx-auto px-4">
                <div className="flex items-center justify-around py-2">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex flex-col items-center py-2 px-3 rounded-xl transition-colors ${isActive
                                    ? 'text-primary-500 bg-primary-50'
                                    : 'text-secondary-500 hover:text-dark-700 hover:bg-light-100'
                                    }`}
                            >
                                <item.icon size={24} />
                                <span className="text-xs mt-1 font-medium">
                                    {item.label}
                                </span>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </nav>
    );
}
