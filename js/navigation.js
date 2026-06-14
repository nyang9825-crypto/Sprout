function showPage(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const pageEl = document.getElementById(`page-${id}`);
    if (!pageEl) return;
    pageEl.classList.add('active');

    document.querySelectorAll('.nav-item').forEach(n => {
        const attr = n.getAttribute('onclick') || '';
        n.classList.toggle('active', attr.includes(`'${id}'`));
    });
    document.querySelectorAll('.mobile-nav-item').forEach(n => {
        const attr = n.getAttribute('onclick') || '';
        n.classList.toggle('active', attr.includes(`'${id}'`));
    });

    if (id === 'home')          { renderHomePage(); }
    else if (id === 'spending') { renderBudgetWidget(); renderSpendingPage(); }
    else if (id === 'trips')    { renderTripsPage(); }
    else if (id === 'subscriptions') { renderSubscriptions(); }
    else renderAll();
}

// Sub-tab switching within Subscriptions page
let subPageTab = 'subs';

function setSubTab(tab) {
    subPageTab = tab;
    ['subs', 'overview', 'analytics'].forEach(t => {
        const cap = t.charAt(0).toUpperCase() + t.slice(1);
        const panel = document.getElementById(`subPanel${cap}`);
        const btn   = document.getElementById(`subTab${cap}`);
        if (panel) panel.style.display = t === tab ? '' : 'none';
        if (btn) {
            btn.style.background = t === tab ? 'white' : 'transparent';
            btn.style.color      = t === tab ? 'var(--text)' : 'var(--muted)';
            btn.style.boxShadow  = t === tab ? '0 1px 6px rgba(0,0,0,0.1)' : 'none';
        }
    });
    if (tab === 'overview')   { renderDashboard(); renderBudgetWidget(); }
    if (tab === 'analytics')  { renderAnalytics(); }
    if (tab === 'subs')       { renderSubscriptions(); }
}
