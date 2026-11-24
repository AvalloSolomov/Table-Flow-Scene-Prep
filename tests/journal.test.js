const test = require('node:test');
const assert = require('node:assert/strict');
const { createEnvironment } = require('./helpers');

const MODULE = 'table-flow-scene-prep';

function journalEnv({ isGM, pageType = 'text', content = '<p>Recap</p>' }) {
    const page = { id: 'pg1', name: 'Recap', type: pageType, text: { content } };
    const entry = { id: 'j1', name: 'Session 1', pages: { size: 1, get: (id) => (id === 'pg1' ? page : undefined), contents: [page] } };
    page.parent = entry;
    const env = createEnvironment({
        isGM,
        settings: {
            [`${MODULE}.lockScreenJournalId`]: 'j1',
            [`${MODULE}.lockScreenJournalPageId`]: 'pg1'
        }
    });
    env.game.journal = { get: (id) => (id === 'j1' ? entry : undefined), has: (id) => id === 'j1', contents: [entry] };
    env.window.foundry.applications = {
        ux: { TextEditor: { implementation: { enrichHTML: async (html, options) => { env.enrichOptions = options; return html; } } } }
    };
    env.registerSettings();
    return { env, page, entry };
}

test('journal: sanitizing keeps links, content links, data attributes, images and styling', () => {
    const { tfsp } = createEnvironment();
    const html = '<h2>Title</h2>' +
        '<a class="content-link" data-uuid="JournalEntry.abc" data-link draggable="true">Link</a>' +
        '<img src="modules/x/map.png" alt="Map" style="width:100%">' +
        '<table><tr><td style="color:red">Cell</td></tr></table>' +
        '<ul><li>One</li></ul><em>em</em>';
    const out = tfsp.DOMHelpers.sanitizeHTML(html);
    for (const expected of ['<h2>Title</h2>', 'class="content-link"', 'data-uuid="JournalEntry.abc"', 'draggable="true"',
        'src="modules/x/map.png"', 'style="width:100%"', '<td style="color:red">Cell</td>', '<li>One</li>', '<em>em</em>']) {
        assert.ok(out.includes(expected), `keeps ${expected}`);
    }
});

test('journal: the GM publishes a snapshot with secrets stripped, and players read it', async () => {
    const gm = journalEnv({ isGM: true, content: '<p>Public</p><section class="secret">Hidden</section>' });
    await gm.env.tfsp.Settings.refreshLockScreenJournalSnapshot();
    assert.equal(gm.env.enrichOptions.secrets, false);

    const snapshot = gm.env.stored.get(`${MODULE}.lockScreenJournalSnapshot`);
    assert.equal(snapshot.pageId, 'pg1');
    assert.equal(snapshot.title, 'Recap');

    const player = journalEnv({ isGM: false });
    player.env.stored.set(`${MODULE}.lockScreenJournalSnapshot`, snapshot);
    player.env.stored.set(`${MODULE}.isLocked`, true);
    player.env.tfsp.PlayerOverlay.show('Locked');
    const body = player.env.document.querySelector('.tfsp-overlay-journal-body');
    assert.match(body.innerHTML, /Public/);
});

test('journal: non-text pages publish a notice instead of content', async () => {
    const { env } = journalEnv({ isGM: true, pageType: 'image' });
    await env.tfsp.Settings.refreshLockScreenJournalSnapshot();
    assert.match(env.stored.get(`${MODULE}.lockScreenJournalSnapshot`).html, /cannot be displayed/);
});

test('journal: unlinking clears the snapshot and removes the box from a live lock screen', async () => {
    const { env } = journalEnv({ isGM: true });
    await env.tfsp.Settings.refreshLockScreenJournalSnapshot();
    assert.ok(env.tfsp.Settings.getLockScreenJournalContent());

    await env.tfsp.Settings.setLockScreenJournal('', '');
    assert.equal(env.tfsp.Settings.getLockScreenJournalContent(), null);
});

test('journal: players cannot publish a snapshot', async () => {
    const { env } = journalEnv({ isGM: false });
    await env.tfsp.Settings.refreshLockScreenJournalSnapshot();
    assert.equal(env.stored.has(`${MODULE}.lockScreenJournalSnapshot`), false);
});

test('journal: a stored snapshot with hostile HTML cannot run script on the lock screen', () => {
    const env = createEnvironment({
        isGM: false,
        settings: {
            [`${MODULE}.isLocked`]: true,
            [`${MODULE}.lockScreenJournalSnapshot`]: {
                pageId: 'p', title: 'T',
                html: '<img src=x onerror="window.pwned=1"><svg onload="window.pwned=1"></svg><a href="javascript:window.pwned=1">x</a>'
            }
        }
    });
    env.registerSettings();
    env.tfsp.PlayerOverlay.show('Locked');
    const body = env.document.querySelector('.tfsp-overlay-journal-body');
    assert.doesNotMatch(body.innerHTML, /onerror|onload|javascript:/i);
});

test('lock flow: a player who connects while locked gets the lock screen; unlock clears it', async () => {
    const env = createEnvironment({ isGM: false, settings: { [`${MODULE}.isLocked`]: true } });
    env.registerSettings();
    const ready = env.hooks.once.find(h => h.name === 'ready').fn;
    const realSetTimeout = env.window.setTimeout;
    env.window.setTimeout = (fn) => { fn(); return 0; };
    ready();
    await new Promise(resolve => setTimeout(resolve, 0));
    env.window.setTimeout = realSetTimeout;
    assert.ok(env.document.getElementById(env.tfsp.PlayerOverlay.OVERLAY_ID));

    await env.tfsp.Settings.setLocked(false);
    assert.equal(env.document.getElementById(env.tfsp.PlayerOverlay.OVERLAY_ID), null);
});

test('lock flow: auto-lock on startup locks the world and notifies players once', async () => {
    const env = createEnvironment({ isGM: true, settings: { [`${MODULE}.autoLock`]: true } });
    env.registerSettings();
    const ready = env.hooks.once.find(h => h.name === 'ready').fn;
    const realSetTimeout = env.window.setTimeout;
    env.window.setTimeout = (fn) => { fn(); return 0; };
    ready();
    await new Promise(resolve => setTimeout(resolve, 10));
    env.window.setTimeout = realSetTimeout;

    assert.equal(env.tfsp.Settings.isLocked(), true);
    assert.equal(env.emitted.filter(e => e.data.action === 'lock').length, 1);
    assert.ok(env.document.getElementById(env.tfsp.GMBanner.BANNER_ID));
    assert.ok(env.document.getElementById(env.tfsp.FloatingButton.BUTTON_ID));
    env.tfsp.FloatingButton.remove();
});
