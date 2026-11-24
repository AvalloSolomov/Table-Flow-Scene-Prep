const test = require('node:test');
const assert = require('node:assert/strict');
const { createEnvironment } = require('./helpers');

const MODULE = 'table-flow-scene-prep';

function setup({ isGM = false, users = [], settings = {} } = {}) {
    const env = createEnvironment({
        isGM,
        users,
        settings: Object.fromEntries(Object.entries(settings).map(([k, v]) => [`${MODULE}.${k}`, v]))
    });
    env.registerSettings();
    return env;
}

test('overlay: renders message, escapes names, and shows other online players', () => {
    const env = setup({
        users: [
            { id: 'p1', name: '<img src=x onerror=alert(1)>', isGM: false, active: true },
            { id: 'p2', name: 'Offline Olga', isGM: false, active: false },
            { id: 'gm', name: 'The GM', isGM: true, active: true }
        ]
    });
    env.game.user.name = '<b>Me</b>';
    env.tfsp.PlayerOverlay.show('Back in a minute <i>soon</i>');

    const overlay = env.document.getElementById(env.tfsp.PlayerOverlay.OVERLAY_ID);
    assert.equal(overlay.querySelectorAll('img[onerror]').length, 0, 'no injected elements');
    assert.equal(overlay.querySelector('.tfsp-overlay-message').textContent, 'Back in a minute <i>soon</i>');
    assert.ok(overlay.textContent.includes('<img src=x onerror=alert(1)>'));
    assert.ok(overlay.textContent.includes('<b>Me</b>'));
    assert.ok(!overlay.textContent.includes('Offline Olga'));
    assert.ok(!overlay.textContent.includes('The GM'));
    assert.match(overlay.querySelector('.tfsp-connected-players-pill').textContent, /^2 Connected$/);
});

test('overlay: show() twice leaves a single overlay', () => {
    const env = setup();
    env.tfsp.PlayerOverlay.show('a');
    env.tfsp.PlayerOverlay.show('b');
    assert.equal(env.document.querySelectorAll(`#${env.tfsp.PlayerOverlay.OVERLAY_ID}`).length, 1);
    assert.equal(env.document.querySelector('.tfsp-overlay-message').textContent, 'b');
});

test('overlay: hide() removes it and stops the tip timers', () => {
    const env = setup({ settings: { lockScreenTips: 'One\nTwo' } });
    env.tfsp.PlayerOverlay.show('a');
    assert.ok(env.tfsp.PlayerOverlay.tipInterval, 'tips rotate with more than one tip');
    env.tfsp.PlayerOverlay.hide();
    assert.equal(env.document.getElementById(env.tfsp.PlayerOverlay.OVERLAY_ID), null);
    assert.equal(env.tfsp.PlayerOverlay.tipInterval, null);
    assert.equal(env.tfsp.PlayerOverlay.tipSwapTimer, null);
});

test('overlay: tips box is omitted when there are no tips and can be updated live', async () => {
    const env = setup({ settings: { lockScreenTips: '' } });
    env.tfsp.PlayerOverlay.show('a');
    assert.equal(env.document.querySelector('.tfsp-overlay-tip'), null);
    assert.equal(env.tfsp.PlayerOverlay.tipInterval, null);

    env.tfsp.PlayerOverlay.updateTips(['One', 'Two']);
    assert.ok(env.document.querySelector('.tfsp-overlay-tip'));
    env.tfsp.PlayerOverlay.updateTips([]);
    assert.equal(env.document.querySelector('.tfsp-overlay-tip'), null);
    env.tfsp.PlayerOverlay.hide();
});

test('overlay: journal content is sanitized and can be added, replaced and removed', () => {
    const env = setup();
    env.tfsp.PlayerOverlay.show('a');
    assert.equal(env.document.querySelector('.tfsp-overlay-journal'), null);

    env.tfsp.PlayerOverlay.updateJournal({
        title: 'Recap <script>x</script>',
        html: '<p>Hello</p><script>window.pwned = true</script><img src=x onerror="window.pwned = true">'
    });
    const journal = env.document.querySelector('.tfsp-overlay-journal');
    assert.ok(journal);
    assert.equal(journal.querySelector('script'), null);
    assert.equal(journal.querySelector('[onerror]'), null);
    assert.equal(journal.querySelector('.tfsp-overlay-journal-title').textContent, 'Recap <script>x</script>');
    assert.match(journal.querySelector('.tfsp-overlay-journal-body').innerHTML, /<p>Hello<\/p>/);

    env.tfsp.PlayerOverlay.updateJournal({ title: 'New', html: '<p>Second</p>' });
    assert.equal(env.document.querySelectorAll('.tfsp-overlay-journal').length, 1);
    assert.match(env.document.querySelector('.tfsp-overlay-journal').textContent, /Second/);

    env.tfsp.PlayerOverlay.updateJournal(null);
    assert.equal(env.document.querySelector('.tfsp-overlay-journal'), null);
});

test('overlay: refreshPlayers updates the count and names in place and tolerates a missing overlay', () => {
    const p1 = { id: 'p1', name: 'Borin', isGM: false, active: true };
    const env = setup({ users: [p1] });
    assert.doesNotThrow(() => env.tfsp.PlayerOverlay.refreshPlayers());

    env.tfsp.PlayerOverlay.show('a');
    assert.match(env.document.querySelector('.tfsp-player-count').textContent, /Borin/);

    p1.active = false;
    env.tfsp.PlayerOverlay.refreshPlayers();
    assert.match(env.document.querySelector('.tfsp-player-count').textContent, /Just you/);
    assert.equal(env.document.querySelector('.tfsp-connected-players-pill').textContent, '1 Connected');
});

test('overlay: has no GM-only drag handle', () => {
    const env = setup({ isGM: true });
    env.tfsp.PlayerOverlay.show('a');
    assert.equal(env.document.querySelector('.tfsp-drag-handle'), null);
});

test('banner: show/hide manages the element, frame, tab title and document listeners', () => {
    const env = setup({ isGM: true, settings: { lockIndicator: 'bar-frame' } });
    const { GMBanner } = env.tfsp;
    const counts = {};
    const doc = env.document;
    const add = doc.addEventListener.bind(doc);
    const remove = doc.removeEventListener.bind(doc);
    doc.addEventListener = (type, ...rest) => { counts[type] = (counts[type] ?? 0) + 1; add(type, ...rest); };
    doc.removeEventListener = (type, ...rest) => { counts[type] = (counts[type] ?? 0) - 1; remove(type, ...rest); };

    for (let i = 0; i < 3; i++) GMBanner.show();
    assert.equal(doc.querySelectorAll(`#${GMBanner.BANNER_ID}`).length, 1);
    assert.equal(doc.querySelectorAll(`#${GMBanner.FRAME_ID}`).length, 1);
    assert.equal(doc.title, '🔒 LOCKED - Foundry VTT');

    GMBanner.hide();
    assert.equal(doc.getElementById(GMBanner.BANNER_ID), null);
    assert.equal(doc.getElementById(GMBanner.FRAME_ID), null);
    assert.equal(doc.title, 'Foundry VTT');
    for (const type of ['mousemove', 'mouseup', 'touchmove', 'touchend']) {
        assert.equal(counts[type] ?? 0, 0, `document "${type}" listeners balanced after hide`);
    }
});

test('banner: respects the show-banner setting and updates the waiting count', () => {
    const env = setup({
        isGM: true,
        users: [{ id: 'p1', name: 'Aria', isGM: false, active: true }]
    });
    const { GMBanner } = env.tfsp;

    env.stored.set(`${MODULE}.showBanner`, false);
    GMBanner.show();
    assert.equal(env.document.getElementById(GMBanner.BANNER_ID), null);

    env.stored.set(`${MODULE}.showBanner`, true);
    GMBanner.show();
    const badge = env.document.querySelector('.tfsp-banner-badge');
    assert.match(badge.textContent, /1 waiting/);

    env.game.users.get('p1').active = false;
    GMBanner.updateCount();
    assert.equal(badge.style.display, 'none');
    GMBanner.hide();
});

test('banner: clicking it unlocks the session and notifies the GM', async () => {
    const env = setup({ isGM: true, settings: { isLocked: true } });
    env.tfsp.GMBanner.show();
    env.document.getElementById(env.tfsp.GMBanner.BANNER_ID).onclick({ target: env.document.body });
    await new Promise(resolve => setTimeout(resolve, 0));
    assert.equal(env.tfsp.Settings.isLocked(), false);
    assert.ok(env.emitted.some(e => e.data.action === 'unlock'));
    assert.ok(env.notifications.some(([, m]) => /unlocked/i.test(m)));
});

test('banner: non-GM clients cannot unlock from the banner handler', async () => {
    const env = setup({ isGM: false, settings: { isLocked: true } });
    await env.tfsp.GMBanner._handleBannerUnlockClick();
    assert.equal(env.tfsp.Settings.isLocked(), true);
    assert.equal(env.emitted.length, 0);
});

test('floating button: states, click opens the panel, and remove() cleans up', () => {
    const env = setup({ isGM: true, users: [{ id: 'p1', name: 'Aria', isGM: false, active: true }] });
    const { FloatingButton, GMInterface } = env.tfsp;

    FloatingButton.create();
    assert.ok(env.document.getElementById(FloatingButton.BUTTON_ID));
    assert.match(FloatingButton.button.className, /tfsp-btn-unlocked/);

    env.stored.set(`${MODULE}.isLocked`, true);
    FloatingButton.updateState();
    assert.match(FloatingButton.button.className, /tfsp-btn-waiting/);
    assert.match(FloatingButton.button.textContent, /1\s*waiting/);

    env.game.users.get('p1').active = false;
    FloatingButton.updateState();
    assert.match(FloatingButton.button.className, /tfsp-btn-locked/);
    assert.doesNotMatch(FloatingButton.button.className, /waiting/);

    FloatingButton.button.dispatchEvent(new env.window.MouseEvent('mousedown', { bubbles: true, clientX: 5, clientY: 5 }));
    env.document.dispatchEvent(new env.window.MouseEvent('mouseup', { bubbles: true }));
    assert.ok(env.document.getElementById(GMInterface.INTERFACE_ID), 'click without moving opens the panel');

    FloatingButton.remove();
    assert.equal(env.document.getElementById(FloatingButton.BUTTON_ID), null);
    assert.equal(FloatingButton.button, null);
    assert.equal(FloatingButton._attachTimer, null);
});
