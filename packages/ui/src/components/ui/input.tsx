import * as React from 'react';
import { Button } from './button.js';
import { cn } from '../../lib/utils.js';

function PlainInput({
  className,
  type,
  ...props
}: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none selection:bg-primary selection:text-primary-foreground file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-background',
        'focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring',
        'aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40',
        className,
      )}
      {...props}
    />
  );
}

function Input({ type, ...props }: React.ComponentProps<'input'>) {
  return type === 'password' ? (
    <PasswordInput {...props} />
  ) : (
    <PlainInput type={type} {...props} />
  );
}

// Font Awesome Free 6.7.2, Fonticons, Inc. Icons licensed CC BY 4.0.
// https://fontawesome.com/license/free
const eye =
  'M288 32c-80.8 0-145.5 36.8-192.6 80.6C48.6 156 17.3 208 2.5 243.7c-3.3 7.9-3.3 16.7 0 24.6C17.3 304 48.6 356 95.4 399.4C142.5 443.2 207.2 480 288 480s145.5-36.8 192.6-80.6c46.8-43.5 78.1-95.4 93-131.1c3.3-7.9 3.3-16.7 0-24.6c-14.9-35.7-46.2-87.7-93-131.1C433.5 68.8 368.8 32 288 32zM144 256a144 144 0 1 1 288 0 144 144 0 1 1 -288 0zm144-64c0 35.3-28.7 64-64 64c-7.1 0-13.9-1.2-20.3-3.3c-5.5-1.8-11.9 1.6-11.7 7.4c.3 6.9 1.3 13.8 3.2 20.7c13.7 51.2 66.4 81.6 117.6 67.9s81.6-66.4 67.9-117.6c-11.1-41.5-47.8-69.4-88.6-71.1c-5.8-.2-9.2 6.1-7.4 11.7c2.1 6.4 3.3 13.2 3.3 20.3z';
const eyeSlash =
  'M38.8 5.1C28.4-3.1 13.3-1.2 5.1 9.2S-1.2 34.7 9.2 42.9l592 464c10.4 8.2 25.5 6.3 33.7-4.1s6.3-25.5-4.1-33.7L525.6 386.7c39.6-40.6 66.4-86.1 79.9-118.4c3.3-7.9 3.3-16.7 0-24.6c-14.9-35.7-46.2-87.7-93-131.1C465.5 68.8 400.8 32 320 32c-68.2 0-125 26.3-169.3 60.8L38.8 5.1zM223.1 149.5C248.6 126.2 282.7 112 320 112c79.5 0 144 64.5 144 144c0 24.9-6.3 48.3-17.4 68.7L408 294.5c8.4-19.3 10.6-41.4 4.8-63.3c-11.1-41.5-47.8-69.4-88.6-71.1c-5.8-.2-9.2 6.1-7.4 11.7c2.1 6.4 3.3 13.2 3.3 20.3c0 10.2-2.4 19.8-6.6 28.3l-90.3-70.8zM373 389.9c-16.4 6.5-34.3 10.1-53 10.1c-79.5 0-144-64.5-144-144c0-6.9 .5-13.6 1.4-20.2L83.1 161.5C60.3 191.2 44 220.8 34.5 243.7c-3.3 7.9-3.3 16.7 0 24.6c14.9 35.7 46.2 87.7 93 131.1C174.5 443.2 239.2 480 320 480c47.8 0 89.9-12.9 126.2-32.5L373 389.9z';

function PasswordInput({
  className,
  ref,
  disabled,
  ...props
}: React.ComponentProps<'input'>) {
  const [visible, setVisible] = React.useState(false);
  const input = React.useRef<HTMLInputElement>(null);
  const selection = React.useRef<{
    start: number | null;
    end: number | null;
    direction: 'forward' | 'backward' | 'none' | null;
  } | null>(null);
  React.useImperativeHandle(ref, () => input.current!, []);
  React.useLayoutEffect(() => {
    if (!selection.current || !input.current) return;
    const { start, end, direction } = selection.current;
    input.current.focus({ preventScroll: true });
    input.current.setSelectionRange(start, end, direction ?? undefined);
    selection.current = null;
  }, [visible]);
  return (
    <div data-slot="password-input" className="relative min-w-0 w-full">
      <PlainInput
        {...props}
        ref={input}
        disabled={disabled}
        type={visible ? 'text' : 'password'}
        className={cn(className, 'pr-12')}
      />
      <Button
        data-slot="password-toggle"
        type="button"
        variant="ghost"
        size="icon"
        disabled={disabled}
        className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground"
        aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
        onPointerDown={(event) => {
          if (event.button === 0) event.preventDefault();
        }}
        onClick={() => {
          if (input.current) {
            selection.current = {
              start: input.current.selectionStart,
              end: input.current.selectionEnd,
              direction: input.current.selectionDirection,
            };
          }
          setVisible((value) => !value);
        }}
      >
        <svg
          viewBox={visible ? '0 0 640 512' : '0 0 576 512'}
          aria-hidden="true"
          focusable="false"
          fill="currentColor"
        >
          <path d={visible ? eyeSlash : eye} />
        </svg>
      </Button>
    </div>
  );
}

export { Input };
