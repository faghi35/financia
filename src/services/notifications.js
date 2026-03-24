const VAPID_PUBLIC_KEY = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';

export const notificationService = {
    async requestPermission() {
        if (!('Notification' in window)) {
            console.log('This browser does not support notifications');
            return false;
        }

        const permission = await Notification.requestPermission();
        return permission === 'granted';
    },

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

            // Save subscription to localStorage (in a real app, send to server)
            localStorage.setItem('push-subscription', JSON.stringify(subscription));

            return subscription;
        } catch (error) {
            console.error('Error subscribing to push:', error);
            return null;
        }
    },

    async unsubscribeFromPush() {
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();

            if (subscription) {
                await subscription.unsubscribe();
                localStorage.removeItem('push-subscription');
            }

            return true;
        } catch (error) {
            console.error('Error unsubscribing from push:', error);
            return false;
        }
    },

    async isSubscribed() {
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();
            return !!subscription;
        } catch (error) {
            return false;
        }
    },

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

    async sendTestNotification() {
        if (!('Notification' in window)) {
            alert('Ce navigateur ne supporte pas les notifications');
            return;
        }

        if (Notification.permission === 'granted') {
            const registration = await navigator.serviceWorker.ready;
            registration.showNotification('Financia', {
                body: 'Les notifications sont activées !',
                icon: '/icons/icon-192x192.png',
                badge: '/icons/icon-72x72.png',
                vibrate: [100, 50, 100],
                data: {
                    dateOfArrival: Date.now(),
                    primaryKey: 1,
                },
                actions: [
                    {
                        action: 'explore',
                        title: 'Ouvrir l\'application',
                    },
                    {
                        action: 'close',
                        title: 'Fermer',
                    },
                ],
            });
        } else {
            alert('Veuillez autoriser les notifications dans les paramètres de votre navigateur');
        }
    },
};

export default notificationService;