import { toast } from "sonner-native";

type HandleErrorOptions = {
  fallbackMessage?: string;
  silent?: boolean;
};

const DEFAULT_FALLBACK = "Something went wrong. Please try again.";

export function getErrorMessage(error: unknown, fallback = DEFAULT_FALLBACK): string {
  if (typeof error === "string" && error.trim().length > 0) {
    return error;
  }
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }
  if (isObjectWithMessage(error)) {
    return error.message;
  }
  return fallback;
}

export function handleError(error: unknown, options: HandleErrorOptions = {}): string {
  const { fallbackMessage, silent = false } = options;
  const message = getErrorMessage(error, fallbackMessage);

  if (__DEV__) {
    console.error("[handleError]", error);
  }

  if (!silent) {
    toast.error(message);
  }

  return message;
}

function isObjectWithMessage(value: unknown): value is { message: string } {
  if (typeof value !== "object" || value === null) return false;
  if (!("message" in value)) return false;
  const candidate = (value as { message: unknown }).message;
  return typeof candidate === "string" && candidate.trim().length > 0;
}
