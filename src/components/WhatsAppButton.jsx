import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../i18n/LanguageContext';

const STORAGE_KEY = 'amani-whatsapp-pos';
const BUTTON_SIZE = 56;
const EDGE_MARGIN = 8;
const DRAG_THRESHOLD = 5; // px of movement before a press counts as a drag, not a tap

const clampToViewport = ({ x, y }) => ({
  x: Math.min(Math.max(EDGE_MARGIN, x), window.innerWidth - BUTTON_SIZE - EDGE_MARGIN),
  y: Math.min(Math.max(EDGE_MARGIN, y), window.innerHeight - BUTTON_SIZE - EDGE_MARGIN),
});

const defaultPosition = () =>
  clampToViewport({
    x: window.innerWidth - BUTTON_SIZE - 24,
    y: window.innerHeight - BUTTON_SIZE - 80,
  });

const loadPosition = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && Number.isFinite(saved.x) && Number.isFinite(saved.y)) {
      return clampToViewport(saved);
    }
  } catch {
    // storage unavailable or corrupt - fall back to default
  }
  return defaultPosition();
};

/**
 * Floating WhatsApp chat button, shown on every interface.
 * Drag it anywhere on screen (mouse or touch); a tap opens WhatsApp.
 * The position is remembered between visits.
 */
const WhatsAppButton = () => {
  const phoneNumber = '14372156321'; // +1 437-215-6321 without spaces and +
  const { t } = useLanguage();
  const message = t('whatsapp.prefill');
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

  const [pos, setPos] = useState(loadPosition);
  const [dragging, setDragging] = useState(false);
  const [showHint, setShowHint] = useState(true);
  const gesture = useRef(null); // { startX, startY, originX, originY, moved }

  // Keep the button on screen when the window is resized / rotated.
  useEffect(() => {
    const onResize = () => setPos((p) => clampToViewport(p));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const handlePointerDown = useCallback((e) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    gesture.current = {
      startX: e.clientX,
      startY: e.clientY,
      originX: pos.x,
      originY: pos.y,
      moved: false,
    };
  }, [pos.x, pos.y]);

  const handlePointerMove = useCallback((e) => {
    const g = gesture.current;
    if (!g) return;
    const dx = e.clientX - g.startX;
    const dy = e.clientY - g.startY;
    if (!g.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
    if (!g.moved) {
      g.moved = true;
      setDragging(true);
      setShowHint(false);
    }
    setPos(clampToViewport({ x: g.originX + dx, y: g.originY + dy }));
  }, []);

  const handlePointerUp = useCallback((e) => {
    const g = gesture.current;
    gesture.current = null;
    if (!g) return;
    e.currentTarget.releasePointerCapture?.(e.pointerId);

    if (g.moved) {
      setDragging(false);
      setPos((p) => {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
        } catch {
          // ignore - position just won't persist
        }
        return p;
      });
    } else {
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    }
  }, [whatsappUrl]);

  // Show the hint bubble on whichever side of the button has more room.
  const hintOnLeft = pos.x > window.innerWidth / 2;

  return (
    <div
      className="fixed z-50 select-none"
      style={{ left: pos.x, top: pos.y, width: BUTTON_SIZE, height: BUTTON_SIZE }}
    >
      {/* Floating Text */}
      {showHint && !dragging && (
        <motion.div
          className={`absolute top-1/2 -translate-y-1/2 bg-white px-4 py-2 rounded-full shadow-lg pointer-events-none ${
            hintOnLeft ? 'right-full mr-3' : 'left-full ml-3'
          }`}
          initial={{ opacity: 0, x: hintOnLeft ? 20 : -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <p className="text-gray-800 font-medium text-sm whitespace-nowrap">
            {t('whatsapp.hint')}
          </p>
        </motion.div>
      )}

      {/* WhatsApp Button (drag to move, tap to chat) */}
      <motion.button
        type="button"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className={`relative flex items-center justify-center w-14 h-14 bg-green-500 hover:bg-green-600 rounded-full shadow-lg ${
          dragging ? 'cursor-grabbing shadow-2xl' : 'cursor-grab'
        }`}
        style={{ touchAction: 'none' }}
        initial={{ scale: 0 }}
        animate={{ scale: dragging ? 1.15 : 1 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Chat on WhatsApp (drag to move)"
        title="Tap to chat on WhatsApp - drag to move"
      >
        {/* WhatsApp Icon */}
        <svg
          className="w-8 h-8 text-white pointer-events-none"
          fill="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
        </svg>

        {/* Pulse animation (paused while dragging) */}
        {!dragging && (
          <span className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-75 pointer-events-none" />
        )}
      </motion.button>
    </div>
  );
};

export default WhatsAppButton;
