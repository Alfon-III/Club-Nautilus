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
        trackSelector: '.carousel-slide',
        itemSelector: '.carousel-item',
        previousSelector: '.prev-btn',
        nextSelector: '.next-btn',
        id: 'instagram-posts',
        label: 'Instagram'
    });

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

    // Competition calendar: upcoming dates first, then completed and undated events.
    const competitionTable = document.querySelector('#competition-list');

    if (competitionTable) {
        const tableBody = competitionTable.tBodies[0];
        const filterButtons = [...document.querySelectorAll('.competition-filter')];
        const count = document.querySelector('#competition-count');
        const today = new Date();
        const todayDay = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
        const toUtcDay = value => {
            const [year, month, day] = value.split('-').map(Number);
            return Date.UTC(year, month - 1, day);
        };

        const competitions = [...tableBody.rows].map((row, index) => {
            const start = row.dataset.date ? toUtcDay(row.dataset.date) : null;
            const end = row.dataset.end ? toUtcDay(row.dataset.end) : start;
            const countdownCell = row.querySelector('.countdown-cell');
            let group = 2;

            if (start === null) {
                countdownCell.textContent = 'Día por concretar';
            } else if (todayDay > end) {
                group = 1;
                countdownCell.textContent = 'Finalizada';
                countdownCell.classList.add('finalized-event');
            } else {
                group = 0;
                countdownCell.textContent = todayDay >= start
                    ? 'En curso'
                    : `${Math.round((start - todayDay) / 86400000)} días`;
            }

            return { row, index, start, end, group };
        });

        competitions.sort((a, b) => {
            if (a.group !== b.group) return a.group - b.group;
            if (a.group === 0) return a.start - b.start;
            if (a.group === 1) return b.end - a.end;
            return a.index - b.index;
        });
        competitions.forEach(({ row }) => tableBody.appendChild(row));

        const applyFilter = selected => {
            let visibleCount = 0;
            competitions.forEach(({ row }) => {
                const matches = selected === 'all' || row.dataset.categories.split(' ').includes(selected);
                row.hidden = !matches;
                if (matches) visibleCount += 1;
            });
            filterButtons.forEach(button => {
                button.setAttribute('aria-pressed', String(button.dataset.filter === selected));
            });
            count.textContent = `${visibleCount} ${visibleCount === 1 ? 'competición' : 'competiciones'}`;
        };

        filterButtons.forEach(button => {
            button.addEventListener('click', () => applyFilter(button.dataset.filter));
        });
    }
});
