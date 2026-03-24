'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    Chart as ChartJS,
    ArcElement,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    PointElement,
    LineElement,
} from 'chart.js';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import { transactionService } from '../services/database';
import { formatCurrency, getMonthName } from '../utils/formatters';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';

ChartJS.register(
    ArcElement,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    PointElement,
    LineElement
);

const CHART_COLORS = [
    '#0ea5e9',
    '#10b981',
    '#f59e0b',
    '#ef4444',
    '#8b5cf6',
    '#ec4899',
    '#06b6d4',
    '#84cc16',
    '#f97316',
    '#6366f1',
];

export default function Reports() {
    const [period, setPeriod] = useState('month');
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    const getDateRange = () => {
        const now = new Date();
        let startDate, endDate;

        switch (period) {
            case 'week':
                startDate = new Date(now);
                startDate.setDate(now.getDate() - 7);
                endDate = now;
                break;
            case 'month':
                startDate = new Date(selectedYear, selectedMonth, 1);
                endDate = new Date(selectedYear, selectedMonth + 1, 0);
                break;
            case 'year':
                startDate = new Date(selectedYear, 0, 1);
                endDate = new Date(selectedYear, 11, 31);
                break;
            default:
                startDate = new Date(selectedYear, selectedMonth, 1);
                endDate = new Date(selectedYear, selectedMonth + 1, 0);
        }

        return {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
        };
    };

    const { startDate, endDate } = getDateRange();

    const { data: transactions = [] } = useQuery({
        queryKey: ['transactions', 'reports', startDate, endDate],
        queryFn: () => transactionService.getTransactions({ startDate, endDate }),
    });

    const { data: categoryStats = {} } = useQuery({
        queryKey: ['categoryStats', startDate, endDate],
        queryFn: () => transactionService.getCategoryStats(startDate, endDate),
    });

    const { data: monthlySummary = { income: 0, expense: 0, balance: 0 } } =
        useQuery({
            queryKey: ['monthlySummary', selectedMonth, selectedYear],
            queryFn: () =>
                transactionService.getMonthlySummary(selectedMonth, selectedYear),
        });

    const stats = useMemo(() => {
        const income = transactions
            .filter((t) => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
        const expense = transactions
            .filter((t) => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

        return {
            income,
            expense,
            balance: income - expense,
            transactionCount: transactions.length,
        };
    }, [transactions]);

    const expenseByCategory = useMemo(() => {
        const expenses = transactions.filter((t) => t.type === 'expense');
        const grouped = expenses.reduce((acc, t) => {
            acc[t.category] = (acc[t.category] || 0) + t.amount;
            return acc;
        }, {});

        return {
            labels: Object.keys(grouped),
            datasets: [
                {
                    data: Object.values(grouped),
                    backgroundColor: CHART_COLORS.slice(
                        0,
                        Object.keys(grouped).length
                    ),
                    borderWidth: 0,
                },
            ],
        };
    }, [transactions]);

    const incomeByCategory = useMemo(() => {
        const incomes = transactions.filter((t) => t.type === 'income');
        const grouped = incomes.reduce((acc, t) => {
            acc[t.category] = (acc[t.category] || 0) + t.amount;
            return acc;
        }, {});

        return {
            labels: Object.keys(grouped),
            datasets: [
                {
                    data: Object.values(grouped),
                    backgroundColor: CHART_COLORS.slice(
                        0,
                        Object.keys(grouped).length
                    ),
                    borderWidth: 0,
                },
            ],
        };
    }, [transactions]);

    const dailyData = useMemo(() => {
        const grouped = transactions.reduce((acc, t) => {
            const date = new Date(t.date).toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: 'short',
            });
            if (!acc[date]) {
                acc[date] = { income: 0, expense: 0 };
            }
            if (t.type === 'income') {
                acc[date].income += t.amount;
            } else {
                acc[date].expense += t.amount;
            }
            return acc;
        }, {});

        const labels = Object.keys(grouped).reverse();
        return {
            labels,
            datasets: [
                {
                    label: 'Revenus',
                    data: labels.map((l) => grouped[l].income),
                    backgroundColor: 'rgba(16, 185, 129, 0.5)',
                    borderColor: '#10b981',
                    borderWidth: 2,
                },
                {
                    label: 'Dépenses',
                    data: labels.map((l) => grouped[l].expense),
                    backgroundColor: 'rgba(239, 68, 68, 0.5)',
                    borderColor: '#ef4444',
                    borderWidth: 2,
                },
            ],
        };
    }, [transactions]);

    const exportCSV = () => {
        const headers = ['Date', 'Type', 'Catégorie', 'Montant', 'Description'];
        const rows = transactions.map((t) => [
            new Date(t.date).toLocaleDateString('fr-FR'),
            t.type === 'income' ? 'Revenu' : 'Dépense',
            t.category,
            t.amount,
            t.description || '',
        ]);

        const csv = [headers, ...rows].map((row) => row.join(';')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
        saveAs(blob, `financia-rapport-${selectedMonth + 1}-${selectedYear}.csv`);
    };

    const exportExcel = () => {
        // Prepare data for Excel
        const data = transactions.map((t) => ({
            'Date': new Date(t.date).toLocaleDateString('fr-FR'),
            'Type': t.type === 'income' ? 'Revenu' : 'Dépense',
            'Catégorie': t.category,
            'Montant (FCFA)': t.amount,
            'Description': t.description || '',
        }));

        // Create summary sheet data
        const summaryData = [
            { 'Résumé': 'Revenus', 'Valeur': stats.income },
            { 'Résumé': 'Dépenses', 'Valeur': stats.expense },
            { 'Résumé': 'Solde', 'Valeur': stats.balance },
            { 'Résumé': 'Nombre de transactions', 'Valeur': stats.transactionCount },
        ];

        // Create workbook
        const wb = XLSX.utils.book_new();

        // Add transactions sheet
        const ws1 = XLSX.utils.json_to_sheet(data);
        XLSX.utils.book_append_sheet(wb, ws1, 'Transactions');

        // Add summary sheet
        const ws2 = XLSX.utils.json_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(wb, ws2, 'Résumé');

        // Add category stats sheet
        const categoryData = Object.entries(categoryStats).map(([category, data]) => ({
            'Catégorie': category,
            'Revenus': data.income,
            'Dépenses': data.expense,
            'Nombre': data.count,
        }));
        const ws3 = XLSX.utils.json_to_sheet(categoryData);
        XLSX.utils.book_append_sheet(wb, ws3, 'Statistiques par catégorie');

        // Generate Excel file
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        saveAs(blob, `financia-rapport-${selectedMonth + 1}-${selectedYear}.xlsx`);
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    padding: 20,
                    usePointStyle: true,
                },
            },
        },
    };

    return (
        <div className="space-y-6 pb-24">
            {/* Header */}
            <div className="text-center py-4">
                <h1 className="text-2xl font-bold text-slate-800">Rapports</h1>
                <p className="text-slate-500 text-sm mt-1">
                    Analysez vos finances
                </p>
            </div>

            {/* Period Selector */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                <div className="flex gap-2 mb-4">
                    {['week', 'month', 'year'].map((p) => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${period === p
                                ? 'bg-sky-500 text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                        >
                            {p === 'week'
                                ? 'Semaine'
                                : p === 'month'
                                    ? 'Mois'
                                    : 'Année'}
                        </button>
                    ))}
                </div>

                {period === 'month' && (
                    <div className="flex gap-2">
                        <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                            className="flex-1 py-2 px-3 border border-slate-200 rounded-lg text-sm"
                        >
                            {Array.from({ length: 12 }, (_, i) => (
                                <option key={i} value={i}>
                                    {getMonthName(i)}
                                </option>
                            ))}
                        </select>
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                            className="flex-1 py-2 px-3 border border-slate-200 rounded-lg text-sm"
                        >
                            {Array.from({ length: 5 }, (_, i) => {
                                const year = new Date().getFullYear() - 2 + i;
                                return (
                                    <option key={year} value={year}>
                                        {year}
                                    </option>
                                );
                            })}
                        </select>
                    </div>
                )}
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-3">
                <div className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl p-4 text-white">
                    <p className="text-white/80 text-sm">Revenus</p>
                    <p className="text-xl font-bold mt-1">
                        {formatCurrency(stats.income)}
                    </p>
                </div>
                <div className="bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl p-4 text-white">
                    <p className="text-white/80 text-sm">Dépenses</p>
                    <p className="text-xl font-bold mt-1">
                        {formatCurrency(stats.expense)}
                    </p>
                </div>
            </div>

            {/* Balance */}
            <div
                className={`rounded-2xl p-4 ${stats.balance >= 0
                    ? 'bg-emerald-50 border border-emerald-200'
                    : 'bg-red-50 border border-red-200'
                    }`}
            >
                <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-700">
                        Solde de la période
                    </span>
                    <span
                        className={`text-xl font-bold ${stats.balance >= 0
                            ? 'text-emerald-600'
                            : 'text-red-600'
                            }`}
                    >
                        {formatCurrency(stats.balance)}
                    </span>
                </div>
                <p className="text-sm text-slate-500 mt-1">
                    {stats.transactionCount} transaction(s)
                </p>
            </div>

            {/* Expense Chart */}
            {expenseByCategory.labels.length > 0 && (
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                    <h3 className="font-semibold text-slate-800 mb-4">
                        Répartition des dépenses
                    </h3>
                    <div className="h-64">
                        <Doughnut data={expenseByCategory} options={chartOptions} />
                    </div>
                </div>
            )}

            {/* Income Chart */}
            {incomeByCategory.labels.length > 0 && (
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                    <h3 className="font-semibold text-slate-800 mb-4">
                        Répartition des revenus
                    </h3>
                    <div className="h-64">
                        <Doughnut data={incomeByCategory} options={chartOptions} />
                    </div>
                </div>
            )}

            {/* Daily Evolution */}
            {dailyData.labels.length > 0 && (
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                    <h3 className="font-semibold text-slate-800 mb-4">
                        Évolution quotidienne
                    </h3>
                    <div className="h-64">
                        <Bar data={dailyData} options={chartOptions} />
                    </div>
                </div>
            )}

            {/* Category Details */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                <h3 className="font-semibold text-slate-800 mb-4">
                    Détail par catégorie
                </h3>
                {Object.keys(categoryStats).length === 0 ? (
                    <p className="text-slate-500 text-center py-4">
                        Aucune donnée pour cette période
                    </p>
                ) : (
                    <div className="space-y-3">
                        {Object.entries(categoryStats)
                            .sort((a, b) => b[1].expense - a[1].expense)
                            .map(([category, data]) => (
                                <div
                                    key={category}
                                    className="flex items-center justify-between p-3 bg-slate-50 rounded-xl"
                                >
                                    <div>
                                        <p className="font-medium text-slate-700">
                                            {category}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            {data.count} transaction(s)
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        {data.income > 0 && (
                                            <p className="text-sm text-emerald-600">
                                                +{formatCurrency(data.income)}
                                            </p>
                                        )}
                                        {data.expense > 0 && (
                                            <p className="text-sm text-red-500">
                                                -{formatCurrency(data.expense)}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                    </div>
                )}
            </div>

            {/* Export Buttons */}
            <div className="grid grid-cols-2 gap-3">
                <button
                    onClick={exportCSV}
                    className="py-4 bg-slate-800 text-white rounded-2xl font-semibold hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
                >
                    <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                        />
                    </svg>
                    CSV
                </button>
                <button
                    onClick={exportExcel}
                    className="py-4 bg-emerald-600 text-white rounded-2xl font-semibold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
                >
                    <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                    </svg>
                    Excel
                </button>
            </div>
        </div>
    );
}