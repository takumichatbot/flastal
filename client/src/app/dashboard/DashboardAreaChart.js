'use client';

import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

function CustomTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white border border-slate-100 rounded-xl shadow-lg px-4 py-3 text-sm">
            <p className="text-slate-500 text-xs mb-1">{label}</p>
            <p className="font-black text-pink-600">¥{payload[0].value.toLocaleString()}</p>
        </div>
    );
}

export default function DashboardAreaChart({ data, projectId }) {
    return (
        <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <defs>
                    <linearGradient id={`grad-${projectId}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#94a3b8' }} tickLine={false} axisLine={false}
                    tickFormatter={d => d.slice(5)} />
                <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} tickLine={false} axisLine={false}
                    tickFormatter={v => `¥${(v / 1000).toFixed(0)}k`} width={40} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="total" stroke="#f43f5e" strokeWidth={2}
                    fill={`url(#grad-${projectId})`} dot={false} activeDot={{ r: 4, fill: '#f43f5e' }} />
            </AreaChart>
        </ResponsiveContainer>
    );
}
