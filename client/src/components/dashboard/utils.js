/**
 * Shared utility functions for dashboard components.
 */

/**
 * Returns CSS class name for a priority/severity badge.
 */
export function severityClass(level) {
  switch ((level || '').toUpperCase()) {
    case 'CRITICAL': return 'badge-critical';
    case 'HIGH':     return 'badge-high';
    case 'MEDIUM':   return 'badge-medium';
    case 'LOW':      return 'badge-low';
    default:         return 'badge-neutral';
  }
}

/**
 * Returns an emoji dot color class for decisions.
 */
export function decisionDotStyle(type) {
  switch (type) {
    case 'COMMITTED':     return { background: 'var(--color-low)' };
    case 'DEFERRED':      return { background: 'var(--color-medium)' };
    case 'OPEN_QUESTION': return { background: 'var(--color-info)' };
    default:              return { background: 'var(--text-muted)' };
  }
}

/**
 * Returns badge class for decision type chip.
 */
export function decisionTypeClass(type) {
  switch (type) {
    case 'COMMITTED':     return 'badge-low';
    case 'DEFERRED':      return 'badge-medium';
    case 'OPEN_QUESTION': return 'badge-info';
    default:              return 'badge-neutral';
  }
}

/**
 * Returns badge class for dependency type.
 */
export function depTypeClass(type) {
  switch (type) {
    case 'BLOCKS':     return 'badge-critical';
    case 'REQUIRES':   return 'badge-high';
    case 'WAITING_ON': return 'badge-medium';
    default:           return 'badge-neutral';
  }
}

/**
 * Formats an ISO date string to a readable short date.
 */
export function formatDate(iso) {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  } catch {
    return iso;
  }
}

/**
 * Gets initials from a full name.
 */
export function initials(name) {
  if (!name) return '?';
  return name.split(' ')
    .filter(Boolean)
    .map(w => w[0].toUpperCase())
    .slice(0, 2)
    .join('');
}

/**
 * Returns heat level (0–4) from probability + severity.
 */
export function heatLevel(probability, severity) {
  const probScore = { HIGH: 3, MEDIUM: 2, LOW: 1 }[probability] || 0;
  const sevScore  = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 }[severity] || 0;
  return Math.round((probScore + sevScore) / 2);
}
