import { useEffect } from "react";
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

const Toaster = ({ ...props }: ToasterProps) => {
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
    />
    </>
  );
};

export { Toaster };
