import { useState, useEffect } from 'react'
import { BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts'
import { api } from '../services/api'

const COLORS = ['#1A1A1A', '#4A4A4A', '#7A756D', '#B33A3A', '#3A7B4A', '#2B2B2B', '#D4CDC0', '#8B7D6B']

export default function Summary() {
  const [by, setBy] = useState<'tag' | 'month'>('tag')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [data, setData] = useState<{ label: string; total: number }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    api.getSummary(by, from || undefined, to || undefined)
      .then(setData)
      .catch(() => setData([]))
      .finally(() => setLoading(false))
  }, [by, from, to])

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <h1 className="text-2xl font-heading text-text-primary">Summary</h1>

      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex gap-1">
          <button
            onClick={() => setBy('tag')}
            className={`px-3 py-1.5 text-sm rounded-[2px] border cursor-pointer ${
              by === 'tag' ? 'bg-accent-ink text-white border-accent-ink' : 'bg-transparent text-text-muted border-border-default hover:bg-bg-hover'
            }`}
          >
            By Tag
          </button>
          <button
            onClick={() => setBy('month')}
            className={`px-3 py-1.5 text-sm rounded-[2px] border cursor-pointer ${
              by === 'month' ? 'bg-accent-ink text-white border-accent-ink' : 'bg-transparent text-text-muted border-border-default hover:bg-bg-hover'
            }`}
          >
            By Month
          </button>
        </div>
        <input type="date" value={from} onChange={e => setFrom(e.target.value)}
          className="border-b border-border-default bg-transparent px-0 py-1 text-sm text-text-primary outline-none" />
        <span className="text-text-muted text-sm">to</span>
        <input type="date" value={to} onChange={e => setTo(e.target.value)}
          className="border-b border-border-default bg-transparent px-0 py-1 text-sm text-text-primary outline-none" />
      </div>

      {loading ? (
        <p className="text-text-muted text-sm text-center py-8">Loading...</p>
      ) : data.length === 0 ? (
        <p className="text-text-muted text-sm text-center py-8">No data for the selected period.</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="border border-border-default rounded-[4px] p-4 bg-bg-surface">
            <h2 className="text-sm font-mono text-text-muted uppercase tracking-wider mb-4">
              {by === 'tag' ? 'Totals by Tag' : 'Totals by Month'}
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data}>
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#7A756D' }} axisLine={{ stroke: '#D4CDC0' }} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#7A756D' }} axisLine={{ stroke: '#D4CDC0' }} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#EBE5D9', border: '1px solid #D4CDC0', borderRadius: 2, fontSize: 13 }}
                  formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Total']}
                />
                <Bar dataKey="total" fill="#1A1A1A" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="border border-border-default rounded-[4px] p-4 bg-bg-surface">
            <h2 className="text-sm font-mono text-text-muted uppercase tracking-wider mb-4">Distribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data}
                  dataKey="total"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ name, payload }: { name?: string; payload?: { total: number } }) => {
                    const total = data.reduce((s, d) => s + d.total, 0)
                    const pct = total ? ((payload?.total ?? 0) / total * 100).toFixed(0) : 0
                    return `${name} (${pct}%)`
                  }}
                >
                  {data.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#EBE5D9', border: '1px solid #D4CDC0', borderRadius: 2, fontSize: 13 }}
                  formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Total']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="border border-border-default rounded-[4px] p-4 bg-bg-surface">
        <h2 className="text-sm font-mono text-text-muted uppercase tracking-wider mb-3">Table</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-default text-text-muted font-mono text-xs uppercase tracking-wider">
              <th className="text-left py-2 font-normal">{by === 'tag' ? 'Tag' : 'Month'}</th>
              <th className="text-right py-2 font-normal">Total</th>
            </tr>
          </thead>
          <tbody>
            {data.map(d => (
              <tr key={d.label} className="border-b border-border-default hover:bg-bg-hover">
                <td className="py-2 text-text-primary">{d.label}</td>
                <td className="py-2 text-right font-mono text-text-primary tabular-nums">
                  ₹{d.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </td>
              </tr>
            ))}
            <tr className="font-medium">
              <td className="py-2 text-text-primary">Total</td>
              <td className="py-2 text-right font-mono text-text-primary tabular-nums">
                ₹{data.reduce((s, d) => s + d.total, 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}