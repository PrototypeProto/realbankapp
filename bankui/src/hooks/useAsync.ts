/**
 * Minimal async-state helper so every screen handles loading/error/data the
 * same way, without a data-fetching library yet.
 *
 *   useAsync(fn, deps)  — runs on mount / when deps change (for GET screens)
 *   useAsyncFn(fn)      — returns a trigger you call (for POST actions)
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type { ApiError } from "../api";

export interface AsyncState<T> {
	data: T | null;
	loading: boolean;
	error: ApiError | Error | null;
}

// Auto-running: for read screens. Re-runs when `deps` change.
export function useAsync<T>(
	fn: (signal: AbortSignal) => Promise<T>,
	deps: unknown[],
): AsyncState<T> & { reload: () => void } {
	const [state, setState] = useState<AsyncState<T>>({
		data: null,
		loading: true,
		error: null,
	});
	const [nonce, setNonce] = useState(0);

	// Hold the latest fn in a ref so it's NOT an effect dependency. Callers pass
	// an inline arrow (new identity every render); depending on it directly would
	// refetch every render. The ref lets `deps` alone drive re-runs.
	const fnRef = useRef(fn);
	useEffect(() => {
		fnRef.current = fn;
	});

	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useEffect(() => {
		const controller = new AbortController();
		setState((s) => ({ ...s, loading: true, error: null }));

		fnRef
			.current(controller.signal)
			.then((data) => setState({ data, loading: false, error: null }))
			.catch((err) => {
				if (controller.signal.aborted) return; // ignore unmount/refetch aborts
				setState({ data: null, loading: false, error: err });
			});

		return () => controller.abort();
		// deps is caller-declared and spread, which the linter can't analyse
		// statically; the stale-closure risk it warns about is handled by fnRef.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [...deps, nonce]);

	const reload = useCallback(() => setNonce((n) => n + 1), []);
	return { ...state, reload };
}

// Manually-triggered: for actions (deposit, transfer, create).
export function useAsyncFn<Args extends unknown[], T>(
	fn: (...args: Args) => Promise<T>,
): AsyncState<T> & { run: (...args: Args) => Promise<T | undefined> } {
	const [state, setState] = useState<AsyncState<T>>({
		data: null,
		loading: false,
		error: null,
	});

	const fnRef = useRef(fn);
	useEffect(() => {
		fnRef.current = fn;
	});

	const run = useCallback(async (...args: Args) => {
		setState({ data: null, loading: true, error: null });
		try {
			const data = await fnRef.current(...args);
			setState({ data, loading: false, error: null });
			return data;
		} catch (err) {
			setState({ data: null, loading: false, error: err as Error });
			return undefined;
		}
	}, []);

	return { ...state, run };
}
