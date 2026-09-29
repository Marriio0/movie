package com.netfarjo.app;

import android.os.Bundle;
import android.webkit.CookieManager;
import android.webkit.WebSettings;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        try {
            WebView webView = getBridge().getWebView();
            if (webView != null) {
                WebSettings settings = webView.getSettings();

                // Enable HTML5 video playback, DOM storage, and hardware features
                settings.setMediaPlaybackRequiresUserGesture(false);
                settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
                settings.setDomStorageEnabled(true);
                settings.setDatabaseEnabled(true);
                settings.setJavaScriptCanOpenWindowsAutomatically(true);

                // Crucial for video streaming iframes: accept third-party cookies for video CDNs
                CookieManager cookieManager = CookieManager.getInstance();
                cookieManager.setAcceptCookie(true);
                cookieManager.setAcceptThirdPartyCookies(webView, true);

                // Stream providers (VidLink, VidSrc, etc.) often block Android WebViews with '; wv' in User-Agent.
                // Replace with clean mobile Chrome User-Agent so video hosts treat it as standard browser.
                String defaultUa = settings.getUserAgentString();
                if (defaultUa != null) {
                    String cleanUa = defaultUa.replace("; wv", "")
                                              .replace(";  wv", "")
                                              .replace("Version/4.0 ", "");
                    settings.setUserAgentString(cleanUa);
                }
            }
        } catch (Exception ignored) {
            // Safe fallback
        }
    }
}

