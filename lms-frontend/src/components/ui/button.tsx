import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { LoaderCircle } from 'lucide-react';
import { cn } from '../../lib/cn';

export const buttonStyles = cva('inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2 text-base font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50', {
  variants: { variant: {
    primary: 'bg-brand text-white hover:bg-orange-600 shadow-sm',
    secondary: 'border border-gray-200 bg-white text-ink hover:bg-gray-50',
    ghost: 'text-gray-600 hover:bg-gray-100 hover:text-ink',
    danger: 'bg-red-600 text-white hover:bg-red-700',
  }, size: { default: '', icon: 'h-11 w-11 shrink-0 p-0' } },
  defaultVariants: { variant: 'primary', size: 'default' },
});
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonStyles> { loading?: boolean }
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, loading, disabled, children, type = 'button', ...props }, ref) => (
  <button ref={ref} type={type} className={cn(buttonStyles({ variant, size }), className)} disabled={disabled || loading} aria-busy={loading || undefined} {...props}>
    {loading && <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />}{children}
  </button>
));
Button.displayName = 'Button';
export const IconButton = forwardRef<HTMLButtonElement, Omit<ButtonProps, 'size'> & { label: string }>(({ label, variant = 'ghost', ...props }, ref) => <Button ref={ref} size="icon" variant={variant} aria-label={label} title={label} {...props} />);
IconButton.displayName = 'IconButton';
