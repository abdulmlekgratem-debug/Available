import L from 'leaflet'

// Ensure L is globally accessible on window before any Leaflet plugins (like markercluster) execute
if (typeof window !== 'undefined') {
  ;(window as any).L = L
}

export default L
