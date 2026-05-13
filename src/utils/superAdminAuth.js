const SUPER_ADMIN_EMAIL = "super@updone.com";
const SUPER_ADMIN_PASSWORD = "updone@in";

export function validateSuperAdmin(email, password) {
  return email === SUPER_ADMIN_EMAIL && password === SUPER_ADMIN_PASSWORD;
}

export function setSuperAdminAuthenticated(value) {
  localStorage.setItem('superAdminAuthenticated', Boolean(value));
}

export function isSuperAdminAuthenticated() {
  return localStorage.getItem('superAdminAuthenticated') === 'true';
}

export function clearSuperAdminAuth() {
  localStorage.removeItem('superAdminAuthenticated');
  localStorage.removeItem('superadmin_credentials');
}
