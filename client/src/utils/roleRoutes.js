export function getRoleDashboard(role) {
  switch (role) {
    case 'admin':
      return '/admin/dashboard';
    case 'doctor':
      return '/doctor/dashboard';
    case 'patient':
      return '/patient/dashboard';
    default:
      return '/';
  }
}

export function isStaffRole(role) {
  return role === 'doctor' || role === 'admin';
}

export function formatDoctorName(name) {
  if (!name) return 'Doctor';
  if (/^dr\.?\s/i.test(name.trim())) return name.trim();
  return `${name}`;
}
