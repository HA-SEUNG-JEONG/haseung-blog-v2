"use client";

import { useFormStatus } from "react-dom";

export default function SubmitButton({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} aria-busy={pending} className={className}>
      {pending && (
        <span
          aria-hidden
          className="mr-1.5 inline-block size-3 animate-spin rounded-full border-2 border-current border-t-transparent align-middle motion-reduce:animate-none"
        />
      )}
      {children}
    </button>
  );
}
