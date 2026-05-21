import { useState, useCallback, useEffect } from "react";

export interface UndoRedoAction {
  label: string;
  undo: () => void | Promise<void>;
  redo: () => void | Promise<void>;
}

export function useUndoRedo() {
  const [history, setHistory] = useState<UndoRedoAction[]>([]);
  const [cursor, setCursor] = useState(-1);

  const canUndo = cursor >= 0;
  const canRedo = cursor < history.length - 1;

  const pushAction = useCallback((action: UndoRedoAction) => {
    setHistory(prev => {
      // Remove ações à frente do cursor (ao fazer nova ação, apaga o "futuro")
      const newHistory = prev.slice(0, cursor + 1);
      return [...newHistory, action];
    });
    setCursor(prev => prev + 1);
  }, [cursor]);

  const undo = useCallback(async () => {
    if (!canUndo) return;
    await history[cursor].undo();
    setCursor(prev => prev - 1);
  }, [canUndo, cursor, history]);

  const redo = useCallback(async () => {
    if (!canRedo) return;
    await history[cursor + 1].redo();
    setCursor(prev => prev + 1);
  }, [canRedo, cursor, history]);

  // Atalhos de teclado Ctrl+Z / Ctrl+Y
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [undo, redo]);

  return { canUndo, canRedo, undo, redo, pushAction };
}
