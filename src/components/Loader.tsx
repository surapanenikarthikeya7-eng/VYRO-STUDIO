import { motion } from 'motion/react';

export default function Loader({ onComplete }: { onComplete: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      transition={{ delay: 1.6, duration: 0.5 }}
      onAnimationComplete={onComplete}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#000000] font-sans"
    >
      <div className="relative flex flex-col items-center justify-center">
        {/* Champagne Pulsing Ring */}
        <motion.div
          animate={{
            scale: [0.92, 1.08, 0.92],
            borderColor: ['#E8C49A', '#C8A377', '#E8C49A'],
          }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          className="w-28 h-28 rounded-3xl border-2 flex items-center justify-center bg-[#171717] backdrop-blur p-2 shadow-2xl"
        >
          {/* Animated Logo Image */}
          <motion.img
            src="/assets/aistudio/image_35d6318c.png"
            alt="VYRO STUDIO"
            animate={{ scale: [0.96, 1.04, 0.96] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            className="w-full h-full object-contain rounded-2xl"
          />
        </motion.div>

        {/* Text Loader */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6 text-center"
        >
          <h1 className="font-sans font-semibold tracking-[0.4em] text-white uppercase text-sm sm:text-base">
            VYRO <span className="text-[#E8C49A]">STUDIO</span>
          </h1>
          <motion.p
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="font-mono text-[10px] sm:text-xs text-zinc-500 tracking-wider mt-2 uppercase"
          >
            INITIALIZING SECURE STUDIO SESSION...
          </motion.p>
        </motion.div>
      </div>
    </motion.div>
  );
}
