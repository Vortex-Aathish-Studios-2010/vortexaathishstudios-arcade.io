export const validUsername = name => typeof name === 'string' && /^[A-Za-z0-9_]{3,15}$/.test(name);
export const usernameKey = name => String(name || '').trim().toLowerCase();
export const USERNAME_TAKEN = 'Username already taken. Try another.';
export const USERNAME_FORMAT = 'Use 3–15 letters, numbers, or underscores.';
