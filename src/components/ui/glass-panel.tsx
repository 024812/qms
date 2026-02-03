import { cn } from '@/lib/utils';
import { HTMLMotionProps, motion } from 'framer-motion';

interface GlassPanelProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
  variant?: 'defaut' | 'slab';
}

const panelVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1] as any,
    },
  },
};

export function GlassPanel({
  children,
  className,
  hoverEffect = false,
  variant = 'defaut',
  ...props
}: GlassPanelProps) {
  return (
    <motion.div
      variants={panelVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-50px' }}
      className={cn(
        'relative overflow-hidden rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md shadow-2xl',
        hoverEffect &&
          'transition-all duration-300 hover:bg-black/50 hover:border-white/20 hover:shadow-cyan-900/20',
        variant === 'slab' &&
          'bg-gradient-to-br from-white/5 to-white/0 border-white/20 shadow-[0_0_30px_-10px_rgba(255,255,255,0.1)]',
        className
      )}
      {...props}
    >
      {/* Glossy gradient overlay */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-50" />

      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}
