// Haptic feedback utility for iOS/Android
// Uses the Vibration API with iOS-appropriate patterns

type HapticStyle = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

export function haptic(style: HapticStyle = 'light') {
  // Check if vibration is supported
  if (typeof navigator === 'undefined' || !navigator.vibrate) {
    return;
  }

  // iOS Safari doesn't support vibrate, but we can use AudioContext for haptic-like feedback
  // For now, use vibration patterns that work on Android and some iOS browsers
  const patterns: Record<HapticStyle, number | number[]> = {
    light: 10,
    medium: 20,
    heavy: 30,
    success: [10, 50, 10],
    warning: [20, 50, 20],
    error: [30, 50, 30, 50, 30],
  };

  try {
    navigator.vibrate(patterns[style]);
  } catch (e) {
    // Silently fail if vibration not supported
  }
}

// For iOS, we can trigger haptic feedback through CSS active states
// and by using input elements with specific attributes
// This is a workaround since iOS Safari doesn't expose Vibration API

export function canHaptic(): boolean {
  return typeof navigator !== 'undefined' && 'vibrate' in navigator;
}
