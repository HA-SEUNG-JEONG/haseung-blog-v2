"use client";

import { useRef, useState } from "react";
import ConfirmDialog from "./ConfirmDialog";

// Submit button for a server-component <form action> that asks before submitting.
// The real submit is a hidden button so the dialog's own buttons never post the form.
export default function ConfirmButton({
  message,
  confirmLabel = "확인",
  danger = false,
  className,
  children,
}: {
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const submitRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)}>
        {children}
      </button>
      <button ref={submitRef} type="submit" className="hidden" aria-hidden tabIndex={-1} />
      <ConfirmDialog
        open={open}
        message={message}
        confirmLabel={confirmLabel}
        danger={danger}
        onCancel={() => setOpen(false)}
        onConfirm={() => {
          setOpen(false);
          submitRef.current?.click();
        }}
      />
    </>
  );
}
