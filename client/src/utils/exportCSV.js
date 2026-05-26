    export function exportToCSV(data, filename = 'inventory-export') {
    if (!data || data.length === 0) {
        alert('No data to export.');
        return;
    }

    const headers = Object.keys(data[0]).filter(
        (key) => key !== '_id' && key !== '__v' && key !== 'createdAt' && key !== 'updatedAt'
    );

    const csvRows = [
        headers.join(','),
        ...data.map((row) =>
        headers.map((header) => {
            const value = row[header];
            if (typeof value === 'string') return `"${value.replace(/"/g, '""')}"`;
            return value ?? '';
        }).join(',')
        ),
    ];

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${filename}-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    }