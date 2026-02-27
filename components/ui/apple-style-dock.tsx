import React from 'react';
import {
  HomeIcon,
  Video
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { Dock, DockIcon, DockItem, DockLabel } from './dock';

const data = [
  {
    title: 'Home',
    icon: (
      <HomeIcon className='h-full w-full text-[var(--text-secondary)]' />
    ),
    href: '#',
  },
];

interface AppleStyleDockProps {
  show?: boolean;
  onHomeClick?: () => void;
  onStoryClick?: () => void;
}

export function AppleStyleDock({ show = true, onHomeClick, onStoryClick }: AppleStyleDockProps) {
  return (
    <AnimatePresence>
      <motion.div 
        className='fixed bottom-4 left-1/2 -translate-x-1/2 w-max z-50'
        initial={{ y: 150, x: "-50%", opacity: 0 }}
        animate={{ 
          y: show ? 0 : 150, 
          x: "-50%", 
          opacity: show ? 1 : 0 
        }}
        transition={{ 
          duration: 0.6,
          ease: [0.2, 0.8, 0.2, 1], // Smooth slide
        }}
      >
        <Dock 
          className='items-end pb-3' 
          magnification={80} 
          distance={100} 
          panelHeight={68} 
          baseItemSize={50} 
        >
          {data.map((item, idx) => (
            <DockItem
              key={idx}
              className='aspect-square rounded-full bg-[var(--bg-card)]/50 border border-[var(--border-color)] shadow-sm backdrop-blur-sm cursor-pointer'
              onClick={() => {
                if (item.title === 'Home') onHomeClick?.();
                if (item.title === 'Creators Vid') onStoryClick?.();
              }}
            >
              <DockLabel>{item.title}</DockLabel>
              <DockIcon>{item.icon}</DockIcon>
            </DockItem>
          ))}
        </Dock>
      </motion.div>
    </AnimatePresence>
  );
}