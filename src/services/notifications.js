const VAPID_PUBLIC_KEY = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';

// Notification types
const NOTIFICATION_TYPES = {
    TRANSACTION: 'transaction',
    BUDGET_ALERT: 'budget_alert',
    REMINDER: 'reminder',
    ACHIEVEMENT: 'achievement',
    SYSTEM: 'system'
};

// Notification priorities
const PRIORITIES = {
    LOW: 'low',
    NORMAL: 'normal',
    HIGH: 'high',
    URGENT: 'urgent'
};

export const notificationService = {
    // Default notification settings
    defaultSettings: {
        enabled: true,
        sound: true,
        vibration: true,
        quietHours: {
            enabled: false,
            start: '22:00',
            end: '08:00'
        },
        categories: {
            [NOTIFICATION_TYPES.TRANSACTION]: true,
            [NOTIFICATION_TYPES.BUDGET_ALERT]: true,
            [NOTIFICATION_TYPES.REMINDER]: true,
            [NOTIFICATION_TYPES.ACHIEVEMENT]: true,
            [NOTIFICATION_TYPES.SYSTEM]: true
        },
        budgetAlertThreshold: 80, // Alert when 80% of budget is used
        dailyReminder: true,
        weeklyReport: true
    },

    // Get user notification settings
    getSettings() {
        const saved = localStorage.getItem('notification-settings');
        return saved ? { ...this.defaultSettings, ...JSON.parse(saved) } : this.defaultSettings;
    },

    // Save notification settings
    saveSettings(settings) {
        localStorage.setItem('notification-settings', JSON.stringify(settings));
        return settings;
    },

    // Check if notifications are supported
    isSupported() {
        return 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
    },

    // Request notification permission
    async requestPermission() {
        if (!this.isSupported()) {
            console.log('This browser does not support notifications');
            return false;
        }

        try {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                await this.subscribeToPush();
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error requesting permission:', error);
            return false;
        }
    },

    // Subscribe to push notifications
    async subscribeToPush() {
        try {
            const registration = await navigator.serviceWorker.ready;

            // Check if already subscribed
            const existingSubscription = await registration.pushManager.getSubscription();
            if (existingSubscription) {
                return existingSubscription;
            }

            // Subscribe to push notifications
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: this.urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
            });

            // Save subscription to localStorage and send to server
            localStorage.setItem('push-subscription', JSON.stringify(subscription));
            await this.sendSubscriptionToServer(subscription);

            return subscription;
        } catch (error) {
            console.error('Error subscribing to push:', error);
            return null;
        }
    },

    // Send subscription to server
    async sendSubscriptionToServer(subscription) {
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            if (!user) return;

            // In a real app, send to your backend
            console.log('Subscription sent to server for user:', user.id);
            localStorage.setItem('push-subscription-sent', 'true');
        } catch (error) {
            console.error('Error sending subscription to server:', error);
        }
    },

    // Unsubscribe from push notifications
    async unsubscribeFromPush() {
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();

            if (subscription) {
                await subscription.unsubscribe();
                localStorage.removeItem('push-subscription');
                localStorage.removeItem('push-subscription-sent');
            }

            return true;
        } catch (error) {
            console.error('Error unsubscribing from push:', error);
            return false;
        }
    },

    // Check if subscribed
    async isSubscribed() {
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();
            return !!subscription;
        } catch (error) {
            return false;
        }
    },

    // Check if in quiet hours
    isInQuietHours() {
        const settings = this.getSettings();
        if (!settings.quietHours.enabled) return false;

        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();

        const [startHour, startMin] = settings.quietHours.start.split(':').map(Number);
        const [endHour, endMin] = settings.quietHours.end.split(':').map(Number);

        const startTime = startHour * 60 + startMin;
        const endTime = endHour * 60 + endMin;

        if (startTime <= endTime) {
            return currentTime >= startTime && currentTime <= endTime;
        } else {
            // Overnight quiet hours (e.g., 22:00 - 08:00)
            return currentTime >= startTime || currentTime <= endTime;
        }
    },

    // Show notification with enhanced features
    async showNotification(title, options = {}) {
        const settings = this.getSettings();

        if (!settings.enabled) return;
        if (this.isInQuietHours() && options.priority !== PRIORITIES.URGENT) return;
        if (options.type && !settings.categories[options.type]) return;

        try {
            const registration = await navigator.serviceWorker.ready;

            const notificationOptions = {
                body: options.body || '',
                icon: options.icon || '/icons/icon-192x192.png',
                badge: '/icons/icon-72x72.png',
                vibrate: settings.vibration ? (options.vibrate || [100, 50, 100]) : [],
                data: {
                    dateOfArrival: Date.now(),
                    primaryKey: options.id || Date.now(),
                    type: options.type || NOTIFICATION_TYPES.SYSTEM,
                    url: options.url || '/',
                    ...options.data
                },
                actions: options.actions || [
                    {
                        action: 'open',
                        title: 'Ouvrir',
                    },
                    {
                        action: 'close',
                        title: 'Fermer',
                    },
                ],
                requireInteraction: options.priority === PRIORITIES.HIGH || options.priority === PRIORITIES.URGENT,
                silent: !settings.sound,
                tag: options.tag || 'financia-notification',
                renotify: true
            };

            await registration.showNotification(title, notificationOptions);

            // Save to notification history
            this.saveToHistory(title, options);

        } catch (error) {
            console.error('Error showing notification:', error);
        }
    },

    // Save notification to history
    saveToHistory(title, options) {
        try {
            const history = JSON.parse(localStorage.getItem('notification-history') || '[]');
            const notification = {
                id: Date.now(),
                title,
                body: options.body,
                type: options.type,
                timestamp: new Date().toISOString(),
                read: false,
                data: options.data
            };

            history.unshift(notification);

            // Keep only last 50 notifications
            if (history.length > 50) {
                history.splice(50);
            }

            localStorage.setItem('notification-history', JSON.stringify(history));
        } catch (error) {
            console.error('Error saving notification to history:', error);
        }
    },

    // Get notification history
    getHistory() {
        try {
            return JSON.parse(localStorage.getItem('notification-history') || '[]');
        } catch (error) {
            return [];
        }
    },

    // Mark notification as read
    markAsRead(notificationId) {
        try {
            const history = this.getHistory();
            const notification = history.find(n => n.id === notificationId);
            if (notification) {
                notification.read = true;
                localStorage.setItem('notification-history', JSON.stringify(history));
            }
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    },

    // Clear notification history
    clearHistory() {
        localStorage.removeItem('notification-history');
    },

    // Transaction notifications
    async notifyTransaction(transaction) {
        const settings = this.getSettings();
        if (!settings.categories[NOTIFICATION_TYPES.TRANSACTION]) return;

        const isIncome = transaction.type === 'income';
        const emoji = isIncome ? '💰' : '💸';
        const action = isIncome ? 'Revenu' : 'Dépense';

        await this.showNotification(
            `${emoji} ${action} enregistré`,
            {
                body: `${transaction.description || transaction.category}: ${transaction.amount.toLocaleString()} FCFA`,
                type: NOTIFICATION_TYPES.TRANSACTION,
                url: '/',
                tag: `transaction-${transaction.id}`,
                data: { transactionId: transaction.id }
            }
        );
    },

    // Budget alert notifications
    async notifyBudgetAlert(category, percentage, amount, budget) {
        const settings = this.getSettings();
        if (!settings.categories[NOTIFICATION_TYPES.BUDGET_ALERT]) return;
        if (percentage < settings.budgetAlertThreshold) return;

        const emoji = percentage >= 100 ? '🚨' : '⚠️';
        const status = percentage >= 100 ? 'dépassé' : 'atteint';

        await this.showNotification(
            `${emoji} Budget ${status}: ${category}`,
            {
                body: `${percentage}% du budget utilisé (${amount.toLocaleString()} / ${budget.toLocaleString()} FCFA)`,
                type: NOTIFICATION_TYPES.BUDGET_ALERT,
                priority: percentage >= 100 ? PRIORITIES.HIGH : PRIORITIES.NORMAL,
                url: '/reports',
                tag: `budget-${category}`,
                data: { category, percentage, amount, budget }
            }
        );
    },

    // Daily reminder notification
    async notifyDailyReminder() {
        const settings = this.getSettings();
        if (!settings.dailyReminder) return;

        await this.showNotification(
            '📊 Rappel quotidien',
            {
                body: 'N\'oubliez pas d\'enregistrer vos transactions du jour !',
                type: NOTIFICATION_TYPES.REMINDER,
                priority: PRIORITIES.LOW,
                url: '/add',
                tag: 'daily-reminder'
            }
        );
    },

    // Weekly report notification
    async notifyWeeklyReport(summary) {
        const settings = this.getSettings();
        if (!settings.weeklyReport) return;

        const balance = summary.income - summary.expense;
        const emoji = balance >= 0 ? '✅' : '⚠️';

        await this.showNotification(
            '📈 Rapport hebdomadaire',
            {
                body: `Revenus: ${summary.income.toLocaleString()} | Dépenses: ${summary.expense.toLocaleString()} | Solde: ${balance.toLocaleString()} FCFA`,
                type: NOTIFICATION_TYPES.SYSTEM,
                url: '/reports',
                tag: 'weekly-report',
                data: { summary }
            }
        );
    },

    // Achievement notification
    async notifyAchievement(achievement) {
        const settings = this.getSettings();
        if (!settings.categories[NOTIFICATION_TYPES.ACHIEVEMENT]) return;

        await this.showNotification(
            `🏆 Succès débloqué !`,
            {
                body: achievement.description,
                type: NOTIFICATION_TYPES.ACHIEVEMENT,
                priority: PRIORITIES.NORMAL,
                url: '/profile',
                tag: `achievement-${achievement.id}`,
                data: { achievement }
            }
        );
    },

    // Send test notification
    async sendTestNotification() {
        if (!this.isSupported()) {
            alert('Ce navigateur ne supporte pas les notifications');
            return;
        }

        if (Notification.permission === 'granted') {
            await this.showNotification(
                '🎉 Financia',
                {
                    body: 'Les notifications sont activées et fonctionnent parfaitement !',
                    type: NOTIFICATION_TYPES.SYSTEM,
                    priority: PRIORITIES.NORMAL,
                    url: '/',
                    tag: 'test-notification'
                }
            );
        } else {
            alert('Veuillez autoriser les notifications dans les paramètres de votre navigateur');
        }
    },

    // Schedule notification
    async scheduleNotification(title, options, delayMs) {
        setTimeout(() => {
            this.showNotification(title, options);
        }, delayMs);
    },

    // Cancel scheduled notification
    cancelScheduledNotification(tag) {
        // In a real implementation, you'd track scheduled notifications
        console.log('Canceling scheduled notification:', tag);
    },

    // Utility function
    urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
        const base64 = (base64String + padding)
            .replace(/-/g, '+')
            .replace(/_/g, '/');

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    },

    // Get notification statistics
    getStats() {
        const history = this.getHistory();
        const unread = history.filter(n => !n.read).length;
        const total = history.length;

        const byType = history.reduce((acc, n) => {
            acc[n.type] = (acc[n.type] || 0) + 1;
            return acc;
        }, {});

        return { unread, total, byType };
    }
};

export default notificationService;
