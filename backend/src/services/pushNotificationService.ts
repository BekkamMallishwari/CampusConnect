// Push notification helper using FCM REST API v1 or fallback
export interface PushMessageData {
  token: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

export const sendPushNotification = async (payload: PushMessageData): Promise<boolean> => {
  const fcmServerKey = process.env.FIREBASE_SERVER_KEY || process.env.FIREBASE_MESSAGING_KEY;
  if (!payload.token || !fcmServerKey) {
    console.info(
      `[PushNotification] Skipped push notification for token ending in ${payload.token?.slice(-6) || 'none'} (FCM Server Key not set)`,
    );
    return false;
  }

  try {
    const res = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `key=${fcmServerKey}`,
      },
      body: JSON.stringify({
        to: payload.token,
        notification: {
          title: payload.title,
          body: payload.body,
          sound: 'default',
        },
        data: payload.data || {},
      }),
    });

    if (!res.ok) {
      console.warn(`[PushNotification] FCM response error: ${res.status}`);
      return false;
    }
    console.log(`[PushNotification] Sent push alert: "${payload.title}" to token ending in ${payload.token.slice(-6)}`);
    return true;
  } catch (err) {
    console.error('[PushNotification] Exception sending push notification:', err);
    return false;
  }
};
