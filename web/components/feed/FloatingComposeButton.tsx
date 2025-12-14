'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Camera, PenSquare } from 'lucide-react';

interface FloatingComposeButtonProps {
  onClick: () => void;
  onCameraClick?: () => void;
}

export default function FloatingComposeButton({ onClick, onCameraClick }: FloatingComposeButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleCompose = () => {
    onClick();
    setIsOpen(false);
  };

  const handleCamera = () => {
    onCameraClick?.();
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-25 right-6 md:hidden z-40">
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.button
              initial={{ opacity: 0, y: 20, scale: 0 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0 }}
              onClick={handleCamera}
              className="absolute bottom-32 right-0 w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-600 text-white rounded-full shadow-lg flex items-center justify-center"
            >
              <Camera className="w-5 h-5" />
            </motion.button>
            <motion.button
              initial={{ opacity: 0, y: 20, scale: 0 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0 }}
              transition={{ delay: 0.05 }}
              onClick={handleCompose}
              className="absolute bottom-[4.5rem] right-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-full shadow-lg flex items-center justify-center"
            >
              <PenSquare className="w-5 h-5" />
            </motion.button>
          </>
        )}
      </AnimatePresence>

      <motion.button
        onClick={handleToggle}
        className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-full shadow-lg flex items-center justify-center"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1, rotate: isOpen ? 45 : 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      >
        {isOpen ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
      </motion.button>
    </div>
  );
}
