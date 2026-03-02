/* ========================================
   TREND - Content Loader
   Loads content.json and applies translations
   ======================================== */

(function () {
    let contentData = null;

    function loadContent() {
        // Read from window.contentConfig instead of fetching
        // This avoids CORS issues when opening files locally
        if (window.contentConfig) {
            contentData = window.contentConfig;
            applyContent();

            document.addEventListener('languageChanged', function (event) {
                applyContent(event.detail.lang);
            });
        } else {
            console.error('window.contentConfig not found. Make sure it is defined in index.html');
        }
    }

    function applyContent(lang) {
        if (!contentData) return;

        const currentLang = lang || localStorage.getItem('trendLang') || 'en';

        applyNavigation(currentLang);
        applyHero(currentLang);
        applyGallery(currentLang);
        applyAbout(currentLang);
        applyServicesSection(currentLang);
        applyPricesSection(currentLang);
        applyReviewsSection(currentLang);
        applyContactSection(currentLang);
        applyFooter(currentLang);
    }

    function applyNavigation(lang) {
        const nav = contentData.navigation;

        document.querySelectorAll('.nav-links a').forEach(link => {
            const href = link.getAttribute('href').replace('#', '');
            if (nav[href]) {
                link.setAttribute('data-en', nav[href].en);
                link.setAttribute('data-bg', nav[href].bg);
            }
        });
    }

    function applyHero(lang) {
        const hero = contentData.hero;

        const subtitle = document.querySelector('.hero-subtitle');
        if (subtitle) {
            subtitle.setAttribute('data-en', hero.subtitle.en);
            subtitle.setAttribute('data-bg', hero.subtitle.bg);
        }

        const tagline = document.querySelector('.hero-tagline');
        if (tagline) {
            tagline.setAttribute('data-en', hero.tagline.en);
            tagline.setAttribute('data-bg', hero.tagline.bg);
        }

        const ctaBtn = document.querySelector('.hero-content .btn-primary');
        if (ctaBtn) {
            ctaBtn.setAttribute('data-en', hero.cta_button.en);
            ctaBtn.setAttribute('data-bg', hero.cta_button.bg);
        }
    }

    function applyGallery(lang) {
        const gallery = contentData.gallery;

        const sectionTag = document.querySelector('#gallery .section-tag');
        if (sectionTag) {
            sectionTag.setAttribute('data-en', gallery.section_tag.en);
            sectionTag.setAttribute('data-bg', gallery.section_tag.bg);
        }

        const sectionTitle = document.querySelector('#gallery .section-title');
        if (sectionTitle) {
            sectionTitle.setAttribute('data-en', gallery.section_title.en);
            sectionTitle.setAttribute('data-bg', gallery.section_title.bg);
        }

        const instructions = document.querySelector('.slider-instructions');
        if (instructions) {
            instructions.setAttribute('data-en', gallery.instructions.en);
            instructions.setAttribute('data-bg', gallery.instructions.bg);
        }

        const instagramText = document.querySelector('.gallery-instagram p');
        if (instagramText) {
            instagramText.setAttribute('data-en', gallery.instagram_text.en);
            instagramText.setAttribute('data-bg', gallery.instagram_text.bg);
        }
    }

    function applyAbout(lang) {
        const about = contentData.about;

        const sectionTag = document.querySelector('#about .section-tag');
        if (sectionTag) {
            sectionTag.setAttribute('data-en', about.section_tag.en);
            sectionTag.setAttribute('data-bg', about.section_tag.bg);
        }

        const paragraphs = document.querySelectorAll('#about .about-text p');
        if (paragraphs[0]) {
            paragraphs[0].setAttribute('data-en', about.paragraph_1.en);
            paragraphs[0].setAttribute('data-bg', about.paragraph_1.bg);
        }
        if (paragraphs[1]) {
            paragraphs[1].setAttribute('data-en', about.paragraph_2.en);
            paragraphs[1].setAttribute('data-bg', about.paragraph_2.bg);
        }

        const features = document.querySelectorAll('#about .feature h3');
        if (features[0]) {
            features[0].setAttribute('data-en', about.features.expert_stylists.en);
            features[0].setAttribute('data-bg', about.features.expert_stylists.bg);
        }
        if (features[1]) {
            features[1].setAttribute('data-en', about.features.premium_products.en);
            features[1].setAttribute('data-bg', about.features.premium_products.bg);
        }
        if (features[2]) {
            features[2].setAttribute('data-en', about.features.luxurious_atmosphere.en);
            features[2].setAttribute('data-bg', about.features.luxurious_atmosphere.bg);
        }
    }

    function applyServicesSection(lang) {
        const services = contentData.services_section;

        const sectionTag = document.querySelector('#services .section-tag');
        if (sectionTag) {
            sectionTag.setAttribute('data-en', services.section_tag.en);
            sectionTag.setAttribute('data-bg', services.section_tag.bg);
        }

        const sectionTitle = document.querySelector('#services .section-title');
        if (sectionTitle) {
            sectionTitle.setAttribute('data-en', services.section_title.en);
            sectionTitle.setAttribute('data-bg', services.section_title.bg);
        }
    }

    function applyPricesSection(lang) {
        const prices = contentData.prices_section;

        const sectionTag = document.querySelector('#prices .section-tag');
        if (sectionTag) {
            sectionTag.setAttribute('data-en', prices.section_tag.en);
            sectionTag.setAttribute('data-bg', prices.section_tag.bg);
        }

        const sectionTitle = document.querySelector('#prices .section-title');
        if (sectionTitle) {
            sectionTitle.setAttribute('data-en', prices.section_title.en);
            sectionTitle.setAttribute('data-bg', prices.section_title.bg);
        }

        const ctaBtn = document.querySelector('#prices .btn-secondary span');
        if (ctaBtn) {
            ctaBtn.setAttribute('data-en', prices.cta_button.en);
            ctaBtn.setAttribute('data-bg', prices.cta_button.bg);
        }
    }

    function applyReviewsSection(lang) {
        const reviews = contentData.reviews_section;

        const sectionTag = document.querySelector('#reviews .section-tag');
        if (sectionTag) {
            sectionTag.setAttribute('data-en', reviews.section_tag.en);
            sectionTag.setAttribute('data-bg', reviews.section_tag.bg);
        }

        const sectionTitle = document.querySelector('#reviews .section-title');
        if (sectionTitle) {
            sectionTitle.setAttribute('data-en', reviews.section_title.en);
            sectionTitle.setAttribute('data-bg', reviews.section_title.bg);
        }

        const ctaBtn = document.querySelector('#reviews .btn-secondary span');
        if (ctaBtn) {
            ctaBtn.setAttribute('data-en', reviews.cta_button.en);
            ctaBtn.setAttribute('data-bg', reviews.cta_button.bg);
        }

        const note = document.querySelector('.reviews-note');
        if (note) {
            note.setAttribute('data-en', reviews.note.en);
            note.setAttribute('data-bg', reviews.note.bg);
        }
    }

    function applyContactSection(lang) {
        const contact = contentData.contact_section;

        const sectionTag = document.querySelector('#contact .section-tag');
        if (sectionTag) {
            sectionTag.setAttribute('data-en', contact.section_tag.en);
            sectionTag.setAttribute('data-bg', contact.section_tag.bg);
        }

        const sectionTitle = document.querySelector('#contact .section-title');
        if (sectionTitle) {
            sectionTitle.setAttribute('data-en', contact.section_title.en);
            sectionTitle.setAttribute('data-bg', contact.section_title.bg);
        }

        const contactItems = document.querySelectorAll('#contact .contact-item h3');
        if (contactItems[0]) {
            contactItems[0].setAttribute('data-en', contact.address_label.en);
            contactItems[0].setAttribute('data-bg', contact.address_label.bg);
        }
        if (contactItems[1]) {
            contactItems[1].setAttribute('data-en', contact.phone_label.en);
            contactItems[1].setAttribute('data-bg', contact.phone_label.bg);
        }
        if (contactItems[2]) {
            contactItems[2].setAttribute('data-en', contact.email_label.en);
            contactItems[2].setAttribute('data-bg', contact.email_label.bg);
        }
        if (contactItems[3]) {
            contactItems[3].setAttribute('data-en', contact.hours_label.en);
            contactItems[3].setAttribute('data-bg', contact.hours_label.bg);
        }

        const addressValue = document.querySelector('#contact .contact-item:nth-child(1) .contact-details p');
        if (addressValue) {
            addressValue.setAttribute('data-en', contact.address_value.en);
            addressValue.setAttribute('data-bg', contact.address_value.bg);
        }

        const hoursValue = document.querySelector('#contact .contact-item:nth-child(4) .contact-details p');
        if (hoursValue) {
            hoursValue.setAttribute('data-en', contact.hours_value.en);
            hoursValue.setAttribute('data-bg', contact.hours_value.bg);
        }

        const bookingBtn = document.querySelector('#contact .booking-btn span');
        if (bookingBtn) {
            bookingBtn.setAttribute('data-en', contact.booking_button.en);
            bookingBtn.setAttribute('data-bg', contact.booking_button.bg);
        }

        const mapLink = document.querySelector('.map-link span');
        if (mapLink) {
            mapLink.setAttribute('data-en', contact.map_link.en);
            mapLink.setAttribute('data-bg', contact.map_link.bg);
        }
    }

    function applyFooter(lang) {
        const footer = contentData.footer;

        const tagline = document.querySelector('.footer-tagline');
        if (tagline) {
            tagline.setAttribute('data-en', footer.tagline.en);
            tagline.setAttribute('data-bg', footer.tagline.bg);
        }

        const copyright = document.querySelector('.footer-copyright span');
        if (copyright) {
            copyright.setAttribute('data-en', footer.copyright.en);
            copyright.setAttribute('data-bg', footer.copyright.bg);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadContent);
    } else {
        loadContent();
    }
})();
