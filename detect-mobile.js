/* ========================================
   TREND - Mobile Device Detection
   Redirects mobile users to mobile.html
   ======================================== */

(function () {
    'use strict';

    // Check if we're already on mobile.html to prevent redirect loops
    if (window.location.pathname.includes('mobile.html')) {
        return;
    }

    function isMobileDevice() {
        // Check user agent
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;

        // Check screen width (tablets and phones)
        const screenWidth = window.innerWidth || screen.width;
        const isMobileWidth = screenWidth <= 768;

        // Check if touch device
        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

        return mobileRegex.test(userAgent) || (isMobileWidth && isTouchDevice);
    }

    if (isMobileDevice()) {
        // Preserve language preference in URL
        const currentLang = localStorage.getItem('trendLang');
        const redirectUrl = 'mobile.html' + (currentLang ? '?lang=' + currentLang : '');

        console.log('Mobile device detected, redirecting to:', redirectUrl);
        window.location.href = redirectUrl;
    }
})();
