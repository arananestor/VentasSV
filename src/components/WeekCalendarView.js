import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Rect, Text as SvgText, Line } from 'react-native-svg';
import { useTheme } from '../context/ThemeContext';
import useResponsive from '../hooks/useResponsive';

const DAY_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const START_HOUR = 6;
const END_HOUR = 24;
const HOUR_COUNT = END_HOUR - START_HOUR;
const HEADER_H = 24;
const ROW_H = 16;

export function computeBandPositions(activations, modes, colWidth, hourHeight) {
  const bands = [];
  const modeMap = {};
  modes.forEach(m => { modeMap[m.id] = m; });

  activations.forEach(act => {
    const mode = modeMap[act.modeId];
    const color = mode?.color || '#4361EE';
    const label = mode?.name || '';

    const ranges = expandActivationToRanges(act);
    ranges.forEach(r => {
      const dayIdx = dayToColumn(r.day);
      if (dayIdx < 0) return;
      const startClamp = Math.max(r.startMin, START_HOUR * 60);
      const endClamp = Math.min(r.endMin, END_HOUR * 60);
      if (startClamp >= endClamp) return;

      const x = dayIdx * colWidth;
      const y = HEADER_H + ((startClamp - START_HOUR * 60) / 60) * hourHeight;
      const height = ((endClamp - startClamp) / 60) * hourHeight;

      bands.push({ x, y, width: colWidth, height, color, label, day: r.day, modeId: act.modeId });
    });
  });

  return bands;
}

function expandActivationToRanges(act) {
  const startMin = timeToMinutes(act.startTime || '00:00');
  const rawEnd = timeToMinutes(act.endTime || '23:59');
  const crossDay = rawEnd <= startMin;

  if (act.type === 'evento' && act.date) {
    const d = new Date(act.date + 'T00:00:00');
    const day = d.getDay();
    if (crossDay) {
      return [
        { day, startMin, endMin: 24 * 60 },
        { day: (day + 1) % 7, startMin: 0, endMin: rawEnd },
      ];
    }
    return [{ day, startMin, endMin: rawEnd }];
  }

  if (act.type === 'recurrente' && act.days) {
    if (crossDay) {
      return act.days.flatMap(day => [
        { day, startMin, endMin: 24 * 60 },
        { day: (day + 1) % 7, startMin: 0, endMin: rawEnd },
      ]);
    }
    return act.days.map(day => ({ day, startMin, endMin: rawEnd }));
  }
  return [];
}

function timeToMinutes(t) {
  const [h, m] = (t || '00:00').split(':').map(Number);
  return h * 60 + (m || 0);
}

function dayToColumn(day) {
  // 0=Sun → column 6, 1=Mon → 0, ..., 6=Sat → 5
  return day === 0 ? 6 : day - 1;
}

export default function WeekCalendarView({ scheduledActivations = [], modes = [] }) {
  const { theme } = useTheme();
  const { width } = useResponsive();
  const calWidth = width - 32;
  const colWidth = calWidth / 7;
  const hourHeight = ROW_H;
  const svgHeight = HEADER_H + HOUR_COUNT * hourHeight;

  const bands = computeBandPositions(scheduledActivations, modes, colWidth, hourHeight);

  return (
    <View style={[styles.container, { borderColor: theme.cardBorder }]}>
      <Svg width={calWidth} height={svgHeight}>
        {/* Day headers */}
        {DAY_LABELS.map((label, i) => (
          <SvgText key={`h${i}`} x={i * colWidth + colWidth / 2} y={16} fontSize={10} fontWeight="700"
            fill={theme.textMuted} textAnchor="middle">{label}</SvgText>
        ))}

        {/* Hour grid lines */}
        {Array.from({ length: HOUR_COUNT + 1 }, (_, i) => (
          <Line key={`g${i}`} x1={0} x2={calWidth} y1={HEADER_H + i * hourHeight} y2={HEADER_H + i * hourHeight}
            stroke={theme.cardBorder} strokeWidth={0.5} />
        ))}

        {/* Column dividers */}
        {Array.from({ length: 6 }, (_, i) => (
          <Line key={`c${i}`} x1={(i + 1) * colWidth} x2={(i + 1) * colWidth}
            y1={HEADER_H} y2={svgHeight} stroke={theme.cardBorder} strokeWidth={0.5} />
        ))}

        {/* Bands */}
        {bands.map((b, i) => (
          <React.Fragment key={i}>
            <Rect x={b.x + 1} y={b.y} width={b.width - 2} height={Math.max(b.height, 2)}
              rx={3} fill={b.color} opacity={0.85} />
            {b.height > 30 && (
              <SvgText x={b.x + 4} y={b.y + 12} fontSize={8} fontWeight="600" fill="#fff">
                {b.label.length > 8 ? b.label.slice(0, 8) + '…' : b.label}
              </SvgText>
            )}
          </React.Fragment>
        ))}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { borderWidth: 1, borderRadius: 12, overflow: 'hidden', padding: 4 },
});
