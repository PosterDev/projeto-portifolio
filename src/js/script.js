document.addEventListener('DOMContentLoaded', () => {
    const navLinks = Array.from(document.querySelectorAll('.site-nav a[href^="#"]'));
    const statNumbers = Array.from(document.querySelectorAll('.stat-number'));
    const skillMeters = Array.from(document.querySelectorAll('.skill-meter'));
    const rotatingRole = document.getElementById('rotating-role');
    const lightbox = document.getElementById('image-lightbox');
    const lightboxPreview = document.getElementById('image-lightbox-preview');
    const lightboxClose = document.getElementById('image-lightbox-close');
    const certificateImages = document.querySelectorAll('.certificate-image');
    const projectFilters = Array.from(document.querySelectorAll('.project-filter'));
    const profilePhoto = document.querySelector('.profile-photo');
    const projectCards = Array.from(document.querySelectorAll('.project-card'));
    const projectsEmpty = document.getElementById('projects-empty');
    const sections = Array.from(document.querySelectorAll('section[id]'));

    const {
        rotatingRoles = [],
        quickAccess = {}
    } = window.portfolioConfig || {};

    let countersAnimated = false;
    let skillsAnimated = false;
    let currentRoleIndex = 0;

    function setActiveNav(hash) {
        navLinks.forEach(link => {
            link.classList.toggle('is-active', link.getAttribute('href') === hash);
        });
    }

    function scrollToSection(hash) {
        if (!hash) {
            return;
        }

        const target = document.querySelector(hash);
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            window.history.replaceState(null, '', hash);
        }
    }

    function animateCounters() {
        if (countersAnimated) {
            return;
        }

        countersAnimated = true;

        statNumbers.forEach((element, index) => {
            const target = Number(element.dataset.count || 0);
            const duration = 900 + (index * 120);
            const startTime = performance.now();

            function tick(now) {
                const progress = Math.min((now - startTime) / duration, 1);
                element.textContent = String(Math.round(target * progress));

                if (progress < 1) {
                    window.requestAnimationFrame(tick);
                } else {
                    element.textContent = String(target);
                }
            }

            window.requestAnimationFrame(tick);
        });
    }

    function animateSkills() {
        if (skillsAnimated) {
            return;
        }

        skillsAnimated = true;

        skillMeters.forEach((meter, index) => {
            const fill = meter.querySelector('.skill-meter-fill');
            const level = Number(meter.dataset.level || 0);

            if (!(fill instanceof HTMLElement)) {
                return;
            }

            window.setTimeout(() => {
                fill.style.width = `${level}%`;
            }, index * 140);
        });
    }

    function applyProjectFilter(filter) {
        let visibleProjects = 0;

        projectFilters.forEach(button => {
            button.classList.toggle('is-active', button.dataset.filter === filter);
            button.setAttribute('aria-pressed', button.dataset.filter === filter ? 'true' : 'false');
        });

        projectCards.forEach(card => {
            const tags = (card.dataset.tags || '').split(' ');
            const isVisible = filter === 'all' || tags.includes(filter);

            card.hidden = !isVisible;
            if (isVisible) {
                visibleProjects += 1;
            }
        });

        if (projectsEmpty) {
            projectsEmpty.hidden = visibleProjects > 0;
        }
    }

    function rotateRoleText() {
        if (!rotatingRole) {
            return;
        }

        rotatingRole.classList.add('is-switching');
        window.setTimeout(() => {
            currentRoleIndex = (currentRoleIndex + 1) % rotatingRoles.length;
            rotatingRole.textContent = rotatingRoles[currentRoleIndex];
            rotatingRole.classList.remove('is-switching');
        }, 180);
    }

    function openLightbox(image) {
        if (!lightbox || !lightboxPreview) {
            return;
        }

        lightboxPreview.src = image.src;
        lightboxPreview.alt = image.alt;
        lightbox.classList.add('open');
        lightbox.setAttribute('aria-hidden', 'false');
    }

    function setProfilePhotoFallback() {
        if (!profilePhoto) {
            return;
        }

        profilePhoto.addEventListener('error', () => {
            profilePhoto.src = 'https://raw.githubusercontent.com/PosterDev/projeto-portifolio/main/src/img/CURRICULUM.jpg';
        }, { once: true });
    }

    function closeLightbox() {
        if (!lightbox || !lightboxPreview) {
            return;
        }

        lightbox.classList.remove('open');
        lightbox.setAttribute('aria-hidden', 'true');
        lightboxPreview.src = '';
    }

    navLinks.forEach(link => {
        link.addEventListener('click', event => {
            event.preventDefault();
            const hash = link.getAttribute('href');
            setActiveNav(hash);
            scrollToSection(hash);
        });
    });

    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) {
                return;
            }

            const hash = `#${entry.target.id}`;
            setActiveNav(hash);

            if (entry.target.id === 'home') {
                animateCounters();
            }
            if (entry.target.id === 'cargo') {
                animateSkills();
            }
        });
    }, { threshold: 0.35 });

    sections.forEach(section => observer.observe(section));

    const currentHash = window.location.hash || '#home';
    setActiveNav(currentHash);

    certificateImages.forEach(image => {
        image.addEventListener('click', () => openLightbox(image));
        image.addEventListener('keydown', event => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                openLightbox(image);
            }
        });
    });

    if (lightboxClose) {
        lightboxClose.addEventListener('click', closeLightbox);
    }

    if (lightbox) {
        lightbox.addEventListener('click', event => {
            if (event.target === lightbox) {
                closeLightbox();
            }
        });
    }

    document.addEventListener('keydown', event => {
        const targetElement = event.target;
        if (targetElement instanceof HTMLElement) {
            const tagName = targetElement.tagName;
            if (tagName === 'INPUT' || tagName === 'TEXTAREA' || targetElement.isContentEditable) {
                return;
            }
        }

        if (event.key === 'Escape') {
            closeLightbox();
        }

        const directSection = quickAccess[event.key];
        if (directSection) {
            event.preventDefault();
            setActiveNav(directSection);
            scrollToSection(directSection);
        }
    });

    if (rotatingRole) {
        rotatingRole.textContent = rotatingRoles[0];
        window.setInterval(rotateRoleText, 2600);
    }

    setProfilePhotoFallback();

    projectFilters.forEach(button => {
        button.addEventListener('click', () => {
            applyProjectFilter(button.dataset.filter || 'all');
        });
    });

    applyProjectFilter('all');
});