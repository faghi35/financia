'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { transactionService } from '../services/database';
import toast from 'react-hot-toast';

const INCOME_CATEGORIES = [
    'Salaire',
    'Freelance',
    'Investissement',
    'Cadeau',
    'Remboursement',
    'Autre',
];

const EXPENSE_CATEGORIES = [
    'Alimentation',
    'Transport',
    'Logement',
    'Santé',
    'Éducation',
    'Loisirs',
    'Shopping',
    'Factures',
    'Autre',
];

export default function AddTransaction() {
    const queryClient = useQueryClient();
    const [type, setType] = useState('expense');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState(
        new Date().toISOString().split('T')[0]
    );

    const categories =
        type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

    const mutation = useMutation({
        mutationFn: transactionService.addTransaction,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            queryClient.invalidateQueries({ queryKey: ['balance'] });
            queryClient.invalidateQueries({ queryKey: ['monthlySummary'] });
            toast.success('Transaction ajoutée avec succès !');
            resetForm();
        },
        onError: (error) => {
            toast.error('Erreur lors de l\'ajout de la transaction');
            console.error(error);
        },
    });

    const resetForm = () => {
        setAmount('');
        setCategory('');
        setDescription('');
        setDate(new Date().toISOString().split('T')[0]);
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!amount || parseFloat(amount) <= 0) {
            toast.error('Veuillez entrer un montant valide');
            return;
        }

        if (!category) {
            toast.error('Veuillez sélectionner une catégorie');
            return;
        }

        mutation.mutate({
            type,
            amount: parseFloat(amount),
            category,
            description: description.trim(),
            date: new Date(date).toISOString(),
        });
    };

    return (
        <div className="space-y-6 pb-24">
            {/* Header */}
            <div className="text-center py-4">
                <h1 className="text-2xl font-bold text-slate-800">
                    Nouvelle Transaction
                </h1>
                <p className="text-slate-500 text-sm mt-1">
                    Ajoutez un revenu ou une dépense
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Type Toggle */}
                <div className="bg-slate-100 p-1 rounded-xl flex">
                    <button
                        type="button"
                        onClick={() => {
                            setType('expense');
                            setCategory('');
                        }}
                        className={`flex-1 py-3 rounded-lg font-medium transition-all ${type === 'expense'
                                ? 'bg-white text-red-500 shadow-sm'
                                : 'text-slate-500'
                            }`}
                    >
                        📉 Dépense
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setType('income');
                            setCategory('');
                        }}
                        className={`flex-1 py-3 rounded-lg font-medium transition-all ${type === 'income'
                                ? 'bg-white text-emerald-500 shadow-sm'
                                : 'text-slate-500'
                            }`}
                    >
                        📈 Revenu
                    </button>
                </div>

                {/* Montant */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        Montant (FCFA)
                    </label>
                    <div className="relative">
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0"
                            min="0"
                            step="1"
                            className="w-full text-3xl font-bold text-center py-4 border-0 border-b-2 border-slate-200 focus:border-sky-500 focus:outline-none bg-transparent"
                        />
                    </div>
                </div>

                {/* Catégorie */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                    <label className="block text-sm font-medium text-slate-700 mb-3">
                        Catégorie
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                type="button"
                                onClick={() => setCategory(cat)}
                                className={`py-3 px-2 rounded-xl text-sm font-medium transition-all ${category === cat
                                        ? type === 'income'
                                            ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-500'
                                            : 'bg-red-100 text-red-700 border-2 border-red-500'
                                        : 'bg-slate-50 text-slate-600 border-2 border-transparent hover:bg-slate-100'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Date */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        Date
                    </label>
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full py-3 px-4 border border-slate-200 rounded-xl focus:border-sky-500 focus:outline-none"
                    />
                </div>

                {/* Description */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        Description (optionnel)
                    </label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Ajoutez une note..."
                        rows={3}
                        className="w-full py-3 px-4 border border-slate-200 rounded-xl focus:border-sky-500 focus:outline-none resize-none"
                    />
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={mutation.isPending}
                    className={`w-full py-4 rounded-2xl font-semibold text-white shadow-lg transition-all ${type === 'income'
                            ? 'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700'
                            : 'bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700'
                        } ${mutation.isPending
                            ? 'opacity-50 cursor-not-allowed'
                            : 'active:scale-[0.98]'
                        }`}
                >
                    {mutation.isPending ? (
                        <span className="flex items-center justify-center gap-2">
                            <svg
                                className="animate-spin h-5 w-5"
                                viewBox="0 0 24 24"
                            >
                                <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                    fill="none"
                                />
                                <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                />
                            </svg>
                            Ajout en cours...
                        </span>
                    ) : (
                        `Ajouter ${type === 'income' ? 'le revenu' : 'la dépense'}`
                    )}
                </button>
            </form>
        </div>
    );
}