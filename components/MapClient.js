'use client'
import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const CAT = {
  'Hiking':        { color: '#15803d', emoji: '🏔️' },
  'Swimming':      { color: '#0369a1', emoji: '🏊' },
  'Skiing/Snow':   { color: '#7c3aed', emoji: '⛷️' },
  'Camping':       { color: '#92400e', emoji: '🏕️' },
  'Wildlife':      { color: '#b45309', emoji: '🦁' },
  'Museums':       { color: '#be123c', emoji: '🏛️' },
  'Attractions':   { color: '#c2410c', emoji: '🎡' },
  'Family Dining': { color: '#dc2626', emoji: '🍕' },
  'Other':         { color: '#6b7280', emoji: '📍' },
}

const CO_CENTER = [39.0, -105.5]
const CO_ZOOM   = 7

function makeIcon(cat, highlighted = false) {
  const { color, emoji } = CAT[cat] || CAT['Other']
  const size = highlighted ? 42 : 36
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size*1.33}" viewBox="0 0 36 48">
    <path d="M18 0C8.059 0 0 8.059 0 18c0 12 18 30 18 30S36 30 36 18C36 8.059 27.941 0 18 0z" fill="${color}" ${highlighted ? `stroke="white" stroke-width="2"` : ''}/>
    <circle cx="18" cy="18" r="10" fill="white" fill-opacity=".95"/>
    <text x="18" y="22" text-anchor="middle" font-size="11">${emoji}</text>
  </svg>`
  return L.divIcon({
    html: svg, className: '',
    iconSize: [size, size * 1.33],
    iconAnchor: [size/2, size * 1.33],
    popupAnchor: [0, -(size * 1.33) - 4]
  })
}

export default function MapClient({
  spots        = [],
  mapClass     = 'map-fullscreen',
  onMapClick   = null,
  onSpotClick  = null,
  onUserLocation = null,
  autoLocate   = false,
  selectedSpot = null,
  isOwner      = false,
}) {
  const mapRef      = useRef(null)
  const instanceRef = useRef(null)
  const markerMap   = useRef({})
  const userLayerRef = useRef(null)

  // Init map
  useEffect(() => {
    if (instanceRef.current) return
    const m = L.map(mapRef.current, { zoomControl: false }).setView(CO_CENTER, CO_ZOOM)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors', maxZoom: 19,
    }).addTo(m)
    // Move zoom controls to bottom-right (out of the way of top bar)
    L.control.zoom({ position: 'bottomright' }).addTo(m)
    if (onMapClick) {
      m.on('click', e => onMapClick(e.latlng))
      m.on('tap', e => onMapClick(e.latlng))
      m.getContainer().style.cursor = 'crosshair'
    }
    instanceRef.current = m

    // Auto-locate
    if (autoLocate && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          const { latitude: lat, longitude: lng } = pos.coords
          m.setView([lat, lng], 13)
          // Pulse ring
          const pulseIcon = L.divIcon({
            html: `<div class="user-pulse"></div>`,
            className: '', iconSize: [18,18], iconAnchor: [9,9]
          })
          const pulseMk = L.marker([lat, lng], { icon: pulseIcon }).addTo(m)
          // Blue dot on top
          const dotIcon = L.divIcon({
            html: `<div style="width:14px;height:14px;border-radius:50%;background:#3b82f6;border:2.5px solid white;box-shadow:0 1px 6px rgba(0,0,0,.35)"></div>`,
            className: '', iconSize: [14,14], iconAnchor: [7,7]
          })
          L.marker([lat, lng], { icon: dotIcon, zIndexOffset: 1000 }).addTo(m)
          userLayerRef.current = pulseMk
          onUserLocation?.({ lat, lng })
        },
        () => onUserLocation?.(null)
      )
    }

    return () => { m.remove(); instanceRef.current = null }
  }, [])

  // Sync markers when spots change
  useEffect(() => {
    const m = instanceRef.current
    if (!m) return
    Object.values(markerMap.current).forEach(mk => m.removeLayer(mk))
    markerMap.current = {}
    spots.forEach(s => {
      const isSelected = selectedSpot?.id === s.id
      const mk = L.marker([s.lat, s.lng], { icon: makeIcon(s.category, isSelected) }).addTo(m)
      if (onSpotClick) {
        mk.on('click', () => onSpotClick(s))
      } else {
        // fallback popup
        const c = CAT[s.category]?.color || '#888'
        mk.bindPopup(`
          <div style="font-family:sans-serif">
            <div style="background:${c};padding:8px 12px">
              <div style="color:rgba(255,255,255,.8);font-size:10px;font-weight:700;text-transform:uppercase">${s.category}</div>
              <div style="color:white;font-weight:700;font-size:13px">${s.name}</div>
            </div>
            ${s.note && (s.note_is_public || isOwner) ? `<div style="padding:8px 12px;font-size:12px;color:#444">${s.note}</div>` : '<div style="padding:8px 12px"></div>'}
          </div>`, { maxWidth: 220 })
      }
      markerMap.current[s.id] = mk
    })
  }, [spots, selectedSpot?.id, isOwner])

  // Fly to selected spot
  useEffect(() => {
    if (!selectedSpot || !instanceRef.current) return
    instanceRef.current.flyTo([selectedSpot.lat, selectedSpot.lng], 15, { duration: 0.7 })
  }, [selectedSpot?.id])

  return <div ref={mapRef} className={mapClass} />
}
