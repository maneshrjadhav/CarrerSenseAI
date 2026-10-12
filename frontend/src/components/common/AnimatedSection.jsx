import React from 'react';
import { motion } from 'framer-motion';

export default function AnimatedSection({
  children,
  className = '',
  delay = 0,
  direction = 'up', // 'up' | 'down' | 'left' | 'right' | 'none'
  ...props
}) {
  const getInitialPosition = () => {
    switch (direction) {
      case 'up': return { opacity: 0, y: 28 };
      case 'down': return { opacity: 0, y: -28 };
      case 'left': return { opacity: 0, x: 28 };
      case 'right': return { opacity: 0, x: -28 };
      default: return { opacity: 0 };
    }
  };

  return (
    <motion.div
      initial={getInitialPosition()}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.55, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

