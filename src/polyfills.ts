/**
 * Polyfill for sockjs-client
 * @see https://github.com/sockjs/sockjs-client/issues/439
 */
(function () {
	// When running in a browser, set `global` to `window` for sockjs-client compatibility.
	// When running under SSR (Node), `window` is not defined — use `globalThis` instead.
	if (typeof window !== 'undefined') {
		(window as any).global = window;
	} else if (typeof globalThis !== 'undefined') {
		(globalThis as any).global = globalThis;
	}
})();

export {};
