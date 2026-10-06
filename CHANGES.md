# Changes

## 2026-10.001 - Modernize

### Change

- Remove Postgres in favour of in-memory buffering backed by disk. Historical capture
  moves to iss-telemetry-capture.
- Replace socket.io with SSE.
- Replace webpack+Babel-based building with basic Vite.
- Replace JS with TS, React/Flummox et al. with Preact.
- Update all remaining libraries, e.g., D3 and three.js.
- Match parameter precision to NASA resolution, and coordinate units, for coolant flow,
  tank pressure, gyroscope vibration, and attitude rate change.
- Head the actual attitude as LVLH, the frame its quaternion always uses, and present the
  controller's frame separately.

### Add

- Show how far each solar array's rotation deviates from its group's mean, with the
  mirroring of its mounting undone.

### Remove

- Remove the `/rss.xml` feed.
- Remove Slack integration.
- Remove the solar arrays' mean rotation and incidence rows.
- Remove the gyroscope vibration alarm lights until we have definitive thresholds.
- Remove the photovoltaic orientation procedure.

### Fix

- Replace voltage totals with deviations from group means.
- Correct units and labels: coolant and tank pressures, voltages, airlocks' supply and
  umbilicals, and the desaturation light.
- Filter stream updates to those in STDEFAULT (AOS) or STSTATIC.
- Correct the handling of stream updates timestamped late December.
- Unify zero/dash presentations.
- Resize charts when the window resizes.
- Convert bullet charts' mean markers into the unit of their measure.
