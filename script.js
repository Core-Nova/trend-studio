/* ========================================
   TREND - Luxury Hairdressing Studio
   Vanilla JavaScript
   ======================================== */

document.addEventListener('DOMContentLoaded', function() {
    
    const langButtons = document.querySelectorAll('.lang-btn');
    let currentLang = localStorage.getItem('trendLang') || 'en';
    
    function setLanguage(lang) {
        currentLang = lang;
        localStorage.setItem('trendLang', lang);
        
        langButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.lang === lang);
        });
        
        document.documentElement.lang = lang;
        
        const translatableElements = document.querySelectorAll('[data-en][data-bg]');
        translatableElements.forEach(el => {
            const text = el.getAttribute(`data-${lang}`);
            if (text) {
                if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                    el.placeholder = text;
                } else {
                    el.innerHTML = text;
                }
            }
        });
        
        const titleSuffix = lang === 'bg' ? 'Бутиково фризьорско студио' : 'Hair Boutique Studio';
        document.title = `TREND | ${titleSuffix}`;
        
        document.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang: lang } }));
    }
    
    langButtons.forEach(btn => {
        btn.addEventListener('click', () => setLanguage(btn.dataset.lang));
    });
    
    setLanguage(currentLang);
    
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    const navLinksItems = document.querySelectorAll('.nav-links a');
    
    function toggleMobileMenu() {
        mobileMenuBtn.classList.toggle('active');
        navLinks.classList.toggle('active');
        document.body.style.overflow = navLinks.classList.contains('active') ? 'hidden' : '';
    }
    
    function closeMobileMenu() {
        mobileMenuBtn.classList.remove('active');
        navLinks.classList.remove('active');
        document.body.style.overflow = '';
    }
    
    mobileMenuBtn.addEventListener('click', toggleMobileMenu);
    
    navLinksItems.forEach(link => {
        link.addEventListener('click', closeMobileMenu);
    });
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && navLinks.classList.contains('active')) {
            closeMobileMenu();
        }
    });
    
    const navbar = document.querySelector('.navbar');
    let lastScrollY = window.scrollY;
    
    function handleScroll() {
        const currentScrollY = window.scrollY;
        
        if (currentScrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
        
        lastScrollY = currentScrollY;
    }
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                const navHeight = navbar.offsetHeight;
                const targetPosition = targetElement.offsetTop - navHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    const revealElements = document.querySelectorAll('.service-card, .review-card, .price-category, .contact-item, .about-features .feature, .gallery-instagram');
    
    const revealOnScroll = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                revealOnScroll.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });
    
    revealElements.forEach(el => {
        el.classList.add('reveal');
        revealOnScroll.observe(el);
    });
    
    const sections = document.querySelectorAll('section[id]');
    
    function highlightNavOnScroll() {
        const scrollY = window.scrollY;
        const navHeight = navbar.offsetHeight;
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop - navHeight - 100;
            const sectionBottom = sectionTop + section.offsetHeight;
            const sectionId = section.getAttribute('id');
            const navLink = document.querySelector(`.nav-links a[href="#${sectionId}"]`);
            
            if (navLink) {
                if (scrollY >= sectionTop && scrollY < sectionBottom) {
                    navLinksItems.forEach(link => link.classList.remove('active'));
                    navLink.classList.add('active');
                }
            }
        });
    }
    
    window.addEventListener('scroll', highlightNavOnScroll, { passive: true });
    
    
    console.log('%c✨ TREND - Luxury Hairdressing Studio ✨', 'color: #C9A227; font-size: 16px; font-weight: bold;');
    console.log('%cWhere elegance meets artistry', 'color: #722F37; font-style: italic;');
    
});
