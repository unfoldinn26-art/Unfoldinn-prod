'use client';

import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { useTheme } from '../context/ThemeContext';

const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '';

const Captcha = forwardRef(function Captcha(
  { onVerify, onExpired, onError, className = '' },
  ref
) {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);
  const { isDark } = useTheme();

  // Expose reset method to parent forms
  useImperativeHandle(ref, () => ({
    reset: () => {
      if (typeof window !== 'undefined' && window.grecaptcha && widgetIdRef.current !== null) {
        try {
          window.grecaptcha.reset(widgetIdRef.current);
          onExpired?.();
        } catch (e) {
          console.warn('reCAPTCHA reset warning:', e);
        }
      }
    },
  }));

  useEffect(() => {
    if (!RECAPTCHA_SITE_KEY || typeof window === 'undefined') return;

    let isMounted = true;

    const renderWidget = () => {
      if (!isMounted || !containerRef.current || !window.grecaptcha?.render) return;

      try {
        // Clear container if previously rendered
        containerRef.current.innerHTML = '';

        widgetIdRef.current = window.grecaptcha.render(containerRef.current, {
          sitekey: RECAPTCHA_SITE_KEY,
          theme: isDark ? 'dark' : 'light',
          callback: (token) => {
            if (isMounted) onVerify?.(token);
          },
          'expired-callback': () => {
            if (isMounted) onExpired?.();
          },
          'error-callback': () => {
            if (isMounted) onError?.('CAPTCHA error, please try again.');
          },
        });
      } catch (err) {
        console.warn('reCAPTCHA render notice:', err);
      }
    };

    if (window.grecaptcha?.render) {
      renderWidget();
    } else {
      // Check if script is already added
      const scriptId = 'google-recaptcha-v2-script';
      let script = document.getElementById(scriptId);

      if (!script) {
        script = document.createElement('script');
        script.id = scriptId;
        script.src = 'https://www.google.com/recaptcha/api.js?onload=onGoogleRecaptchaLoad&render=explicit';
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
      }

      window.onGoogleRecaptchaLoad = () => {
        renderWidget();
      };

      // Also listen to script onload as fallback
      script.addEventListener('load', () => {
        if (window.grecaptcha?.ready) {
          window.grecaptcha.ready(renderWidget);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [isDark, onVerify, onExpired, onError]);

  if (!RECAPTCHA_SITE_KEY) {
    return null;
  }

  return (
    <div className={`my-4 flex justify-center sm:justify-start w-full overflow-hidden ${className}`}>
      <div
        ref={containerRef}
        className="min-h-[78px] min-w-[304px] max-w-full origin-top-left scale-[0.88] sm:scale-100 transition-transform"
      />
    </div>
  );
});

export default Captcha;
