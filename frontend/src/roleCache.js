import { getCachedRole, setCachedRole, clearCachedRole } from '../utils/roleCache';

const roleCache = new Map();

export const getCachedRole = (uid) => {
  return roleCache.get(uid);
};

export const setCachedRole = (uid, role) => {
  roleCache.set(uid, role);
};

export const clearCachedRole = (uid) => {
  roleCache.delete(uid);
};