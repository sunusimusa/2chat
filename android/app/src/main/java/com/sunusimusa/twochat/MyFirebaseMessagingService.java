package com.sunusimusa.twochat;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;

import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

public class MyFirebaseMessagingService extends FirebaseMessagingService {

    private static final String MESSAGE_CHANNEL_ID = "2chat_messages";
    private static final String CALL_CHANNEL_ID = "2chat_calls";

    @Override
    public void onNewToken(String token) {
        super.onNewToken(token);

        android.util.Log.d("2ChatFCM", "FCM token refreshed.");

        Intent intent = new Intent(MainActivity.ACTION_FCM_TOKEN_REFRESHED);
        intent.setPackage(getPackageName());
        intent.putExtra("fcm_token", token);
        sendBroadcast(intent);
    }

    @Override
    public void onMessageReceived(RemoteMessage remoteMessage) {
        super.onMessageReceived(remoteMessage);

        java.util.Map<String, String> data = remoteMessage.getData();
        if ("incoming_call".equals(data.get("type"))) {
            String caller = data.get("caller");
            String callId = data.get("callId");
            if (caller == null || caller.trim().isEmpty() || callId == null || callId.trim().isEmpty()) {
                return;
            }
            showIncomingCallNotification(caller, callId);
            return;
        }

        String title = "2Chat";
        String body = "You have a new notification.";

        if (remoteMessage.getNotification() != null) {
            if (remoteMessage.getNotification().getTitle() != null) title = remoteMessage.getNotification().getTitle();
            if (remoteMessage.getNotification().getBody() != null) body = remoteMessage.getNotification().getBody();
        }
        if (data.containsKey("title")) title = data.get("title");
        if (data.containsKey("body")) body = data.get("body");

        showNotification(title, body);
    }

    private void createChannel(NotificationManager manager, String channelId, String name, int importance) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(channelId, name, importance);
            channel.setDescription("2Chat notifications");
            manager.createNotificationChannel(channel);
        }
    }

    private void showIncomingCallNotification(String caller, String callId) {
        NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager == null) return;

        createChannel(manager, CALL_CHANNEL_ID, "Incoming calls", NotificationManager.IMPORTANCE_HIGH);

        Intent intent = new Intent(this, MainActivity.class);
        intent.putExtra("twochat_incoming_caller", caller);
        intent.putExtra("twochat_incoming_call_id", callId);
        intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);

        PendingIntent pendingIntent = PendingIntent.getActivity(
                this,
                callId.hashCode(),
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        Notification.Builder builder = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
                ? new Notification.Builder(this, CALL_CHANNEL_ID)
                : new Notification.Builder(this);

        Notification notification = builder
                .setSmallIcon(android.R.drawable.sym_call_incoming)
                .setContentTitle("Incoming 2Chat call")
                .setContentText(caller + " is calling you")
                .setCategory(Notification.CATEGORY_CALL)
                .setPriority(Notification.PRIORITY_HIGH)
                .setVisibility(Notification.VISIBILITY_PUBLIC)
                .setAutoCancel(true)
                .setContentIntent(pendingIntent)
                .build();

        manager.notify(callId.hashCode(), notification);
    }

    private void showNotification(String title, String body) {
        NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager == null) return;

        createChannel(manager, MESSAGE_CHANNEL_ID, "2Chat Messages", NotificationManager.IMPORTANCE_DEFAULT);

        Intent intent = new Intent(this, MainActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);

        PendingIntent pendingIntent = PendingIntent.getActivity(
                this,
                0,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        Notification.Builder builder = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
                ? new Notification.Builder(this, MESSAGE_CHANNEL_ID)
                : new Notification.Builder(this);

        Notification notification = builder
                .setSmallIcon(android.R.drawable.ic_dialog_info)
                .setContentTitle(title)
                .setContentText(body)
                .setStyle(new Notification.BigTextStyle().bigText(body))
                .setContentIntent(pendingIntent)
                .setAutoCancel(true)
                .setPriority(Notification.PRIORITY_DEFAULT)
                .build();

        manager.notify((int) System.currentTimeMillis(), notification);
    }
}
