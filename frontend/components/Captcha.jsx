'use client';

import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { useTheme } from '../context/ThemeContext';
import { AlertCircle } from 'lucide-react';

const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '';

const Captcha = forwardRef(function Captcha(
  { onVerify, onExpired, onError, className = '' },
  ref
) {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);
  const renderedRef = useRef(false);
  const [loadError, setLoadError] = useState(false);
  const { isDark } = useTheme();

  // Stable references for callbacks to prevent keystroke re-renders from cancelling the async mount
  const onVerifyRef = useRef(onVerify);
  const onExpiredRef = useRef(onExpired);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onVerifyRef.current = onVerify;
  }, [onVerify]);

  useEffect(() => {
    onExpiredRef.current = onExpired;
  }, [onExpired]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  // Expose imperative reset method to parent forms
  useImperativeHandle(ref, () => ({
    reset: () => {
      if (typeof window !== 'undefined' && window.grecaptcha && widgetIdRef.current !== null) {
        try {
          window.grecaptcha.reset(widgetIdRef.current);
          onExpiredRef.current?.();
        } catch (e) {
          console.warn('reCAPTCHA reset notice:', e);
        }
      }
    },
  }));

  useEffect(() => {
    if (!RECAPTCHA_SITE_KEY || typeof window === 'undefined') return;

    let cancelled = false;

    const tryRender = () => {
      if (cancelled || !containerRef.current || renderedRef.current) return;
      if (!window.grecaptcha || typeof window.grecaptcha.render !== 'function') return;

      try {
        // Prevent duplicate widget rendering if already mounted
        if (containerRef.current.hasChildNodes()) {
          renderedRef.current = true;
          return;
        }

        widgetIdRef.current = window.grecaptcha.render(containerRef.current, {
          sitekey: RECAPTCHA_SITE_KEY,
          theme: isDark ? 'dark' : 'light',
          callback: (token) => {
            if (!cancelled) onVerifyRef.current?.(token);
          },
          'expired-callback': () => {
            if (!cancelled) onExpiredRef.current?.();
          },
          'error-callback': () => {
            if (!cancelled) onErrorRef.current?.('CAPTCHA error, please try again.');
          },
        });
        renderedRef.current = true;
      } catch (err) {
        const msg = String(err?.message || '');
        if (msg.includes('already been rendered') || msg.includes('has already')) {
          renderedRef.current = true;
        } else {
          console.warn('reCAPTCHA render notice:', err);
        }
      }
    };

    // Ensure Google script is present
    const scriptId = 'google-recaptcha-v2-script';
    let script = document.getElementById(scriptId);

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://www.google.com/recaptcha/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      script.onerror = () => {
        if (!cancelled) setLoadError(true);
      };
      document.head.appendChild(script);
    }

    // Try immediately if already available
    if (window.grecaptcha && typeof window.grecaptcha.render === 'function') {
      tryRender();
    } else if (window.grecaptcha && typeof window.grecaptcha.ready === 'function') {
      window.grecaptcha.ready(tryRender);
    }

    // Polling retry: checks every 100ms for up to 50 attempts (5 seconds)
    // Ensures rendering completes even during fast keystroke re-renders in the parent form
    let attempts = 0;
    const interval = setInterval(() => {
      if (cancelled) {
        clearInterval(interval);
        return;
      }

      attempts++;
      if (window.grecaptcha && typeof window.grecaptcha.render === 'function') {
        tryRender();
      }

      if (renderedRef.current) {
        clearInterval(interval);
      } else if (attempts >= 50) {
        clearInterval(interval);
        if (!renderedRef.current && !containerRef.current?.hasChildNodes()) {
          setLoadError(true);
        }
      }
    }, 100);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [isDark]);

  if (!RECAPTCHA_SITE_KEY) {
    return null;
  }

  return (
    <div className={`my-3.5 flex flex-col items-center sm:items-start w-full ${className}`}>
      <div
        ref={containerRef}
        className="min-h-[78px] min-w-[304px] max-w-full origin-top-left scale-[0.92] sm:scale-100 transition-transform"
      />
      {loadError && !renderedRef.current && (
        <div className="mt-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-2.5 flex items-start gap-2 w-full">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
          <div className="space-y-1">
            <p className="font-medium">reCAPTCHA could not be loaded.</p>
            <p className="text-[11px] text-amber-700 leading-relaxed">
              If you are using Opera Private mode, Brave Shields, or an Ad Blocker, please pause protection for this page to verify.
            </p>
          </div>
        </div>
      )}
    </div>
  );
});

export default Captcha;
