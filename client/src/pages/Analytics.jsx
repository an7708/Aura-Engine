    import { useEffect, useState } from 'react';
    import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    PieChart, Pie, Cell, Legend, ResponsiveContainer
    } from 'recharts';
    import api from '../api/axios';

    const COLORS = ['#10B981', '#6366F1', '#F59E0B', '#EF4444', '#06B6D4', '#8B5CF6', '#EC4899', '#F97316'];

    export default function Analytics() {
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchAnalytics = async () => {
        try {
            const res = await api.get('/inventory/analytics');
            setAnalytics(res.data.analytics);
        } catch (err) {
            setError('Failed to load analytics. Is the server running?');
        } finally {
            setLoading(false);
        }
        };
        fetchAnalytics();
    }, []);

    if (loading) return <div className="state-box">Loading analytics pipeline...</div>;
    if (error) return <div className="state-box error">{error}</div>;

    const { summary, categoryDistribution, lowStockAlert } = analytics;

    return (
        <div className="page-container">

        <div className="analytics-header">
            <h1 className="analytics-title">Command Center</h1>
            <p className="analytics-subtitle">
            Real-time analytics powered by MongoDB aggregation pipeline
            </p>
        </div>

        <div className="kpi-grid">
            <div className="kpi-card">
            <div className="kpi-label">Total SKUs</div>
            <div className="kpi-value green">{summary.totalSKUs?.toLocaleString()}</div>
            </div>
            <div className="kpi-card">
            <div className="kpi-label">Total Inventory Value</div>
            <div className="kpi-value indigo">${summary.totalInventoryValue?.toLocaleString()}</div>
            </div>
            <div className="kpi-card">
            <div className="kpi-label">Out of Stock Items</div>
            <div className="kpi-value red">{summary.outOfStockItems?.toLocaleString()}</div>
            </div>
            <div className="kpi-card">
            <div className="kpi-label">Low Stock Items</div>
            <div className="kpi-value amber">{summary.lowStockItems?.toLocaleString()}</div>
            </div>
        </div>

        <div className="charts-grid">
            <div className="chart-card">
            <div className="chart-title">Restock Priority</div>
            <div className="chart-subtitle">Top 10 products with lowest stock levels</div>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={lowStockAlert} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F2F4F7" />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="productName" width={130} tick={{ fontSize: 10, fill: '#6B7280' }}
                    tickFormatter={(val) => val.length > 18 ? val.slice(0, 18) + '…' : val}
                    axisLine={false} tickLine={false} />
                <Tooltip
                    formatter={(value) => [`${value} units`, 'Stock']}
                    contentStyle={{ fontSize: '12px', borderRadius: '8px', border: '1px solid #E4E7EC', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                />
                <Bar dataKey="stockQuantity" radius={[0, 4, 4, 0]}>
                    {lowStockAlert.map((entry, index) => (
                    <Cell key={index} fill={entry.isCritical ? '#EF4444' : '#F59E0B'} />
                    ))}
                </Bar>
                </BarChart>
            </ResponsiveContainer>
            </div>

            <div className="chart-card">
            <div className="chart-title">Portfolio Distribution</div>
            <div className="chart-subtitle">Total inventory value by category</div>
            <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                <Pie
                    data={categoryDistribution}
                    dataKey="totalValue"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ category, percent }) => `${(percent * 100).toFixed(0)}%`}
                    labelLine={false}>
                    {categoryDistribution.map((entry, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Pie>
                <Tooltip
                    formatter={(value) => [`$${value.toLocaleString()}`, 'Value']}
                    contentStyle={{ fontSize: '12px', borderRadius: '8px', border: '1px solid #E4E7EC', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                />
                <Legend
                    iconType="circle"
                    iconSize={8}
                    formatter={(value) => value}
                    wrapperStyle={{ fontSize: '12px', color: '#6B7280' }}
                />
                </PieChart>
            </ResponsiveContainer>
            </div>
        </div>

        <div className="breakdown-card">
            <div className="breakdown-title">Category Breakdown</div>
            <table className="breakdown-table">
            <thead>
                <tr>
                <th>Category</th>
                <th>Products</th>
                <th>Total Stock</th>
                <th>Total Value</th>
                </tr>
            </thead>
            <tbody>
                {categoryDistribution.map((row, i) => (
                <tr key={i}>
                    <td>{row.category}</td>
                    <td>{row.productCount.toLocaleString()}</td>
                    <td>{row.totalStock.toLocaleString()}</td>
                    <td>${row.totalValue.toLocaleString()}</td>
                </tr>
                ))}
            </tbody>
            </table>
        </div>
        </div>
    );
    }