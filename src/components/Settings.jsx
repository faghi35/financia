'use client';

import { useState, useRef, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { transactionService } from '../services/database';
import { notificationService } from '../services/notifications';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

export default function Settings() {
    const queryClient = useQueryClient();
    const fileInputRef = useRef(null);
    const [showConfirmClear, setShowConfirmClear] = useState(false);
    const [showAddCategory, setShowAddCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newCategoryType, setNewCategoryType] = useState('expense');
    const [customCategories, setCustomCategories] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('financia-custom-categories');
            return saved ? JSON.parse(saved) : { income: [], expense: [] };
        }
        return { income: [], expense: [] };
    });
    const [notificationsEnabled, setNotificationsEnabled] = useState(false);
    const [isLoadingNotifications, setIsLoadingNotifications] = useState(true);

    useEffect(() => {
        checkNotificationStatus();
    }, []);

    const checkNotificationStatus = async () => {
        const isSubscribed = await notificationService.isSubscribed();
        setNotificationsEnabled(isSubscribed);
        setIsLoadingNotifications(false);
    };

    const toggleNotifications = async () => {
        if (notificationsEnabled) {
            const success = await notificationService.unsubscribeFromPush();
            if (success) {
                setNotificationsEnabled(false);
                toast.success('Notifications désactivées');
            } else {
                toast.error('Erreur lors de la désactivation');
            }
        } else {
            const permission = await notificationService.requestPermission();
            if (permission) {
                const subscription = await notificationService.subscribeToPush();
                if (subscription) {
                    setNotificationsEnabled(true);
                    toast.success('Notifications activées !');
                } else {
                    toast.error('Erreur lors de l\'activation');
                }
            } else {
                toast.error('Permission refusée');
            }
        }
    };

    const sendTestNotification = async () => {
        await notificationService.sendTestNotification();
    };

    const exportMutation = useMutation({
        mutationFn: transactionService.exportData,
        onSuccess: (data) => {
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `financia-backup-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
            toast.success('Données exportées avec succès !');
        },
        onError: () => {
            toast.error('Erreur lors de l\'export');
        },
    });

    const importMutation = useMutation({
        mutationFn: transactionService.importData,
        onSuccess: (count) => {
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            queryClient.invalidateQueries({ queryKey: ['balance'] });
            queryClient.invalidateQueries({ queryKey: ['monthlySummary'] });
            toast.success(`${count} transaction(s) importée(s) !`);
        },
        onError: () => {
            toast.error('Erreur lors de l\'import');
        },
    });

    const clearMutation = useMutation({
        mutationFn: transactionService.clearAllData,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            queryClient.invalidateQueries({ queryKey: ['balance'] });
            queryClient.invalidateQueries({ queryKey: ['monthlySummary'] });
            toast.success('Données supprimées avec succès');
            setShowConfirmClear(false);
        },
        onError: () => {
            toast.error('Erreur lors de la suppression');
        },
    });

    const handleImport = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = event.target?.result;
                importMutation.mutate(data);
            } catch (error) {
                toast.error('Fichier invalide');
            }
        };
        reader.readAsText(file);
    };

    const exportExcel = async () => {
        try {
            const transactions = await transactionService.getTransactions();

            // Prepare data for Excel
            const data = transactions.map((t) => ({
                'Date': new Date(t.date).toLocaleDateString('fr-FR'),
                'Type': t.type === 'income' ? 'Revenu' : 'Dépense',
                'Catégorie': t.category,
                'Montant (FCFA)': t.amount,
                'Description': t.description || '',
            }));

            // Create workbook
            const wb = XLSX.utils.book_new();

            // Add transactions sheet
            const ws = XLSX.utils.json_to_sheet(data);
            XLSX.utils.book_append_sheet(wb, ws, 'Transactions');

            // Generate Excel file
            const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
            const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `financia-export-${new Date().toISOString().split('T')[0]}.xlsx`;
            a.click();
            URL.revokeObjectURL(url);
            toast.success('Données exportées en Excel !');
        } catch (error) {
            toast.error('Erreur lors de l\'export Excel');
        }
    };

    const defaultCategories = {
        income: [
            'Salaire',
            'Freelance',
            'Investissement',
            'Cadeau',
            'Remboursement',
            'Autre',
        ],
        expense: [
            'Alimentation',
            'Transport',
            'Logement',
            'Santé',
            'Éducation',
            'Loisirs',
            'Shopping',
            'Factures',
            'Autre',
        ],
    };

    const categories = {
        income: [...defaultCategories.income, ...customCategories.income],
        expense: [...defaultCategories.expense, ...customCategories.expense],
    };

    const addCategory = () => {
        if (!newCategoryName.trim()) {
            toast.error('Veuillez entrer un nom de catégorie');
            return;
        }

        const updatedCategories = {
            ...customCategories,
            [newCategoryType]: [...customCategories[newCategoryType], newCategoryName.trim()],
        };

        setCustomCategories(updatedCategories);
        localStorage.setItem('financia-custom-categories', JSON.stringify(updatedCategories));
        setNewCategoryName('');
        setShowAddCategory(false);
        toast.success('Catégorie ajoutée avec succès !');
    };

    const deleteCategory = (type, categoryName) => {
        const updatedCategories = {
            ...customCategories,
            [type]: customCategories[type].filter((cat) => cat !== categoryName),
        };

        setCustomCategories(updatedCategories);
        localStorage.setItem('financia-custom-categories', JSON.stringify(updatedCategories));
        toast.success('Catégorie supprimée !');
    };

    return (
        <div className="space-y-6 pb-24">
            {/* Header */}
            <div className="text-center py-4">
                <h1 className="text-2xl font-bold text-slate-800">Paramètres</h1>
                <p className="text-slate-500 text-sm mt-1">
                    Gérez votre application
                </p>
            </div>

            {/* Categories */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-slate-800">
                        Catégories disponibles
                    </h3>
                    <button
                        onClick={() => setShowAddCategory(true)}
                        className="px-3 py-1 bg-sky-500 text-white rounded-lg text-sm font-medium hover:bg-sky-600 transition-colors"
                    >
                        + Ajouter
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <p className="text-sm font-medium text-emerald-600 mb-2">
                            📈 Revenus
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {categories.income.map((cat) => (
                                <span
                                    key={cat}
                                    className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 ${customCategories.income.includes(cat)
                                        ? 'bg-emerald-200 text-emerald-800'
                                        : 'bg-emerald-100 text-emerald-700'
                                        }`}
                                >
                                    {cat}
                                    {customCategories.income.includes(cat) && (
                                        <button
                                            onClick={() => deleteCategory('income', cat)}
                                            className="ml-1 text-emerald-600 hover:text-emerald-800"
                                        >
                                            ×
                                        </button>
                                    )}
                                </span>
                            ))}
                        </div>
                    </div>

                    <div>
                        <p className="text-sm font-medium text-red-500 mb-2">
                            📉 Dépenses
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {categories.expense.map((cat) => (
                                <span
                                    key={cat}
                                    className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 ${customCategories.expense.includes(cat)
                                        ? 'bg-red-200 text-red-800'
                                        : 'bg-red-100 text-red-700'
                                        }`}
                                >
                                    {cat}
                                    {customCategories.expense.includes(cat) && (
                                        <button
                                            onClick={() => deleteCategory('expense', cat)}
                                            className="ml-1 text-red-600 hover:text-red-800"
                                        >
                                            ×
                                        </button>
                                    )}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Notifications */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                <h3 className="font-semibold text-slate-800 mb-4">
                    Notifications
                </h3>

                <div className="space-y-3">
                    {/* Toggle Notifications */}
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                                <span className="text-xl">🔔</span>
                            </div>
                            <div className="text-left">
                                <p className="font-medium text-slate-800">
                                    Notifications push
                                </p>
                                <p className="text-xs text-slate-500">
                                    Recevez des rappels et alertes
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={toggleNotifications}
                            disabled={isLoadingNotifications}
                            className={`relative w-14 h-7 rounded-full transition-colors ${notificationsEnabled
                                    ? 'bg-emerald-500'
                                    : 'bg-slate-300'
                                }`}
                        >
                            <span
                                className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${notificationsEnabled
                                        ? 'translate-x-8'
                                        : 'translate-x-1'
                                    }`}
                            />
                        </button>
                    </div>

                    {/* Test Notification */}
                    {notificationsEnabled && (
                        <button
                            onClick={sendTestNotification}
                            className="w-full flex items-center justify-between p-4 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                                    <span className="text-xl">📬</span>
                                </div>
                                <div className="text-left">
                                    <p className="font-medium text-purple-800">
                                        Tester les notifications
                                    </p>
                                    <p className="text-xs text-purple-600">
                                        Envoyer une notification de test
                                    </p>
                                </div>
                            </div>
                            <svg
                                className="w-5 h-5 text-purple-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 5l7 7-7 7"
                                />
                            </svg>
                        </button>
                    )}
                </div>
            </div>

            {/* Data Management */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                <h3 className="font-semibold text-slate-800 mb-4">
                    Gestion des données
                </h3>

                <div className="space-y-3">
                    {/* Export JSON */}
                    <button
                        onClick={() => exportMutation.mutate()}
                        disabled={exportMutation.isPending}
                        className="w-full flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-sky-100 rounded-full flex items-center justify-center">
                                <span className="text-xl">📤</span>
                            </div>
                            <div className="text-left">
                                <p className="font-medium text-slate-800">
                                    Exporter en JSON
                                </p>
                                <p className="text-xs text-slate-500">
                                    Sauvegardez vos transactions
                                </p>
                            </div>
                        </div>
                        <svg
                            className="w-5 h-5 text-slate-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 5l7 7-7 7"
                            />
                        </svg>
                    </button>

                    {/* Export Excel */}
                    <button
                        onClick={exportExcel}
                        className="w-full flex items-center justify-between p-4 bg-emerald-50 rounded-xl hover:bg-emerald-100 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                                <span className="text-xl">📊</span>
                            </div>
                            <div className="text-left">
                                <p className="font-medium text-emerald-800">
                                    Exporter en Excel
                                </p>
                                <p className="text-xs text-emerald-600">
                                    Fichier .xlsx pour tableur
                                </p>
                            </div>
                        </div>
                        <svg
                            className="w-5 h-5 text-emerald-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 5l7 7-7 7"
                            />
                        </svg>
                    </button>

                    {/* Import */}
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={importMutation.isPending}
                        className="w-full flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                                <span className="text-xl">📥</span>
                            </div>
                            <div className="text-left">
                                <p className="font-medium text-slate-800">
                                    Importer des données
                                </p>
                                <p className="text-xs text-slate-500">
                                    Restaurez une sauvegarde
                                </p>
                            </div>
                        </div>
                        <svg
                            className="w-5 h-5 text-slate-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 5l7 7-7 7"
                            />
                        </svg>
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".json"
                        onChange={handleImport}
                        className="hidden"
                    />

                    {/* Clear Data */}
                    <button
                        onClick={() => setShowConfirmClear(true)}
                        className="w-full flex items-center justify-between p-4 bg-red-50 rounded-xl hover:bg-red-100 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                                <span className="text-xl">🗑️</span>
                            </div>
                            <div className="text-left">
                                <p className="font-medium text-red-700">
                                    Supprimer toutes les données
                                </p>
                                <p className="text-xs text-red-500">
                                    Action irréversible
                                </p>
                            </div>
                        </div>
                        <svg
                            className="w-5 h-5 text-red-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 5l7 7-7 7"
                            />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Confirm Clear Modal */}
            {showConfirmClear && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-3xl">⚠️</span>
                            </div>
                            <h3 className="text-lg font-semibold text-slate-800 mb-2">
                                Supprimer toutes les données ?
                            </h3>
                            <p className="text-slate-500 text-sm mb-6">
                                Cette action est irréversible. Toutes vos
                                transactions seront définitivement supprimées.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowConfirmClear(false)}
                                    className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-colors"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={() => clearMutation.mutate()}
                                    disabled={clearMutation.isPending}
                                    className="flex-1 py-3 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors"
                                >
                                    {clearMutation.isPending
                                        ? 'Suppression...'
                                        : 'Supprimer'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* App Info */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                <h3 className="font-semibold text-slate-800 mb-4">
                    À propos de l&apos;application
                </h3>

                <div className="space-y-3">
                    <div className="flex items-center justify-between py-2">
                        <span className="text-slate-600">Version</span>
                        <span className="font-medium text-slate-800">1.0.0</span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                        <span className="text-slate-600">Stockage</span>
                        <span className="font-medium text-slate-800">
                            IndexedDB
                        </span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                        <span className="text-slate-600">Type</span>
                        <span className="font-medium text-slate-800">PWA</span>
                    </div>
                </div>
            </div>

            {/* Credits */}
            <div className="text-center py-4">
                <p className="text-slate-400 text-sm">
                    Financia © 2026
                </p>
                <p className="text-slate-400 text-xs mt-1">
                    Gestion des finances personnelles
                </p>
            </div>

            {/* Add Category Modal */}
            {showAddCategory && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
                        <h3 className="text-lg font-semibold text-slate-800 mb-4">
                            Ajouter une catégorie
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Type
                                </label>
                                <select
                                    value={newCategoryType}
                                    onChange={(e) => setNewCategoryType(e.target.value)}
                                    className="w-full py-2 px-3 border border-slate-200 rounded-lg"
                                >
                                    <option value="expense">Dépense</option>
                                    <option value="income">Revenu</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Nom de la catégorie
                                </label>
                                <input
                                    type="text"
                                    value={newCategoryName}
                                    onChange={(e) => setNewCategoryName(e.target.value)}
                                    placeholder="Ex: Courses, Loyer..."
                                    className="w-full py-2 px-3 border border-slate-200 rounded-lg"
                                />
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setShowAddCategory(false);
                                        setNewCategoryName('');
                                    }}
                                    className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-colors"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={addCategory}
                                    className="flex-1 py-3 bg-sky-500 text-white rounded-xl font-medium hover:bg-sky-600 transition-colors"
                                >
                                    Ajouter
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
