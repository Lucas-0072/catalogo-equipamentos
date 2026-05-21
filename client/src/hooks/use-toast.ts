import { toast as sonnerToast } from "sonner";

interface ToastOptions {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
}

export function useToast() {
  const toast = (options: ToastOptions) => {
    const { title, description, variant } = options;
    const message = title || "";
    if (variant === "destructive") {
      sonnerToast.error(message, { description });
    } else {
      sonnerToast.success(message, { description });
    }
  };

  return { toast };
}
