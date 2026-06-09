export function severityClass(level) {
  switch ((level || '').toUpperCase()) {
    case 'CRITICAL': return 'critical';
    case 'HIGH':     return 'high';
    case 'MEDIUM':   return 'medium';
    case 'LOW':      return 'low';
    default:         return 'neutral';
  }
}
