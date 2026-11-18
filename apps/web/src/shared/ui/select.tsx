import { ChevronDown } from 'lucide-react';
import type { ComponentProps } from 'react';
import { cn } from '@/shared/lib/utils';

type NativeSelectProps = Omit<ComponentProps<'select'>, 'size'> & {
  placeholder?: string;
  density?: 'default' | 'compact';
};

function NativeSelect({
  className,
  placeholder,
  density = 'default',
  children,
  ...props
}: NativeSelectProps) {
  const compact = density === 'compact';
  return (
    <div data-slot="native-select-wrapper" className={cn('relative w-full', className)}>
      <select
        data-slot="native-select"
        className={cn(
          'peer h-9 w-full pointer-coarse:h-10 min-w-0 cursor-pointer appearance-none truncate rounded-md border border-input bg-background py-1 pr-9 pl-3 text-base shadow-xs outline-none transition-[color,box-shadow] md:text-sm',
          'hover:border-ring/60 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
          'aria-invalid:border-destructive aria-invalid:ring-destructive/20 disabled:cursor-not-allowed disabled:opacity-50',
          "has-[option[value='']:checked]:text-muted-foreground [&_option]:text-foreground",
          compact && 'h-8 pr-7 pl-2.5 text-xs md:text-xs',
        )}
        {...props}
      >
        {placeholder !== undefined && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {children}
      </select>
      <ChevronDown
        aria-hidden
        className={cn(
          'pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground peer-disabled:opacity-50',
          compact && 'right-2 size-3.5',
        )}
      />
    </div>
  );
}

export { NativeSelect };
