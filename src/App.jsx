import { useState, useRef } from 'react'
import axios from 'axios'
import TripMap from './TripMap'
import ELDLogSheet from './ELDLogSheet'
import './index.css'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

const STOP_TYPE_CONFIG = {
  start:    { color: '#4f8ef7', bg: '#1a2a4a', label: 'Start',    icon: '🚛' },
  pickup:   { color: '#22c55e', bg: '#142a1e', label: 'Pickup',   icon: '📦' },
  dropoff:  { color: '#f59e0b', bg: '#2a1e0a', label: 'Dropoff',  icon: '🏁' },
  rest:     { color: '#7c3aed', bg: '#1e1035', label: 'Rest',     icon: '🛏️' },
  sleeper:  { color: '#7c3aed', bg: '#1e1035', label: 'Sleeper',  icon: '🛏️' },
  break:    { color: '#64748b', bg: '#1a2030', label: 'Break',    icon: '⏸️' },
  fuel:     { color: '#ec4899', bg: '#2a0f1e', label: 'Fuel',     icon: '⛽' },
}

const STATUS_COLORS = {
  off_duty: '#64748b', sleeper: '#7c3aed',
  driving: '#22c55e', on_duty_not_driving: '#d97706',
}

const STATUS_LABELS = {
  off_duty: 'Off Duty', sleeper: 'Sleeper Berth',
  driving: 'Driving', on_duty_not_driving: 'On Duty (Not Driving)',
}

function StatCard({ label, value, sub, accent }) {
  return (
    <div
      className="stat-card"
      style={{
        borderColor: accent || 'var(--border)',
        boxShadow: accent ? `0 0 24px ${accent}15` : 'none',
      }}
    >
      <div className="stat-value" style={{ color: accent || 'var(--accent)' }}>
        {value}
      </div>
      <div className="stat-label">{label}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  )
}

function StopCard({ stop, index }) {
  const cfg = STOP_TYPE_CONFIG[stop.stop_type] || STOP_TYPE_CONFIG.start
  return (
    <div
      className="stop-card"
      style={{
        background: cfg.bg,
        borderColor: `${cfg.color}40`,
        animationDelay: `${Math.min(index * 0.04, 0.5)}s`,
      }}
    >
      <div
        className="stop-dot"
        style={{
          background: cfg.color + '20',
          borderColor: cfg.color,
        }}
      >
        {cfg.icon}
      </div>

      <div className="stop-content">
        <div className="stop-header">
          <div>
            <span className="stop-badge" style={{ background: cfg.color }}>{cfg.label}</span>
            <span className="stop-name">{stop.name}</span>
          </div>
          <span className="stop-day">Day {stop.day}</span>
        </div>
        <div className="stop-meta">
          <span style={{ color: 'var(--text-secondary)' }}>
            🕐 {stop.arrival_time_formatted}
          </span>
          {stop.duration > 0 && (
            <span style={{ color: cfg.color }}>
              ⏱ {stop.duration_formatted}
            </span>
          )}
          <span style={{ color: 'var(--text-muted)' }}>
            🛣 {stop.odometer?.toLocaleString()} mi
          </span>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const [form, setForm] = useState({
    current_location: '',
    pickup_location: '',
    dropoff_location: '',
    cycle_used_hours: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)
  const [activeTab, setActiveTab] = useState('map')
  const [activeLogDay, setActiveLogDay] = useState(0)
  const resultsRef = useRef(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    setResult(null)

    try {
      const payload = {
        ...form,
        cycle_used_hours: parseFloat(form.cycle_used_hours) || 0,
      }
      const resp = await axios.post(`${API_BASE}/calculate-trip/`, payload)
      setResult(resp.data)
      setActiveTab('map')
      setActiveLogDay(0)
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Connection failed. Is the backend running?')
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'map', label: '🗺 Route Map' },
    { id: 'stops', label: '📍 Stop Log' },
    { id: 'logs', label: '📋 ELD Log Sheets' },
  ]

  const assumptions = [
    '55 mph avg speed', '11hr/14hr daily limits', '8hr break rule',
    'Fuel every 1,000 mi', '1hr pickup/dropoff', '10hr rest resets',
  ]

  const formFields = [
    { key: 'current_location', label: 'Current Location', icon: '📍', placeholder: 'e.g. Chicago, IL' },
    { key: 'pickup_location', label: 'Pickup Location', icon: '📦', placeholder: 'e.g. Dallas, TX' },
    { key: 'dropoff_location', label: 'Dropoff Location', icon: '🏁', placeholder: 'e.g. Los Angeles, CA' },
  ]

  return (
    <div className="app-root">

      {/* ─── Header ─────────────────────────────────────────────── */}
      <header className="header">
        <div className="header-inner">
          <div className="header-logo" aria-hidden="true">🚛</div>
          <div>
            <div className="header-title">ELD Trip Planner</div>
            <div className="header-subtitle">HOS COMPLIANCE · 70HR/8DAY · PROPERTY CARRIER</div>
          </div>
          <div className="header-right">
            <span className="badge-compliant">FMCSA COMPLIANT</span>
            <span className="badge-cfr">49 CFR Part 395</span>
          </div>
        </div>
      </header>

      {/* ─── Main ───────────────────────────────────────────────── */}
      <main className="main-content">

        {/* ─── Form Card ──────────────────────────────────────── */}
        <div className="form-card">
          <h2 className="form-heading">Plan Your Trip</h2>
          <p className="form-description">
            Enter trip details to calculate HOS-compliant route with ELD log sheets
          </p>

          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              {formFields.map(({ key, label, icon, placeholder }) => (
                <div key={key}>
                  <label className="form-label" htmlFor={key}>
                    {icon} {label}
                  </label>
                  <input
                    id={key}
                    type="text"
                    className="form-input"
                    value={form[key]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    placeholder={placeholder}
                    required
                  />
                </div>
              ))}

              <div>
                <label className="form-label" htmlFor="cycle_used_hours">
                  ⏱ Current Cycle Used (Hrs)
                </label>
                <input
                  id="cycle_used_hours"
                  type="number"
                  min="0" max="70" step="0.5"
                  className="form-input form-input--mono"
                  value={form.cycle_used_hours}
                  onChange={e => setForm(f => ({ ...f, cycle_used_hours: e.target.value }))}
                  placeholder="0 – 70"
                  required
                />
              </div>
            </div>

            {/* Assumptions */}
            <div className="assumptions-bar">
              {assumptions.map(note => (
                <span key={note} className="assumption-item">{note}</span>
              ))}
            </div>

            {/* Error */}
            {error && (
              <div className="error-alert" role="alert">
                ⚠️ {error}
              </div>
            )}

            {/* Submit */}
            <button type="submit" disabled={loading} className="btn-submit">
              {loading ? (
                <>
                  <span className="spinner" />
                  Calculating route…
                </>
              ) : (
                <>Calculate Trip & Generate ELD Logs →</>
              )}
            </button>
          </form>
        </div>

        {/* ─── Results ────────────────────────────────────────── */}
        {result && (
          <div ref={resultsRef} className="results-section">

            {/* Summary Stats */}
            <div style={{ marginBottom: 22 }}>
              <h3 className="section-label">Trip Summary</h3>
              <div className="stat-grid">
                <StatCard label="Total Distance" value={`${result.summary.total_distance_miles?.toLocaleString()} mi`} sub={`${result.summary.total_distance_km?.toLocaleString()} km`} accent="#4f8ef7" />
                <StatCard label="Total Days" value={result.summary.total_days} sub="including rest stops" accent="#7c3aed" />
                <StatCard label="Driving Hours" value={`${result.summary.total_driving_hours}h`} sub="actual driving time" accent="#22c55e" />
                <StatCard label="Rest Stops" value={result.summary.num_rest_stops} sub="10hr+ breaks" accent="#7c3aed" />
                <StatCard label="Fuel Stops" value={result.summary.num_fuel_stops} sub="every 1,000 mi" accent="#ec4899" />
                <StatCard label="Cycle Remaining" value={`${result.summary.cycle_hours_remaining}h`} sub="of 70hr cycle" accent={result.summary.cycle_hours_remaining < 10 ? '#ef4444' : '#22c55e'} />
              </div>
            </div>

            {/* Tabs */}
            <div className="tab-bar" role="tablist">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  className={`tab-btn ${activeTab === tab.id ? 'tab-btn--active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Map Tab */}
            {activeTab === 'map' && (
              <div className="panel">
                <div className="panel-header">
                  <div className="panel-title">🗺 Route Map</div>
                  <div className="panel-subtitle">
                    {result.stops?.length} stops · click markers for details · powered by OpenStreetMap
                  </div>
                </div>
                <TripMap stops={result.stops} routeWaypoints={result.route_waypoints} />
              </div>
            )}

            {/* Stops Tab */}
            {activeTab === 'stops' && (
              <div className="panel">
                <div className="panel-header">
                  <div className="panel-title">📍 Complete Stop Log</div>
                  <div className="panel-subtitle">
                    {result.stops?.length} stops across {result.total_days} days
                  </div>
                </div>
                <div className="panel-body">
                  <div className="stop-list">
                    {result.stops?.map((stop, idx) => (
                      <StopCard key={idx} stop={stop} index={idx} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ELD Log Sheets Tab */}
            {activeTab === 'logs' && (
              <div className="panel">
                <div className="panel-header panel-header--flex">
                  <div>
                    <div className="panel-title">📋 ELD Daily Log Sheets</div>
                    <div className="panel-subtitle">
                      {result.daily_logs?.length} log sheets — 24-hour HOS grid with status bars
                    </div>
                  </div>
                  <div className="day-selector">
                    {result.daily_logs?.map((log, i) => (
                      <button
                        key={i}
                        className={`day-btn ${activeLogDay === i ? 'day-btn--active' : ''}`}
                        onClick={() => setActiveLogDay(i)}
                      >
                        Day {log.day_number}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="panel-body">
                  {result.daily_logs?.[activeLogDay] && (
                    <>
                      <ELDLogSheet
                        dailyLog={result.daily_logs[activeLogDay]}
                        width={820}
                      />

                      {/* Status timeline */}
                      <div className="status-timeline">
                        <div className="status-timeline-label">
                          Status Changes — Day {result.daily_logs[activeLogDay].day_number}
                        </div>
                        <div className="status-list">
                          {result.daily_logs[activeLogDay].log_entries?.map((entry, ei) => {
                            const color = STATUS_COLORS[entry.status] || '#8892b0'
                            return (
                              <div
                                key={ei}
                                className="status-entry"
                                style={{
                                  borderColor: `${color}25`,
                                  animationDelay: `${ei * 0.04}s`,
                                }}
                              >
                                <span className="status-time">{entry.time_formatted}</span>
                                <span
                                  className="status-badge"
                                  style={{
                                    background: color + '18',
                                    color: color,
                                  }}
                                >
                                  {STATUS_LABELS[entry.status] || entry.status}
                                </span>
                                <span className="status-remark">{entry.remarks}</span>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty state */}
        {!result && !loading && (
          <div className="empty-state">
            <div className="empty-icon">🚛</div>
            <div className="empty-title">Enter trip details above to get started</div>
            <div className="empty-description">
              The app will calculate HOS-compliant stops and generate ELD log sheets automatically
            </div>
          </div>
        )}
      </main>

      {/* ─── Footer ──────────────────────────────────────────── */}
      <footer className="footer">
        ELD Trip Planner<span>·</span>70hr/8day Property Carrier<span>·</span>FMCSA 49 CFR Part 395<span>·</span>Map: OpenStreetMap / OSRM
      </footer>
    </div>
  )
}
