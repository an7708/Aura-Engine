    import { useState } from 'react';
    import Inventory from './pages/Inventory';
    import Analytics from './pages/Analytics';
    import './App.css';

    export default function App() {
    const [activePage, setActivePage] = useState('inventory');

    return (
        <div className="app-wrapper">
        <nav className="navbar">
            <div className="navbar-brand">
            <div className="brand-dot" />
            <span className="brand-name">Aura Engine</span>
            <span className="brand-tag">Enterprise</span>
            </div>
            <div className="navbar-nav">
            <button
                className={`nav-btn ${activePage === 'inventory' ? 'active' : ''}`}
                onClick={() => setActivePage('inventory')}>
                Inventory
            </button>
            <button
                className={`nav-btn ${activePage === 'analytics' ? 'active' : ''}`}
                onClick={() => setActivePage('analytics')}>
                Analytics
            </button>
            </div>
        </nav>
        {activePage === 'inventory' ? <Inventory /> : <Analytics />}
        </div>
    );
    }