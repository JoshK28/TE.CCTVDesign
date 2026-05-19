import { useState, useCallback, useEffect, useRef } from 'react';

/**
 * Snapshot-based undo/redo for arbitrary state shapes.
 *
 * Usage:
 *   const { commit, undo, redo, canUndo, canRedo } = useUndoRedo(
 *     { equipment, wallGraphs },
 *     useCallback(({ equipment, wallGraphs }) => {
 *       setEquipment(equipment);
 *       setWallGraphs(wallGraphs);
 *     }, [])
 *   );
 *
 *   // Call commit() BEFORE mutating state to push the current snapshot
 *   // onto the undo stack and clear the redo stack.
 *
 * @param {object} currentState  The state object to snapshot.
 * @param {(state: object) => void} applyState  Restores a snapshot into your component state.
 * @param {{ shortcuts?: boolean, limit?: number }} [options]
 *   shortcuts: bind Ctrl/Cmd+Z and Ctrl/Cmd+Y (default true).
 *   limit: max entries kept in each stack (default 100).
 */
export default function useUndoRedo(currentState, applyState, options = {}) {
  const { shortcuts = true, limit = 100 } = options;

  const [past, setPast] = useState([]);
  const [future, setFuture] = useState([]);

  // Mirror the latest state in a ref so commit/undo/redo always snapshot it,
  // without forcing a new callback identity on every state change.
  const stateRef = useRef(currentState);
  useEffect(() => {
    stateRef.current = currentState;
  }, [currentState]);

  const snapshot = useCallback(
    () => JSON.parse(JSON.stringify(stateRef.current)),
    []
  );

  const commit = useCallback(() => {
    setPast((prev) => {
      const next = [...prev, snapshot()];
      return next.length > limit ? next.slice(next.length - limit) : next;
    });
    setFuture([]);
  }, [snapshot, limit]);

  const undo = useCallback(() => {
    setPast((prev) => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      setFuture((f) => [snapshot(), ...f]);
      applyState(last);
      return prev.slice(0, -1);
    });
  }, [applyState, snapshot]);

  const redo = useCallback(() => {
    setFuture((prev) => {
      if (prev.length === 0) return prev;
      const next = prev[0];
      setPast((p) => [...p, snapshot()]);
      applyState(next);
      return prev.slice(1);
    });
  }, [applyState, snapshot]);

  const reset = useCallback(() => {
    setPast([]);
    setFuture([]);
  }, []);

  useEffect(() => {
    if (!shortcuts) return undefined;
    const handler = (e) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      const key = e.key.toLowerCase();
      if (key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if (key === 'y' || (key === 'z' && e.shiftKey)) {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, redo, shortcuts]);

  return {
    commit,
    undo,
    redo,
    reset,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
  };
}
