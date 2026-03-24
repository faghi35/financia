'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { transactionService } from '../services/database';
import { formatCurrency, getRelativeDate } from '../utils/formatters';

const BalanceCard = ({ title, amount, color = 'primary', icon }) => {
    const colorClasses = {
        primary: 'from-sky-500 to-blue-600',
        success: 'from-emerald-500 to-green-600',
        danger: 'from-red-500 to-rose-600',
        warning: 'from-amber-500 to-orange-600',
    };

    return (
        <div
            className={`bg-gradient-to-br ${colorClasses[color]} rounded-2xl p-5 text-white shadow-lg`}
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
        Salaire: '💼',
        Freelance: '💻',
        Investissement: '📈',
        Alimentation: '🛒',
        Transport: '🚗',
        Logement: '🏠',
        Loisirs: '🎮',
        Santé: '💊',
        Éducation: '📚',
        Shopping: '🛍️',
        Factures: '📄',
        Autre: '📌',
    };

    return (
        <div className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
                <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${isIncome ? 'bg-emerald-100' : 'bg-red-100'
                        }`}
                >
                    {categoryIcons[transaction.category] || '📌'}
                </div>
                <div>
                    <p className="font-medium text-slate-800">
                        {transaction.description || transaction.category}
                    </p>
                    <p className="text-xs text-slate-500">
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
        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                <span className="text-xl">{icon}</span>
            </div>
            <div className="flex-1">
                <p className="text-xs text-slate-500">{label}</p>
                <p className="font-semibold text-slate-800">{value}</p>
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
                    now.getMonth(),
                    now.getFullYear()
                );
            },
        });

    const isLoading = balanceLoading || transactionsLoading;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-sky-500 border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-24">
            {/* Header */}
            <div className="text-center py-4">
                <p className="text-slate-500 text-sm">
                    {currentTime.toLocaleDateString('fr-FR', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                    })}
                </p>
                <p className="text-2xl font-bold text-slate-800">
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
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                <h3 className="font-semibold text-slate-800 mb-4">
                    Résumé du mois
                </h3>
                <div className="flex justify-between items-center">
                    <div className="text-center">
                        <p className="text-xs text-slate-500 mb-1">Revenus</p>
                        <p className="font-semibold text-emerald-600">
                            {formatCurrency(monthlySummary.income)}
                        </p>
                    </div>
                    <div className="h-10 w-px bg-slate-200"></div>
                    <div className="text-center">
                        <p className="text-xs text-slate-500 mb-1">Dépenses</p>
                        <p className="font-semibold text-red-500">
                            {formatCurrency(monthlySummary.expense)}
                        </p>
                    </div>
                    <div className="h-10 w-px bg-slate-200"></div>
                    <div className="text-center">
                        <p className="text-xs text-slate-500 mb-1">Solde</p>
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
                    <h3 className="font-semibold text-slate-800">
                        Transactions récentes
                    </h3>
                    <span className="text-sm text-sky-600">
                        Voir tout →
                    </span>
                </div>
                {transactions.length === 0 ? (
                    <div className="text-center py-8 bg-slate-50 rounded-2xl">
                        <p className="text-4xl mb-2">📭</p>
                        <p className="text-slate-500">
                            Aucune transaction pour le moment
                        </p>
                        <p className="text-sm text-slate-400 mt-1">
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