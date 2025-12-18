'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';

interface FloatingComposeButtonProps {
  onClick?: () => void;
}

export default function FloatingComposeButton({ onClick }: FloatingComposeButtonProps) {
  return (
    <div className="fixed bottom-32 right-6 md:hidden z-40">
      <motion.button
        onClick={onClick}
        className="w-14 h-14 bg-gradient-to-br from-green-500 to-purple-600 text-white rounded-full shadow-lg flex items-center justify-center"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      >
        <Plus className="w-6 h-6" />
      </motion.button>
    </div>
  );
}
