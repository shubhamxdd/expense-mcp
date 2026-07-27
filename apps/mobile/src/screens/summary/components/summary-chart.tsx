import { View, Text, StyleSheet } from 'react-native'
import Svg, { Rect, Circle, Line, Text as SvgText } from 'react-native-svg'
import { formatCurrency } from '../../../utils/format'

interface SummaryChartProps {
  data: { label: string; total: number }[]
  type: 'bar' | 'pie'
  title: string
}

const COLORS = ['#007AFF', '#FF9500', '#34C759', '#FF3B30', '#AF52DE', '#FF2D55', '#5856D6', '#8E8E93']

export function SummaryChart({ data, type, title }: SummaryChartProps) {
  if (data.length === 0) {
    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.empty}>No data</Text>
      </View>
    )
  }

  const maxTotal = Math.max(...data.map(d => d.total))
  const chartHeight = 200
  const chartWidth = 300
  const barWidth = Math.max(20, Math.min(40, (chartWidth - 40) / data.length))
  const gap = 8

  if (type === 'bar') {
    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Svg width={chartWidth} height={chartHeight}>
          {data.map((d, i) => {
            const barHeight = maxTotal > 0 ? (d.total / maxTotal) * (chartHeight - 30) : 0
            const x = 20 + i * (barWidth + gap)
            const y = chartHeight - 10 - barHeight
            return (
              <Rect
                key={d.label}
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill={COLORS[i % COLORS.length]}
                rx={4}
              />
            )
          })}
          {data.map((d, i) => {
            const x = 20 + i * (barWidth + gap) + barWidth / 2
            return (
              <SvgText
                key={`label-${d.label}`}
                x={x}
                y={chartHeight - 2}
                fontSize={9}
                fill="#8E8E93"
                textAnchor="middle"
              >
                {d.label.slice(0, 6)}
              </SvgText>
            )
          })}
        </Svg>
        <View style={styles.legend}>
          {data.map((d, i) => (
            <View key={d.label} style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: COLORS[i % COLORS.length] }]} />
              <Text style={styles.legendLabel}>{d.label}</Text>
              <Text style={styles.legendValue}>{formatCurrency(d.total)}</Text>
            </View>
          ))}
        </View>
      </View>
    )
  }

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      <View style={styles.pieContainer}>
        {data.map((d, i) => {
          const total = data.reduce((s, d) => s + d.total, 0)
          const pct = total > 0 ? ((d.total / total) * 100).toFixed(0) : 0
          return (
            <View key={d.label} style={styles.pieRow}>
              <View style={[styles.pieDot, { backgroundColor: COLORS[i % COLORS.length] }]} />
              <Text style={styles.pieLabel}>{d.label}</Text>
              <Text style={styles.pieValue}>{pct}%</Text>
              <Text style={styles.pieAmount}>{formatCurrency(d.total)}</Text>
            </View>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  empty: {
    textAlign: 'center',
    color: '#8E8E93',
    fontSize: 14,
    paddingVertical: 24,
  },
  legend: {
    marginTop: 12,
    gap: 6,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    fontSize: 13,
    color: '#3C3C43',
    flex: 1,
  },
  legendValue: {
    fontSize: 13,
    color: '#000000',
    fontWeight: '600',
    fontFamily: 'Menlo',
  },
  pieContainer: {
    gap: 10,
  },
  pieRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pieDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  pieLabel: {
    fontSize: 14,
    color: '#3C3C43',
    flex: 1,
  },
  pieValue: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '600',
    width: 40,
    textAlign: 'right',
  },
  pieAmount: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '600',
    fontFamily: 'Menlo',
    width: 90,
    textAlign: 'right',
  },
})
