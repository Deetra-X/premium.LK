export const withErrorToast = async <T,>(fn: () => Promise<T>, onError: (msg: string) => void) => {
  try {
    return await fn();
  } catch (e) {
    const err = e as unknown as { message?: string };
    const msg = err?.message || 'Unexpected error occurred';
    onError(msg);
    throw e;
  }
};
