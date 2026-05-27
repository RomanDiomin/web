import React, { useEffect } from "react";
import { createPortal } from "react-dom";

export function Modal({ isOpen, onClose, children }) {
  useEffect(() => {
    // Disable body scrolling when modal is active
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container glass-panel" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Закрити">
          ✕
        </button>
        <div className="modal-content">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
export default Modal;
