import { cn } from '@/lib/utils';

export function Badge({ children, variant = 'default', className, ...props }: React.HTMLAttributes<HTMLDivElement> & { variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'live' }) {
  const variants: Record<string, string> = {
    default: 'bg-primary text-primary-foreground',
    secondary: 'bg-secondary text-secondary-foreground',
    destructive: 'bg-destructive text-destructive-foreground',
    outline: 'border border-input text-foreground',
    live: 'bg-red-500 text-white',
  };
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
        variants[variant],
        className
      )}
      {...props}
    >
      {variant === 'live' && <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-white live-pulse" />}
      {children}
    </div>
  );
}
