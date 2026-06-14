function renderAll() {
    renderDashboard();
    renderSubscriptions();
    renderAnalytics();
    renderUpcoming();
}

function renderDashboard() {
    const monthly = totalMonthly();
    const yearly  = monthly * 12;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const in7  = new Date(now.getTime() + 7 * 86400000);
    const in30 = new Date(now.getTime() + 30 * 86400000);

    const weekRenewals = subs.filter(s => {
        const d = new Date(s.renewalDate + 'T00:00:00');
        return d >= now && d <= in7;
    });

    const upcoming30 = subs.filter(s => {
        const d = new Date(s.renewalDate + 'T00:00:00');
        return d >= now && d <= in30;
    }).sort((a, b) => new Date(a.renewalDate) - new Date(b.renewalDate));

    document.getElementById('dashMonthly').textContent        = monthly.toFixed(2);
    document.getElementById('dashYearly').textContent         = yearly.toFixed(2);
    document.getElementById('dashCount').textContent          = subs.length;
    document.getElementById('dashWeekRenewals').textContent   = weekRenewals.length;
    document.getElementById('dashUpcomingBadge').textContent  = `${weekRenewals.length} this week`;

    const list = document.getElementById('dashUpcomingList');
    list.innerHTML = upcoming30.length === 0
        ? `<div class="empty-state"><div class="empty-icon">🎉</div><div class="empty-title">Nothing due soon</div><div class="empty-sub">No renewals in the next 30 days.</div></div>`
        : upcoming30.map(s => renderSubItem(s, true)).join('');
}

function renderSubscriptions() {
    const query = (document.getElementById('searchInput')?.value || '').toLowerCase();
    const categories = ['All', ...new Set(subs.map(s => s.category))];

    document.getElementById('categoryChips').innerHTML = categories.map(c => `
        <button class="cat-chip ${c === filterCategory ? 'active' : ''}" onclick="setFilter('${c}')">${c}</button>
    `).join('');

    let filtered = subs.filter(s => {
        const matchCat    = filterCategory === 'All' || s.category === filterCategory;
        const matchSearch = !query || s.name.toLowerCase().includes(query) || s.category.toLowerCase().includes(query);
        return matchCat && matchSearch;
    });
    filtered = filtered.slice().sort((a, b) => new Date(a.renewalDate) - new Date(b.renewalDate));

    const list = document.getElementById('subList');
    if (filtered.length === 0) {
        const empty = subs.length === 0
            ? { icon: '🔍', title: 'No subscriptions yet', sub: 'Click "+ Add New" to track your first subscription.' }
            : { icon: '🔍', title: 'No matches',           sub: 'Try a different search or filter.' };
        list.innerHTML = `<div class="empty-state"><div class="empty-icon">${empty.icon}</div><div class="empty-title">${empty.title}</div><div class="empty-sub">${empty.sub}</div></div>`;
    } else {
        list.innerHTML = filtered.map(s => renderSubItem(s, true)).join('');
    }
}

function renderAnalytics() {
    const monthly = totalMonthly();
    document.getElementById('anaDaily').textContent = (monthly / 30).toFixed(2);

    if (subs.length === 0) {
        document.getElementById('anaAvg').textContent              = '0.00';
        document.getElementById('anaMostExpensive').textContent    = '—';
        document.getElementById('anaMostExpensiveSub').textContent = 'no subs yet';
        document.getElementById('anaTopCat').textContent           = '—';
        document.getElementById('anaTopCatSub').textContent        = 'by spend';
        document.getElementById('catBreakdown').innerHTML = `<div class="empty-state"><div class="empty-icon">📊</div><div class="empty-title">No data yet</div><div class="empty-sub">Add subscriptions to see your breakdown.</div></div>`;
        return;
    }

    document.getElementById('anaAvg').textContent = (monthly / subs.length).toFixed(2);

    const sorted = subs.slice().sort((a, b) => toMonthly(b.cost, b.cycle) - toMonthly(a.cost, a.cycle));
    document.getElementById('anaMostExpensive').textContent    = `$${toMonthly(sorted[0].cost, sorted[0].cycle).toFixed(2)}`;
    document.getElementById('anaMostExpensiveSub').textContent = sorted[0].name;

    const catTotals = {};
    subs.forEach(s => {
        catTotals[s.category] = (catTotals[s.category] || 0) + toMonthly(s.cost, s.cycle);
    });
    const catArr = Object.entries(catTotals).sort((a, b) => b[1] - a[1]);
    const topCat = catArr[0];
    document.getElementById('anaTopCat').textContent    = topCat[0];
    document.getElementById('anaTopCatSub').textContent = `$${topCat[1].toFixed(2)}/mo`;

    document.getElementById('catBreakdown').innerHTML = catArr.map(([cat, amt]) => {
        const pct   = monthly > 0 ? (amt / monthly * 100) : 0;
        const color = CAT_COLORS[cat] || '#94a3b8';
        return `
            <div class="cat-row">
                <div class="cat-dot" style="background:${color}"></div>
                <div class="cat-bar-wrap">
                    <div class="cat-bar-label">
                        <span>${cat}</span>
                        <span>$${amt.toFixed(2)}/mo · ${pct.toFixed(0)}%</span>
                    </div>
                    <div class="cat-bar-track">
                        <div class="cat-bar-fill" style="width:${pct}%;background:${color}"></div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function renderUpcoming() {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const in30 = new Date(now.getTime() + 30 * 86400000);

    const upcoming = subs.filter(s => {
        const d = new Date(s.renewalDate + 'T00:00:00');
        return d >= now && d <= in30;
    }).sort((a, b) => new Date(a.renewalDate) - new Date(b.renewalDate));

    document.getElementById('upcomingCountBadge').textContent = `${upcoming.length} renewal${upcoming.length !== 1 ? 's' : ''}`;

    const list = document.getElementById('upcomingPageList');
    list.innerHTML = upcoming.length === 0
        ? `<div class="empty-state"><div class="empty-icon">✅</div><div class="empty-title">All clear!</div><div class="empty-sub">No renewals in the next 30 days.</div></div>`
        : upcoming.map(s => renderSubItem(s, true)).join('');
}
