
const content_dir = 'contents/'
const config_file = 'config.yml'

const allowedUrlProtocols = ['http:', 'https:', 'mailto:', 'tel:'];
const configOnlyKeys = ['nav', 'sections', 'backgrounds', 'background-interval-ms', 'background-overlay'];

function stringifyValue(value) {
    return value == null ? '' : value.toString();
}

function decodeText(value) {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = String(value);
    return textarea.value;
}

function setElementValue(element, value) {
    if (value && typeof value === 'object') {
        if ('text' in value) {
            element.textContent = decodeText(value.text);
        }
        if ('href' in value && element instanceof HTMLAnchorElement) {
            element.href = value.href;
        }
        return;
    }

    element.textContent = decodeText(value);
}

function renderNavigation(navItems) {
    const navbarItems = document.getElementById('navbar-items');
    if (!navbarItems || !Array.isArray(navItems)) {
        return;
    }

    navbarItems.replaceChildren();

    navItems.forEach((item) => {
        if (!item || !item.text || !item.href) {
            return;
        }

        const listItem = document.createElement('li');
        const link = document.createElement('a');

        listItem.className = 'nav-item';
        link.className = 'nav-link me-lg-3';
        link.href = item.href;
        link.textContent = decodeText(item.text);

        listItem.appendChild(link);
        navbarItems.appendChild(listItem);
    });
}

function normalizeSections(sections) {
    if (!Array.isArray(sections)) {
        return [];
    }

    return sections
        .map((section) => {
            if (typeof section === 'string' && section.trim() !== '') {
                return {
                    id: section,
                    nav: section.toUpperCase(),
                    href: '#' + section,
                };
            }

            if (!section || typeof section !== 'object' || !section.id) {
                return null;
            }
            
            return {
                id: section.id,
                nav: section.nav || section.text || section.id.toUpperCase(),
                title: section.title || section.heading || section.nav || section.text || section.id.toUpperCase(),
                icon: section.icon || '',
                href: section.href || '#' + section.id,
                showInNav: section['show-in-nav'] !== false,
            };
        })
        .filter(Boolean);
}

function getNavigationItems(yml) {
    const sections = normalizeSections(yml.sections);
    if (sections.length > 0) {
        return sections
            .filter((section) => section.showInNav)
            .map((section) => ({
                text: section.nav,
                href: section.href,
        }));
    }

    return Array.isArray(yml.nav) ? yml.nav : [];
}

function activateScrollSpy() {
    const mainNav = document.body.querySelector('#mainNav');
    if (mainNav) {
        new bootstrap.ScrollSpy(document.body, {
            target: '#mainNav',
            offset: 74,
        });
    }
}

function bindResponsiveNavbar() {
    const navbarToggler = document.body.querySelector('.navbar-toggler');
    const responsiveNavItems = [].slice.call(
        document.querySelectorAll('#navbarResponsive .nav-link')
    );

    responsiveNavItems.map(function (responsiveNavItem) {
        responsiveNavItem.addEventListener('click', () => {
            if (navbarToggler && window.getComputedStyle(navbarToggler).display !== 'none') {
                navbarToggler.click();
            }
        });
    });
}

function renderSections(sections) {
    const sectionsContainer = document.getElementById('sections');
    if (!sectionsContainer) {
        return;
    }

    sectionsContainer.replaceChildren();

    sections.forEach((section, index) => {
        const sectionElement = document.createElement('section');
        const container = document.createElement('div');
        const header = document.createElement('header');
        const title = document.createElement('h2');
        const body = document.createElement('div');

        sectionElement.id = section.id;
        sectionElement.className = [
            index % 2 === 0 ? 'bg-gradient-primary-to-secondary-light' : 'bg-gradient-primary-to-secondary-gray',
        ].join(' ');

        container.className = 'container px-5';

        if (section.titleId) {
            title.id = section.titleId;
        }

        if (section.icon) {
            const icon = document.createElement('i');
            icon.classList.add('bi', section.icon);
            title.appendChild(icon);
            title.appendChild(document.createTextNode('\u00a0'));
        }

        title.appendChild(document.createTextNode(decodeText(section.title)));
        body.className = 'main-body';
        body.id = section.id + '-md';

        header.appendChild(title);
        container.appendChild(header);
        container.appendChild(body);
        sectionElement.appendChild(container);
        sectionsContainer.appendChild(sectionElement);
    });
}

function normalizeBackgrounds(backgrounds) {
    if (Array.isArray(backgrounds)) {
        return backgrounds.filter((background) => typeof background === 'string' && background.trim() !== '');
    }

    if (typeof backgrounds === 'string' && backgrounds.trim() !== '') {
        return [backgrounds];
    }

    return [];
}
// Temporarily commenting this out to set my initial background as the frieren one. Once I upload more, we can rotate through whatever
// function chooseInitialBackgroundIndex(backgroundCount) {
//     if (!Number.isFinite(backgroundCount) || backgroundCount <= 1) {
//         return 0;
//     }

//     return Math.floor(Math.random() * backgroundCount);
// }
function chooseInitialBackgroundIndex(backgroundCount) {
    return 0;
}

window.chooseInitialBackgroundIndex = chooseInitialBackgroundIndex;

function initBackgroundSlideshow(yml) {
    const backgrounds = normalizeBackgrounds(yml.backgrounds);
    const layers = [...document.querySelectorAll('.top-section-bg')];
    const interval = Number(yml['background-interval-ms']) || 7000;
    const overlay = Number(yml['background-overlay']);

    if (Number.isFinite(overlay)) {
        document.documentElement.style.setProperty('--top-section-overlay', Math.min(0.85, Math.max(0, overlay)));
    }

    if (backgrounds.length === 0 || layers.length === 0) {
        return;
    }

    let activeLayer = 0;
    let activeBackground = chooseInitialBackgroundIndex(backgrounds.length);

    layers[activeLayer].style.backgroundImage = `url("${backgrounds[activeBackground]}")`;

    if (backgrounds.length === 1 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return;
    }

    window.setInterval(() => {
        const nextLayer = activeLayer === 0 ? 1 : 0;
        activeBackground = (activeBackground + 1) % backgrounds.length;

        layers[nextLayer].style.backgroundImage = `url("${backgrounds[activeBackground]}")`;
        layers[nextLayer].classList.add('top-section-bg-active');
        layers[activeLayer].classList.remove('top-section-bg-active');
        activeLayer = nextLayer;
    }, Math.max(2500, interval));
}

function sanitizeMarkdownHtml(html) {
    const template = document.createElement('template');
    template.innerHTML = html;

    template.content.querySelectorAll('script, style, iframe, object, embed, link, meta, base, form, input, button').forEach((node) => {
        node.remove();
    });

    template.content.querySelectorAll('*').forEach((node) => {
        [...node.attributes].forEach((attribute) => {
            const name = attribute.name.toLowerCase();
            const value = attribute.value.trim();

            if (name.startsWith('on')) {
                node.removeAttribute(attribute.name);
                return;
            }

            if (['href', 'src'].includes(name)) {
                try {
                    const url = new URL(value, window.location.href);
                    if (!allowedUrlProtocols.includes(url.protocol)) {
                        node.removeAttribute(attribute.name);
                    }
                } catch {
                    node.removeAttribute(attribute.name);
                }
            }
        });
    });

    return template.innerHTML;
}

function typesetMath() {
    if (!window.MathJax || !MathJax.startup || !MathJax.typesetPromise) {
        return Promise.resolve();
    }

    return MathJax.startup.promise.then(() => MathJax.typesetPromise());
}

function loadConfig() {
    return fetch(content_dir + config_file)
        .then(response => response.text())
        .then(text => jsyaml.load(text) || {})
        .catch(error => {
            console.log(error);
            return {};
        });
}

function applyConfig(yml) {
    Object.keys(yml).forEach(key => {
        if (configOnlyKeys.includes(key)) {
            return;
        }

        const element = document.getElementById(key);
        const value = yml[key];

        if (!element) {
            console.log("Unknown id and value: " + key + "," + stringifyValue(value))
            return;
        }

        try {
            setElementValue(element, value);
        } catch {
            console.log("Invalid id and value: " + key + "," + stringifyValue(value))
        }
    });
}

function getConfiguredSections(yml) {
    const sections = normalizeSections(yml.sections);
    if (sections.length > 0) {
        return sections.map((section) => section.id);
    }

    return [...document.querySelectorAll('[id$="-md"]')].map((element) => {
        return element.id.replace(/-md$/, '');
    });
}

function loadMarkdownSection(name) {
    return fetch(content_dir + name + '.md')
        .then(response => response.text())
        .then(markdown => {
            const target = document.getElementById(name + '-md');
            if (!target) {
                console.log("Unknown markdown section: " + name);
                return;
            }

            const html = sanitizeMarkdownHtml(marked.parse(markdown));
            target.innerHTML = html;
        })
        .catch(error => console.log(error));
}

function markSiteReady() {
    document.body.classList.remove('site-loading');
    document.body.classList.add('site-ready');
}

function initNewsCarousel() {
    const carousel = document.querySelector('.news-carousel');
    const track = carousel?.querySelector('.news-track');
    if (!track) return;

    const realItems = [...track.querySelectorAll('.news-item')];
    if (realItems.length === 0) return;

    // The viewport hides cards outside the visible carousel area.
    const viewport = document.createElement('div');
    viewport.className = 'news-viewport';
    track.parentNode.insertBefore(viewport, track);
    viewport.appendChild(track);

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let current = 1;
    let moving = false;
    let timer;

    // Put a copy of the last card before the first, and a copy of
    // the first card after the last. This makes the ends appear connected.
    const lastClone = realItems[realItems.length - 1].cloneNode(true);
    const firstClone = realItems[0].cloneNode(true);

    [lastClone, firstClone].forEach(clone => {
        clone.setAttribute('aria-hidden', 'true');
        clone.inert = true;
    });

    track.prepend(lastClone);
    track.append(firstClone);

    const allItems = [...track.querySelectorAll('.news-item')];

    function positionCard(animate = true) {
        track.style.transition = animate && !reducedMotion.matches
            ? 'transform 0.4s ease'
            : 'none';

        const card = allItems[current];
        const cardCenter = card.offsetLeft + card.offsetWidth / 2;
        const viewportCenter = viewport.clientWidth / 2;

        track.style.transform = `translateX(${viewportCenter - cardCenter}px)`;

        allItems.forEach((item, index) => {
            item.classList.toggle('is-active', index === current);
        });
    }

    function move(direction) {
        if (moving || realItems.length < 2) return;

        moving = true;
        current += direction;
        positionCard();
    }

    // After moving onto a duplicate, reset to the identical real card
    // without animation. The visitor sees no change.
    track.addEventListener('transitionend', event => {
        if (event.target !== track || event.propertyName !== 'transform') return;

        if (current === 0) {
            current = realItems.length;
            positionCard(false);
        } else if (current === realItems.length + 1) {
            current = 1;
            positionCard(false);
        }

        moving = false;
    });

    const controls = document.createElement('div');
    controls.className = 'news-controls';

    const previous = document.createElement('button');
    previous.type = 'button';
    previous.textContent = '← Previous';

    const next = document.createElement('button');
    next.type = 'button';
    next.textContent = 'Next →';

    previous.addEventListener('click', () => move(-1));
    next.addEventListener('click', () => move(1));

    controls.append(previous, next);
    carousel.appendChild(controls);

    function stopRotation() {
        clearInterval(timer);
        timer = undefined;
    }

    function startRotation() {
        if (timer || realItems.length < 2 || document.hidden || reducedMotion.matches) {
            return;
        }
        // timer = setInterval(() => move(1), 6000); // uncomment if you want to bring back the automatic scrolling of news
    }

    carousel.addEventListener('mouseenter', stopRotation);
    carousel.addEventListener('mouseleave', startRotation);
    carousel.addEventListener('focusin', stopRotation);
    carousel.addEventListener('focusout', event => {
        if (!carousel.contains(event.relatedTarget)) startRotation();
    });

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) stopRotation();
        else startRotation();
    });

    // Swipe left or right on mobile.
    let touchStartX = 0;

    viewport.addEventListener('touchstart', event => {
        touchStartX = event.changedTouches[0].screenX;
        stopRotation();
    }, { passive: true });

    viewport.addEventListener('touchend', event => {
        const distance = event.changedTouches[0].screenX - touchStartX;

        if (Math.abs(distance) > 50) {
            move(distance < 0 ? 1 : -1);
        }
        startRotation();
    }, { passive: true });

    window.addEventListener('resize', () => positionCard(false));

    positionCard(false);
    startRotation();
}

window.addEventListener('DOMContentLoaded', event => {
    marked.use({ mangle: false, headerIds: false });

    loadConfig()
        .then((yml) => {
            applyConfig(yml);
            const sections = normalizeSections(yml.sections);

            renderNavigation(getNavigationItems(yml));
            renderSections(sections);
            initBackgroundSlideshow(yml);
            activateScrollSpy();
            bindResponsiveNavbar();

            return Promise.all(getConfiguredSections(yml).map(loadMarkdownSection));
        })
        .then(() => {
            initNewsCarousel();
            return typesetMath();
        })
        .catch(error => console.log(error))
        .finally(() => markSiteReady());

}); 
