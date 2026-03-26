'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { authService, categoryService } from '../../src/services/database';
import {
    User,
    Phone,
    Lock,
    Eye,
    EyeOff,
    LogOut,
    Plus,
    Trash2,
    Wallet,
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

export default function ProfilePage() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('profile');

    // Profile form
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // Category form
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newCategoryType, setNewCategoryType] = useState('expense');
    const [newCategoryIcon, setNewCategoryIcon] = useState('💰');
    const [newCategoryColor, setNewCategoryColor] = useState('#6b7280');

    const icons = [
        { name: 'Wallet', component: Wallet },
        { name: 'Briefcase', component: Briefcase },
        { name: 'Code', component: Code },
        { name: 'LineChart', component: LineChart },
        { name: 'Gift', component: Gift },
        { name: 'RefreshCw', component: RefreshCw },
        { name: 'ShoppingCart', component: ShoppingCart },
        { name: 'Car', component: Car },
        { name: 'Home', component: Home },
        { name: 'Heart', component: Heart },
        { name: 'GraduationCap', component: GraduationCap },
        { name: 'Gamepad2', component: Gamepad2 },
        { name: 'ShoppingBag', component: ShoppingBag },
        { name: 'FileText', component: FileText },
        { name: 'Pin', component: Pin },
    ];
    const colors = ['#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#6b7280', '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#a855f7'];

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const storedUser = authService.getStoredUser();
            if (storedUser) {
                setUser(storedUser);
                setName(storedUser.name);
                setPhone(storedUser.phone);
            }

            const cats = await categoryService.getCategories();
            setCategories(cats);
        } catch (error) {
            console.error('Erreur:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const data = { name };
            if (password) {
                data.password = password;
            }

            const updatedUser = await authService.updateProfile(data);
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
            setPassword('');
            toast.success('Profil mis à jour !');
        } catch (error) {
            toast.error(error.message || 'Erreur lors de la mise à jour');
        } finally {
            setLoading(false);
        }
    };

    const handleAddCategory = async (e) => {
        e.preventDefault();
        if (!newCategoryName.trim()) {
            toast.error('Nom de catégorie requis');
            return;
        }

        try {
            const newCat = await categoryService.createCategory({
                name: newCategoryName,
                type: newCategoryType,
                icon: newCategoryIcon,
                color: newCategoryColor,
            });

            setCategories([...categories, newCat]);
            setNewCategoryName('');
            setNewCategoryIcon('💰');
            setNewCategoryColor('#6b7280');
            toast.success('Catégorie ajoutée !');
        } catch (error) {
            toast.error(error.message || 'Erreur lors de l\'ajout');
        }
    };

    const handleDeleteCategory = async (id) => {
        if (!confirm('Supprimer cette catégorie ?')) return;

        try {
            await categoryService.deleteCategory(id);
            setCategories(categories.filter(c => c.id !== id));
            toast.success('Catégorie supprimée');
        } catch (error) {
            toast.error(error.message || 'Erreur lors de la suppression');
        }
    };

    const handleLogout = () => {
        authService.logout();
        router.push('/login');
    };

    if (loading && !user) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="relative">
                    {/* Spinner autour du logo */}
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-blue-600 absolute"></div>
                    {/* Logo au centre */}
                    <div className="flex items-center justify-center h-16 w-16">
                        <img
                            src="/finance-logo.jpg"
                            alt="Financia Logo"
                            className="w-10 h-10 rounded-lg object-cover"
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
                <div className="w-20 h-20 gradient-primary rounded-full mx-auto mb-4 flex items-center justify-center">
                    <span className="text-3xl text-white">👤</span>
                </div>
                <h1 className="text-2xl font-bold text-dark-800">{user?.name}</h1>
                <p className="text-secondary-500 text-sm">{user?.phone}</p>
            </div>

            {/* Tabs */}
            <div className="bg-light-100 p-1 rounded-xl flex">
                <button
                    onClick={() => setActiveTab('profile')}
                    className={`flex-1 py-3 rounded-lg font-medium transition-all ${activeTab === 'profile'
                        ? 'bg-white text-primary-500 shadow-sm'
                        : 'text-secondary-500'
                        }`}
                >
                    Profil
                </button>
                <button
                    onClick={() => setActiveTab('categories')}
                    className={`flex-1 py-3 rounded-lg font-medium transition-all ${activeTab === 'categories'
                        ? 'bg-white text-primary-500 shadow-sm'
                        : 'text-secondary-500'
                        }`}
                >
                    Catégories
                </button>
            </div>

            {/* Profile Tab */}
            {activeTab === 'profile' && (
                <div className="space-y-4">
                    <form onSubmit={handleUpdateProfile} className="space-y-4">
                        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Nom complet
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full py-3 px-4 border border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none"
                                required
                            />
                        </div>

                        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Numéro de téléphone
                            </label>
                            <input
                                type="tel"
                                value={phone}
                                disabled
                                className="w-full py-3 px-4 border border-slate-200 rounded-xl bg-slate-50 text-slate-500"
                            />
                            <p className="text-xs text-slate-400 mt-1">Le numéro ne peut pas être modifié</p>
                        </div>

                        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Nouveau mot de passe (optionnel)
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Laisser vide pour ne pas changer"
                                    className="w-full py-3 px-4 pr-12 border border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none"
                                    minLength={6}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 gradient-primary text-white rounded-xl font-semibold shadow-lg btn-press"
                        >
                            {loading ? 'Mise à jour...' : 'Mettre à jour le profil'}
                        </button>
                    </form>

                    <button
                        onClick={handleLogout}
                        className="w-full py-4 bg-red-50 text-red-600 rounded-xl font-semibold border border-red-200 btn-press"
                    >
                        Se déconnecter
                    </button>
                </div>
            )}

            {/* Categories Tab */}
            {activeTab === 'categories' && (
                <div className="space-y-4">
                    {/* Add Category Form */}
                    <form onSubmit={handleAddCategory} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 space-y-4">
                        <h3 className="font-semibold text-slate-800">Ajouter une catégorie</h3>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Nom</label>
                            <input
                                type="text"
                                value={newCategoryName}
                                onChange={(e) => setNewCategoryName(e.target.value)}
                                placeholder="Ex: Restaurants"
                                className="w-full py-3 px-4 border border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Type</label>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setNewCategoryType('income')}
                                    className={`flex-1 py-3 rounded-xl font-medium ${newCategoryType === 'income'
                                        ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-500'
                                        : 'bg-slate-50 text-slate-600 border-2 border-transparent'
                                        }`}
                                >
                                    📈 Revenu
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setNewCategoryType('expense')}
                                    className={`flex-1 py-3 rounded-xl font-medium ${newCategoryType === 'expense'
                                        ? 'bg-red-100 text-red-700 border-2 border-red-500'
                                        : 'bg-slate-50 text-slate-600 border-2 border-transparent'
                                        }`}
                                >
                                    📉 Dépense
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Icône</label>
                            <div className="flex flex-wrap gap-2">
                                {icons.map((icon) => (
                                    <button
                                        key={icon.name}
                                        type="button"
                                        onClick={() => setNewCategoryIcon(icon.name)}
                                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${newCategoryIcon === icon.name
                                            ? 'bg-blue-100 border-2 border-blue-500 text-blue-600'
                                            : 'bg-slate-50 border-2 border-transparent text-slate-600'
                                            }`}
                                    >
                                        <icon.component size={20} />
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Couleur</label>
                            <div className="flex flex-wrap gap-2">
                                {colors.map((color) => (
                                    <button
                                        key={color}
                                        type="button"
                                        onClick={() => setNewCategoryColor(color)}
                                        className={`w-8 h-8 rounded-full ${newCategoryColor === color ? 'ring-2 ring-offset-2 ring-blue-500' : ''
                                            }`}
                                        style={{ backgroundColor: color }}
                                    />
                                ))}
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="w-full py-3 gradient-primary text-white rounded-xl font-semibold btn-press"
                        >
                            Ajouter la catégorie
                        </button>
                    </form>

                    {/* Categories List */}
                    <div className="space-y-3">
                        <h3 className="font-semibold text-slate-800 px-1">Mes catégories</h3>

                        {categories.map((cat) => {
                            const IconComponent = icons.find(i => i.name === cat.icon)?.component || Pin;
                            return (
                                <div
                                    key={cat.id}
                                    className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 flex items-center justify-between"
                                >
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-10 h-10 rounded-lg flex items-center justify-center"
                                            style={{ backgroundColor: cat.color + '20', color: cat.color }}
                                        >
                                            <IconComponent size={20} />
                                        </div>
                                        <div>
                                            <p className="font-medium text-slate-800">{cat.name}</p>
                                            <p className="text-xs text-slate-500">
                                                {cat.type === 'income' ? 'Revenu' : 'Dépense'}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteCategory(cat.id)}
                                        className="text-red-500 hover:text-red-700 p-2"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                            );
                        })}

                        {categories.length === 0 && (
                            <p className="text-center text-slate-500 py-8">Aucune catégorie</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}