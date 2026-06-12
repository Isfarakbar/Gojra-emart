const { getMessaging } = require('firebase-admin/messaging');

/**
 * Sends a push notification to a specific device via Firebase Cloud Messaging.
 * 
 * @param {string} fcmToken - The device FCM token.
 * @param {string} title - The title of the notification.
 * @param {string} body - The body of the notification.
 * @param {object} data - Optional extra data payload.
 */
const sendNotification = async (fcmToken, title, body, data = {}) => {
    if (!fcmToken) {
        console.warn('⚠️ No FCM token provided. Skipping notification:', title);
        return;
    }

    try {
        const message = {
            notification: {
                title,
                body,
            },
            data: {
                ...data,
                click_action: 'FLUTTER_NOTIFICATION_CLICK' // Standard for Flutter background handling
            },
            token: fcmToken,
        };

        const response = await getMessaging().send(message);
        console.log(`✅ Push notification sent to ${fcmToken.substring(0, 10)}... | Message ID:`, response);
    } catch (error) {
        console.error('❌ Error sending FCM push notification:', error.message);
    }
};

module.exports = sendNotification;
