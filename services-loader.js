/* ========================================
   Services Loader - Loads services from JSON
   ======================================== */

(function() {
    'use strict';

    function formatPrice(priceEur) {
        return priceEur.toFixed(2) + ' €';
    }

    function loadServices() {
        var data = window.servicesConfig;
        if (data) {
            renderServices(data);
            renderPrices(data);
        } else {
            console.error('Services config not found. Make sure servicesConfig is defined in HTML.');
        }
    }

    function getCurrentLang() {
        return localStorage.getItem('trendLang') || 'en';
    }

    function renderServices(data) {
        const servicesSection = document.querySelector('#services .services-grid');
        if (!servicesSection) return;

        const lang = getCurrentLang();
        const services = [
            {
                icon: '✂',
                name: data.services.categories[0].name[lang],
                description: lang === 'en' 
                    ? 'Precision cuts and expert styling tailored to your face shape and personal style.'
                    : 'Прецизни подстригвания и експертно стилизиране, съобразени с формата на лицето и личния ви стил.'
            },
            {
                icon: '🎨',
                name: data.services.categories[1].name[lang],
                description: lang === 'en'
                    ? 'Premium coloring with world-renowned brands like KYDRA by Phyto for stunning results.'
                    : 'Премиум боядисване със световноизвестни марки като KYDRA by Phyto за зашеметяващи резултати.'
            },
            {
                icon: '💆',
                name: data.services.categories[2].name[lang],
                description: lang === 'en'
                    ? 'Revitalize your hair with ALTERNA Haircare and Olaplex treatments designed to restore and strengthen.'
                    : 'Ревитализирайте косата си с терапии ALTERNA Haircare и Olaplex, създадени да възстановяват и укрепват.'
            },
            {
                icon: '👁',
                name: data.services.categories[3].name[lang],
                description: lang === 'en'
                    ? 'Beautiful, natural-looking lash extensions applied hair by hair for a stunning finish.'
                    : 'Красиви, естествено изглеждащи мигли, поставени косъм по косъм за зашеметяващ завършек.'
            }
        ];

        servicesSection.innerHTML = services.map(service => `
            <div class="service-card">
                <div class="service-icon">${service.icon}</div>
                <h3>${service.name}</h3>
                <p>${service.description}</p>
            </div>
        `).join('');
    }

    function renderPrices(data) {
        const pricesSection = document.querySelector('.price-categories');
        if (!pricesSection) return;

        const lang = getCurrentLang();

        pricesSection.innerHTML = data.services.categories.map(category => {
            const itemsHtml = category.items.map(item => {
                const priceNote = item.price_note ? item.price_note[lang] + ' ' : '';
                const price = formatPrice(item.price_eur);
                return `
                    <li>
                        <span class="service-name">${item.name[lang]}</span>
                        <span class="service-price">${priceNote}${price}</span>
                    </li>
                `;
            }).join('');

            return `
                <div class="price-category">
                    <h3 class="category-title">${category.name[lang]}</h3>
                    <ul class="price-list">${itemsHtml}</ul>
                </div>
            `;
        }).join('');

        const priceNoteEl = document.querySelector('.price-note');
        if (priceNoteEl) {
            priceNoteEl.textContent = data.price_note[lang];
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadServices);
    } else {
        loadServices();
    }

    document.addEventListener('languageChanged', loadServices);
})();
