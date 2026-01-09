import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export default function CustomCursor() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [isGrabbing, setIsGrabbing] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const canHover = window.matchMedia('(hover: hover) and (pointer: fine)');
    setIsVisible(canHover.matches);
    if (!canHover.matches) return;

    const moveCursor = (e) => setPosition({ x: e.clientX, y: e.clientY });
    
    const handleHover = (e) => {
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

  if (!isVisible) return null;

  return (
    <motion.div
      className="fixed top-0 left-0 pointer-events-none z-99999 mix-blend-difference"
      style={{
        width: 0,
        height: 0,
        // Restored your original sharp default dimensions
        borderLeft: "8px solid transparent",
        borderRight: "8px solid transparent",
        borderBottom: "16px solid #ffffff", 
      }}
      animate={{
        x: position.x - 8,
        y: position.y - 8,
        rotate: isGrabbing ? 180 : (isHovered ? 45 : 0),
        // Toned down the hover scale: 1.3 is visible but "surgical"
        scale: isGrabbing ? 0.8 : (isHovered ? 1.5 : 1), 
        opacity: isHovered ? 0.8 : 1,
      }}
      transition={{ type: 'spring', damping: 30, stiffness: 350, mass: 0.5 }}
    />
  );
}