export function isDemoDataEnabled(
  value = process.env.NEXT_PUBLIC_VENTURE_CONNECT_DEMO_DATA ?? process.env.ENABLE_DEMO_DATA
) {
  return value?.trim().toLowerCase() === "true";
}
