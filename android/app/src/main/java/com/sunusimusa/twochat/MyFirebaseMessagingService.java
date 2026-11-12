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

    private static final String CHANNEL_ID = "2chat_messages";

    @Override
    public void onNewToken(String token) {
        super.onNewToken(token);

        android.util.Log.d(
                "2ChatFCM",
                "FCM token refreshed."
        );

        // We will securely send this token to the backend later.
    }

    @Override
    public void onMessageReceived(RemoteMessage remoteMessage) {
        super.onMessageReceived(remoteMessage);

        String title = "2Chat";
        String body = "You have a new notification.";

        if (remoteMessage.getNotification() != null) {

            if (remoteMessage.getNotification().getTitle() != null) {
                title = remoteMessage.getNotification().getTitle();
            }

            if (remoteMessage.getNotification().getBody() != null) {
                body = remoteMessage.getNotification().getBody();
            }
        }

        if (remoteMessage.getData().containsKey("title")) {
            title = remoteMessage.getData().get("title");
        }

        if (remoteMessage.getData().containsKey("body")) {
            body = remoteMessage.getData().get("body");
        }

        showNotification(title, body);
    }

    private void showNotification(String title, String body) {

        NotificationManager manager =
                (NotificationManager) getSystemService(
                        Context.NOTIFICATION_SERVICE
                );

        if (manager == null) {
            return;
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {

            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "2Chat Messages",
                    NotificationManager.IMPORTANCE_DEFAULT
            );

            channel.setDescription(
                    "Private messages, group messages and announcements"
            );

            manager.createNotificationChannel(channel);
        }

        Intent intent = new Intent(this, MainActivity.class);

        intent.addFlags(
                Intent.FLAG_ACTIVITY_CLEAR_TOP |
                Intent.FLAG_ACTIVITY_SINGLE_TOP
        );

        PendingIntent pendingIntent = PendingIntent.getActivity(
                this,
                0,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT |
                PendingIntent.FLAG_IMMUTABLE
        );

        Notification.Builder builder;

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            builder = new Notification.Builder(this, CHANNEL_ID);
        } else {
            builder = new Notification.Builder(this);
        }

        Notification notification = builder
                .setSmallIcon(android.R.drawable.ic_dialog_info)
                .setContentTitle(title)
                .setContentText(body)
                .setStyle(new Notification.BigTextStyle().bigText(body))
                .setContentIntent(pendingIntent)
                .setAutoCancel(true)
                .setPriority(Notification.PRIORITY_DEFAULT)
                .build();

        manager.notify(
                (int) System.currentTimeMillis(),
                notification
        );
    }
    }
                  
