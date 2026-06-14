function deleteSub(id) {
    const sub = subs.find(s => s.id === id);
    if (!sub) return;
    subs = subs.filter(s => s.id !== id);
    persistSubs();
    renderAll();
    toastUndo(`Deleted "${sub.name}"`, () => {
        subs.push(sub);
        subs.sort((a, b) => new Date(a.renewalDate) - new Date(b.renewalDate));
        persistSubs();
        renderAll();
        toast(`Restored "${sub.name}"`, 'success');
    });
}

function setFilter(cat) {
    filterCategory = cat;
    renderSubscriptions();
}

function exportCSV() {
    if (subs.length === 0) { toast('No subscriptions to export.', 'info'); return; }
    const rows = [
        ['Name', 'Cost', 'Cycle', 'Monthly Equivalent', 'Renewal Date', 'Category', 'Notes'],
        ...subs.map(s => [
            `"${s.name}"`, s.cost, s.cycle, toMonthly(s.cost, s.cycle).toFixed(2),
            s.renewalDate, s.category, `"${s.notes || ''}"`,
        ]),
        [],
        ['Total Monthly', totalMonthly().toFixed(2)],
        ['Total Yearly',  (totalMonthly() * 12).toFixed(2)],
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `subscriptions_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast(`Exported ${subs.length} subscriptions`, 'success');
}
