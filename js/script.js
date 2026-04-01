/* =========================================
   HEADER — SCROLL DINÁMICO
========================================= */
(function () {
    var header = document.getElementById('header');
    var lastScroll = 0;

    function onScroll() {
        var y = window.scrollY;
        if (y > 60) {
            header.classList.add('header__scrolled');
        } else {
            header.classList.remove('header__scrolled');
        }
        lastScroll = y;
    }

    window.addEventListener('scroll', onScroll, { passive: true });
})();

/* =========================================
   CARRUSEL — LOOP INFINITO
========================================= */
(function () {
    var track = document.getElementById('carouselTrack');
    var dotsWrap = document.getElementById('carouselDots');
    var btnPrev = document.getElementById('carouselPrev');
    var btnNext = document.getElementById('carouselNext');

    /* Configuración */
    var clonesCount = 6;
    var cardWidth = 0;
    var gap = 16;
    var realTotal = 0;
    var total = 0;
    var realIndex = 0;
    var virtualIndex = 0;
    var interval = null;
    var animationTime = 550; // ms, igual que CSS transition
    var teleportTimeout = null;

    /* Variables para drag */
    var isDragging = false;
    var startX = 0;
    var currentTranslate = 0;
    var touchStartTranslate = 0;

    /* =========================================
       SETUP INFINITO — CLONAR CARDS
    ========================================= */
    function setupInfinite() {
        var cards = Array.from(track.querySelectorAll('.oportunidades__card'));
        realTotal = cards.length;
        if (realTotal === 0) return;

        // Ajustar clonesCount si hay pocas tarjetas
        if (realTotal < clonesCount) {
            clonesCount = realTotal;
        }

        // Clonar las últimas cards al principio
        for (var i = realTotal - clonesCount; i < realTotal; i++) {
            var clone = cards[i].cloneNode(true);
            clone.classList.add('clone');
            track.insertBefore(clone, cards[0]);
        }

        // Clonar las primeras cards al final
        for (var j = 0; j < clonesCount; j++) {
            var cloneEnd = cards[j].cloneNode(true);
            cloneEnd.classList.add('clone');
            track.appendChild(cloneEnd);
        }

        total = realTotal + (clonesCount * 2);
    }

    function getCardWidth() {
        var firstCard = track.querySelector('.oportunidades__card');
        if (firstCard) {
            return firstCard.getBoundingClientRect().width;
        }
        return 260;
    }

    function buildDots() {
        dotsWrap.innerHTML = '';
        for (var i = 0; i < realTotal; i++) {
            var dot = document.createElement('button');
            dot.className = 'oportunidades__dot' + (i === 0 ? ' oportunidades__dot--active' : '');
            dot.setAttribute('role', 'tab');
            dot.setAttribute('aria-label', 'Ir a la tarjeta ' + (i + 1));
            dot.dataset.index = i;
            dotsWrap.appendChild(dot);
        }
    }

    function updateDots() {
        var dots = dotsWrap.querySelectorAll('.oportunidades__dot');
        dots.forEach(function (d, i) {
            d.classList.toggle('oportunidades__dot--active', i === realIndex);
            d.setAttribute('aria-selected', i === realIndex ? 'true' : 'false');
        });
    }

    /* =========================================
       POSICIONAMIENTO
    ========================================= */
    function setPosition(animate) {
        cardWidth = getCardWidth();
        var offset = virtualIndex * (cardWidth + gap);
        currentTranslate = -offset;

        if (animate !== false) {
            track.style.transition = 'transform ' + animationTime + 'ms cubic-bezier(0.4, 0, 0.2, 1)';
        } else {
            track.style.transition = 'none';
        }
        track.style.transform = 'translateX(' + currentTranslate + 'px)';
    }

    /* =========================================
       TELETRANSPORTE
    ========================================= */
    function teleportIfNeeded() {
        // Si estamos en los clones del inicio, saltar al final real
        if (virtualIndex < clonesCount) {
            virtualIndex = virtualIndex + realTotal;
            setPosition(false);
        }
        // Si estamos en los clones del final, saltar al inicio real
        else if (virtualIndex >= realTotal + clonesCount) {
            virtualIndex = virtualIndex - realTotal;
            setPosition(false);
        }
    }

    function scheduleTeleport() {
        // Limpiar timeout anterior si existe
        if (teleportTimeout) {
            clearTimeout(teleportTimeout);
        }
        // Programar teletransporte para justo después de la animación
        teleportTimeout = setTimeout(function () {
            teleportIfNeeded();
        }, animationTime + 10); // +10ms de margen
    }

    /* =========================================
       NAVEGACIÓN
    ========================================= */
    function goToVirtual(index, animate) {
        virtualIndex = index;
        realIndex = virtualIndex - clonesCount;
        realIndex = ((realIndex % realTotal) + realTotal) % realTotal;

        setPosition(animate);
        updateDots();

        if (animate !== false) {
            scheduleTeleport();
        }
    }

    function goToReal(index, animate) {
        realIndex = ((index % realTotal) + realTotal) % realTotal;
        virtualIndex = realIndex + clonesCount;
        setPosition(animate);
        updateDots();
    }

    function next() {
        teleportIfNeeded();
        goToVirtual(virtualIndex + 1);
    }

    function prev() {
        teleportIfNeeded();
        goToVirtual(virtualIndex - 1);
    }

    function startAutoplay() {
        stopAutoplay();
        interval = setInterval(next, 3500);
    }

    function stopAutoplay() {
        if (interval) { clearInterval(interval); interval = null; }
    }

    /* =========================================
       INICIALIZAR
    ========================================= */
    setupInfinite();
    buildDots();
    goToReal(0, false);
    startAutoplay();

    track.style.cursor = 'grab';

    /* =========================================
       BOTONES Y DOTS
    ========================================= */
    btnNext.addEventListener('click', function () { next(); startAutoplay(); });
    btnPrev.addEventListener('click', function () { prev(); startAutoplay(); });

    dotsWrap.addEventListener('click', function (e) {
        var dot = e.target.closest('.oportunidades__dot');
        if (dot) {
            goToReal(parseInt(dot.dataset.index, 10));
            startAutoplay();
        }
    });

    /* =========================================
       DRAG CON MOUSE (DESKTOP)
    ========================================= */
    function dragStart(e) {
        if (e.type === 'mousedown') {
            isDragging = true;
            startX = e.pageX;
            cardWidth = getCardWidth();
            stopAutoplay();
            track.style.cursor = 'grabbing';
            track.style.transition = 'none';
            // Cancelar teletransporte pendiente
            if (teleportTimeout) clearTimeout(teleportTimeout);
        }
    }

    function drag(e) {
        if (!isDragging) return;
        e.preventDefault();
        var diff = e.pageX - startX;
        currentTranslate = -virtualIndex * (cardWidth + gap) + diff;
        track.style.transform = 'translateX(' + currentTranslate + 'px)';
    }

    function dragEnd() {
        if (!isDragging) return;
        isDragging = false;
        track.style.cursor = 'grab';

        var newIndex = Math.round(-currentTranslate / (cardWidth + gap));
        goToVirtual(newIndex);
        startAutoplay();
    }

    track.addEventListener('mousedown', dragStart);
    track.addEventListener('mousemove', drag);
    track.addEventListener('mouseup', dragEnd);
    track.addEventListener('mouseleave', function () {
        if (isDragging) dragEnd();
    });
    track.addEventListener('dragstart', function (e) { e.preventDefault(); });

    /* =========================================
       TOUCH (MÓVIL)
    ========================================= */
    track.addEventListener('touchstart', function (e) {
        startX = e.touches[0].clientX;
        cardWidth = getCardWidth();
        touchStartTranslate = -virtualIndex * (cardWidth + gap);
        stopAutoplay();
        track.style.transition = 'none';
        if (teleportTimeout) clearTimeout(teleportTimeout);
    }, { passive: true });

    track.addEventListener('touchmove', function (e) {
        var diff = e.touches[0].clientX - startX;
        currentTranslate = touchStartTranslate + diff;
        track.style.transform = 'translateX(' + currentTranslate + 'px)';
    }, { passive: true });

    track.addEventListener('touchend', function () {
        var newIndex = Math.round(-currentTranslate / (cardWidth + gap));
        goToVirtual(newIndex);
        startAutoplay();
    }, { passive: true });

    /* =========================================
       RESIZE
    ========================================= */
    window.addEventListener('resize', function () {
        setPosition(false);
    }, { passive: true });
})();

/* =========================================
   TABS DE CIUDADES
========================================= */
(function () {
    var tabs = document.querySelectorAll('.ciudades__tab');
    tabs.forEach(function (tab) {
        tab.addEventListener('click', function () {
            tabs.forEach(function (t) {
                t.classList.remove('ciudades__tab--active');
                t.setAttribute('aria-selected', 'false');
            });
            tab.classList.add('ciudades__tab--active');
            tab.setAttribute('aria-selected', 'true');
            tab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        });
    });
})();

/* =========================================
   HERO SEARCH — prevent default
========================================= */
(function () {
    var form = document.querySelector('.hero__search');
    if (form) {
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            var btn = form.querySelector('.hero__search__btn');
            btn.textContent = 'Buscando...';
            setTimeout(function () { btn.textContent = 'Buscar Fechas'; }, 1800);
        });
    }
})();

/* =========================================
   BUSCADOR EN TIEMPO REAL
========================================= */
(function () {
    var input = document.querySelector('.buscador__input');
    var items = document.querySelectorAll('.articulos__item');

    if (input && items.length > 0) {
        input.addEventListener('input', function (e) {
            var query = e.target.value.toLowerCase().trim();

            items.forEach(function (item) {
                var nameElement = item.querySelector('.articulos_name');
                if (nameElement) {
                    var nameText = nameElement.textContent.toLowerCase();
                    // Buscamos coincidencia
                    if (nameText.indexOf(query) !== -1) {
                        item.style.display = 'flex';
                    } else {
                        item.style.display = 'none';
                    }
                }
            });
        });
    }
})();

/* =========================================
   FILTRADO Y NAVEGACIÓN POR CATEGORÍAS
   Nota: En el futuro esto será dinámico con 
   la base de datos, por ahora es estático.
========================================= */
(function () {
    const categoryButtons = document.querySelectorAll('.categoria__button');
    const articles = document.querySelectorAll('.articulos__item');
    const container = document.querySelector('#contenedor-articulos');

    if (categoryButtons.length > 0 && articles.length > 0) {
        categoryButtons.forEach(button => {
            button.addEventListener('click', () => {
                const selectedCategory = button.getAttribute('data-categoria');

                // Filtrar artículos
                articles.forEach(article => {
                    const articleCategory = article.getAttribute('data-categoria');
                    
                    if (selectedCategory === 'todo' || articleCategory === selectedCategory) {
                        article.style.display = 'flex';
                    } else {
                        article.style.display = 'none';
                    }
                });

                // Scroll suave hacia los resultados
                if (container) {
                    const headerOffset = 100;
                    const elementPosition = container.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    });
                }
            });
        });
    }
})();