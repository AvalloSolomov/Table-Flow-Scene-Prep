const test = require('node:test');
const assert = require('node:assert/strict');
const { createEnvironment } = require('./helpers');

const MODULE = 'table-flow-scene-prep';

test('DOMHelpers.escapeHTML escapes markup characters', () => {
    const { tfsp } = createEnvironment();
    assert.equal(tfsp.DOMHelpers.escapeHTML(`<b onclick="x">'&</b>`), '&lt;b onclick=&quot;x&quot;&gt;&#39;&amp;&lt;/b&gt;');
    assert.equal(tfsp.DOMHelpers.escapeHTML(null), '');
});

test('DOMHelpers.sanitizeHTML removes scripts, handlers and javascript: URLs but keeps normal markup', () => {
    const { tfsp } = createEnvironment();
    const out = tfsp.DOMHelpers.sanitizeHTML(
        '<p class="a">Hello <strong>world</strong></p>' +
        '<script>alert(1)</script>' +
        '<img src="x.png" onerror="alert(1)">' +
        '<a href="javascript:alert(1)">bad</a>' +
        '<a href=" JaVa\tScRiPt:alert(1)">bad2</a>' +
        '<a href="https://example.com">ok</a>' +
        '<iframe src="https://example.com"></iframe>'
    );
    assert.match(out, /<p class="a">Hello <strong>world<\/strong><\/p>/);
    assert.match(out, /<a href="https:\/\/example.com">ok<\/a>/);
    assert.doesNotMatch(out, /script/i);
    assert.doesNotMatch(out, /onerror/i);
    assert.doesNotMatch(out, /javascript:/i);
    assert.doesNotMatch(out, /iframe/i);
});

test('Settings: defaults, tip parsing, and indicator fallback', async () => {
    const env = createEnvironment();
    env.registerSettings();
    const { Settings } = env.tfsp;

    assert.equal(Settings.isLocked(), false);
    assert.equal(Settings.getButtonAnchor(), 'free');
    assert.equal(Settings.getBannerTopPosition(), 100);
    assert.deepEqual([...Settings.getLockScreenTips()], [], 'no default tips ship with the module');

    await Settings.setLockScreenTips('• one\n\n  • two  \n');
    assert.deepEqual([...Settings.getLockScreenTips()], ['one', 'two']);

    await Settings.setLockScreenTipsTitle('   ');
    assert.equal(Settings.getLockScreenTipsTitle(), 'Tips & Trivia');

    env.stored.set(`${MODULE}.lockIndicator`, 'nonsense');
    assert.equal(Settings.getLockIndicator(), 'bar');
    await Settings.setLockIndicator('compact');
    assert.equal(Settings.getLockIndicator(), 'compact');
});

test('Settings: every setting the code reads is registered', () => {
    const env = createEnvironment();
    env.registerSettings();
    const { Settings } = env.tfsp;
    for (const getter of ['isLocked', 'getLockoutMessage', 'getAutoLock', 'getShowBanner', 'getBannerTopPosition',
        'getButtonAnchor', 'getLockScreenJournalId', 'getLockScreenJournalPageId', 'getLockScreenTips',
        'getLockIndicator', 'getLockScreenTipsTitle', 'getLockScreenJournalContent', 'getLockScreenBackground']) {
        assert.doesNotThrow(() => Settings[getter](), getter);
    }
});

test('Settings: background accepts only the two built-in choices', async () => {
    const gm = createEnvironment({ isGM: true });
    gm.registerSettings();
    const settings = gm.tfsp.Settings;
    assert.equal(settings.getLockScreenBackground(), 'dark');
    await settings.setLockScreenBackground('dice');
    assert.equal(settings.getLockScreenBackground(), 'dice');
    await assert.rejects(settings.setLockScreenBackground('worlds/example/custom.png'), /built-in/);
    assert.equal(settings.getLockScreenBackground(), 'dice');
    const player = createEnvironment();
    player.registerSettings();
    await assert.rejects(player.tfsp.Settings.setLockScreenBackground('dice'), /Only a GM/);
});

test('Settings: a player client shows and hides the overlay when the lock setting changes', async () => {
    const env = createEnvironment({ isGM: false });
    env.registerSettings();
    const overlayId = env.tfsp.PlayerOverlay.OVERLAY_ID;

    await env.tfsp.Settings.setLocked(true);
    assert.ok(env.document.getElementById(overlayId), 'overlay shown on lock');

    await env.tfsp.Settings.setLocked(false);
    assert.equal(env.document.getElementById(overlayId), null, 'overlay removed on unlock');
});

test('Settings: a GM client shows the banner, never the player overlay', async () => {
    const env = createEnvironment({ isGM: true });
    env.registerSettings();

    await env.tfsp.Settings.setLocked(true);
    assert.ok(env.document.getElementById(env.tfsp.GMBanner.BANNER_ID));
    assert.equal(env.document.getElementById(env.tfsp.PlayerOverlay.OVERLAY_ID), null);

    await env.tfsp.Settings.setLocked(false);
    assert.equal(env.document.getElementById(env.tfsp.GMBanner.BANNER_ID), null);
});
