package com.sunusimusa.twochat;

import android.Manifest;
import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.PermissionRequest;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import java.util.ArrayList;
import java.util.List;

public class MainActivity extends Activity {

    private WebView webView;
    private ValueCallback<Uri[]> filePathCallback;

    private static final int FILE_CHOOSER_REQUEST = 1001;
    private static final int PERMISSION_REQUEST = 1002;

    private PermissionRequest pendingPermissionRequest;

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

        webView.setWebViewClient(new WebViewClient() {

            @Override
            public boolean shouldOverrideUrlLoading(
                    WebView view,
                    WebResourceRequest request
            ) {
                view.loadUrl(request.getUrl().toString());
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

        webView.loadUrl(
                "https://twochat-vg3s.onrender.com"
        );
    }

    private void showMessage(String message) {
        Toast.makeText(
                this,
                message,
                Toast.LENGTH_LONG
        ).show();
    }

    private void handleWebPermission(PermissionRequest request) {

        if (isFinishing() || isDestroyed()) {
            request.deny();
            return;
        }

        Uri origin = request.getOrigin();

        if (origin == null ||
                !"https".equals(origin.getScheme()) ||
                !"twochat-vg3s.onrender.com".equals(origin.getHost())) {

            showMessage("BLOCKED: Untrusted website origin");
            request.deny();
            return;
        }

        showMessage("TEST 1: WebView requested permission");

        if (pendingPermissionRequest != null) {
            showMessage("Another permission request is pending");
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
            showMessage("ERROR: No supported capture resource");
            request.deny();
            return;
        }

        if (androidPermissions.isEmpty()) {

            showMessage("TEST 2: Android permission already granted");

            grantWebPermission(request, allowedResources);

            return;
        }

        pendingPermissionRequest = request;

        showMessage("TEST 2: Requesting Android permission");

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

            showMessage("TEST 3: Permission grant sent to WebView");

        } catch (Exception e) {

            showMessage(
                    "ERROR granting WebView permission: " +
                    e.getClass().getSimpleName()
            );

        }
    }

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

        if (requestCode != PERMISSION_REQUEST) {
            return;
        }

        PermissionRequest request = pendingPermissionRequest;

        pendingPermissionRequest = null;

        if (request == null) {
            showMessage("ERROR: Permission request no longer exists");
            return;
        }

        if (permissions == null || grantResults == null) {
            request.deny();
            showMessage("ERROR: Android returned no permission result");
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

            showMessage("TEST 2: Android permission granted");

            grantWebPermission(request, resourcesToGrant);

        } else {

            showMessage("ERROR: Android permission denied");

            request.deny();
        }
    }

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

    @Override
    public void onBackPressed() {

        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }

    @Override
    protected void onDestroy() {

        if (pendingPermissionRequest != null) {
            pendingPermissionRequest.deny();
            pendingPermissionRequest = null;
        }

        if (filePathCallback != null) {
            filePathCallback.onReceiveValue(null);
            filePathCallback = null;
        }

        if (webView != null) {
            webView.stopLoading();
            webView.destroy();
            webView = null;
        }

        super.onDestroy();
    }
            }
                                                                
