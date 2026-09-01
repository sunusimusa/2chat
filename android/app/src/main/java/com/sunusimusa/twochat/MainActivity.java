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

public class MainActivity extends Activity {

    private WebView webView;

    private ValueCallback<Uri[]> filePathCallback;

    private static final int FILE_CHOOSER_REQUEST = 1001;
    private static final int PERMISSION_REQUEST = 1002;

    private PermissionRequest pendingPermissionRequest;


    // =========================================================
    // ON CREATE
    // =========================================================

    @Override
    protected void onCreate(Bundle savedInstanceState) {

        super.onCreate(savedInstanceState);

        webView = new WebView(this);

        WebSettings settings = webView.getSettings();

        // JavaScript
        settings.setJavaScriptEnabled(true);

        // Local storage
        settings.setDomStorageEnabled(true);

        // File access
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);

        // Media
        settings.setMediaPlaybackRequiresUserGesture(false);

        // Zoom
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);

        // Database / storage
        settings.setDatabaseEnabled(true);


        // =====================================================
        // WEBVIEW CLIENT
        // =====================================================

        webView.setWebViewClient(
                new WebViewClient() {

                    @Override
                    public boolean shouldOverrideUrlLoading(
                            WebView view,
                            WebResourceRequest request
                    ) {

                        view.loadUrl(
                                request.getUrl().toString()
                        );

                        return true;
                    }
                }
        );


        // =====================================================
        // WEB CHROME CLIENT
        // =====================================================

        webView.setWebChromeClient(
                new WebChromeClient() {

                    // =========================================
                    // PHOTO / VIDEO FILE UPLOAD
                    // =========================================

                    @Override
                    public boolean onShowFileChooser(
                            WebView webView,
                            ValueCallback<Uri[]> callback,
                            FileChooserParams fileChooserParams
                    ) {

                        // Cancel old callback
                        if (
                                MainActivity.this.filePathCallback
                                        != null
                        ) {

                            MainActivity.this
                                    .filePathCallback
                                    .onReceiveValue(null);
                        }


                        MainActivity.this.filePathCallback =
                                callback;


                        try {

                            Intent intent =
                                    fileChooserParams
                                            .createIntent();


                            startActivityForResult(
                                    intent,
                                    FILE_CHOOSER_REQUEST
                            );

                        }

                        catch (Exception e) {

                            if (
                                    MainActivity.this
                                            .filePathCallback
                                            != null
                            ) {

                                MainActivity.this
                                        .filePathCallback
                                        .onReceiveValue(null);

                                MainActivity.this
                                        .filePathCallback = null;
                            }
                        }


                        return true;
                    }


                    // =========================================
                    // MICROPHONE / CAMERA
                    // =========================================

                    @Override
                    public void onPermissionRequest(
                            final PermissionRequest request
                    ) {

                        runOnUiThread(() -> {

                            String[] resources =
                                    request.getResources();


                            boolean needMicrophone =
                                    false;

                            boolean needCamera =
                                    false;


                            // ---------------------------------
                            // CHECK REQUESTED RESOURCES
                            // ---------------------------------

                            for (
                                    String resource :
                                    resources
                            ) {

                                if (
                                        PermissionRequest
                                                .RESOURCE_AUDIO_CAPTURE
                                                .equals(resource)
                                ) {

                                    needMicrophone = true;
                                }


                                if (
                                        PermissionRequest
                                                .RESOURCE_VIDEO_CAPTURE
                                                .equals(resource)
                                ) {

                                    needCamera = true;
                                }
                            }


                            // ---------------------------------
                            // ANDROID MICROPHONE PERMISSION
                            // ---------------------------------

                            boolean microphoneGranted =
                                    checkSelfPermission(
                                            Manifest.permission
                                                    .RECORD_AUDIO
                                    )
                                            ==
                                    PackageManager
                                            .PERMISSION_GRANTED;


                            // ---------------------------------
                            // ANDROID CAMERA PERMISSION
                            // ---------------------------------

                            boolean cameraGranted =
                                    checkSelfPermission(
                                            Manifest.permission
                                                    .CAMERA
                                    )
                                            ==
                                    PackageManager
                                            .PERMISSION_GRANTED;


                            // =================================
                            // EVERYTHING ALREADY GRANTED
                            // =================================

                            if (
                                    (!needMicrophone ||
                                            microphoneGranted)
                                    &&
                                    (!needCamera ||
                                            cameraGranted)
                            ) {

                                android.util.Log.d("2CHAT_VOICE", "GRANTING WEBVIEW RESOURCES: " + java.util.Arrays.toString(resources));
                                request.grant(resources);

                                return;
                            }


                            // =================================
                            // SAVE WEBVIEW REQUEST
                            // =================================

                            pendingPermissionRequest =
                                    request;


                            // =================================
                            // REQUEST MICROPHONE
                            // =================================

                            if (
                                    needMicrophone
                                    &&
                                    !microphoneGranted
                            ) {

                                requestPermissions(
                                        new String[]{
                                                Manifest.permission
                                                        .RECORD_AUDIO
                                        },
                                        PERMISSION_REQUEST
                                );

                                return;
                            }


                            // =================================
                            // REQUEST CAMERA
                            // =================================

                            if (
                                    needCamera
                                    &&
                                    !cameraGranted
                            ) {

                                requestPermissions(
                                        new String[]{
                                                Manifest.permission
                                                        .CAMERA
                                        },
                                        PERMISSION_REQUEST
                                );

                                return;
                            }


                            // =================================
                            // DENY IF NOTHING MATCHES
                            // =================================

                            request.deny();

                        });
                    }
                }
        );


        // =====================================================
        // SET WEBVIEW
        // =====================================================

        setContentView(webView);


        // =====================================================
        // LOAD 2CHAT
        // =====================================================

        webView.loadUrl(
                "https://twochat-vg3s.onrender.com"
        );
    }


    // =========================================================
    // ANDROID PERMISSION RESULT
    // =========================================================

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


        // ---------------------------------------------
        // WRONG REQUEST
        // ---------------------------------------------

        if (
                requestCode != PERMISSION_REQUEST
        ) {

            return;
        }


        // ---------------------------------------------
        // NO WEBVIEW REQUEST
        // ---------------------------------------------

        if (
                pendingPermissionRequest == null
        ) {

            return;
        }


        PermissionRequest request =
                pendingPermissionRequest;


        pendingPermissionRequest = null;


        // ---------------------------------------------
        // CHECK RESULT
        // ---------------------------------------------

        boolean granted = true;


        for (
                int result :
                grantResults
        ) {

            if (
                    result !=
                    PackageManager
                            .PERMISSION_GRANTED
            ) {

                granted = false;

                break;
            }
        }


        // ---------------------------------------------
        // GRANT WEBVIEW
        // ---------------------------------------------

        if (granted) {

            request.grant(
                    request.getResources()
            );

        }

        // ---------------------------------------------
        // DENY WEBVIEW
        // ---------------------------------------------

        else {

            request.deny();
        }
    }


    // =========================================================
    // FILE CHOOSER RESULT
    // =========================================================

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


        // ---------------------------------------------
        // NOT OUR REQUEST
        // ---------------------------------------------

        if (
                requestCode != FILE_CHOOSER_REQUEST
        ) {

            return;
        }


        // ---------------------------------------------
        // NO CALLBACK
        // ---------------------------------------------

        if (
                filePathCallback == null
        ) {

            return;
        }


        Uri[] results = null;


        // =================================================
        // FILE SELECTED
        // =================================================

        if (
                resultCode == RESULT_OK
                &&
                data != null
        ) {

            // ---------------------------------------------
            // SINGLE FILE
            // ---------------------------------------------

            String dataString =
                    data.getDataString();


            if (
                    dataString != null
            ) {

                results =
                        new Uri[]{
                                Uri.parse(dataString)
                        };
            }


            // ---------------------------------------------
            // MULTIPLE FILES
            // ---------------------------------------------

            else if (
                    data.getClipData() != null
            ) {

                int count =
                        data.getClipData()
                                .getItemCount();


                results =
                        new Uri[count];


                for (
                        int i = 0;
                        i < count;
                        i++
                ) {

                    results[i] =
                            data.getClipData()
                                    .getItemAt(i)
                                    .getUri();
                }
            }
        }


        // =================================================
        // RETURN FILES TO WEBVIEW
        // =================================================

        filePathCallback
                .onReceiveValue(results);


        filePathCallback = null;
    }


    // =========================================================
    // BACK BUTTON
    // =========================================================

    @Override
    public void onBackPressed() {

        if (
                webView != null
                &&
                webView.canGoBack()
        ) {

            webView.goBack();

        }

        else {

            super.onBackPressed();
        }
    }


    // =========================================================
    // CLEANUP
    // =========================================================

    @Override
    protected void onDestroy() {

        if (
                webView != null
        ) {

            webView.stopLoading();

            webView.destroy();

            webView = null;
        }


        super.onDestroy();
    }
}
