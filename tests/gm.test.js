const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createEnvironment, ROOT } = require('./helpers');

const MODULE = 'table-flow-scene-prep';

function setup({ isGM = true, users = [], settings = {} } = {}) {
    const env = createEnvironment({
        isGM,
        users,
        settings: Object.fromEntries(Object.entries(settings).map(([k, v]) => [`${MODULE}.${k}`, v]))
    });
    env.registerSettings();
    return env;
}

const tick = () => new Promise(resolve => setTimeout(resolve, 0));

test('GM panel: non-GMs cannot open it', () => {
    const env = setup({ isGM: false });
    env.tfsp.GMInterface.show();
    assert.equal(env.document.getElementById(env.tfsp.GMInterface.INTERFACE_ID), null);
});

test('GM panel: opens, escapes player names and the saved message, and closes cleanly', () => {
    const env = setup({
        users: [{ id: 'p1', name: '<img src=x onerror=alert(1)>', isGM: false, active: true }],
        settings: { lockoutMessage: '</textarea><script>window.pwned=1</script>' }
    });
    const { GMInterface } = env.tfsp;
    GMInterface.show();
    GMInterface.toggleSettings();

    const panel = env.document.getElementById(GMInterface.INTERFACE_ID);
    assert.equal(panel.querySelector('.tfsp-player-list img'), null);
    assert.ok(panel.querySelector('.tfsp-player-list').textContent.includes('<img src=x onerror=alert(1)>'));

    const settings = env.document.getElementById(GMInterface.SETTINGS_ID);
    assert.equal(env.document.querySelector('script'), null);
    assert.equal(settings.querySelector('#table-flow-scene-prep-message').value, '</textarea><script>window.pwned=1</script>');

    GMInterface.hide();
    assert.equal(env.document.getElementById(GMInterface.INTERFACE_ID), null);
    assert.equal(env.document.getElementById(GMInterface.SETTINGS_ID), null);
});

test('GM panel: header buttons are Lucide icons, not text glyphs', () => {
    const env = setup();
    env.tfsp.GMInterface.show();
    const buttons = env.document.querySelectorAll('.tfsp-header-btn');
    assert.equal(buttons.length, 3);
    for (const button of buttons) {
        assert.ok(button.querySelector('.tfsp-icon'), button.id);
        assert.equal(button.textContent.trim(), '');
        assert.ok(button.getAttribute('aria-label'));
    }
});

test('GM panel: settings toggle opens and closes the popup', () => {
    const env = setup();
    const { GMInterface } = env.tfsp;
    GMInterface.show();
    GMInterface.toggleSettings();
    assert.ok(env.document.getElementById(GMInterface.SETTINGS_ID));
    GMInterface.toggleSettings();
    assert.equal(env.document.getElementById(GMInterface.SETTINGS_ID), null);
});

test('GM panel: Lock Session locks the world, notifies players, shows the banner', async () => {
    const env = setup({ users: [{ id: 'p1', name: 'Aria', isGM: false, active: true }] });
    env.tfsp.GMInterface.show();
    env.document.getElementById('gm-lock-button').click();
    await tick();

    assert.equal(env.tfsp.Settings.isLocked(), true);
    assert.ok(env.emitted.some(e => e.data.action === 'lock'));
    assert.ok(env.document.getElementById(env.tfsp.GMBanner.BANNER_ID));
    assert.ok(env.notifications.some(([, m]) => /locked.*1 online player\./i.test(m)));
});

test('GM panel: Unlock Session unlocks the world and removes the banner', async () => {
    const env = setup({ settings: { isLocked: true } });
    env.tfsp.GMBanner.show();
    env.tfsp.GMInterface.show();
    env.document.getElementById('gm-unlock-button').click();
    await tick();

    assert.equal(env.tfsp.Settings.isLocked(), false);
    assert.ok(env.emitted.some(e => e.data.action === 'unlock'));
    assert.equal(env.document.getElementById(env.tfsp.GMBanner.BANNER_ID), null);
});

test('GM panel: Resync only works while locked and with players online', async () => {
    const env = setup({ users: [{ id: 'p1', name: 'Aria', isGM: false, active: true }] });
    await env.tfsp.GMInterface._handleResyncLockScreens();
    assert.equal(env.emitted.length, 0);
    assert.ok(env.notifications.some(([type]) => type === 'warn'));

    env.stored.set(`${MODULE}.isLocked`, true);
    await env.tfsp.GMInterface._handleResyncLockScreens();
    assert.deepEqual(env.emitted.map(e => e.data.targetUserId), ['p1']);

    env.game.users.get('p1').active = false;
    env.emitted.length = 0;
    await env.tfsp.GMInterface._handleResyncLockScreens();
    assert.equal(env.emitted.length, 0);
});

test('GM panel: Save Settings validates and applies every field', async () => {
    const env = setup({ settings: { isLocked: true } });
    const { GMInterface, Settings } = env.tfsp;
    GMInterface.show();
    GMInterface.toggleSettings();
    const $ = (id) => env.document.getElementById(id);

    $('setting-show-banner').checked = true;
    $('setting-banner-position').value = '9999';
    $('setting-auto-lock').checked = true;
    $('setting-button-anchor').value = 'bottom-left';
    $('setting-lock-indicator').value = 'compact';
    assert.deepEqual([...$('setting-lock-background').options].map(option => option.value), ['dark', 'dice']);
    $('setting-lock-background').value = 'dice';
    $('setting-lock-tips-title').value = 'Fun Facts';
    $('setting-lock-tips').value = '• First\n- Second\n3. Third\n\n';
    $('save-settings-button').click();
    await tick();

    assert.equal(Settings.getBannerTopPosition(), 300);
    assert.equal(Settings.getAutoLock(), true);
    assert.equal(Settings.getButtonAnchor(), 'bottom-left');
    assert.equal(Settings.getLockIndicator(), 'compact');
    assert.equal(Settings.getLockScreenBackground(), 'dice');
    assert.equal(Settings.getLockScreenTipsTitle(), 'Fun Facts');
    assert.deepEqual([...Settings.getLockScreenTips()], ['First', 'Second', 'Third']);
    assert.ok(env.notifications.some(([, m]) => m === 'Settings saved'));
    GMInterface.toggleSettings();
    GMInterface.toggleSettings();
    assert.equal($('setting-lock-background').value, 'dice');
});

test('GM panel: background save failures are reported without a success notification', async () => {
    const env = setup();
    env.tfsp.GMInterface.show();
    env.tfsp.GMInterface.toggleSettings();
    env.tfsp.Settings.setLockScreenBackground = async () => { throw new Error('Write denied'); };
    await env.tfsp.GMInterface._handleSaveSettings();
    assert.ok(env.notifications.some(([type, message]) => type === 'error' && message.includes('Write denied')));
    assert.equal(env.notifications.some(([, message]) => message === 'Settings saved'), false);
});

test('GM panel: Save Message stores and broadcasts a non-empty message, ignores an empty one', async () => {
    const env = setup();
    env.tfsp.GMInterface.show();
    env.tfsp.GMInterface.toggleSettings();
    const box = env.document.getElementById('table-flow-scene-prep-message');

    box.value = '   ';
    env.document.getElementById('save-message-button').click();
    await tick();
    assert.equal(env.emitted.length, 0);

    box.value = ' New message ';
    env.document.getElementById('save-message-button').click();
    await tick();
    assert.equal(env.tfsp.Settings.getLockoutMessage(), 'New message');
    assert.ok(env.emitted.some(e => e.data.action === 'messageUpdate'));
});

test('GM panel: journal drop rejects compendium and non-journal documents, links world journals', async () => {
    const page = { id: 'pg1', name: 'Recap', type: 'text', documentName: 'JournalEntryPage' };
    const entry = {
        id: 'j1', name: 'Session 1', pages: { size: 1, get: (id) => (id === 'pg1' ? page : undefined), contents: [page], find: (fn) => [page].find(fn) },
        documentName: 'JournalEntry'
    };
    page.parent = entry;
    const env = setup();
    env.game.journal = { get: (id) => (id === 'j1' ? entry : undefined), has: (id) => id === 'j1', contents: [entry] };
    env.window.fromUuid = async (uuid) => ({ page, entry, bad: null }[uuid] ?? null);
    const { GMInterface, Settings } = env.tfsp;

    await GMInterface._handleJournalDrop({ uuid: 'bad' });
    assert.ok(env.notifications.some(([type]) => type === 'warn'));

    entry.pack = 'world.some-pack';
    await GMInterface._handleJournalDrop({ uuid: 'page' });
    assert.equal(Settings.getLockScreenJournalId(), '');
    delete entry.pack;

    env.window.foundry.applications = { ux: { TextEditor: { implementation: { enrichHTML: async (html) => html } } } };
    await GMInterface._handleJournalDrop({ uuid: 'page' });
    assert.equal(Settings.getLockScreenJournalId(), 'j1');
    assert.equal(Settings.getLockScreenJournalPageId(), 'pg1');
});

test('hooks: init registers settings; ready initialises a player client behind the lock screen', async () => {
    const env = createEnvironment({
        isGM: false,
        settings: { [`${MODULE}.isLocked`]: true }
    });
    assert.ok(env.hooks.once.some(h => h.name === 'init'));
    env.hooks.once.find(h => h.name === 'init').fn();

    const realSetTimeout = env.window.setTimeout;
    env.window.setTimeout = (fn) => { fn(); return 0; };
    env.hooks.once.find(h => h.name === 'ready').fn();
    await tick();
    env.window.setTimeout = realSetTimeout;

    assert.ok(env.document.getElementById(env.tfsp.PlayerOverlay.OVERLAY_ID));
    assert.equal(env.socketListeners.length, 1);
});

test('hooks: userConnected re-sends the lock only to users who just connected, and only while locked', () => {
    const env = setup({ settings: { isLocked: true } });
    env.hooks.once.length = 0;
    const timers = [];
    env.window.setTimeout = (fn) => { timers.push(fn); return 0; };

    env.fireHook('userConnected', { id: 'p1' }, true);
    timers.splice(0).forEach(fn => fn());
    assert.deepEqual(env.emitted.filter(e => e.data.action === 'lock').map(e => e.data.targetUserId), ['p1']);

    env.emitted.length = 0;
    env.fireHook('userConnected', { id: 'p1' }, false);
    timers.splice(0).forEach(fn => fn());
    assert.equal(env.emitted.length, 0, 'no lock re-sent on disconnect');

    env.stored.set(`${MODULE}.isLocked`, false);
    env.fireHook('userConnected', { id: 'p2' }, true);
    timers.splice(0).forEach(fn => fn());
    assert.equal(env.emitted.length, 0, 'no lock re-sent while unlocked');
});

test('hooks: the module registers no userDisconnected hook (Foundry has none)', () => {
    const env = createEnvironment();
    assert.equal(env.hooks.on.filter(h => h.name === 'userDisconnected').length, 0);
});

test('manifest: files, icons and version are consistent', () => {
    const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'module.json'), 'utf8'));
    assert.equal(manifest.id, MODULE);
    assert.match(manifest.version, /^\d+\.\d+\.\d+$/);
    assert.ok(manifest.title && manifest.description && manifest.authors?.length);
    assert.ok(Number(manifest.compatibility.minimum) <= 14);

    for (const file of [...manifest.scripts, ...manifest.styles, manifest.readme]) {
        assert.ok(fs.existsSync(path.join(ROOT, file)), `${file} exists`);
    }

    const css = fs.readFileSync(path.join(ROOT, 'styles/table-flow-scene-prep.css'), 'utf8');
    const icons = [...css.matchAll(/url\('\.\.\/(icons\/[a-z-]+\.svg)'\)/g)].map(m => m[1]);
    assert.ok(icons.length > 0);
    for (const icon of icons) {
        assert.ok(fs.existsSync(path.join(ROOT, icon)), `${icon} exists`);
    }

    const workflow = fs.readFileSync(path.join(ROOT, '.github/workflows/release.yml'), 'utf8');
    assert.match(workflow, /zip -r module\.zip [^\n]*\bicons\b/, 'release zip includes icons/');
    assert.ok(fs.existsSync(path.join(ROOT, 'icons/LICENSE')), 'icon license is shipped');
    for (const asset of ['TABLEFLOW_LOGO.svg', 'LICENSE']) {
        assert.ok(fs.existsSync(path.join(ROOT, asset)), asset);
    }
});

test('icons: every shipped SVG is Lucide-style (24x24 stroke, currentColor) and none are unused', () => {
    const dir = path.join(ROOT, 'icons');
    const css = fs.readFileSync(path.join(ROOT, 'styles/table-flow-scene-prep.css'), 'utf8');
    for (const file of fs.readdirSync(dir).filter(f => f.endsWith('.svg'))) {
        const svg = fs.readFileSync(path.join(dir, file), 'utf8');
        assert.match(svg, /viewBox="0 0 24 24"/, file);
        assert.match(svg, /stroke="currentColor"/, file);
        assert.match(svg, /stroke-width="2"/, file);
        assert.ok(css.includes(`icons/${file}`), `${file} is referenced by the stylesheet`);
    }
});

test('source: no development leftovers in shipped scripts', () => {
    for (const dir of ['scripts/core', 'scripts/ui', 'scripts/utils', 'scripts']) {
        const full = path.join(ROOT, dir);
        for (const file of fs.readdirSync(full).filter(f => f.endsWith('.js'))) {
            const code = fs.readFileSync(path.join(full, file), 'utf8');
            assert.doesNotMatch(code, /console\.(log|debug)\(|debugger;|TODO|FIXME|localhost|\bfa-[a-z]|class="fas? /, `${dir}/${file}`);
        }
    }
});
