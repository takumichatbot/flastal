'use client';

export function cn(...classes) { return classes.filter(Boolean).join(' '); }

export const AppCard = ({ children, className, id }) => (
  <div id={id} className={cn('bg-white rounded-[2rem] shadow-sm border border-slate-100 p-5 md:p-8', className)}>
    {children}
  </div>
);

export const JpText = ({ children, className }) => (
  <span className={cn('inline-block leading-relaxed', className)}>{children}</span>
);
