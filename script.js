document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.current-year').forEach(element => {
        element.textContent = new Date().getFullYear();
    });

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const scrollBehavior = () => reducedMotion.matches ? 'instant' : 'smooth';

    // The mobile menu uses the same navigation links as the desktop header.
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    const mobileNavigation = window.matchMedia('(max-width: 980px)');

    if (hamburger && navLinks) {
        navLinks.id ||= 'primary-navigation';
        hamburger.setAttribute('aria-controls', navLinks.id);

        const setMenuOpen = open => {
            const isOpen = open && mobileNavigation.matches;
            hamburger.classList.toggle('active', isOpen);
            navLinks.classList.toggle('active', isOpen);
            hamburger.setAttribute('aria-expanded', String(isOpen));
            hamburger.setAttribute('aria-label', isOpen ? 'Cerrar menú' : 'Abrir menú');
            navLinks.inert = mobileNavigation.matches && !isOpen;
        };

        hamburger.addEventListener('click', () => {
            setMenuOpen(hamburger.getAttribute('aria-expanded') !== 'true');
        });

        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => setMenuOpen(false));
        });

        document.addEventListener('click', event => {
            if (!navLinks.contains(event.target) && !hamburger.contains(event.target)) {
                setMenuOpen(false);
            }
        });

        document.addEventListener('keydown', event => {
            if (event.key === 'Escape' && hamburger.getAttribute('aria-expanded') === 'true') {
                setMenuOpen(false);
                hamburger.focus();
            }
        });

        mobileNavigation.addEventListener('change', () => setMenuOpen(false));
        setMenuOpen(false);
    }

    // Anchors use the browser's native scrolling and the CSS scroll margin.
    const header = document.querySelector('header');
    if (header) {
        const updateHeader = () => header.classList.toggle('scrolled', window.scrollY > 16);
        window.addEventListener('scroll', updateHeader, { passive: true });
        updateHeader();
    }

    const sectionLinks = [...document.querySelectorAll('.nav-links a')]
        .filter(link => /^#.+/.test(link.getAttribute('href') || ''))
        .map(link => ({ link, section: document.getElementById(link.hash.slice(1)) }))
        .filter(({ section }) => section);

    if ('IntersectionObserver' in window && sectionLinks.length) {
        const sectionObserver = new IntersectionObserver(entries => {
            const current = entries.find(entry => entry.isIntersecting);
            if (!current) return;

            sectionLinks.forEach(({ link, section }) => {
                const active = section === current.target;
                link.classList.toggle('active', active);
                if (active) link.setAttribute('aria-current', 'location');
                else link.removeAttribute('aria-current');
            });
        }, { rootMargin: '-25% 0px -65% 0px', threshold: 0 });

        sectionLinks.forEach(({ section }) => sectionObserver.observe(section));
    }

    // Schedule tabs keep one control in the keyboard's tab order.
    const tabGroups = new Map();
    document.querySelectorAll('.tab-btn').forEach(button => {
        const panel = document.getElementById(button.dataset.target);
        if (!panel) return;
        const group = button.dataset.group || 'default';
        if (!tabGroups.has(group)) tabGroups.set(group, []);
        tabGroups.get(group).push({ button, panel });
    });

    tabGroups.forEach(tabs => {
        const tabList = tabs[0].button.closest('.tabs');
        tabList?.setAttribute('role', 'tablist');
        if (tabList && !tabList.hasAttribute('aria-label')) {
            tabList.setAttribute('aria-label', 'Grupos de entrenamiento');
        }

        tabs.forEach(({ button, panel }) => {
            button.id = `tab-${panel.id}`;
            button.setAttribute('role', 'tab');
            button.setAttribute('aria-controls', panel.id);
            panel.setAttribute('role', 'tabpanel');
            panel.setAttribute('aria-labelledby', button.id);
            panel.tabIndex = 0;
        });

        const activateTab = (selected, focus = false) => {
            tabs.forEach(({ button, panel }, index) => {
                const active = index === selected;
                button.classList.toggle('active', active);
                button.setAttribute('aria-selected', String(active));
                button.tabIndex = active ? 0 : -1;
                panel.classList.toggle('active', active);
                panel.hidden = !active;
            });
            if (focus) tabs[selected].button.focus();
        };

        tabs.forEach(({ button }, index) => {
            button.addEventListener('click', () => activateTab(index));
            button.addEventListener('keydown', event => {
                let selected;
                if (event.key === 'ArrowRight') selected = (index + 1) % tabs.length;
                else if (event.key === 'ArrowLeft') selected = (index - 1 + tabs.length) % tabs.length;
                else if (event.key === 'Home') selected = 0;
                else if (event.key === 'End') selected = tabs.length - 1;
                else return;

                event.preventDefault();
                activateTab(selected, true);
            });
        });

        const initial = tabs.findIndex(({ button }) => button.classList.contains('active'));
        activateTab(Math.max(0, initial));
    });

    const setupInstagramCarousel = () => {
        const track = document.querySelector('.carousel-slide');
        if (!track) return;
        const items = [...track.querySelectorAll('.carousel-item')];
        if (items.length < 2) return;
        const carousel = track.closest('.carousel-container');
        const viewport = carousel.querySelector('.carousel-viewport');
        const previous = document.querySelector('.prev-btn');
        const next = document.querySelector('.next-btn');
        const previousPreview = document.querySelector('.carousel-preview-previous');
        const nextPreview = document.querySelector('.carousel-preview-next');
        const status = document.querySelector('#instagram-carousel-status');
        const pagination = carousel.querySelector('.carousel-pagination');
        const postLink = carousel.querySelector('.carousel-post-link');
        const links = items.map(item => item.querySelector('[data-instgrm-permalink]')?.dataset.instgrmPermalink
            || item.querySelector('iframe')?.src?.replace(/\/embed\/?(?:\?.*)?$/, '/'));
        const desktopLayout = window.matchMedia('(min-width: 900px)');
        let leading = desktopLayout.matches ? 1 : Math.min(2, items.length - 1);
        let cardWidth = desktopLayout.matches ? 100 / 3 : 80;
        let restingOffset = desktopLayout.matches ? 0 : 10 - leading * cardWidth;
        let active = 0;
        let target = 0;
        let moving = false;

        const syncLayout = () => {
            leading = desktopLayout.matches ? 1 : Math.min(2, items.length - 1);
            cardWidth = desktopLayout.matches ? 100 / 3 : 80;
            restingOffset = desktopLayout.matches ? 0 : 10 - leading * cardWidth;
            track.style.transform = `translateX(${restingOffset}%)`;
        };

        track.id ||= 'instagram-posts';
        track.removeAttribute('tabindex');
        track.removeAttribute('role');
        track.removeAttribute('aria-label');
        syncLayout();
        viewport.tabIndex = 0;
        viewport.setAttribute('role', 'region');
        viewport.setAttribute('aria-roledescription', 'carrusel');
        viewport.setAttribute('aria-label', 'Publicaciones de Instagram');
        if (status?.id) viewport.setAttribute('aria-describedby', status.id);
        [previous, next, previousPreview, nextPreview].forEach(button => {
            button?.setAttribute('aria-controls', track.id);
        });

        const pages = items.map((item, index) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'carousel-page';
            button.textContent = String(index + 1);
            button.setAttribute('aria-label', `Ver publicación ${index + 1} de ${items.length}`);
            button.setAttribute('aria-controls', track.id);
            button.addEventListener('click', () => navigate(index));
            pagination.appendChild(button);
            item.setAttribute('role', 'group');
            item.setAttribute('aria-label', `Publicación ${index + 1} de ${items.length}`);
            return button;
        });

        const updateHeight = () => {
            const visibleItems = desktopLayout.matches
                ? items.filter(item => Number(item.style.order) < 3)
                : [items[active]];
            const height = Math.max(...visibleItems.map(item => item.getBoundingClientRect().height));
            viewport.style.height = `${Math.ceil(height)}px`;
        };

        const render = () => {
            const previousIndex = (active - 1 + items.length) % items.length;
            const nextIndex = (active + 1) % items.length;

            items.forEach((item, index) => {
                item.classList.toggle('is-previous', index === previousIndex);
                item.classList.toggle('is-active', index === active);
                item.classList.toggle('is-next', index === nextIndex);
                item.classList.remove('is-before-previous');
                item.inert = index !== active;
                item.setAttribute('aria-hidden', String(index !== active));

                item.style.order = String((index - active + leading + items.length) % items.length);
                if (index === active) pages[index].setAttribute('aria-current', 'true');
                else pages[index].removeAttribute('aria-current');
            });

            if (status) status.textContent = `Publicación ${active + 1} de ${items.length}`;
            if (links[active]) postLink.href = links[active];
            updateHeight();
        };

        const advance = () => {
            if (moving || active === target) return;
            moving = true;
            const distance = (target - active + items.length) % items.length;
            const direction = distance <= items.length / 2 ? 1 : -1;
            if (items[active].contains(document.activeElement)) viewport.focus({ preventScroll: true });
            active = (active + direction + items.length) % items.length;
            render();
            const finish = () => {
                moving = false;
                advance();
            };
            if (reducedMotion.matches || !track.animate) {
                finish();
                return;
            }
            const animation = track.animate([
                { transform: `translateX(${restingOffset + direction * cardWidth}%)` },
                { transform: `translateX(${restingOffset}%)` }
            ], { duration: 260, easing: 'cubic-bezier(0.22, 0.61, 0.36, 1)' });
            animation.finished.then(finish, finish);
        };

        const navigate = index => {
            target = (index + items.length) % items.length;
            advance();
        };
        const move = direction => navigate(target + direction);

        previous?.addEventListener('click', () => move(-1));
        next?.addEventListener('click', () => move(1));
        previousPreview?.addEventListener('click', () => move(-1));
        nextPreview?.addEventListener('click', () => move(1));
        carousel.addEventListener('keydown', event => {
            if (event.key === 'ArrowLeft') {
                event.preventDefault();
                move(-1);
            } else if (event.key === 'ArrowRight') {
                event.preventDefault();
                move(1);
            } else if (event.key === 'Home' || event.key === 'End') {
                event.preventDefault();
                navigate(event.key === 'Home' ? 0 : items.length - 1);
            }
        });

        // Embedded posts handle their own gestures; the surrounding preview areas support swipes.
        let gesture = null;
        let swiped = false;
        viewport.addEventListener('pointerdown', event => {
            swiped = false;
            if (event.pointerType === 'mouse') return;
            gesture = { id: event.pointerId, x: event.clientX, y: event.clientY };
        });
        viewport.addEventListener('pointerup', event => {
            if (!gesture || gesture.id !== event.pointerId) return;
            const dx = event.clientX - gesture.x;
            const dy = event.clientY - gesture.y;
            gesture = null;
            if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.5) {
                swiped = true;
                move(dx < 0 ? 1 : -1);
            }
        });
        viewport.addEventListener('pointercancel', () => { gesture = null; });
        viewport.addEventListener('click', event => {
            if (!swiped) return;
            event.preventDefault();
            event.stopPropagation();
            swiped = false;
        }, true);
        if ('ResizeObserver' in window) {
            const observer = new ResizeObserver(updateHeight);
            items.forEach(item => observer.observe(item));
        }
        desktopLayout.addEventListener('change', () => {
            syncLayout();
            render();
        });
        window.addEventListener('resize', updateHeight, { passive: true });
        render();
    };

    setupInstagramCarousel();

    // Native scrolling supports touch, trackpads and the visible arrow controls.
    const setupCarousel = ({ trackSelector, itemSelector, previousSelector, nextSelector, id, label }) => {
        const track = document.querySelector(trackSelector);
        if (!track) return;
        const items = [...track.querySelectorAll(itemSelector)];
        if (!items.length) return;
        const previous = document.querySelector(previousSelector);
        const next = document.querySelector(nextSelector);

        track.id ||= id;
        track.tabIndex = 0;
        track.setAttribute('role', 'region');
        track.setAttribute('aria-label', label);
        [previous, next].forEach(button => button?.setAttribute('aria-controls', track.id));

        const maximumScroll = () => Math.max(0, track.scrollWidth - track.clientWidth);
        const updateControls = () => {
            if (previous) previous.disabled = track.scrollLeft <= 2;
            if (next) next.disabled = track.scrollLeft >= maximumScroll() - 2;
        };

        const move = direction => {
            const limit = maximumScroll();
            const current = track.scrollLeft;
            const trackLeft = track.getBoundingClientRect().left + track.clientLeft;
            const positions = items.map(item => Math.max(0, Math.min(limit,
                item.getBoundingClientRect().left - trackLeft + current)));
            positions.push(limit);

            const destination = direction > 0
                ? positions.find(position => position > current + 2) ?? limit
                : positions.reverse().find(position => position < current - 2) ?? 0;

            track.scrollTo({ left: destination, behavior: scrollBehavior() });
        };

        previous?.addEventListener('click', () => move(-1));
        next?.addEventListener('click', () => move(1));
        track.addEventListener('scroll', updateControls, { passive: true });
        window.addEventListener('resize', updateControls, { passive: true });
        window.addEventListener('load', updateControls, { once: true });

        if ('ResizeObserver' in window) {
            const resizeObserver = new ResizeObserver(updateControls);
            resizeObserver.observe(track);
            items.forEach(item => resizeObserver.observe(item));
        }
        updateControls();
    };

    setupCarousel({
        trackSelector: '.shop-carousel-track',
        itemSelector: '.shop-carousel-card',
        previousSelector: '.shop-nav-btn.prev',
        nextSelector: '.shop-nav-btn.next',
        id: 'equipment-gallery',
        label: 'Galería de equipación'
    });

    const toggleTableButton = document.getElementById('toggle-shop-table');
    const tableWrapper = document.getElementById('shop-table-wrapper');
    if (toggleTableButton && tableWrapper) {
        const updateTable = () => {
            const collapsed = tableWrapper.classList.contains('collapsed');
            toggleTableButton.setAttribute('aria-expanded', String(!collapsed));
            tableWrapper.inert = collapsed;
            tableWrapper.setAttribute('aria-hidden', String(collapsed));
            toggleTableButton.innerHTML = collapsed
                ? '<i class="fas fa-tshirt" aria-hidden="true"></i> Ver Tabla de Equipación'
                : '<i class="fas fa-chevron-up" aria-hidden="true"></i> Ocultar Tabla';
        };
        toggleTableButton.addEventListener('click', () => {
            tableWrapper.classList.toggle('collapsed');
            updateTable();
        });
        updateTable();
    }

    // Clipboard fallback keeps copying usable on local, non-secure previews.
    const copyText = async text => {
        if (navigator.clipboard?.writeText) {
            try {
                await navigator.clipboard.writeText(text);
                return true;
            } catch {
                // Older browsers and denied clipboard permissions can use selection.
            }
        }
        const field = document.createElement('textarea');
        field.value = text;
        field.setAttribute('readonly', '');
        field.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0;';
        const previouslyFocused = document.activeElement;
        document.body.appendChild(field);
        field.select();
        let copied = false;
        try {
            copied = typeof document.execCommand === 'function' && document.execCommand('copy');
        } catch {
            copied = false;
        } finally {
            field.remove();
            previouslyFocused?.focus({ preventScroll: true });
        }
        return copied;
    };

    const setupCopyButton = (buttonId, emailId) => {
        const button = document.getElementById(buttonId);
        const email = document.getElementById(emailId);
        if (!button || !email) return;
        const icon = button.querySelector('i');
        const originalIcon = icon?.className;
        const originalLabel = button.getAttribute('aria-label') || 'Copiar email';
        const originalTitle = button.getAttribute('title');
        let feedbackTimeout;
        let copying = false;

        button.addEventListener('click', async () => {
            if (copying) return;
            copying = true;
            const copied = await copyText(email.textContent.trim());
            copying = false;
            window.clearTimeout(feedbackTimeout);

            if (copied) {
                if (icon) icon.className = 'fas fa-check';
                button.setAttribute('aria-label', 'Email copiado');
                button.setAttribute('title', 'Email copiado');
            } else {
                const selection = window.getSelection();
                const range = document.createRange();
                range.selectNodeContents(email);
                selection?.removeAllRanges();
                selection?.addRange(range);
                button.setAttribute('aria-label', 'Email seleccionado para copiar');
                button.setAttribute('title', 'Email seleccionado para copiar');
            }

            feedbackTimeout = window.setTimeout(() => {
                if (icon) icon.className = originalIcon;
                button.setAttribute('aria-label', originalLabel);
                if (originalTitle === null) button.removeAttribute('title');
                else button.setAttribute('title', originalTitle);
            }, 2500);
        });
    };

    setupCopyButton('copy-email-btn', 'contact-email');
    setupCopyButton('shop-copy-email-btn', 'shop-contact-email');

    // Competition calendar: upcoming events first, then completed and undated events.
    const competitionTable = document.querySelector('#competition-list');

    if (competitionTable) {
        const tableBody = competitionTable.tBodies[0];
        const today = new Date();
        const todayDay = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
        const thisMonth = Date.UTC(today.getFullYear(), today.getMonth(), 1);
        const toUtcDay = value => {
            const [year, month, day] = value.split('-').map(Number);
            return Date.UTC(year, month - 1, day);
        };
        const toUtcMonth = value => {
            const [year, month] = value.split('-').map(Number);
            return Date.UTC(year, month - 1, 1);
        };

        const competitions = [...tableBody.rows].map((row, index) => {
            const start = row.dataset.date ? toUtcDay(row.dataset.date) : null;
            const end = row.dataset.end ? toUtcDay(row.dataset.end) : start;
            const month = row.dataset.month ? toUtcMonth(row.dataset.month) : null;
            const countdownCell = row.querySelector('.countdown-cell');
            let group = 2;

            if (start === null) {
                if (month !== null && month >= thisMonth) group = 0;
            } else if (todayDay > end) {
                group = 1;
                countdownCell.textContent = 'Finalizada';
                countdownCell.classList.add('finalized-event');
            } else if (row.dataset.provisional === 'true') {
                group = 0;
                countdownCell.textContent = 'Fecha provisional';
            } else if (row.dataset.alternative === 'true') {
                group = 0;
                countdownCell.textContent = todayDay >= start
                    ? 'Día por concretar'
                    : `${Math.round((start - todayDay) / 86400000)}–${Math.round((end - todayDay) / 86400000)} días · día por concretar`;
            } else {
                group = 0;
                countdownCell.textContent = todayDay >= start
                    ? 'En curso'
                    : `${Math.round((start - todayDay) / 86400000)} días`;
            }

            return { row, index, start, end, month, group };
        });

        competitions.sort((a, b) => {
            if (a.group !== b.group) return a.group - b.group;
            if (a.group === 0) return (a.start ?? a.month) - (b.start ?? b.month);
            if (a.group === 1) return b.end - a.end;
            return a.index - b.index;
        });
        competitions.forEach(({ row }) => tableBody.appendChild(row));
    }
});
