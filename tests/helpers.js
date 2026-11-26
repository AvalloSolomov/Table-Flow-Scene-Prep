const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

const ROOT = path.resolve(__dirname, '..');
const SCRIPT_ORDER = require(path.join(ROOT, 'module.json')).scripts;

/**
 * Build a jsdom window with a minimal Foundry stand-in and load the module scripts into it.
 * @param {{isGM?: boolean, userId?: string, users?: object[], settings?: object}} options
 */
function createEnvironment({ isGM = false, userId = 'u-self', users = [], settings = {} } = {}) {
    const dom = new JSDOM('<!doctype html><html><head><title>Foundry VTT</title></head><body></body></html>', {
        url: 'http://localhost/',
        runScripts: 'outside-only',
        pretendToBeVisual: true
    });
    const { window } = dom;

    const registered = new Map();
    const stored = new Map(Object.entries(settings));
    const hooks = { on: [], once: [] };
    const notifications = [];
    const emitted = [];
    const socketListeners = [];

    const self = { id: userId, name: 'Self', isGM, active: true };
    const allUsers = [self, ...users];

    window.Hooks = {
        on: (name, fn) => hooks.on.push({ name, fn }),
        once: (name, fn) => hooks.once.push({ name, fn }),
        callAll: () => {}
    };
    window.foundry = { utils: { debounce: (fn) => fn } };
    window.ui = {
        notifications: {
            info: (m) => notifications.push(['info', m]),
            warn: (m) => notifications.push(['warn', m]),
            error: (m) => notifications.push(['error', m])
        }
    };
    window.game = {
        user: self,
        users: { values: () => allUsers.values(), get: (id) => allUsers.find(u => u.id === id) },
        modules: { get: () => undefined },
        journal: { get: () => undefined, has: () => false, contents: [] },
        socket: {
            on: (name, fn) => socketListeners.push({ name, fn }),
            emit: (name, data) => emitted.push({ name, data })
        },
        settings: {
            register: (module, key, config) => registered.set(`${module}.${key}`, config),
            get: (module, key) => {
                const id = `${module}.${key}`;
                if (stored.has(id)) return stored.get(id);
                const config = registered.get(id);
                if (!config) throw new Error(`Setting ${id} is not registered`);
                return config.default;
            },
            set: async (module, key, value) => {
                const id = `${module}.${key}`;
                stored.set(id, value);
                registered.get(id)?.onChange?.(value);
                return value;
            }
        }
    };

    for (const file of SCRIPT_ORDER) {
        window.eval(fs.readFileSync(path.join(ROOT, file), 'utf8'));
    }

    return {
        window,
        document: window.document,
        tfsp: window.TableFlowScenePrep,
        game: window.game,
        hooks,
        notifications,
        emitted,
        socketListeners,
        stored,
        /** Run every registered handler for a hook name */
        fireHook(name, ...args) {
            hooks.on.filter(h => h.name === name).forEach(h => h.fn(...args));
        },
        /** Register settings the way the init hook does */
        registerSettings() {
            window.TableFlowScenePrep.Settings.register();
        }
    };
}

module.exports = { createEnvironment, ROOT };
