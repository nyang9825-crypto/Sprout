let subViewMode = 'list';

function toggleSubView() {
    subViewMode = subViewMode === 'list' ? 'grid' : 'list';
    const btn = document.getElementById('subViewBtn');
    if (btn) btn.textContent = subViewMode === 'grid' ? '☰  List' : '⊞  Grid';
    renderSubscriptions();
}

function renderAll() {
    renderSubscriptions();
    renderUpcoming();
    renderBudgetWidget();
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

    animateValue(document.getElementById('dashMonthly'),     monthly,           true);
    animateValue(document.getElementById('dashYearly'),      yearly,            true);
    animateValue(document.getElementById('dashCount'),       subs.length,       false);
    animateValue(document.getElementById('dashWeekRenewals'),weekRenewals.length,false);
    document.getElementById('dashUpcomingBadge').textContent = `${weekRenewals.length} this week`;

    const list = document.getElementById('dashUpcomingList');
    list.innerHTML = upcoming30.length === 0
        ? emptyState('empty_ok', 'Nothing due soon', 'No renewals in the next 30 days.')
        : upcoming30.map(s => renderSubItem(s, true)).join('');
}

function emptyState(icon, title, sub) {
    return `<div class="empty-state"><div class="empty-icon-svg">${ICONS[icon] || ICONS.empty_list}</div><div class="empty-title">${title}</div><div class="empty-sub">${sub}</div></div>`;
}

function renderSubscriptions() {
    const query = (document.getElementById('searchInput')?.value || '').toLowerCase();

    // Build category counts
    const catCounts = { All: subs.length };
    subs.forEach(s => { catCounts[s.category] = (catCounts[s.category] || 0) + 1; });
    const categories = ['All', ...new Set(subs.map(s => s.category))];

    document.getElementById('categoryChips').innerHTML = categories.map(c => `
        <button class="cat-chip ${c === filterCategory ? 'active' : ''}" onclick="setFilter('${c}')">
            ${c} <span class="chip-count">${catCounts[c] || 0}</span>
        </button>
    `).join('');

    let filtered = subs.filter(s => {
        const matchCat    = filterCategory === 'All' || s.category === filterCategory;
        const matchSearch = !query || s.name.toLowerCase().includes(query) || s.category.toLowerCase().includes(query);
        return matchCat && matchSearch;
    });
    filtered = filtered.slice().sort((a, b) => new Date(a.renewalDate) - new Date(b.renewalDate));

    const list = document.getElementById('subList');
    if (filtered.length === 0) {
        list.innerHTML = subs.length === 0
            ? emptyState('empty_list',   'No subscriptions yet', 'Click "+ Add New" to track your first subscription.')
            : emptyState('empty_search', 'No matches',           'Try a different search or filter.');
    } else if (subViewMode === 'grid') {
        list.innerHTML = renderSubGrid(filtered);
    } else {
        list.innerHTML = filtered.map(s => renderSubItem(s, true)).join('');
    }
}

function renderSubGrid(filtered) {
    const now = new Date(); now.setHours(0, 0, 0, 0);
    const cards = filtered.map(s => {
        const days   = daysUntil(s.renewalDate);
        const isPaid = days < 0;
        const logo   = BRAND_LOGOS[s.name];
        const d      = new Date(s.renewalDate + 'T00:00:00');
        const day    = d.getDate();
        const suf    = [,'st','nd','rd'][day % 10 > 3 || (day >= 11 && day <= 13) ? 0 : day % 10] || 'th';
        const color  = CAT_COLORS[s.category] || '#16a34a';
        const iconHtml = logo
            ? `<img src="${logo}" style="width:44px;height:44px;border-radius:12px;object-fit:contain;padding:6px;background:white;border:1px solid var(--border-soft)" onerror="this.style.display='none'" />`
            : `<div style="width:44px;height:44px;border-radius:12px;background:${color}18;border:1px solid ${color}30;display:flex;align-items:center;justify-content:center;font-size:22px">${s.emoji}</div>`;

        return `<div class="sub-grid-card" onclick="openModal(${s.id})">
            ${isPaid ? `<div class="sub-grid-paid"><svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3.5"><polyline points="20 6 9 17 4 12"/></svg></div>` : ''}
            ${iconHtml}
            <div style="font-size:13px;font-weight:700;color:var(--text);margin-top:10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%">${escHtml(s.name)}</div>
            <div style="font-size:16px;font-weight:800;color:var(--text);margin-top:3px;letter-spacing:-0.4px">${fmtMoney(toMonthly(s.cost, s.cycle))}<span style="font-size:10px;font-weight:600;color:var(--muted)">/mo</span></div>
            <div style="font-size:11px;color:var(--muted);margin-top:2px">${isPaid ? 'Renewed' : 'Renews'} ${day}${suf}</div>
            <div style="font-size:10px;font-weight:700;color:${color};margin-top:5px;text-transform:uppercase;letter-spacing:0.3px">${s.category}</div>
        </div>`;
    });
    return `<div class="sub-grid-view">${cards.join('')}</div>`;
}

function renderAnalytics() {
    const monthly = totalMonthly();
    animateValue(document.getElementById('anaDaily'), monthly / 30, true);

    if (subs.length === 0) {
        document.getElementById('anaAvg').textContent              = '0.00';
        document.getElementById('anaMostExpensive').textContent    = '—';
        document.getElementById('anaMostExpensiveSub').textContent = 'no subs yet';
        document.getElementById('anaTopCat').textContent           = '—';
        document.getElementById('anaTopCatSub').textContent        = 'by spend';
        document.getElementById('catBreakdown').innerHTML = emptyState('empty_chart', 'No data yet', 'Add subscriptions to see your breakdown.');
        return;
    }

    animateValue(document.getElementById('anaAvg'), monthly / subs.length, true);

    const sorted = subs.slice().sort((a, b) => toMonthly(b.cost, b.cycle) - toMonthly(a.cost, a.cycle));
    animateValue(document.getElementById('anaMostExpensive'), toMonthly(sorted[0].cost, sorted[0].cycle), true);
    document.getElementById('anaMostExpensiveSub').textContent = sorted[0].name;

    const catTotals = {};
    subs.forEach(s => {
        catTotals[s.category] = (catTotals[s.category] || 0) + toMonthly(s.cost, s.cycle);
    });
    const catArr = Object.entries(catTotals).sort((a, b) => b[1] - a[1]);
    const topCat = catArr[0];
    document.getElementById('anaTopCat').textContent    = topCat[0];
    document.getElementById('anaTopCatSub').textContent = `${fmtMoney(topCat[1])}/mo`;

    document.getElementById('catBreakdown').innerHTML = catArr.map(([cat, amt]) => {
        const pct   = monthly > 0 ? (amt / monthly * 100) : 0;
        const color = CAT_COLORS[cat] || '#94a3b8';
        return `
            <div class="cat-row">
                <div class="cat-dot" style="background:${color}"></div>
                <div class="cat-bar-wrap">
                    <div class="cat-bar-label">
                        <span>${cat}</span>
                        <span>${fmtMoney(amt)}/mo · ${pct.toFixed(0)}%</span>
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
        ? emptyState('empty_ok', 'All clear!', 'No renewals in the next 30 days.')
        : upcoming.map(s => renderSubItem(s, true)).join('');
}
