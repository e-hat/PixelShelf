import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  children,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col space-y-4 md:space-y-0 md:flex-row md:items-start md:justify-between mb-8", className)}>
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        {description && (
          <p className="text-muted-foreground max-w-3xl">
            {description}
          </p>
        )}
        {children}
      </div>
      {actions && (
        <div className="flex flex-shrink-0 items-center space-x-2 md:ml-4 md:mt-0 mt-4">
          {actions}
        </div>
      )}
    </div>
  );
}

export function PageHeaderDescription({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p className={cn("text-muted-foreground max-w-3xl", className)}>
      {children}
    </p>
  );
}

export function PageHeaderActions({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center space-x-2", className)}>
      {children}
    </div>
  );
}