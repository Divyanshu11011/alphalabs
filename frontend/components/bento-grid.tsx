'use client';

import { motion } from 'framer-motion';
import { Carousel } from './carousel';
import { GetStartedButton } from './get-started-button';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: "easeOut" as const,
    },
  },
};

export function BentoGrid() {
  return (
    <div className="space-y-8 md:space-y-12">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6"
      >
        {/* Large carousel card - spans 2 cols and 2 rows */}
        <motion.div
          variants={itemVariants}
          className="col-span-2 row-span-2 h-72 md:h-96 lg:h-[28rem] bg-white/5 border border-white/10 rounded-xl backdrop-blur-sm overflow-hidden hover:border-white/20 transition-colors duration-300"
        >
          <Carousel />
        </motion.div>

        {/* Top right card */}
        <motion.div
          variants={itemVariants}
          className="col-span-1 h-36 md:h-44 lg:h-52 bg-white/5 border border-white/10 rounded-xl backdrop-blur-sm hover:border-white/20 transition-colors duration-300"
        >
          {/* Content */}
        </motion.div>

        {/* Top right corner card */}
        <motion.div
          variants={itemVariants}
          className="col-span-1 h-36 md:h-44 lg:h-52 bg-white/5 border border-white/10 rounded-xl backdrop-blur-sm hover:border-white/20 transition-colors duration-300"
        >
          {/* Content */}
        </motion.div>

        {/* Bottom right wide card */}
        <motion.div
          variants={itemVariants}
          className="col-span-2 h-36 md:h-44 lg:h-52 bg-white/5 border border-white/10 rounded-xl backdrop-blur-sm hover:border-white/20 transition-colors duration-300"
        >
          {/* Content */}
        </motion.div>
      </motion.div>

      {/* Get Started Button */}
      <GetStartedButton />
    </div>
  );
}
