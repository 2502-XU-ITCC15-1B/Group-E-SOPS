const KEY = "role_cache";

export const getCachedRole = (uid) => {
  return localStorage.getItem(`${KEY}_${uid}`);
};

export const setCachedRole = (uid, role) => {
  localStorage.setItem(`${KEY}_${uid}`, role);
};

export const clearCachedRole = (uid) => {
  localStorage.removeItem(`${KEY}_${uid}`);
};