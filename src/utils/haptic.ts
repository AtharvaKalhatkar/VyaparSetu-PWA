export function haptic(pattern?: number | number[]) {
  try {
    if (navigator.vibrate) navigator.vibrate(pattern ?? 10)
  } catch {}
}

export function useHaptic() {
  return { tap: () => haptic(8), heavy: () => haptic(20), success: () => haptic([10, 30, 10]), error: () => haptic([30, 50, 30]) }
}
