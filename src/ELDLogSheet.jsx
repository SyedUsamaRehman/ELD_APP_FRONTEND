import { useEffect, useRef } from 'react';

// Row order matches the actual DOT form exactly
const STATUS_ROWS = {
  off_duty: 0,
  sleeper: 1,
  driving: 2,
  on_duty_not_driving: 3,
};

export default function ELDLogSheet({ dailyLog, width = 860 }) {
  const canvasRef = useRef(null);

  // --- Layout constants (all in logical px, scaled by DPR) ---
  const PAD_L = 12;
  const PAD_R = 12;
  const LABEL_W = 130;          // left label column
  const TOTAL_COL_W = 56;       // "Total Hours" right column
  const GRID_X = PAD_L + LABEL_W;
  const GRID_W = width - PAD_L - LABEL_W - TOTAL_COL_W - PAD_R;
  const HOUR_W = GRID_W / 24;

  // Header section
  const HDR_H = 160;

  // Grid section
  const GRID_TOP = HDR_H + 4;
  const ROW_H = 44;
  const GRID_H = ROW_H * 4;
  const REMARKS_TOP = GRID_TOP + GRID_H;
  const REMARKS_H = 72;

  // Recap section
  const RECAP_TOP = REMARKS_TOP + REMARKS_H + 4;
  const RECAP_H = 90;

  const CANVAS_H = RECAP_TOP + RECAP_H + 16;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !dailyLog) return;

    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = width * DPR;
    canvas.height = CANVAS_H * DPR;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${CANVAS_H}px`;

    const ctx = canvas.getContext('2d');
    ctx.scale(DPR, DPR);

    // White background (DOT paper log is white)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, CANVAS_H);

    drawHeader(ctx);
    drawGrid(ctx);
    drawRemarks(ctx);
    drawRecap(ctx);

    // Outer border
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(PAD_L, 1, width - PAD_L - PAD_R, CANVAS_H - 4);

  }, [dailyLog, width]);

  // ─── HEADER ────────────────────────────────────────────────────────────────
  function drawHeader(ctx) {
    const x0 = PAD_L;
    const y0 = 1;
    const w = width - PAD_L - PAD_R;

    // Title row
    ctx.fillStyle = '#000';
    ctx.font = 'bold 13px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('DRIVER\'S DAILY LOG', x0 + w / 2, y0 + 15);

    ctx.font = '8px Arial, sans-serif';
    ctx.fillText('(24 hours)', x0 + w / 2, y0 + 26);

    // Original/duplicate note
    ctx.textAlign = 'right';
    ctx.font = '7.5px Arial, sans-serif';
    ctx.fillText('Original — File at home terminal.', x0 + w, y0 + 12);
    ctx.fillText('Duplicate — Driver retains in his/her possession for 8 days.', x0 + w, y0 + 22);

    // Date row ── (month) / (day) / (year)
    const dateY = y0 + 38;
    ctx.textAlign = 'left';
    ctx.font = '8px Arial, sans-serif';
    ctx.fillStyle = '#444';
    ctx.fillText('(month)', x0 + 10, dateY + 12);
    ctx.fillText('(day)', x0 + 70, dateY + 12);
    ctx.fillText('(year)', x0 + 125, dateY + 12);

    // Draw date values
    ctx.font = 'bold 10px Arial, sans-serif';
    ctx.fillStyle = '#000';
    const today = new Date();
    const dayNum = String(today.getDate()).padStart(2, '0');
    const monthNum = String(today.getMonth() + 1).padStart(2, '0');
    const yr = String(today.getFullYear());
    ctx.fillText(monthNum, x0 + 10, dateY + 2);
    ctx.fillText(dayNum, x0 + 70, dateY + 2);
    ctx.fillText(yr, x0 + 125, dateY + 2);

    // Underlines for date fields
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 0.8;
    [[x0 + 8, x0 + 60], [x0 + 65, x0 + 110], [x0 + 115, x0 + 170]].forEach(([sx, ex]) => {
      ctx.beginPath(); ctx.moveTo(sx, dateY + 5); ctx.lineTo(ex, dateY + 5); ctx.stroke();
    });

    // From: / To: row
    const fromY = y0 + 58;
    ctx.fillStyle = '#000';
    ctx.font = 'bold 8.5px Arial, sans-serif';
    ctx.fillText('From:', x0 + 4, fromY);
    ctx.fillText('To:', x0 + w * 0.52, fromY);

    ctx.font = '9px Arial, sans-serif';
    ctx.fillStyle = '#222';
    const fromLoc = (dailyLog.from_location || '').substring(0, 38);
    const toLoc = (dailyLog.to_location || '').substring(0, 38);
    ctx.fillText(fromLoc, x0 + 30, fromY);
    ctx.fillText(toLoc, x0 + w * 0.52 + 18, fromY);

    ctx.strokeStyle = '#000';
    ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.moveTo(x0 + 30, fromY + 2); ctx.lineTo(x0 + w * 0.50, fromY + 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x0 + w * 0.52 + 18, fromY + 2); ctx.lineTo(x0 + w - 4, fromY + 2); ctx.stroke();

    // Total miles / Mileage box
    const milesY = y0 + 74;
    ctx.strokeStyle = '#000'; ctx.lineWidth = 0.8;
    ctx.strokeRect(x0 + 4, milesY, 80, 20);
    ctx.strokeRect(x0 + 90, milesY, 80, 20);

    ctx.font = '7px Arial, sans-serif'; ctx.fillStyle = '#000';
    ctx.fillText('Total Miles Driving Today', x0 + 6, milesY + 8);
    ctx.fillText('Total Mileage Today', x0 + 92, milesY + 8);
    ctx.font = 'bold 10px Arial, sans-serif';
    ctx.fillText(String(Math.round(dailyLog.total_miles || 0)), x0 + 30, milesY + 17);

    // Truck / Trailer number box
    ctx.strokeRect(x0 + 4, milesY + 24, 170, 18);
    ctx.font = '7px Arial, sans-serif'; ctx.fillStyle = '#000';
    ctx.fillText('Truck/Tractor and Trailer Numbers or License Plate(s)/State (show each unit)', x0 + 6, milesY + 32);
    ctx.font = 'bold 9px Arial, sans-serif';
    ctx.fillText(`${dailyLog.truck_number || 'TRK-001'} / ${dailyLog.trailer_number || 'TRL-001'}`, x0 + 30, milesY + 39);

    // Right side: Carrier / Office / Signature
    const rightX = x0 + w * 0.48;
    const rW = w * 0.52 - 4;
    const infoY = milesY;

    // Name of Carrier
    ctx.font = '7.5px Arial, sans-serif'; ctx.fillStyle = '#000';
    ctx.fillText('Name of Carrier or Carriers', rightX, infoY + 8);
    ctx.strokeStyle = '#000'; ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.moveTo(rightX, infoY + 10); ctx.lineTo(rightX + rW, infoY + 10); ctx.stroke();
    ctx.font = 'bold 9px Arial, sans-serif';
    ctx.fillText(dailyLog.carrier || 'Independent Carrier', rightX, infoY + 20);

    // Main Office Address
    ctx.font = '7.5px Arial, sans-serif'; ctx.fillStyle = '#000';
    ctx.fillText('Main Office Address', rightX, infoY + 32);
    ctx.beginPath(); ctx.moveTo(rightX, infoY + 34); ctx.lineTo(rightX + rW, infoY + 34); ctx.stroke();
    ctx.font = '8px Arial, sans-serif';
    ctx.fillText('USA', rightX, infoY + 44);

    // Driver Signature
    ctx.font = '7.5px Arial, sans-serif';
    ctx.fillText(`Driver's Signature: ${dailyLog.driver_name || 'Driver'}`, rightX, infoY + 56);
    ctx.beginPath(); ctx.moveTo(rightX, infoY + 58); ctx.lineTo(rightX + rW, infoY + 58); ctx.stroke();

    // Co-Driver
    ctx.fillText('Name of Co-Driver (if any): —', rightX, infoY + 70);
    ctx.beginPath(); ctx.moveTo(rightX, infoY + 72); ctx.lineTo(rightX + rW, infoY + 72); ctx.stroke();

    // Divider line before grid
    ctx.strokeStyle = '#000'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x0, HDR_H); ctx.lineTo(x0 + w, HDR_H); ctx.stroke();
  }

  // ─── GRID ──────────────────────────────────────────────────────────────────
  function drawGrid(ctx) {
    const x0 = PAD_L;
    const w = width - PAD_L - PAD_R;
    const gridRight = GRID_X + GRID_W;

    // Row labels — exactly as on DOT form
    const labels = [
      { num: '1.', text: 'Off Duty' },
      { num: '2.', text: 'Sleeper\nBerth' },
      { num: '3.', text: 'Driving' },
      { num: '4.', text: 'On Duty\n(Not Driving)' },
    ];

    labels.forEach((lbl, i) => {
      const rowY = GRID_TOP + i * ROW_H;

      // Row background (alternate very slightly)
      ctx.fillStyle = i % 2 === 0 ? '#fafafa' : '#f4f4f4';
      ctx.fillRect(GRID_X, rowY, GRID_W, ROW_H);

      // Row number + label
      ctx.fillStyle = '#000';
      ctx.textAlign = 'right';
      ctx.font = 'bold 9px Arial, sans-serif';
      ctx.fillText(lbl.num, PAD_L + 22, rowY + ROW_H / 2 + 3);

      ctx.textAlign = 'left';
      ctx.font = '8.5px Arial, sans-serif';
      const lines = lbl.text.split('\n');
      if (lines.length === 1) {
        ctx.fillText(lines[0], PAD_L + 26, rowY + ROW_H / 2 + 4);
      } else {
        ctx.fillText(lines[0], PAD_L + 26, rowY + ROW_H / 2 - 2);
        ctx.fillText(lines[1], PAD_L + 26, rowY + ROW_H / 2 + 9);
      }

      // Horizontal row divider
      ctx.strokeStyle = '#000';
      ctx.lineWidth = i === 0 ? 1 : 0.5;
      ctx.beginPath();
      ctx.moveTo(x0, rowY);
      ctx.lineTo(x0 + w - TOTAL_COL_W - PAD_R, rowY);
      ctx.stroke();
    });

    // Bottom border of grid
    ctx.strokeStyle = '#000'; ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x0, GRID_TOP + GRID_H);
    ctx.lineTo(x0 + w - TOTAL_COL_W - PAD_R, GRID_TOP + GRID_H);
    ctx.stroke();

    // Vertical separator between labels and grid
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(GRID_X, GRID_TOP - 2);
    ctx.lineTo(GRID_X, GRID_TOP + GRID_H);
    ctx.stroke();

    // ── Hour tick marks and labels ───────────────────────────────────────────
    const tickLabels = {
      0: 'Mid-\nnight', 1: '1', 2: '2', 3: '3', 4: '4', 5: '5', 6: '6',
      7: '7', 8: '8', 9: '9', 10: '10', 11: '11', 12: 'Noon',
      13: '1', 14: '2', 15: '3', 16: '4', 17: '5', 18: '6',
      19: '7', 20: '8', 21: '9', 22: '10', 23: '11', 24: 'Mid-\nnight',
    };

    for (let h = 0; h <= 24; h++) {
      const x = GRID_X + h * HOUR_W;
      const isMajor = h === 0 || h === 12 || h === 24;
      const isHalf = h === 6 || h === 18;

      // Vertical grid line through all rows
      ctx.strokeStyle = isMajor ? '#000' : '#aaa';
      ctx.lineWidth = isMajor ? 1 : 0.4;
      ctx.beginPath();
      ctx.moveTo(x, GRID_TOP);
      ctx.lineTo(x, GRID_TOP + GRID_H);
      ctx.stroke();

      // 15-minute ticks inside each row
      for (let q = 1; q <= 3; q++) {
        const qx = x + (HOUR_W * q) / 4;
        if (h < 24) {
          for (let row = 0; row < 4; row++) {
            const rowY = GRID_TOP + row * ROW_H;
            const isTop = q === 2; // half-hour mark taller
            const tickLen = isTop ? 10 : 5;
            ctx.strokeStyle = '#888';
            ctx.lineWidth = 0.4;
            ctx.beginPath();
            ctx.moveTo(qx, rowY);
            ctx.lineTo(qx, rowY + tickLen);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(qx, rowY + ROW_H);
            ctx.lineTo(qx, rowY + ROW_H - tickLen);
            ctx.stroke();
          }
        }
      }

      // Hour label above grid
      if (tickLabels[h]) {
        ctx.fillStyle = '#000';
        ctx.textAlign = 'center';
        const labelX = h < 24 ? x + HOUR_W / 2 : x;
        const lines = tickLabels[h].split('\n');
        if (lines.length === 2) {
          ctx.font = (isMajor || isHalf) ? 'bold 7px Arial' : '7px Arial';
          ctx.fillText(lines[0], h === 24 ? x : labelX, GRID_TOP - 10);
          ctx.fillText(lines[1], h === 24 ? x : labelX, GRID_TOP - 2);
        } else {
          ctx.font = isMajor ? 'bold 8px Arial' : '8px Arial';
          ctx.fillText(tickLabels[h], labelX, GRID_TOP - 4);
        }
      }
    }

    // ── "Total Hours" column header ──────────────────────────────────────────
    const totalX = gridRight + 4;
    ctx.fillStyle = '#000';
    ctx.textAlign = 'center';
    ctx.font = 'bold 7px Arial';
    ctx.fillText('Total', totalX + TOTAL_COL_W / 2 - 4, GRID_TOP - 8);
    ctx.fillText('Hours', totalX + TOTAL_COL_W / 2 - 4, GRID_TOP - 1);

    // Vertical line before total column
    ctx.strokeStyle = '#000'; ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(gridRight, GRID_TOP - 14);
    ctx.lineTo(gridRight, GRID_TOP + GRID_H);
    ctx.stroke();

    // ── Draw the actual HOS status bars ─────────────────────────────────────
    const entries = dailyLog.log_entries || [];
    if (entries.length > 0) {
      for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        const rowIdx = STATUS_ROWS[entry.status];
        if (rowIdx === undefined) continue;

        const startT = entry.time;
        let endT;
        if (i < entries.length - 1) {
          endT = entries[i + 1].time;
          if (endT < startT) endT = 24;
        } else {
          endT = 24;
        }

        const barX = GRID_X + startT * HOUR_W;
        const barW = Math.max(1, (endT - startT) * HOUR_W);
        const barY = GRID_TOP + rowIdx * ROW_H;

        // Solid thick horizontal line (DOT-style — black line in the row)
        const lineY = barY + ROW_H / 2;
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(barX, lineY);
        ctx.lineTo(barX + barW, lineY);
        ctx.stroke();

        // Vertical drop-line to next status at transition
        if (i < entries.length - 1) {
          const nextEntry = entries[i + 1];
          const nextRowIdx = STATUS_ROWS[nextEntry.status];
          if (nextRowIdx !== undefined && nextRowIdx !== rowIdx && endT < 24) {
            const transX = GRID_X + endT * HOUR_W;
            const fromY = barY + ROW_H / 2;
            const toY = GRID_TOP + nextRowIdx * ROW_H + ROW_H / 2;
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(transX, fromY);
            ctx.lineTo(transX, toY);
            ctx.stroke();
          }
        }
      }
    }

    // ── Total hours per row ──────────────────────────────────────────────────
    const totals = [
      dailyLog.hours_off_duty || 0,
      dailyLog.hours_sleeper || 0,
      dailyLog.hours_driving || 0,
      dailyLog.hours_on_duty || 0,
    ];
    const grandTotal = totals.reduce((a, b) => a + b, 0);

    totals.forEach((t, i) => {
      const rowY = GRID_TOP + i * ROW_H;
      // Box for total
      ctx.strokeStyle = '#000'; ctx.lineWidth = 0.5;
      ctx.strokeRect(gridRight + 2, rowY + 2, TOTAL_COL_W - 4, ROW_H - 4);

      ctx.fillStyle = '#000';
      ctx.font = 'bold 10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(t.toFixed(2), gridRight + TOTAL_COL_W / 2, rowY + ROW_H / 2 + 4);
    });

    // Grand total line
    ctx.strokeStyle = '#000'; ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(gridRight, GRID_TOP + GRID_H);
    ctx.lineTo(gridRight + TOTAL_COL_W, GRID_TOP + GRID_H);
    ctx.stroke();
    ctx.font = 'bold 9px Arial';
    ctx.fillStyle = '#000';
    ctx.textAlign = 'center';
    ctx.fillText(`=${grandTotal.toFixed(2)}`, gridRight + TOTAL_COL_W / 2, GRID_TOP + GRID_H + 10);
  }

  // ─── REMARKS ───────────────────────────────────────────────────────────────
  function drawRemarks(ctx) {
    const x0 = PAD_L;
    const w = width - PAD_L - PAD_R;
    const y0 = REMARKS_TOP;

    // Box
    ctx.strokeStyle = '#000'; ctx.lineWidth = 0.8;
    ctx.strokeRect(x0, y0, w - TOTAL_COL_W - PAD_R + PAD_L, REMARKS_H);

    ctx.fillStyle = '#000';
    ctx.textAlign = 'left';
    ctx.font = 'bold 8px Arial';
    ctx.fillText('Remarks', x0 + 4, y0 + 11);

    // Pull key status-change entries for remarks
    const entries = dailyLog.log_entries || [];
    const remarkLines = entries
      .filter(e => e.remarks && e.remarks.trim())
      .slice(0, 5)
      .map(e => `${e.time_formatted || formatHour(e.time)}  —  ${e.location || ''}  |  ${e.remarks.substring(0, 60)}`);

    ctx.font = '7.5px Arial';
    ctx.fillStyle = '#222';
    remarkLines.forEach((line, i) => {
      ctx.fillText(line, x0 + 8, y0 + 24 + i * 10);
    });

    // Required DOT notes
    ctx.font = '7px Arial';
    ctx.fillStyle = '#555';
    ctx.fillText('Enter name of place you reported and where released from work, and when and where each change of duty occurred.', x0 + 4, y0 + REMARKS_H - 14);
    ctx.fillText('Use time standard of home terminal.', x0 + 4, y0 + REMARKS_H - 5);

    // Shipping docs label
    ctx.fillStyle = '#000';
    ctx.font = '7.5px Arial';
    ctx.fillText('Shipping Documents / Pro or Manifest No.:', x0 + 4, y0 + REMARKS_H + 10);
    ctx.strokeStyle = '#000'; ctx.lineWidth = 0.4;
    ctx.beginPath(); ctx.moveTo(x0 + 175, y0 + REMARKS_H + 10); ctx.lineTo(x0 + 340, y0 + REMARKS_H + 10); ctx.stroke();
    ctx.font = '7.5px Arial';
    ctx.fillText('Shipper & Commodity:', x0 + 350, y0 + REMARKS_H + 10);
    ctx.beginPath(); ctx.moveTo(x0 + 440, y0 + REMARKS_H + 10); ctx.lineTo(x0 + w - TOTAL_COL_W - 8, y0 + REMARKS_H + 10); ctx.stroke();
  }

  // ─── RECAP TABLE ───────────────────────────────────────────────────────────
  function drawRecap(ctx) {
    const x0 = PAD_L + 2;
    const y0 = RECAP_TOP;
    const w = width - PAD_L - PAD_R - 4;
    const col = (w - 80) / 6;  // 6 data columns

    // Box
    ctx.strokeStyle = '#000'; ctx.lineWidth = 0.8;
    ctx.strokeRect(x0, y0, w, RECAP_H);

    // Header row
    ctx.fillStyle = '#000';
    ctx.font = 'bold 8px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Recap:', x0 + 2, y0 + 9);
    ctx.font = '7px Arial';
    ctx.fillText('Complete at', x0 + 2, y0 + 18);
    ctx.fillText('end of day', x0 + 2, y0 + 26);

    // 70hr/8day heading
    const col70X = x0 + 78;
    ctx.font = 'bold 8px Arial';
    ctx.fillText('70 Hour/', col70X, y0 + 9);
    ctx.fillText('8 Day', col70X, y0 + 18);
    ctx.font = '7px Arial';
    ctx.fillText('Drivers', col70X, y0 + 26);

    // Column headers
    const colStartX = col70X + 48;
    ['A.', 'B.', 'C.'].forEach((lbl, i) => {
      const cx = colStartX + i * col;
      ctx.font = 'bold 8px Arial';
      ctx.fillText(lbl, cx + col / 2 - 4, y0 + 9);
    });

    // Divider line
    ctx.strokeStyle = '#000'; ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.moveTo(x0, y0 + 30); ctx.lineTo(x0 + w, y0 + 30); ctx.stroke();

    // Row labels
    const rowLabels = [
      'On duty\nhours\ntoday.\nTotal lines\n3 & 4',
    ];
    ctx.font = '6.5px Arial';
    ctx.fillStyle = '#000';
    const shortLabels = ['On duty\nhours today.\n(Lines 3 & 4)'];
    shortLabels[0].split('\n').forEach((line, li) => {
      ctx.fillText(line, x0 + 2, y0 + 38 + li * 9);
    });

    // A/B/C values
    const onDutyToday = (dailyLog.hours_driving || 0) + (dailyLog.hours_on_duty || 0);
    const aVal = onDutyToday.toFixed(2);
    // B = available tomorrow = 70 - used
    const bVal = Math.max(0, 70 - onDutyToday).toFixed(2);
    // C = hrs including today
    const cVal = onDutyToday.toFixed(2);

    [aVal, bVal, cVal].forEach((val, i) => {
      const cx = colStartX + i * col;
      ctx.strokeRect(cx, y0 + 32, col - 4, 24);
      ctx.font = 'bold 9px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(val, cx + col / 2 - 2, y0 + 48);
      ctx.textAlign = 'left';
    });

    // Sub-labels for A/B/C
    const subLabels = [
      ['A. Total hours', 'on duty today.'],
      ['B. Total hours', 'available', 'tomorrow'],
      ['C. Total hours', 'on duty last 7', 'days including', '70 hr. minus A*'],
    ];
    subLabels.forEach((lines, i) => {
      const cx = colStartX + i * col;
      ctx.font = '6px Arial';
      ctx.fillStyle = '#333';
      lines.forEach((line, li) => {
        ctx.fillText(line, cx, y0 + 60 + li * 7.5);
      });
    });

    // Asterisk note
    ctx.font = '6.5px Arial';
    ctx.fillStyle = '#000';
    ctx.textAlign = 'right';
    ctx.fillText('*If you took 34 consecutive hours off duty you have 60/70 hours available', x0 + w - 2, y0 + RECAP_H - 4);
    ctx.textAlign = 'left';

    // Certification text
    ctx.font = '7px Arial';
    ctx.fillStyle = '#000';
    ctx.fillText('I hereby certify that my data entries are true and correct.  49 CFR Part 395 · 70hr/8day · Property Carrier · No Adverse Conditions', x0 + 4, y0 + RECAP_H - 14);
  }

  function formatHour(h) {
    const hr = Math.floor(h) % 24;
    const min = Math.round((h - Math.floor(h)) * 60);
    const ampm = hr < 12 ? 'AM' : 'PM';
    const h12 = hr % 12 || 12;
    return `${String(h12).padStart(2, '0')}:${String(min).padStart(2, '0')} ${ampm}`;
  }

  return (
    <div className="eld-canvas-wrapper">
      <canvas ref={canvasRef} />
    </div>
  );
}
