package com.sunusimusa.twochat;

import android.Manifest;
import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.media.MediaRecorder;
import android.net.Uri;
import android.os.Bundle;
import android.os.Build;
import android.util.Base64;
import android.webkit.JavascriptInterface;
import android.webkit.PermissionRequest;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.vwebkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;
import com.google.firebase.messaging.FirebaseMessaging;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

public class MainActivity extends Activity {

    private WebView webView;
    private ValueCallback<Uri[]> filePathCallback;

    private static final int FILE_CHOOSER_REQUEST = 1001;
    private static final int PERMISSION_REQUEST = 1002;
    private static final int NATIVE_AUDIO_PERMISSION_REQUEST = 1003;
    private static final int NOTIFICATION_PERMISSION_REQUEST = 1004;
    
    private static final String APP_URL =
            "https://twochat-vg3s.onrender.com";

    private PermissionRequest pendingPermissionRequest;

    private MediaRecorder mediaRecorder;
    private File recordingFile;

    private boolean isNativeRecording = false;
    private boolean pendingNativeStart = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        webView = new WebView(this);

        WebSettings settings = webView.getSettings();

        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setDatabaseEnabled(true);

        webView.addJavascriptInterface(
                new NativeVoiceBridge(),
                "AndroidVoiceRecorder"
        );

        webView.setWebViewClient(new WebViewClient() {

            @Override
            public boolean shouldOverrideUrlLoading(
                    WebView view,
                    WebResourceRequest request
            ) {
                Uri uri = request.getUrl();

                if ("https".equals(uri.getScheme())
                        && APP_URL_HOST.equals(uri.getHost())) {

                    return false;
                }

                return true;
            }
        });

        webView.setWebChromeClient(new WebChromeClient() {

            @Override
            public boolean onShowFileChooser(
                    WebView view,
                    ValueCallback<Uri[]> callback,
                    FileChooserParams params
            ) {
                if (filePathCallback != null) {
                    filePathCallback.onReceiveValue(null);
                }

                filePathCallback = callback;

                try {
                    Intent intent = params.createIntent();

                    startActivityForResult(
                            intent,
                            FILE_CHOOSER_REQUEST
                    );

                } catch (Exception e) {
                    filePathCallback.onReceiveValue(null);
                    filePathCallback = null;
                }

                return true;
            }

            @Override
            public void onPermissionRequest(
                    final PermissionRequest request
            ) {
                runOnUiThread(() -> handleWebPermission(request));
            }

            @Override
            public void onPermissionRequestCanceled(
                    PermissionRequest request
            ) {
                if (pendingPermissionRequest == request) {
                    pendingPermissionRequest = null;
                }
            }
        });

        setContentView(webView);
        requestNotificationPermission();

        FirebaseMessaging.getInstance().getToken()
        .addOnCompleteListener(task -> {
            if (!task.isSuccessful()) {
                android.util.Log.e(
                        "2ChatFCM",
                        "Failed to get FCM token",
                        task.getException()
                );
                return;
            }

            String token = task.getResult();

            android.util.Log.d(
                    "2ChatFCM",
                    "FCM Token: " + token
            );

            webView.evaluateJavascript(
                    "window.on2ChatFCMToken && window.on2ChatFCMToken('" +
                    token +
                    "');",
                    null
            );
        });

webView.loadUrl(APP_URL + "/home.html");
}

    private static final String APP_URL_HOST =
            "twochat-vg3s.onrender.com";

    private void requestNotificationPermission() {

    if (Build.VERSION.SDK_INT >= 33) {

        if (checkSelfPermission(
                Manifest.permission.POST_NOTIFICATIONS
        ) != PackageManager.PERMISSION_GRANTED) {

            requestPermissions(
                    new String[]{
                            Manifest.permission.POST_NOTIFICATIONS
                    },
                    NOTIFICATION_PERMISSION_REQUEST
            );
        }
    }
    }

    private void showMessage(String message) {
        Toast.makeText(
                this,
                message,
                Toast.LENGTH_LONG
        ).show();
    }

    // ==========================================
    // WEBVIEW PERMISSIONS
    // ==========================================

    private void handleWebPermission(PermissionRequest request) {

        if (isFinishing() || isDestroyed()) {
            request.deny();
            return;
        }

        Uri origin = request.getOrigin();

        if (origin == null
                || !"https".equals(origin.getScheme())
                || !APP_URL_HOST.equals(origin.getHost())) {

            request.deny();
            return;
        }

        if (pendingPermissionRequest != null) {
            request.deny();
            return;
        }

        List<String> androidPermissions = new ArrayList<>();
        List<String> allowedResources = new ArrayList<>();

        for (String resource : request.getResources()) {

            if (PermissionRequest.RESOURCE_AUDIO_CAPTURE.equals(resource)) {

                allowedResources.add(resource);

                if (checkSelfPermission(
                        Manifest.permission.RECORD_AUDIO
                ) != PackageManager.PERMISSION_GRANTED) {

                    androidPermissions.add(
                            Manifest.permission.RECORD_AUDIO
                    );
                }

            } else if (
                    PermissionRequest.RESOURCE_VIDEO_CAPTURE.equals(resource)
            ) {

                allowedResources.add(resource);

                if (checkSelfPermission(
                        Manifest.permission.CAMERA
                ) != PackageManager.PERMISSION_GRANTED) {

                    androidPermissions.add(
                            Manifest.permission.CAMERA
                    );
                }
            }
        }

        if (allowedResources.isEmpty()) {
            request.deny();
            return;
        }

        if (androidPermissions.isEmpty()) {
            grantWebPermission(request, allowedResources);
            return;
        }

        pendingPermissionRequest = request;

        requestPermissions(
                androidPermissions.toArray(new String[0]),
                PERMISSION_REQUEST
        );
    }

    private void grantWebPermission(
            PermissionRequest request,
            List<String> resources
    ) {
        try {
            request.grant(resources.toArray(new String[0]));
        } catch (Exception e) {
            request.deny();
        }
    }

    // ==========================================
    // NATIVE VOICE RECORDER
    // ==========================================

    private class NativeVoiceBridge {

        @JavascriptInterface
        public void startRecording() {

            runOnUiThread(() -> startNativeRecording());
        }

        @JavascriptInterface
        public void stopRecording() {

            runOnUiThread(() -> stopNativeRecording());
        }

        @JavascriptInterface
        public void cancelRecording() {

            runOnUiThread(() -> cancelNativeRecording());
        }
    }

    private void startNativeRecording() {

        if (isFinishing() || isDestroyed()) {
            return;
        }

        if (isNativeRecording) {
            return;
        }

        if (checkSelfPermission(
                Manifest.permission.RECORD_AUDIO
        ) != PackageManager.PERMISSION_GRANTED) {

            pendingNativeStart = true;

            requestPermissions(
                    new String[]{
                            Manifest.permission.RECORD_AUDIO
                    },
                    NATIVE_AUDIO_PERMISSION_REQUEST
            );

            return;
        }

        try {

            recordingFile = File.createTempFile(
                    "2chat_voice_",
                    ".m4a",
                    getCacheDir()
            );

            mediaRecorder = new MediaRecorder();

            mediaRecorder.setAudioSource(
                    MediaRecorder.AudioSource.MIC
            );

            mediaRecorder.setOutputFormat(
                    MediaRecorder.OutputFormat.MPEG_4
            );

            mediaRecorder.setAudioEncoder(
                    MediaRecorder.AudioEncoder.AAC
            );

            mediaRecorder.setAudioEncodingBitRate(64000);
            mediaRecorder.setAudioSamplingRate(44100);

            mediaRecorder.setOutputFile(
                    recordingFile.getAbsolutePath()
            );

            mediaRecorder.prepare();
            mediaRecorder.start();

            isNativeRecording = true;

            callJavascript(
                    "window.onNativeVoiceRecordingStarted && " +
                    "window.onNativeVoiceRecordingStarted();"
            );

        } catch (Exception e) {

            releaseRecorder();

            sendNativeError(
                    "Could not start native recording: " +
                    e.getMessage()
            );
        }
    }

    private void stopNativeRecording() {

        if (!isNativeRecording || mediaRecorder == null) {
            return;
        }

        try {

            mediaRecorder.stop();

            isNativeRecording = false;

            mediaRecorder.reset();
            mediaRecorder.release();
            mediaRecorder = null;

            if (recordingFile == null || !recordingFile.exists()) {
                sendNativeError("Recording file was not created.");
                return;
            }

            new Thread(() -> {

                try {

                    byte[] audioBytes = new byte[
                            (int) recordingFile.length()
                    ];

                    FileInputStream input =
                            new FileInputStream(recordingFile);

                    int offset = 0;
                    int count;

                    while (offset < audioBytes.length
                            && (count = input.read(
                            audioBytes,
                            offset,
                            audioBytes.length - offset
                    )) != -1) {

                        offset += count;
                    }

                    input.close();

                    if (offset == 0) {
                        throw new IOException("Empty recording.");
                    }

                    String base64Audio = Base64.encodeToString(
                            audioBytes,
                            Base64.NO_WRAP
                    );

                    runOnUiThread(() -> {

                        callJavascript(
                                "window.onNativeVoiceRecordingStopped && " +
                                "window.onNativeVoiceRecordingStopped('" +
                                base64Audio +
                                "');"
                        );

                        deleteRecordingFile();
                    });

                } catch (Exception e) {

                    runOnUiThread(() -> {

                        sendNativeError(
                                "Could not read recording: " +
                                e.getMessage()
                        );

                        deleteRecordingFile();
                    });
                }

            }).start();

        } catch (RuntimeException e) {

            releaseRecorder();

            deleteRecordingFile();

            sendNativeError(
                    "Recording could not be stopped: " +
                    e.getMessage()
            );
        }
    }

    private void cancelNativeRecording() {

        pendingNativeStart = false;

        if (isNativeRecording && mediaRecorder != null) {

            try {
                mediaRecorder.stop();
            } catch (Exception ignored) {
            }
        }

        releaseRecorder();
        deleteRecordingFile();

        isNativeRecording = false;

        callJavascript(
                "window.onNativeVoiceRecordingCancelled && " +
                "window.onNativeVoiceRecordingCancelled();"
        );
    }

    private void releaseRecorder() {

        if (mediaRecorder != null) {

            try {
                mediaRecorder.reset();
            } catch (Exception ignored) {
            }

            try {
                mediaRecorder.release();
            } catch (Exception ignored) {
            }

            mediaRecorder = null;
        }

        isNativeRecording = false;
    }

    private void deleteRecordingFile() {

        if (recordingFile != null) {

            if (recordingFile.exists()) {
                recordingFile.delete();
            }

            recordingFile = null;
        }
    }

    private void sendNativeError(String message) {

        String safeMessage = message == null
                ? "Unknown recording error"
                : message.replace("\\", "\\\\")
                         .replace("'", "\\'")
                         .replace("\n", " ");

        callJavascript(
                "window.onNativeVoiceRecordingError && " +
                "window.onNativeVoiceRecordingError('" +
                safeMessage +
                "');"
        );
    }

    private void callJavascript(String javascript) {

        runOnUiThread(() -> {

            if (webView != null && !isFinishing()) {
                webView.evaluateJavascript(
                        javascript,
                        null
                );
            }
        });
    }

    // ==========================================
    // ANDROID PERMISSION RESULT
    // ==========================================

    @Override
    public void onRequestPermissionsResult(
            int requestCode,
            String[] permissions,
            int[] grantResults
    ) {
        super.onRequestPermissionsResult(
                requestCode,
                permissions,
                grantResults
        );

        if (requestCode == NATIVE_AUDIO_PERMISSION_REQUEST) {

            boolean granted =
                    checkSelfPermission(
                            Manifest.permission.RECORD_AUDIO
                    ) == PackageManager.PERMISSION_GRANTED;

            if (pendingNativeStart && granted) {

                pendingNativeStart = false;
                startNativeRecording();

            } else {

                pendingNativeStart = false;

                sendNativeError(
                        "Android microphone permission was denied."
                );
            }

            return;
        }

        if (requestCode != PERMISSION_REQUEST) {
            return;
        }

        PermissionRequest request = pendingPermissionRequest;

        pendingPermissionRequest = null;

        if (request == null) {
            return;
        }

        if (permissions == null || grantResults == null) {
            request.deny();
            return;
        }

        List<String> resourcesToGrant = new ArrayList<>();

        for (String resource : request.getResources()) {

            if (PermissionRequest.RESOURCE_AUDIO_CAPTURE.equals(resource)
                    && checkSelfPermission(
                    Manifest.permission.RECORD_AUDIO
            ) == PackageManager.PERMISSION_GRANTED) {

                resourcesToGrant.add(resource);

            } else if (
                    PermissionRequest.RESOURCE_VIDEO_CAPTURE.equals(resource)
                            && checkSelfPermission(
                            Manifest.permission.CAMERA
                    ) == PackageManager.PERMISSION_GRANTED) {

                resourcesToGrant.add(resource);
            }
        }

        if (!resourcesToGrant.isEmpty()) {
            grantWebPermission(request, resourcesToGrant);
        } else {
            request.deny();
        }
    }

    // ==========================================
    // FILE CHOOSER
    // ==========================================

    @Override
    protected void onActivityResult(
            int requestCode,
            int resultCode,
            Intent data
    ) {
        super.onActivityResult(
                requestCode,
                resultCode,
                data
        );

        if (requestCode != FILE_CHOOSER_REQUEST) {
            return;
        }

        if (filePathCallback == null) {
            return;
        }

        Uri[] results = null;

        if (resultCode == RESULT_OK && data != null) {

            if (data.getDataString() != null) {

                results = new Uri[]{
                        Uri.parse(data.getDataString())
                };

            } else if (data.getClipData() != null) {

                int count = data.getClipData().getItemCount();

                results = new Uri[count];

                for (int i = 0; i < count; i++) {

                    results[i] = data.getClipData()
                            .getItemAt(i)
                            .getUri();
                }
            }
        }

        filePathCallback.onReceiveValue(results);
        filePathCallback = null;
    }

    // ==========================================
    // BACK BUTTON
    // ==========================================

    @Override
    public void onBackPressed() {

        if (isNativeRecording) {
            cancelNativeRecording();
        }

        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }

    // ==========================================
    // DESTROY
    // ==========================================

    @Override
    protected void onDestroy() {

        pendingNativeStart = false;

        if (pendingPermissionRequest != null) {
            pendingPermissionRequest.deny();
            pendingPermissionRequest = null;
        }

        if (filePathCallback != null) {
            filePathCallback.onReceiveValue(null);
            filePathCallback = null;
        }

        releaseRecorder();
        deleteRecordingFile();

        if (webView != null) {

            webView.removeJavascriptInterface(
                    "AndroidVoiceRecorder"
            );

            webView.stopLoading();
            webView.destroy();
            webView = null;
        }

        super.onDestroy();
    }
}
