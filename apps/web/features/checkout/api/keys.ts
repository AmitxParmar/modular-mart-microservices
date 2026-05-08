export const checkoutKeys = {
  all: ["checkout"] as const,
  intents: () => [...checkoutKeys.all, "intent"] as const,
};
