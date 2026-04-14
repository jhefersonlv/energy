const WHATSAPP_NUMBER = '5511947020525';

// =====================
// MODAL
// =====================
const STEP_CONFIG = {
    1:   { title: 'O que você precisa?',        subtitle: 'Selecione o tipo de serviço' },
    '1b':{ title: 'Você já tem um aparelho?',   subtitle: 'Nos conte para personalizarmos seu orçamento' },
    2:   { title: 'Marca do equipamento',        subtitle: 'Qual a marca do seu ar-condicionado?' },
    3:   { title: 'Tamanho do ambiente',         subtitle: 'Selecione a capacidade ideal pelo m² do local' },
    4:   { title: 'Tipo de equipamento',         subtitle: 'Qual modelo de ar-condicionado você quer?' }
};

function initModal() {
    const overlay        = document.getElementById('modalOverlay');
    const btnClose       = document.getElementById('modalClose');
    const btnVoltar      = document.getElementById('btnVoltar');
    const btnProximo     = document.getElementById('btnProximo');
    const btnEnviar      = document.getElementById('btnEnviar');
    const titleEl        = document.getElementById('modalTitle');
    const subtitleEl     = document.getElementById('modalSubtitle');
    const stepsIndicator = document.getElementById('stepsIndicator');

    // State
    let currentStep = 1;   // 1, '1b', 2, 3, 4
    let isAC        = false;  // true when AC service (not install)
    let isInstall   = false;  // true when "Instalação de Ar-Condicionado"
    let autoAdvanceTimer = null;

    // ── Helpers ──────────────────────────────────────────
    function getVal(name) {
        const el = document.querySelector(`.modal input[name="${name}"]:checked`);
        return el ? el.value : null;
    }

    function getServiceType() {
        const radio = document.querySelector('.modal input[name="servico"]:checked');
        if (!radio) return 'other';
        const ac = radio.closest('.modal-option').dataset.ac;
        if (ac === 'install') return 'install';
        if (ac === 'true')    return 'ac';
        return 'other';
    }

    function totalSteps() {
        if (isInstall || isAC) return 4;
        return 1;
    }

    // ── Indicador de etapas ───────────────────────────────
    function renderStepDots() {
        const total = totalSteps();
        if (total === 1 || currentStep === '1b') { stepsIndicator.innerHTML = ''; return; }

        // Map currentStep to number for dots
        const numStep = typeof currentStep === 'number' ? currentStep : 1;

        let html = '';
        for (let i = 1; i <= total; i++) {
            const isDone   = i < numStep;
            const isActive = i === numStep;
            const cls = isDone ? 'done' : isActive ? 'active' : '';
            html += `<div class="step-dot-nav ${cls}">${isDone ? '<i class="fas fa-check"></i>' : i}</div>`;
            if (i < total) {
                html += `<div class="step-connector ${isDone ? 'done' : ''}"></div>`;
            }
        }
        stepsIndicator.innerHTML = html;
    }

    // ── Mostrar step ──────────────────────────────────────
    function showStep(n) {
        document.querySelectorAll('.modal-step').forEach(s => s.classList.remove('active'));
        const stepId = n === '1b' ? 'step1b' : 'step' + n;
        const stepEl = document.getElementById(stepId);
        if (stepEl) stepEl.classList.add('active');
        currentStep = n;

        // Atualiza título e subtítulo
        const cfg = STEP_CONFIG[n] || STEP_CONFIG[1];
        titleEl.textContent    = cfg.title;
        subtitleEl.textContent = cfg.subtitle;

        // Atualiza indicador
        renderStepDots();

        // Atualiza botões
        const isLast = (isAC || isInstall) ? (currentStep === 4) : true;
        const isFirstLike = (n === 1 || n === '1b');
        const isOnStep1b  = (n === '1b');

        btnVoltar.style.display  = (n === 1) ? 'none' : 'inline-flex';
        btnProximo.style.display = (isLast || isOnStep1b) ? 'none' : 'inline-flex';
        btnEnviar.style.display  = (isLast && !isOnStep1b) ? 'inline-flex' : 'none';
    }

    // ── Abrir / Fechar ────────────────────────────────────
    function openModal() {
        clearTimeout(autoAdvanceTimer);
        resetModal();
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    function resetModal() {
        currentStep = 1;
        isAC     = false;
        isInstall = false;
        document.querySelectorAll('.modal input[type="radio"]').forEach(r => r.checked = false);
        document.querySelectorAll('.modal .selected').forEach(el => el.classList.remove('selected'));
        document.querySelectorAll('.has-ac-btn').forEach(b => b.classList.remove('selected'));
        stepsIndicator.innerHTML = '';
        showStep(1);
    }

    // ── Mensagem WhatsApp ─────────────────────────────────
    function buildMessage() {
        const servico = getVal('servico') || '';
        if (!isAC && !isInstall) {
            return (
                `Olá! Gostaria de solicitar um orçamento pela ENERGY:\n\n` +
                `• Serviço: ${servico}\n\n` +
                `Aguardo o contato!`
            );
        }
        return (
            `Olá! Gostaria de solicitar um orçamento pela ENERGY:\n\n` +
            `• Serviço: ${servico}\n` +
            `• Marca: ${getVal('marca') || 'Não informado'}\n` +
            `• Capacidade: ${getVal('btu') || 'Não informado'}\n` +
            `• Tipo de equipamento: ${getVal('tipo') || 'Não informado'}\n\n` +
            `Aguardo o contato!`
        );
    }

    function sendWhatsApp() {
        window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(buildMessage())}`, '_blank');
        closeModal();
    }

    // ── Selecionar card ───────────────────────────────────
    function selectCard(card, radioName) {
        document.querySelectorAll(`.modal input[name="${radioName}"]`).forEach(r => {
            r.closest('label').classList.remove('selected');
        });
        card.classList.add('selected');
        card.querySelector('input[type="radio"]').checked = true;
    }

    // ── Auto-avanço após seleção ───────────────────────────
    function advanceFromStep(step) {
        clearTimeout(autoAdvanceTimer);
        autoAdvanceTimer = setTimeout(() => {
            if (step === 1) {
                const svcType = getServiceType();
                if (svcType === 'install') {
                    // Exibe a pergunta "Você já tem um aparelho?"
                    isInstall = false;
                    isAC      = false;
                    showStep('1b');
                } else if (svcType === 'ac') {
                    isAC      = true;
                    isInstall = false;
                    showStep(2);
                } else {
                    // Serviço elétrico → WhatsApp direto
                    sendWhatsApp();
                }
            } else if (step === 2) {
                showStep(3);
            } else if (step === 3) {
                showStep(4);
            }
        }, step === 4 ? 0 : 380);
    }

    // ── Bind: cards de serviço (step 1) ──────────────────
    document.querySelectorAll('.modal-option').forEach(card => {
        card.addEventListener('click', () => {
            selectCard(card, 'servico');
            advanceFromStep(1);
        });
    });

    // ── Bind: botões "Tem AC?" (step 1b) ──────────────────
    document.getElementById('btnTemAC').addEventListener('click', () => {
        // Usuário tem aparelho → coleta marca/BTU/tipo
        isInstall = true;
        isAC      = false;
        document.querySelectorAll('.has-ac-btn').forEach(b => b.classList.remove('selected'));
        document.getElementById('btnTemAC').classList.add('selected');
        setTimeout(() => showStep(2), 250);
    });

    document.getElementById('btnNaoTemAC').addEventListener('click', () => {
        // Usuário não tem aparelho → mostra mensagem de transição e redireciona para marketplace
        document.querySelectorAll('.has-ac-btn').forEach(b => b.classList.remove('selected'));
        document.getElementById('btnNaoTemAC').classList.add('selected');
        setTimeout(() => {
            // Esconde step 1b e mostra mensagem de redirecionamento
            document.querySelectorAll('.modal-step').forEach(s => s.classList.remove('active'));
            document.getElementById('stepRedirect').classList.add('active');
            // Esconde botões de navegação durante o redirect
            btnVoltar.style.display = 'none';
            btnProximo.style.display = 'none';
            btnEnviar.style.display = 'none';
            // Redireciona após a mensagem ser lida
            setTimeout(() => {
                window.location.href = 'comprar-ar.html';
            }, 1800);
        }, 300);
    });

    // ── Bind: cards de marca (step 2) ────────────────────
    document.querySelectorAll('.modal-brand-card').forEach(card => {
        card.addEventListener('click', () => {
            selectCard(card, 'marca');
            advanceFromStep(2);
        });
    });

    // ── Bind: cards de BTU (step 3) ──────────────────────
    document.querySelectorAll('.modal-btu-card').forEach(card => {
        card.addEventListener('click', () => {
            selectCard(card, 'btu');
            advanceFromStep(3);
        });
    });

    // ── Bind: cards de tipo (step 4) — só marca, não auto-avança
    document.querySelectorAll('.modal-type-card').forEach(card => {
        card.addEventListener('click', () => {
            selectCard(card, 'tipo');
        });
    });

    // ── Botões de navegação ───────────────────────────────
    document.querySelectorAll('.open-modal').forEach(btn => {
        btn.addEventListener('click', e => { e.preventDefault(); openModal(); });
    });

    btnClose.addEventListener('click', closeModal);
    overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

    btnVoltar.addEventListener('click', () => {
        clearTimeout(autoAdvanceTimer);
        if (currentStep === '1b') {
            // Volta ao step 1
            isInstall = false;
            isAC      = false;
            showStep(1);
        } else if (currentStep === 2) {
            // Se veio de isInstall, volta para step 1b; se veio de isAC, volta para step 1
            if (isInstall) {
                showStep('1b');
            } else {
                showStep(1);
            }
        } else if (typeof currentStep === 'number' && currentStep > 1) {
            showStep(currentStep - 1);
        }
    });

    btnProximo.addEventListener('click', () => {
        const fields = { 1: 'servico', 2: 'marca', 3: 'btu' };
        const f = fields[currentStep];
        if (f && !getVal(f)) { shakeStep(currentStep); return; }
        clearTimeout(autoAdvanceTimer);
        advanceFromStep(currentStep);
    });

    btnEnviar.addEventListener('click', () => {
        if (!getVal('tipo')) { shakeStep(4); return; }
        sendWhatsApp();
    });
}

function shakeStep(n) {
    const stepId = n === '1b' ? 'step1b' : 'step' + n;
    const step = document.getElementById(stepId);
    if (!step) return;
    step.style.animation = 'none';
    step.offsetHeight;
    step.style.animation = 'shake 0.4s ease';
}

// =====================
// INIT
// =====================
document.addEventListener('DOMContentLoaded', () => {
    initModal();

    // Scroll reveal
    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });

    document.querySelectorAll('.culture-card, .service-card, .project-card, .about-grid, .section-title, .industry-card, .process-step, .diff-item').forEach(el => {
        el.classList.add('reveal-init');
        revealObserver.observe(el);
    });

    const style = document.createElement('style');
    style.textContent = `
        .reveal-init { opacity: 0; transform: translateY(30px); transition: all 0.8s cubic-bezier(0.2, 0.8, 0.2, 1); }
        .reveal-init.active { opacity: 1; transform: translateY(0); }
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            20%       { transform: translateX(-8px); }
            40%       { transform: translateX(8px); }
            60%       { transform: translateX(-5px); }
            80%       { transform: translateX(5px); }
        }
    `;
    document.head.appendChild(style);

    // Hamburger menu
    const hamburger = document.getElementById('hamburger');
    const navMenu   = document.getElementById('navMenu');

    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('open');
            navMenu.classList.toggle('open');
            document.body.style.overflow = navMenu.classList.contains('open') ? 'hidden' : '';
        });

        // Fechar menu ao clicar em qualquer link
        navMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('open');
                navMenu.classList.remove('open');
                document.body.style.overflow = '';
            });
        });
    }

    // Smooth scroll
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href === '#') return;
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) target.scrollIntoView({ behavior: 'smooth' });
        });
    });

    // Header shadow
    const header = document.querySelector('header');
    window.addEventListener('scroll', () => {
        header.classList.toggle('scrolled', window.scrollY > 10);
    }, { passive: true });

    // Logos slider
    document.querySelectorAll('.logos-track').forEach(track => {
        track.innerHTML += track.innerHTML;
    });
});
