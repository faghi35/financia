import { openDB } from 'idb';

const DB_NAME = 'financia-db';
const DB_VERSION = 1;
const STORE_NAME = 'transactions';

let dbPromise = null;

const getDB = () => {
    if (!dbPromise) {
        dbPromise = openDB(DB_NAME, DB_VERSION, {
            upgrade(db) {
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    const store = db.createObjectStore(STORE_NAME, {
                        keyPath: 'id',
                        autoIncrement: false,
                    });
                    store.createIndex('date', 'date');
                    store.createIndex('type', 'type');
                    store.createIndex('category', 'category');
                }
            },
        });
    }
    return dbPromise;
};

export const transactionService = {
    async addTransaction(transaction) {
        const db = await getDB();
        const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newTransaction = {
            ...transaction,
            id,
            createdAt: new Date().toISOString(),
        };
        await db.add(STORE_NAME, newTransaction);
        return newTransaction;
    },

    async getTransactions(filters = {}) {
        const db = await getDB();
        let transactions = await db.getAll(STORE_NAME);

        if (filters.type) {
            transactions = transactions.filter((t) => t.type === filters.type);
        }

        if (filters.category) {
            transactions = transactions.filter(
                (t) => t.category === filters.category
            );
        }

        if (filters.startDate) {
            transactions = transactions.filter(
                (t) => new Date(t.date) >= new Date(filters.startDate)
            );
        }

        if (filters.endDate) {
            transactions = transactions.filter(
                (t) => new Date(t.date) <= new Date(filters.endDate)
            );
        }

        transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

        if (filters.limit) {
            transactions = transactions.slice(0, filters.limit);
        }

        return transactions;
    },

    async updateTransaction(id, data) {
        const db = await getDB();
        const transaction = await db.get(STORE_NAME, id);
        if (!transaction) {
            throw new Error('Transaction not found');
        }
        const updated = { ...transaction, ...data };
        await db.put(STORE_NAME, updated);
        return updated;
    },

    async deleteTransaction(id) {
        const db = await getDB();
        await db.delete(STORE_NAME, id);
        return true;
    },

    async getBalance() {
        const transactions = await this.getTransactions();
        const balance = transactions.reduce((acc, t) => {
            return t.type === 'income' ? acc + t.amount : acc - t.amount;
        }, 0);
        return balance;
    },

    async getMonthlySummary(month, year) {
        const startDate = new Date(year, month, 1).toISOString();
        const endDate = new Date(year, month + 1, 0).toISOString();

        const transactions = await this.getTransactions({
            startDate,
            endDate,
        });

        const summary = transactions.reduce(
            (acc, t) => {
                if (t.type === 'income') {
                    acc.income += t.amount;
                } else {
                    acc.expense += t.amount;
                }
                return acc;
            },
            { income: 0, expense: 0 }
        );

        summary.balance = summary.income - summary.expense;
        return summary;
    },

    async getCategoryStats(startDate, endDate) {
        const transactions = await this.getTransactions({
            startDate,
            endDate,
        });

        const stats = transactions.reduce((acc, t) => {
            if (!acc[t.category]) {
                acc[t.category] = { income: 0, expense: 0, count: 0 };
            }
            if (t.type === 'income') {
                acc[t.category].income += t.amount;
            } else {
                acc[t.category].expense += t.amount;
            }
            acc[t.category].count += 1;
            return acc;
        }, {});

        return stats;
    },

    async exportData() {
        const transactions = await this.getTransactions();
        return JSON.stringify(transactions, null, 2);
    },

    async importData(jsonData) {
        const db = await getDB();
        const transactions = JSON.parse(jsonData);

        for (const transaction of transactions) {
            await db.put(STORE_NAME, transaction);
        }

        return transactions.length;
    },

    async clearAllData() {
        const db = await getDB();
        await db.clear(STORE_NAME);
        return true;
    },
};

export default transactionService;