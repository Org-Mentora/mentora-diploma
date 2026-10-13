import { Toaster as Sonner, type ToasterProps } from 'sonner';

function Toaster(props: ToasterProps) {
  return (
    <Sonner
      className="toaster group"
      richColors
      closeButton
      style={
        {
          '--normal-bg': 'var(--background)',
          '--normal-text': 'var(--foreground)',
          '--normal-border': 'var(--border)',
        } as React.CSSProperties
      }
      {...props}
    />
  );
}

export { Toaster };
