// Google APIs type declarations

// Google Maps API types
declare global {
  interface Window {
    google: typeof google & {
      accounts?: {
        id: {
          initialize: (config: any) => void
          prompt: (callback?: (notification: any) => void) => void
          disableAutoSelect: () => void
        }
      }
    }
  }
}