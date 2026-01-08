import React, { useEffect } from 'react';
import { motion, useSpring } from 'framer-motion';

export default function CustomCursor() {
  // Spring settings for a weighted, professional feel
  const springConfig = { damping: 25, stiffness: 300, mass: 0.5 };
  const cursorX = useSpring(0, springConfig);
  const cursorY = useSpring(0, springConfig);

  useEffect(() => {
    const moveMouse = (e) => {
      // Small offset so the tip of the arrow aligns with the click point
      cursorX.set(e.clientX - 2);
      cursorY.set(e.clientY - 2);
    };

    window.addEventListener("mousemove", moveMouse);
    return () => window.removeEventListener("mousemove", moveMouse);
  }, [cursorX, cursorY]);

  return (
    <motion.div
      style={{
        translateX: cursorX,
        translateY: cursorY,
      }}
      className="fixed top-0 left-0 pointer-events-none z-[9999]"
    >
      {/* Reduced size SVG (from 32px to 20px) */}
      <svg 
        width="20" 
        height="20" 
        viewBox="0 0 32 32" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-[0_0_5px_rgba(34,211,238,0.3)]"
      >
        <path 
          d="M5 2L26 16L5 30V2Z" 
          fill="#0891b2" /* Muted Cyan 600 instead of bright Neon */
          stroke="#e2e8f0" /* Slate 200 instead of pure white */
          strokeWidth="2.5" 
          strokeLinejoin="round"
        />
      </svg>
    </motion.div>
  );
}