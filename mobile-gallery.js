/* ========================================
   TREND - Mobile Gallery
   Horizontal scroll gallery for mobile
   ======================================== */

(function () {
    'use strict';

    function initMobileGallery() {
        const galleryImages = window.imagesConfig?.gallery || [];
        const container = document.querySelector('.gallery-scroll-container');

        if (!container || galleryImages.length === 0) {
            console.error('Gallery container not found or no images available');
            return;
        }

        // Clear container
        container.innerHTML = '';

        // Create gallery items
        galleryImages.forEach((imageSrc, index) => {
            const item = document.createElement('div');
            item.className = 'gallery-item';

            const img = document.createElement('img');
            img.src = imageSrc;
            img.alt = `Gallery image ${index + 1}`;
            img.loading = index === 0 ? 'eager' : 'lazy'; // Load first image immediately

            item.appendChild(img);
            container.appendChild(item);
        });

        console.log(`Mobile gallery initialized with ${galleryImages.length} images`);
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initMobileGallery);
    } else {
        initMobileGallery();
    }
})();
