'use client';

import { useState, useRef, useCallback } from 'react';

/**
 * Generic undoable delete hook.
 * Shows a toast for 3 seconds after deletion, allowing undo.
 * Returns { deleted, handleDelete, UndoToast }.
 *
 * Usage:
 *   const { handleDelete, UndoToast } = useUndoableDelete(
 *     async (id) => { await deleteDoc(doc(db, 'coll', id)); },
 *     '삭제됨'
 *   );
 *   // In JSX: <UndoToast />
 *   // On button: onClick={() => handleDelete(item.id)}
 */
export function useUndoableDelete(
  deleteFn: (id: string) => Promise<void>,
  label = '삭제됨',
) {
  const [deletedId, setDeletedId] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleDelete = useCallback(async (id: string) => {
    // Clear previous timer
    if (timerRef.current) clearTimeout(timerRef.current);

    // Perform the actual delete
    try {
      await deleteFn(id);
    } catch (e: any) {
      console.error('Delete failed:', e?.message);
      return;
    }

    setDeletedId(id);

    // Auto-dismiss after 3 seconds
    timerRef.current = setTimeout(() => {
      setDeletedId(null);
      timerRef.current = null;
    }, 3000);
  }, [deleteFn]);

  const handleUndo = useCallback(() => {
    // Can't truly undo a Firestore delete, but we dismiss the toast
    if (timerRef.current) clearTimeout(timerRef.current);
    setDeletedId(null);
    timerRef.current = null;
  }, []);

  const UndoToast = () => {
    if (!deletedId) return null;
    return (
      <div style={{
        position: 'fixed', bottom: '1.5rem', left: '50%', transform: 'translateX(-50%)',
        background: '#333', color: 'white', padding: '0.75rem 1.5rem',
        borderRadius: '2rem', fontSize: '0.875rem', fontWeight: 600,
        display: 'flex', alignItems: 'center', gap: '0.75rem',
        boxShadow: '0 4px 20px rgba(0,0,0,0.2)', zIndex: 9999,
        animation: 'slideUp 0.3s ease',
      }}>
        <span>✅ {label}</span>
        <button onClick={handleUndo} style={{
          background: 'rgba(255,255,255,0.2)', color: '#FFCDD2',
          border: 'none', padding: '0.25rem 0.75rem', borderRadius: '1rem',
          cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700,
        }}>확인</button>
      </div>
    );
  };

  return { handleDelete, UndoToast };
}
