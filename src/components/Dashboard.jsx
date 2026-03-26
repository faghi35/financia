'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { transactionService } from '../services/database';
import { formatCurrency, getRelativeDate } from '../utils/formatters';
import {
    Wallet,
    TrendingUp,
    TrendingDown,
    Briefcase,
    Code,
    LineChart,
    Gift,
    RefreshCw,
    ShoppingCart,
    Car,
    Home,
    Heart,
    GraduationCap,
    Gamepad2,
    ShoppingBag,
    FileText,
    Pin
} from 'lucide-react';

const BalanceCard = ({ title, amount, color = 'primary', icon }) => {
    const colorClasses = {
        primary: 'from-primary-500 to-secondary-500',
        success: 'from-emerald-500 to-green-600',
        danger: 'from-red-500 to-rose-600',
        accent: 'from-accent-500 to-accent-400',
    };

    return (
        <div
            className={`bg-gradient-to-br ${colorClasses[color]} rounded-2xl p-5 text-white shadow-lg card-hover`}
        >
            <div className="flex items-center justify-between mb-3">
                <span className="text-white/80 text-sm font-medium">
                    {title}
                </span>
                {icon && <span className="text-2xl">{icon}</span>}
            </div>
            <p className="text-2xl font-bold tracking-tight">
                {formatCurrency(amount)}
            </p>
        </div>
    );
};

const TransactionItem = ({ transaction }) => {
    const isIncome = transaction.type === 'income';

    const categoryIcons = {
        Salaire: Briefcase,
        Freelance: Code,
        Investissement: LineChart,
        Alimentation: ShoppingCart,
        Transport: Car,
        Logement: Home,
        Loisirs: Gamepad2,
        Santé: Heart,
        Éducation: GraduationCap,
        Shopping: ShoppingBag,
        Factures: FileText,
        Autre: Pin,
    };

    const IconComponent = categoryIcons[transaction.category] || Pin;

    return (
        <div className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm border border-light-200 hover:shadow-md transition-shadow card-hover">
            <div className="flex items-center gap-3">
                <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${isIncome ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
                        }`}
                >
                    <IconComponent size={20} />
                </div>
                <div>
                    <p className="font-medium text-dark-800">
                        {transaction.description || transaction.category}
                    </p>
                    <p className="text-xs text-secondary-500">
                        {getRelativeDate(transaction.date)}
                    </p>
                </div>
            </div>
            <p
                className={`font-semibold ${isIncome ? 'text-emerald-600' : 'text-red-500'
                    }`}
            >
                {isIncome ? '+' : '-'}
                {formatCurrency(transaction.amount)}
            </p>
        </div>
    );
};

const QuickStat = ({ label, value, icon, trend }) => {
    return (
        <div className="flex items-center gap-3 p-3 bg-light-100 rounded-xl card-hover">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                <span className="text-xl">{icon}</span>
            </div>
            <div className="flex-1">
                <p className="text-xs text-secondary-500">{label}</p>
                <p className="font-semibold text-dark-800">{value}</p>
            </div>
            {trend && (
                <span
                    className={`text-xs font-medium ${trend > 0 ? 'text-emerald-600' : 'text-red-500'
                        }`}
                >
                    {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
                </span>
            )}
        </div>
    );
};

export default function Dashboard() {
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const { data: balance = 0, isLoading: balanceLoading } = useQuery({
        queryKey: ['balance'],
        queryFn: transactionService.getBalance,
    });

    const { data: transactions = [], isLoading: transactionsLoading } =
        useQuery({
            queryKey: ['transactions', 'recent'],
            queryFn: () => transactionService.getTransactions({ limit: 5 }),
        });

    const { data: monthlySummary = { income: 0, expense: 0, balance: 0 } } =
        useQuery({
            queryKey: ['monthlySummary'],
            queryFn: () => {
                const now = new Date();
                return transactionService.getMonthlySummary(
                    now.getMonth() + 1, // getMonth() returns 0-11, we need 1-12
                    now.getFullYear()
                );
            },
        });

    const isLoading = balanceLoading || transactionsLoading;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="relative">
                    {/* Spinner autour du logo */}
                    <div className="animate-spin rounded-full h-20 w-20 border-4 border-gray-200 border-t-blue-600 absolute inset-0"></div>
                    {/* Logo au centre */}
                    <div className="flex items-center justify-center h-20 w-20">
                        <img
                            src="/finance-logo.jpg"
                            alt="Financia Logo"
                            className="w-12 h-12 rounded-xl object-cover"
                        />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-24">
            {/* Header */}
            <div className="text-center py-4">
                <p className="text-secondary-500 text-sm">
                    {currentTime.toLocaleDateString('fr-FR', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                    })}
                </p>
                <p className="text-2xl font-bold text-dark-800">
                    {currentTime.toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit',
                    })}
                </p>
            </div>

            {/* Balance Principal */}
            <BalanceCard
                title="Solde total"
                amount={balance}
                color="primary"
                icon="💰"
            />

            {/* Stats rapides */}
            <div className="grid grid-cols-2 gap-3">
                <QuickStat
                    label="Revenus du mois"
                    value={formatCurrency(monthlySummary.income)}
                    icon="📈"
                />
                <QuickStat
                    label="Dépenses du mois"
                    value={formatCurrency(monthlySummary.expense)}
                    icon="📉"
                />
            </div>

            {/* Résumé mensuel */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-light-200 card-hover">
                <h3 className="font-semibold text-dark-800 mb-4">
                    Résumé du mois
                </h3>
                <div className="flex justify-between items-center">
                    <div className="text-center">
                        <p className="text-xs text-secondary-500 mb-1">Revenus</p>
                        <p className="font-semibold text-emerald-600">
                            {formatCurrency(monthlySummary.income)}
                        </p>
                    </div>
                    <div className="h-10 w-px bg-light-300"></div>
                    <div className="text-center">
                        <p className="text-xs text-secondary-500 mb-1">Dépenses</p>
                        <p className="font-semibold text-red-500">
                            {formatCurrency(monthlySummary.expense)}
                        </p>
                    </div>
                    <div className="h-10 w-px bg-light-300"></div>
                    <div className="text-center">
                        <p className="text-xs text-secondary-500 mb-1">Solde</p>
                        <p
                            className={`font-semibold ${monthlySummary.balance >= 0
                                ? 'text-emerald-600'
                                : 'text-red-500'
                                }`}
                        >
                            {formatCurrency(monthlySummary.balance)}
                        </p>
                    </div>
                </div>
            </div>

            {/* Transactions récentes */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-dark-800">
                        Transactions récentes
                    </h3>
                    <span className="text-sm text-primary-500 font-medium">
                        Voir tout →
                    </span>
                </div>
                {transactions.length === 0 ? (
                    <div className="text-center py-8 bg-light-100 rounded-2xl">
                        <p className="text-4xl mb-2">📭</p>
                        <p className="text-secondary-500">
                            Aucune transaction pour le moment
                        </p>
                        <p className="text-sm text-secondary-400 mt-1">
                            Ajoutez votre première transaction !
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {transactions.map((transaction) => (
                            <TransactionItem
                                key={transaction.id}
                                transaction={transaction}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}