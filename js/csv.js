/* ─ Bank CSV Import ─
   Supports Chase, BofA, Wells Fargo, Capital One, Citi, and most
   banks that export standard transaction CSVs.
   Logic: find charges that appear 2+ times with a consistent amount →
   flag as recurring subscription candidates.
*/

function triggerCSVImport() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv,text/csv';
    input.onchange = (e) => {
        if (e.target.files[0]) parseCSVFile(e.target.files[0]);
    };
    input.click();
}

function parseCSVFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const detected = detectRecurringFromCSV(e.target.result);
            if (!detected.length) {
                toast('No recurring charges detected in this CSV', 'info');
                return;
            }
            // Filter out subs already tracked
            const fresh = detected.filter(d => !subs.some(s => s.name.toLowerCase() === d.name.toLowerCase()));
            if (!fresh.length) {
                toast('All recurring charges are already tracked!', 'info');
                return;
            }
            detectedSubs = fresh;
            showDetectedModal(fresh, 'Found in bank CSV · adjust costs as needed', 'csv');
        } catch (err) {
            toast('Could not parse CSV: ' + err.message, 'error');
        }
    };
    reader.readAsText(file);
}

function detectRecurringFromCSV(csvText) {
    const lines = csvText.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length < 3) return [];

    const header   = parseCSVRow(lines[0]).map(h => h.toLowerCase().replace(/[^a-z ]/g, '').trim());
    const rows     = lines.slice(1).map(parseCSVRow).filter(r => r.length >= 2);

    const descIdx  = findColIdx(header, ['description','merchant','name','payee','narrative','memo','details','transaction']);
    const amtIdx   = findColIdx(header, ['amount','debit','charge','withdrawal']);
    const creditIdx= findColIdx(header, ['credit']);
    const dateIdx  = findColIdx(header, ['date','transaction date','post date','posted']);

    if (descIdx === -1) {
        toast('Cannot identify description column — try a different bank export.', 'error');
        return [];
    }

    // Group by normalized merchant name
    const groups = {};
    rows.forEach(row => {
        const rawDesc = (row[descIdx] || '').trim();
        if (!rawDesc) return;

        // Parse amount — try debit col first, then generic amount col
        let rawAmt = '';
        if (amtIdx >= 0) rawAmt = row[amtIdx] || '';
        else if (creditIdx >= 0) rawAmt = row[creditIdx] || '';
        const amt = parseFloat(rawAmt.replace(/[$,\s()]/g, ''));
        if (isNaN(amt) || amt <= 0) return;

        const key = normalizeDesc(rawDesc);
        if (!groups[key]) groups[key] = { rawDesc, amounts: [], dates: [] };
        groups[key].amounts.push(amt);
        if (dateIdx >= 0) groups[key].dates.push(row[dateIdx] || '');
    });

    const detected = [];
    Object.values(groups).forEach(({ rawDesc, amounts }) => {
        if (amounts.length < 2) return;

        // Consistent amount check: all within $0.50 of the median
        const sorted = amounts.slice().sort((a, b) => a - b);
        const median = sorted[Math.floor(sorted.length / 2)];
        const consistent = amounts.every(a => Math.abs(a - median) <= 0.50);
        if (!consistent) return;

        const match = matchKnownService(rawDesc);
        detected.push({
            id:          Date.now() + Math.random(),
            name:        match ? match.name : toTitleCase(cleanDesc(rawDesc)),
            emoji:       match ? match.emoji : '📦',
            cost:        parseFloat(median.toFixed(2)),
            cycle:       'monthly',
            renewalDate: nextMonthISO(),
            category:    match ? match.category : 'Other',
            notes:       '',
        });
    });

    // Sort by cost descending so biggest charges are shown first
    detected.sort((a, b) => b.cost - a.cost);
    return detected;
}

/* ─ Helpers ─ */

function normalizeDesc(desc) {
    return desc
        .toLowerCase()
        .replace(/\*+/g, ' ')           // asterisks (e.g. "NETFLIX*COM")
        .replace(/\d{4,}/g, '')         // strip long digit sequences (IDs)
        .replace(/[^a-z ]/g, ' ')       // keep only letters/spaces
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, 35);
}

function cleanDesc(desc) {
    return desc
        .replace(/\*+/g, ' ')
        .replace(/[^a-zA-Z ]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, 40);
}

function matchKnownService(desc) {
    const d = desc.toLowerCase();
    for (const [domain, svc] of Object.entries(KNOWN_SENDERS)) {
        const brand = domain.split('.')[0];
        const firstName = svc.name.toLowerCase().split(' ')[0];
        if (d.includes(brand) || (firstName.length > 3 && d.includes(firstName))) {
            return svc;
        }
    }
    return null;
}

function findColIdx(headers, candidates) {
    for (const c of candidates) {
        const idx = headers.findIndex(h => h === c || h.includes(c));
        if (idx >= 0) return idx;
    }
    return -1;
}

function parseCSVRow(line) {
    const cols = [];
    let inQuotes = false, current = '';
    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
            inQuotes = !inQuotes;
        } else if (ch === ',' && !inQuotes) {
            cols.push(current.trim());
            current = '';
        } else {
            current += ch;
        }
    }
    cols.push(current.trim());
    return cols;
}

function nextMonthISO() {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().split('T')[0];
}

function toTitleCase(str) {
    return str.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}
