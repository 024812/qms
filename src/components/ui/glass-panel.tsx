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
        'relative overflow-hidden rounded-2xl border border-slate-200 bg-white/80 backdrop-blur-xl shadow-sm',
        hoverEffect &&
          'transition-all duration-300 hover:bg-white/90 hover:border-slate-300 hover:shadow-md cursor-pointer',
        variant === 'slab' &&
          'bg-gradient-to-br from-white/90 to-white/50 border-white/60 shadow-lg',
        className
      )}
      {...props}
    >
      {/* Glossy gradient overlay */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent opacity-50" />

      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}
