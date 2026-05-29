    import { useState, useEffect, useCallback, useRef } from 'react';
    import api from '../api/axios';
    import { useDebounce } from '../hooks/useDebounce';
    import { exportToCSV } from '../utils/exportCSV';

    const CATEGORIES = [
    '', 'Electronics', 'Apparel', 'Furniture',
    'Food & Beverage', 'Sports', 'Automotive',
    'Health & Beauty', 'Toys',
    ];

    export default function Inventory() {
    const [products, setProducts] = useState([]);
    const [pagination, setPagination] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [category, setCategory] = useState('');
    const [maxStock, setMaxStock] = useState('');
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [page, setPage] = useState(1);
    const [sortBy, setSortBy] = useState('productName');
    const [order, setOrder] = useState('asc');

    const search = useDebounce(searchInput, 500);

    const prevParamsRef = useRef('');

    const fetchInventory = useCallback(async () => {
        const params = new URLSearchParams({ page, limit: 50, sortBy, order });
        if (search) params.append('search', search);
        if (category) params.append('category', category);
        if (minPrice) params.append('minPrice', minPrice);
        if (maxPrice) params.append('maxPrice', maxPrice);
        if (maxStock) params.append('maxStock', maxStock);

        const paramString = params.toString();

        if (paramString === prevParamsRef.current) return;
        prevParamsRef.current = paramString;

        setLoading(true);
        setError('');
        try {
        const res = await api.get(`/inventory?${paramString}`);
        setProducts(res.data.products);
        setPagination(res.data.pagination);
        } catch (err) {
        setError('Failed to fetch inventory. Is the server running?');
        } finally {
        setLoading(false);
        }
    }, [page, search, category, minPrice, maxPrice, maxStock, sortBy, order]);

    useEffect(() => { fetchInventory(); }, [fetchInventory]);

    useEffect(() => {
        prevParamsRef.current = '';
        setPage(1);
    }, [search, category, minPrice, maxPrice, maxStock]);

    const goToPage = useCallback((newPage) => {
        const total = pagination.totalPages || 1;
        const clamped = Math.max(1, Math.min(newPage, total));
        setPage((prev) => (prev === clamped ? prev : clamped));
    }, [pagination.totalPages]);

    const handleSort = (field) => {
        if (sortBy === field) setOrder(order === 'asc' ? 'desc' : 'asc');
        else { setSortBy(field); setOrder('asc'); }
    };

    const SortIcon = ({ field }) => {
        if (sortBy !== field) return <span className="sort-icon">↕</span>;
        return <span className="sort-icon active">{order === 'asc' ? '↑' : '↓'}</span>;
    };

    const stockBadge = (qty, reorder) => {
        if (qty === 0) return { cls: 'badge badge-danger', label: 'Out of stock' };
        if (qty <= reorder) return { cls: 'badge badge-warning', label: 'Low stock' };
        return { cls: 'badge badge-success', label: 'In stock' };
    };

    const handleClear = () => {
        prevParamsRef.current = '';
        setSearchInput('');
        setCategory('');
        setMinPrice('');
        setMaxPrice('');
        setMaxStock('');
    };

    return (
        <div className="page-container">

        <div className="page-header">
            <div>
            <h1 className="page-title">Inventory</h1>
            <p className="page-subtitle">
                {pagination.totalRecords?.toLocaleString() || '—'} total products
            </p>
            </div>
            <button className="btn-primary" onClick={() => exportToCSV(products, 'aura-inventory')}>
            Export CSV
            </button>
        </div>

        <div className="filter-bar">
            <div className="filter-group flex-1">
            <label className="filter-label">Search</label>
            <input
                className="filter-input"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search products"
            />
            </div>

            <div className="filter-group">
            <label className="filter-label">Category</label>
            <select
                className="filter-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}>
                {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c || 'All categories'}</option>
                ))}
            </select>
            </div>

            <div className="filter-group">
            <label className="filter-label">Min price ($)</label>
            <input
                className="filter-input"
                type="number"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder="0"
                style={{ width: '110px' }}
            />
            </div>

            <div className="filter-group">
            <label className="filter-label">Max price ($)</label>
            <input
                className="filter-input"
                type="number"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="9999"
                style={{ width: '110px' }}
            />
            </div>

            <div className="filter-group">
            <label className="filter-label">Max stock</label>
            <input
                className="filter-input"
                type="number"
                value={maxStock}
                onChange={(e) => setMaxStock(e.target.value)}
                placeholder="e.g. 20"
                style={{ width: '120px' }}
            />
            </div>

            <button className="btn-ghost" onClick={handleClear}>
            Clear
            </button>
        </div>

        {error && <div className="error-box">{error}</div>}

        <div className="table-card">
            <div className="table-scroll">
            <table className="data-table">
                <thead>
                <tr>
                    {[
                    { label: 'Product Name', field: 'productName' },
                    { label: 'SKU', field: 'sku' },
                    { label: 'Category', field: 'category' },
                    { label: 'Price', field: 'price' },
                    { label: 'Cost', field: 'cost' },
                    { label: 'Stock', field: 'stockQuantity' },
                    { label: 'Reorder At', field: 'reorderLevel' },
                    { label: 'Status', field: null },
                    ].map(({ label, field }) => (
                    <th
                        key={label}
                        className={field ? '' : 'no-sort'}
                        onClick={() => field && handleSort(field)}>
                        {label}
                        {field && <SortIcon field={field} />}
                    </th>
                    ))}
                </tr>
                </thead>
                <tbody>
                {loading ? (
                    <tr><td colSpan={8} className="td-empty">Loading inventory...</td></tr>
                ) : products.length === 0 ? (
                    <tr><td colSpan={8} className="td-empty">No products match your filters.</td></tr>
                ) : (
                    products.map((product) => {
                    const badge = stockBadge(product.stockQuantity, product.reorderLevel);
                    return (
                        <tr key={product._id}>
                        <td className="td-product-name">{product.productName}</td>
                        <td className="td-sku">{product.sku}</td>
                        <td className="td-muted">{product.category}</td>
                        <td className="td-price">${product.price.toFixed(2)}</td>
                        <td className="td-muted">${product.cost.toFixed(2)}</td>
                        <td className="td-price">{product.stockQuantity.toLocaleString()}</td>
                        <td className="td-muted">{product.reorderLevel}</td>
                        <td><span className={badge.cls}>{badge.label}</span></td>
                        </tr>
                    );
                    })
                )}
                </tbody>
            </table>
            </div>

            {pagination.totalPages > 1 && (
            <div className="pagination-bar">
                <span className="pagination-info">
                Page {pagination.currentPage} of {pagination.totalPages} — {products.length} of {pagination.totalRecords?.toLocaleString()} records
                </span>
                <div className="pagination-controls">
                <button
                    className="btn-page"
                    onClick={() => goToPage(page - 1)}
                    disabled={!pagination.hasPrevPage || loading}>
                    Previous
                </button>
                <button
                    className="btn-page"
                    onClick={() => goToPage(page + 1)}
                    disabled={!pagination.hasNextPage || loading}>
                    Next
                </button>
                </div>
            </div>
            )}
        </div>
        </div>
    );
    }    