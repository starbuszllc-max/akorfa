'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';
import Link from 'next/link';

interface FloatingCreateButtonProps {
  isVisible: boolean;
}

export default function FloatingCreateButton({ isVisible }: FloatingCreateButtonProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="fixed bottom-24 left-4 z-50"
        >
          <Link href="/create">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/40 flex items-center justify-center text-white"
            >
              <Plus className="w-7 h-7" strokeWidth={2.5} />
            </motion.button>
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
