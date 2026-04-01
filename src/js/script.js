function trocarTela(tela) {
    document.querySelectorAll('.card').forEach(element => {
        element.style.display = 'none';
    });

    const targetCard = document.getElementById(tela);
    if (targetCard) {
        targetCard.style.display = 'block';
    }
}

window.trocarTela = trocarTela;

let marioAudioStarted = false;
let marioAudioEnabled = true;
let marioAudioCtx = null;
let marioMasterGain = null;
let marioTimer = null;
let marioNoteIndex = 0;

const marioMelody = [
    [659.25, 140], [659.25, 140], [0, 120], [659.25, 140], [0, 120], [523.25, 140], [659.25, 140], [0, 120],
    [783.99, 220], [0, 280], [392.0, 220], [0, 240],
    [523.25, 180], [0, 120], [392.0, 180], [0, 120], [329.63, 180], [0, 120],
    [440.0, 160], [493.88, 160], [466.16, 140], [440.0, 160], [0, 120], [392.0, 160], [659.25, 160], [783.99, 160], [880.0, 180]
];

function playMarioStep() {
    if (!marioAudioEnabled || !marioAudioCtx || !marioMasterGain) {
        return;
    }

    const [freq, duration] = marioMelody[marioNoteIndex];
    marioNoteIndex = (marioNoteIndex + 1) % marioMelody.length;

    if (freq > 0) {
        const osc = marioAudioCtx.createOscillator();
        const noteGain = marioAudioCtx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, marioAudioCtx.currentTime);

        noteGain.gain.setValueAtTime(0.0001, marioAudioCtx.currentTime);
        noteGain.gain.exponentialRampToValueAtTime(1, marioAudioCtx.currentTime + 0.01);
        noteGain.gain.exponentialRampToValueAtTime(0.0001, marioAudioCtx.currentTime + (duration / 1000));

        osc.connect(noteGain);
        noteGain.connect(marioMasterGain);

        osc.start();
        osc.stop(marioAudioCtx.currentTime + (duration / 1000));
    }

    marioTimer = window.setTimeout(playMarioStep, duration);
}

function startMarioStyleMusic() {
    if (!marioAudioEnabled || marioAudioStarted) {
        return;
    }

    const AudioContextRef = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextRef) {
        return;
    }

    marioAudioCtx = new AudioContextRef();
    marioMasterGain = marioAudioCtx.createGain();
    marioMasterGain.gain.value = 0.04;
    marioMasterGain.connect(marioAudioCtx.destination);
    marioAudioStarted = true;

    playMarioStep();
}

function stopMarioStyleMusic() {
    if (marioTimer) {
        window.clearTimeout(marioTimer);
        marioTimer = null;
    }

    if (marioAudioCtx) {
        marioAudioCtx.close();
        marioAudioCtx = null;
        marioMasterGain = null;
    }

    marioAudioStarted = false;
    marioNoteIndex = 0;
}

function updateMusicButton() {
    const btn = document.getElementById('music-toggle');
    if (!btn) {
        return;
    }

    if (marioAudioEnabled) {
        btn.textContent = '🎵 Música: ON';
        btn.classList.remove('off');
    } else {
        btn.textContent = '🔇 Música: OFF';
        btn.classList.add('off');
    }
}

function toggleMusic() {
    marioAudioEnabled = !marioAudioEnabled;

    if (marioAudioEnabled) {
        startMarioStyleMusic();
    } else {
        stopMarioStyleMusic();
    }

    updateMusicButton();
}

function bootstrapMusic() {
    if (!marioAudioEnabled || marioAudioStarted) {
        return;
    }

    startMarioStyleMusic();
    if (marioAudioStarted) {
        document.removeEventListener('click', bootstrapMusic);
        document.removeEventListener('keydown', bootstrapMusic);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const navButtons = Array.from(document.querySelectorAll('.nav-button[data-target]'));
    const cards = Array.from(document.querySelectorAll('.card'));
    const statNumbers = Array.from(document.querySelectorAll('.stat-number'));
    const skillMeters = Array.from(document.querySelectorAll('.skill-meter'));
    const rotatingRole = document.getElementById('rotating-role');
    const musicToggleBtn = document.getElementById('music-toggle');
    const lightbox = document.getElementById('image-lightbox');
    const lightboxPreview = document.getElementById('image-lightbox-preview');
    const lightboxClose = document.getElementById('image-lightbox-close');
    const certificateImages = document.querySelectorAll('.certificate-image');
    const projectFilters = Array.from(document.querySelectorAll('.project-filter'));
    const projectCards = Array.from(document.querySelectorAll('.project-card'));
    const projectsEmpty = document.getElementById('projects-empty');
    const sectionOrder = navButtons.map(button => button.dataset.target);
    const savedSection = window.localStorage.getItem('posterdev.activeSection');

    let countersAnimated = false;
    let skillsAnimated = false;
    let currentRoleIndex = 0;

    const rotatingRoles = [
        'interfaces modernas',
        'componentes reutilizaveis',
        'experiencias responsivas',
        'projetos com identidade visual'
    ];

    function setActiveNav(target) {
        navButtons.forEach(button => {
            const isActive = button.dataset.target === target;
            button.classList.toggle('is-active', isActive);
            button.setAttribute('aria-current', isActive ? 'page' : 'false');
        });
    }

    function animateCard(target) {
        const activeCard = document.getElementById(target);
        if (!activeCard) {
            return;
        }

        cards.forEach(card => card.classList.remove('card-enter'));
        void activeCard.offsetWidth;
        activeCard.classList.add('card-enter');
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

    function syncEnhancedUi(target) {
        setActiveNav(target);
        animateCard(target);
        window.localStorage.setItem('posterdev.activeSection', target);

        if (target === 'home') {
            animateCounters();
        }

        if (target === 'cargo') {
            animateSkills();
        }
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

    const baseTrocarTela = window.trocarTela;
    window.trocarTela = function trocarTelaComUi(target) {
        baseTrocarTela(target);
        syncEnhancedUi(target);
    };

    function goToSection(target) {
        if (!sectionOrder.includes(target)) {
            return;
        }

        window.trocarTela(target);
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

    function closeLightbox() {
        if (!lightbox || !lightboxPreview) {
            return;
        }

        lightbox.classList.remove('open');
        lightbox.setAttribute('aria-hidden', 'true');
        lightboxPreview.src = '';
    }

    if (musicToggleBtn) {
        musicToggleBtn.addEventListener('click', toggleMusic);
        updateMusicButton();
    }

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

    document.addEventListener('click', bootstrapMusic);
    document.addEventListener('keydown', bootstrapMusic);
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

        const quickAccess = {
            '1': 'home',
            '2': 'sobre',
            '3': 'trajetoria',
            '4': 'cargo',
            '5': 'projetos',
            '6': 'certificados'
        };

        const directSection = quickAccess[event.key];
        if (directSection) {
            event.preventDefault();
            goToSection(directSection);
            return;
        }

        if (event.key !== 'ArrowRight' && event.key !== 'ArrowDown' && event.key !== 'ArrowLeft' && event.key !== 'ArrowUp') {
            return;
        }

        const visibleCard = cards.find(card => card.style.display !== 'none') || cards[0];
        const currentIndex = visibleCard ? sectionOrder.indexOf(visibleCard.id) : 0;
        const step = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : -1;
        const nextIndex = (currentIndex + step + sectionOrder.length) % sectionOrder.length;

        event.preventDefault();
        goToSection(sectionOrder[nextIndex]);
    });

    if (rotatingRole) {
        rotatingRole.textContent = rotatingRoles[0];
        window.setInterval(rotateRoleText, 2600);
    }

    projectFilters.forEach(button => {
        button.addEventListener('click', () => {
            applyProjectFilter(button.dataset.filter || 'all');
        });
    });

    applyProjectFilter('all');

    goToSection(sectionOrder.includes(savedSection) ? savedSection : 'home');
});