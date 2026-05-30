/* frontend/src/hooks/useEnterSubmit.js */

import { useEffect } from 'react';

/**
 * Hook to trigger a callback when user presses Enter inside an input.
 * Usage:
 *   const ref = useRef(null);
 *   useEnterSubmit(ref, handleSubmit, [deps]);
 *   <input ref={ref} ... />
 *
 * For most forms, prefer wrapping inputs in <form onSubmit={...}> + <button type="submit">.
 */
export const useEnterSubmit = (ref, onSubmit, deps = []) => {
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const handler = (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                onSubmit?.();
            }
        };
        el.addEventListener('keydown', handler);
        return () => el.removeEventListener('keydown', handler);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps);
};
