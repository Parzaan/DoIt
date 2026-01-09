import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export default function CustomCursor() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [isGrabbing, setIsGrabbing] = useState(false);
  const [isVisible, setIsVisible] = useState(false); // Start hidden, reveal if desktop

  useEffect(() => {
    // This check is the "Gold Standard" for modern web dev
    const canHover = window.matchMedia('(hover: hover) and (pointer: fine)');
    
    // Set visibility based on device capability
    setIsVisible(canHover.matches);

    // If it's a touch device (no hover), stop right here
    if (!canHover.matches) return;

    const moveCursor = (e) => setPosition({ x: e.clientX, y: e.clientY });
    
    const handleHover = (e) => {
      // Yes, we need the hover thing! It's what makes the triangle 
      // glow cyan and rotate when you touch buttons.
      if (e.target.closest('button, input, a, .cursor-grab, [role="button"]')) {
        setIsHovered(true);
      } else {
        setIsHovered(false);
      }
    };

    const handleMouseDown = (e) => {
      if (e.target.closest('.cursor-grab')) setIsGrabbing(true);
    };
    const handleMouseUp = () => setIsGrabbing(false);

    window.addEventListener('mousemove', moveCursor);
    window.addEventListener('mouseover', handleHover);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      window.removeEventListener('mousemove', moveCursor);
      window.removeEventListener('mouseover', handleHover);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // If it's mobile/tablet, we don't render at all
  if (!isVisible) return null;

  return (
    <motion.div
      className="fixed top-0 left-0 pointer-events-none z-[99999] drop-shadow-[0_0_5px_rgba(34,211,238,0.3)]"
      style={{
        width: 0, height: 0,
        borderLeft: "8px solid transparent",
        borderRight: "8px solid transparent",
        borderBottom: "16px solid white",
      }}
      animate={{
        x: position.x - 8,
        y: position.y - 8,
        rotate: isGrabbing ? 180 : (isHovered ? 45 : 0),
        scale: isGrabbing ? 0.8 : (isHovered ? 1.8 : 1),
        borderBottomColor: isGrabbing ? "#facc15" : (isHovered ? "#22d3ee" : "#ffffff"),
      }}
      transition={{ type: 'spring', damping: 30, stiffness: 300, mass: 0.5 }}
    />
  );
}