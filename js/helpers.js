function toMonthly(cost, cycle) {
    if (cycle === 'yearly') return cost / 12;
    if (cycle === 'weekly') return cost * 4.33;
    return cost;
}

function totalMonthly() {
    return subs.reduce((s, sub) => s + toMonthly(sub.cost, sub.cycle), 0);
}

function daysUntil(dateStr) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const d = new Date(dateStr + 'T00:00:00');
    return Math.ceil((d - today) / 86400000);
}

function daysPill(days) {
    if (days < 0)   return `<span class="days-pill past">Expired ${Math.abs(days)}d ago</span>`;
    if (days === 0) return `<span class="days-pill urgent">Today!</span>`;
    if (days <= 3)  return `<span class="days-pill urgent">In ${days} day${days === 1 ? '' : 's'}</span>`;
    if (days <= 14) return `<span class="days-pill soon">In ${days} days</span>`;
    return `<span class="days-pill ok">In ${days} days</span>`;
}

function cycleLabel(cycle) {
    return cycle === 'yearly' ? '/yr' : cycle === 'weekly' ? '/wk' : '/mo';
}

function subBgColor(category) {
    const colors = {
        'Entertainment':    '#eff6ff',
        'Music':            '#faf5ff',
        'Software':         '#f0f9ff',
        'Gaming':           '#fff7ed',
        'News & Reading':   '#f7fee7',
        'Health & Fitness': '#f0fdf4',
        'Cloud Storage':    '#ecfeff',
        'Finance':          '#fffbeb',
        'Shopping':         '#fdf2f8',
        'Other':            '#f8fafc',
    };
    return colors[category] || '#f8fafc';
}

function escHtml(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function renderSubItem(sub, showDays = false) {
    const days = daysUntil(sub.renewalDate);
    const monthly = toMonthly(sub.cost, sub.cycle);
    return `
        <div class="sub-item">
            <div class="sub-emoji" style="background:${subBgColor(sub.category)}">${sub.emoji || '📦'}</div>
            <div class="sub-info">
                <div class="sub-name">${escHtml(sub.name)}</div>
                <div class="sub-meta">${sub.category} · Renews ${new Date(sub.renewalDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                ${sub.notes ? `<div class="sub-meta" style="color:#94a3b8">${escHtml(sub.notes)}</div>` : ''}
            </div>
            <div class="sub-right">
                ${showDays ? daysPill(days) : ''}
                <div class="sub-cost">
                    <div class="sub-cost-main">$${sub.cost.toFixed(2)}<span style="font-size:12px;font-weight:500;color:var(--muted)">${cycleLabel(sub.cycle)}</span></div>
                    ${sub.cycle !== 'monthly' ? `<div class="sub-cost-cycle">$${monthly.toFixed(2)}/mo equiv.</div>` : ''}
                </div>
                <button class="icon-btn edit" onclick="openModal(${sub.id})" title="Edit">✏️</button>
                <button class="icon-btn delete" onclick="deleteSub(${sub.id})" title="Delete">🗑️</button>
            </div>
        </div>
    `;
}
