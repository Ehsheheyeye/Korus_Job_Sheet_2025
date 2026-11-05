/*
 * Full-screen blur loader.
 * - Shows on every page load / reload.
 * - Shows again whenever the user clicks a button, link, menu item or dashboard card.
 * - While it is showing, the user cannot click, type or scroll anything.
 * - It stays for LOADER_DURATION_MS, then disappears.
 *
 * To change how long it shows, edit LOADER_DURATION_MS below.
 */
(function () {
    const LOADER_DURATION_MS = 3 * 60 * 1000; // 3 minutes

    // Things that count as an "action" and start the loader when clicked.
    const ACTION_SELECTOR = [
        'a[href]',
        'button',
        '[role="button"]',
        'input[type="submit"]',
        'input[type="button"]',
        '.nav-link',
        '.clickable-card'
    ].join(',');

    const blocker = document.getElementById('app-blocker');
    if (!blocker) return;

    // Use the saved dark/light theme straight away, so the loader matches it.
    try {
        if (localStorage.getItem('theme') === 'dark') document.body.classList.add('dark');
    } catch (err) { /* storage not available */ }

    let hideTimer = null;

    function isActive() {
        return blocker.classList.contains('is-active');
    }

    function show() {
        if (isActive()) return;

        if (document.activeElement && document.activeElement !== document.body) {
            document.activeElement.blur();
        }
        document.body.classList.add('app-blocked');
        blocker.classList.add('is-active');
        blocker.setAttribute('aria-hidden', 'false');

        hideTimer = setTimeout(hide, LOADER_DURATION_MS);
    }

    function hide() {
        clearTimeout(hideTimer);
        hideTimer = null;
        blocker.classList.remove('is-active');
        blocker.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('app-blocked');
    }

    // Block every click, tap, key press and scroll while the loader is showing.
    // Only real user input is blocked; the app's own code (e.g. switching page
    // after Save) must still work behind the loader.
    function blockWhileActive(e) {
        if (!isActive() || !e.isTrusted) return;
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
    }
    ['click', 'dblclick', 'mousedown', 'mouseup', 'pointerdown', 'pointerup',
     'touchstart', 'touchend', 'contextmenu', 'keydown', 'keypress', 'keyup',
     'wheel', 'submit'].forEach(type => {
        window.addEventListener(type, blockWhileActive, { capture: true, passive: false });
    });

    // Start the loader when the user clicks an action. The click still does its
    // normal job (open page, save, etc.) behind the blur.
    document.addEventListener('click', e => {
        if (!e.isTrusted || isActive()) return;
        const target = e.target.closest(ACTION_SELECTOR);
        if (!target || blocker.contains(target)) return;
        show();
    }, true);

    // Show on page load / reload.
    show();
})();
