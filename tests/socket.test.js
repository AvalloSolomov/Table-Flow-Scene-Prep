const test = require('node:test');
const assert = require('node:assert/strict');
const { createEnvironment } = require('./helpers');

const MODULE = 'table-flow-scene-prep';

function send(env, data) {
    env.tfsp.SocketHandler.initialize();
    const listener = env.socketListeners.find(l => l.name === `module.${MODULE}`);
    listener.fn(data);
}

function playerEnv(settings = {}) {
    const env = createEnvironment({ isGM: false, settings: Object.fromEntries(Object.entries(settings).map(([k, v]) => [`${MODULE}.${k}`, v])) });
    env.registerSettings();
    return env;
}

test('socket: initialize registers one listener and is idempotent', () => {
    const env = playerEnv();
    env.tfsp.SocketHandler.initialize();
    env.tfsp.SocketHandler.initialize();
    assert.equal(env.socketListeners.filter(l => l.name === `module.${MODULE}`).length, 1);
});

test('socket: player shows the overlay on lock using the stored message, not the payload', () => {
    const env = playerEnv({ isLocked: true, lockoutMessage: 'Real message' });
    send(env, { action: 'lock', message: 'Forged message' });
    const overlay = env.document.getElementById(env.tfsp.PlayerOverlay.OVERLAY_ID);
    assert.ok(overlay);
    assert.match(overlay.textContent, /Real message/);
    assert.doesNotMatch(overlay.textContent, /Forged message/);
});

test('socket: a forged lock is ignored while the world is unlocked', () => {
    const env = playerEnv({ isLocked: false });
    send(env, { action: 'lock', message: 'x' });
    assert.equal(env.document.getElementById(env.tfsp.PlayerOverlay.OVERLAY_ID), null);
});

test('socket: a forged unlock cannot dismiss the lock screen while locked', () => {
    const env = playerEnv({ isLocked: true });
    env.tfsp.PlayerOverlay.show('Locked');
    send(env, { action: 'unlock' });
    assert.ok(env.document.getElementById(env.tfsp.PlayerOverlay.OVERLAY_ID));
});

test('socket: a real unlock removes the lock screen', async () => {
    const env = playerEnv({ isLocked: true });
    env.tfsp.PlayerOverlay.show('Locked');
    env.stored.set(`${MODULE}.isLocked`, false);
    send(env, { action: 'unlock' });
    assert.equal(env.document.getElementById(env.tfsp.PlayerOverlay.OVERLAY_ID), null);
});

test('socket: messages targeted at another user are ignored', () => {
    const env = playerEnv({ isLocked: true });
    send(env, { action: 'lock', targetUserId: 'someone-else' });
    assert.equal(env.document.getElementById(env.tfsp.PlayerOverlay.OVERLAY_ID), null);
    send(env, { action: 'lock', targetUserId: 'u-self' });
    assert.ok(env.document.getElementById(env.tfsp.PlayerOverlay.OVERLAY_ID));
});

test('socket: malformed payloads are ignored', () => {
    const env = playerEnv({ isLocked: true });
    assert.doesNotThrow(() => send(env, undefined));
    assert.doesNotThrow(() => send(env, {}));
    assert.doesNotThrow(() => send(env, { action: 'nonsense' }));
    assert.equal(env.document.getElementById(env.tfsp.PlayerOverlay.OVERLAY_ID), null);
});

test('socket: message and journal updates only apply while locked', () => {
    const env = playerEnv({ isLocked: true, lockoutMessage: 'First' });
    env.tfsp.PlayerOverlay.show('First');
    env.stored.set(`${MODULE}.lockoutMessage`, 'Second');
    send(env, { action: 'messageUpdate' });
    assert.match(env.document.querySelector('.tfsp-overlay-message').textContent, /Second/);
    assert.doesNotThrow(() => send(env, { action: 'journalUpdate' }));
});

test('socket: a GM client only reacts to lock events that match the world setting', () => {
    const env = createEnvironment({ isGM: true });
    env.registerSettings();
    const bannerId = env.tfsp.GMBanner.BANNER_ID;

    send(env, { action: 'lock' });
    assert.equal(env.document.getElementById(bannerId), null, 'forged lock ignored while unlocked');

    env.stored.set(`${MODULE}.isLocked`, true);
    send(env, { action: 'lock' });
    assert.ok(env.document.getElementById(bannerId));

    env.stored.set(`${MODULE}.isLocked`, false);
    send(env, { action: 'unlock' });
    assert.equal(env.document.getElementById(bannerId), null);
});

test('socket: emit helpers send the expected actions', () => {
    const env = playerEnv();
    const { SocketHandler } = env.tfsp;
    SocketHandler.emitLock('hi', 'u1');
    SocketHandler.emitUnlock();
    SocketHandler.emitMessageUpdate('m');
    SocketHandler.emitJournalUpdate();
    assert.deepEqual(env.emitted.map(e => e.data.action), ['lock', 'unlock', 'messageUpdate', 'journalUpdate']);
    assert.equal(env.emitted[0].data.targetUserId, 'u1');
    assert.ok(env.emitted.every(e => e.name === `module.${MODULE}`));
});
