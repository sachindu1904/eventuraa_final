import React from 'react';
import { cn } from '@/lib/utils';

export const Spinner = React.forwardRef<
  HTMLDivElement, 
  React.HTMLAttributes<HTMLDivElement>
>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "animate-spin rounded-full border-4 border-solid border-gray-200 border-t-eventuraa-blue h-8 w-8",
          className
        )}
        {...props}
      />
    );
  }
);

Spinner.displayName = "Spinner"; 