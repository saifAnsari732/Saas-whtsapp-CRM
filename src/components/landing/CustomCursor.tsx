"use client";

import { useEffect, useState } from "react";
import { motion, useSpring } from "framer-motion";

export default function CustomCursor() {
  const [isPointer, setIsPointer] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const cursorX = useSpring(0, { stiffness: 600, damping: 30 });
  const cursorY = useSpring(0, { stiffness: 600, damping: 30 });
  
  const dotX = useSpring(0, { stiffness: 1200, damping: 40 });
  const dotY = useSpring(0, { stiffness: 1200, damping: 40 });

  useEffect(() => {
    // Only run on desktop/devices with fine pointer
    if (typeof window === "undefined" || !window.matchMedia("(pointer: fine)").matches) {
      return;
    }

    const moveCursor = (e: MouseEvent) => {
      cursorX.set(e.clientX - 16);
      cursorY.set(e.clientY - 16);
      dotX.set(e.clientX - 3);
      dotY.set(e.clientY - 3);
      if (!isVisible) setIsVisible(true);
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target?.tagName === "BUTTON" ||
        target?.tagName === "A" ||
        target?.closest("button") ||
        target?.closest("a") ||
        target?.getAttribute("role") === "button"
      ) {
        setIsPointer(true);
      } else {
        setIsPointer(false);
      }
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    window.addEventListener("mousemove", moveCursor);
    window.addEventListener("mouseover", handleMouseOver);
    document.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      window.removeEventListener("mousemove", moveCursor);
      window.removeEventListener("mouseover", handleMouseOver);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [cursorX, cursorY, dotX, dotY, isVisible]);

  if (!isVisible) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {/* Outer Glowing Ring */}
      <motion.div
        style={{
          x: cursorX,
          y: cursorY,
        }}
        animate={{
          scale: isPointer ? 1.6 : 1,
          borderColor: isPointer ? "#00A884" : "rgba(37, 211, 102, 0.4)",
          backgroundColor: isPointer ? "rgba(0, 168, 132, 0.08)" : "transparent",
        }}
        transition={{ duration: 0.15 }}
        className="w-8 h-8 rounded-full border-2 border-[#00A884]/40 fixed top-0 left-0 backdrop-blur-[0.5px]"
      />

      {/* Center Precision Dot */}
      <motion.div
        style={{
          x: dotX,
          y: dotY,
        }}
        animate={{
          scale: isPointer ? 0.7 : 1,
          backgroundColor: isPointer ? "#00A884" : "#25D366",
        }}
        transition={{ duration: 0.1 }}
        className="w-1.5 h-1.5 rounded-full bg-[#00A884] fixed top-0 left-0 shadow-sm"
      />
    </div>
  );
}
