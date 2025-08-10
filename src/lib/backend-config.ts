
// config.ts

// This function should only be called on the client side.
export const getBackendMode = (): 'firebase' | 'mariadb' => {
  if (typeof window !== 'undefined') {
    const mode = localStorage.getItem("backend");
    if (mode === 'firebase' || mode === 'mariadb') {
      return mode;
    }
  }
  return "firebase"; // Default to Firebase
};

// This function should only be called on the client side.
export const setBackendMode = (mode: 'firebase' | 'mariadb') => {
  if (typeof window !== 'undefined') {
    localStorage.setItem("backend", mode);
  }
};
