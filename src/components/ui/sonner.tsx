import { useEffect, useState } from "react";
import { Toaster as Sonner, toast, useSonner } from "sonner";

/* One toast at a time: a new toast dismisses whatever is showing. */
function SingleToast() {
  const { toasts } = useSonner();
  useEffect(() => {
    const live = toasts.filter((item) => !item.delete);
    live.slice(1).forEach((item) => toast.dismiss(item.id));
  }, [toasts]);
  return null;
}

type ToasterProps = React.ComponentProps<typeof Sonner>;

/* The run page opts into top-center toasts below its header by setting body.run-toasts and --run-toast-top. */
function useRunPlacement() {
  const [top, setTop] = useState<number | null>(null);
  useEffect(() => {
    const read = () => setTop(document.body.classList.contains("run-toasts") ? parseFloat(document.body.style.getPropertyValue("--run-toast-top")) || 92 : null);
    const observer = new MutationObserver(read);
    observer.observe(document.body, { attributes: true, attributeFilter: ["class", "style"] }); read();
    return () => observer.disconnect();
  }, []);
  return top;
}

const Toaster = ({ ...props }: ToasterProps) => {
  const runTop = useRunPlacement();
  return (
    <>
    <SingleToast />
    <Sonner
      visibleToasts={1}
      offset={24}
      mobileOffset={24}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-card group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-none",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
      {...(runTop !== null ? { position: "top-center" as const, offset: { top: runTop }, mobileOffset: { top: runTop }, duration: 3000 } : {})}
    />
    </>
  );
};

export { Toaster };
