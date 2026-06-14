const SPROUT_CLIENT_ID = '589239694196-kuae6qdpi1ce7sq6brd7k23a88ucgv25.apps.googleusercontent.com';

function gmailDomain(fromHeader) {
    const match = fromHeader.match(/@([\w.-]+)/);
    if (!match) return null;
    const parts = match[1].split('.');
    return parts.slice(-2).join('.');
}

function showGmailStep(step) {
    ['connect', 'scanning', 'done'].forEach(s => {
        document.getElementById(`gmailStep${s.charAt(0).toUpperCase() + s.slice(1)}`).classList.add('hidden');
    });
    document.getElementById(`gmailStep${step.charAt(0).toUpperCase() + step.slice(1)}`).classList.remove('hidden');
}

function initGmailUI() {
    showGmailStep('connect');
    document.getElementById('gmailBadge').textContent = 'Ready';
}

function connectGmail() {
    showGmailStep('scanning');
    setScanStatus('Connecting to Google…', 10);

    const client = google.accounts.oauth2.initTokenClient({
        client_id: SPROUT_CLIENT_ID,
        scope: 'https://www.googleapis.com/auth/gmail.readonly',
        callback: async (resp) => {
            if (resp.error) {
                alert('Google sign-in failed: ' + resp.error);
                showGmailStep('connect');
                return;
            }
            gmailToken = resp.access_token;
            await scanGmail();
        },
    });
    client.requestAccessToken();
}

function rescanGmail() {
    if (!gmailToken) { connectGmail(); return; }
    showGmailStep('scanning');
    setScanStatus('Re-scanning Gmail…', 10);
    scanGmail();
}

function resetGmail() {
    gmailToken = null;
    showGmailStep('connect');
    document.getElementById('gmailBadge').textContent = 'Ready';
}

function setScanStatus(msg, pct) {
    document.getElementById('scanStatus').textContent       = msg;
    document.getElementById('scanProgress').style.width    = pct + '%';
}

async function scanGmail() {
    try {
        setScanStatus('Searching for billing emails…', 25);

        const query   = BILLING_KEYWORDS.map(k => `subject:"${k}"`).join(' OR ');
        const listRes = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=100`,
            { headers: { Authorization: `Bearer ${gmailToken}` } }
        );
        const listData = await listRes.json();
        const messages = listData.messages || [];

        setScanStatus(`Found ${messages.length} billing emails — analyzing…`, 50);

        const found     = new Map();
        const batchSize = 20;

        for (let i = 0; i < Math.min(messages.length, 80); i += batchSize) {
            const batch = messages.slice(i, i + batchSize);
            await Promise.all(batch.map(async (m) => {
                try {
                    const msgRes = await fetch(
                        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject`,
                        { headers: { Authorization: `Bearer ${gmailToken}` } }
                    );
                    const msg     = await msgRes.json();
                    const headers = msg.payload?.headers || [];
                    const from    = headers.find(h => h.name === 'From')?.value || '';
                    const domain  = gmailDomain(from);
                    if (domain && KNOWN_SENDERS[domain] && !found.has(domain)) {
                        found.set(domain, { ...KNOWN_SENDERS[domain], domain });
                    }
                } catch {}
            }));
            setScanStatus(
                `Analyzing emails… (${Math.min(i + batchSize, messages.length)}/${Math.min(messages.length, 80)})`,
                50 + (i / 80) * 40
            );
        }

        setScanStatus('Done!', 100);

        const results = Array.from(found.values()).filter(r => !subs.some(s => s.name === r.name));

        if (results.length === 0) {
            document.getElementById('gmailDoneText').textContent = 'Scan complete — nothing new found';
            document.getElementById('gmailDoneSub').textContent  = `Checked ${messages.length} emails. All known subs already tracked.`;
            document.getElementById('gmailBadge').textContent    = 'Up to date';
            showGmailStep('done');
            return;
        }

        detectedSubs = results;
        showDetectedModal(results, `Scanned ${messages.length} billing emails`, 'gmail');

    } catch (err) {
        toast('Gmail scan failed: ' + err.message, 'error');
        showGmailStep('connect');
    }
}

function showDetectedModal(results, subtitleText, source) {
    detectedSource = source || 'gmail';
    if (detectedSource !== 'csv') {
        showGmailStep('done');
        document.getElementById('gmailDoneText').textContent = `Found ${results.length} new subscription${results.length !== 1 ? 's' : ''}`;
        document.getElementById('gmailDoneSub').textContent  = subtitleText || '';
        document.getElementById('gmailBadge').textContent    = `${results.length} found`;
    }

    const today       = new Date();
    const defaultDate = new Date(today.getFullYear(), today.getMonth() + 1, 1).toISOString().split('T')[0];

    document.getElementById('detectedTitle').textContent = `Found ${results.length} subscription${results.length !== 1 ? 's' : ''}`;
    document.getElementById('detectedList').innerHTML    = results.map((r, i) => {
        const logo = BRAND_LOGOS[r.name];
        const iconHtml = logo
            ? `<img src="${logo}" alt="${r.name}" style="width:100%;height:100%;object-fit:contain;padding:5px;display:block;"` +
              ` onerror="this.style.display='none';this.parentElement.textContent='${r.emoji}';" />`
            : r.emoji;
        return `
        <div style="display:flex;align-items:center;gap:12px;padding:12px 16px;border-bottom:1px solid var(--border)">
            <input type="checkbox" id="det_${i}" checked style="width:16px;height:16px;cursor:pointer;accent-color:var(--blue)" />
            <div style="width:36px;height:36px;background:#f0fdf4;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;overflow:hidden">${iconHtml}</div>
            <div style="flex:1">
                <div style="font-weight:600;font-size:14px">${r.name}</div>
                <div style="font-size:12px;color:var(--muted)">${r.category}</div>
            </div>
            <div style="display:flex;align-items:center;gap:8px">
                <span style="font-size:12px;color:var(--muted)">$</span>
                <input type="number" id="det_cost_${i}" value="${r.cost}" step="0.01" min="0"
                    style="width:72px;padding:6px 8px;border:1.5px solid var(--border);border-radius:6px;font-size:13px;text-align:right" />
                <span style="font-size:12px;color:var(--muted)">/mo</span>
            </div>
            <div>
                <input type="date" id="det_date_${i}" value="${defaultDate}"
                    style="padding:6px 8px;border:1.5px solid var(--border);border-radius:6px;font-size:12px" />
            </div>
        </div>
    `;
    }).join('');

    document.getElementById('detectedBackdrop').classList.remove('hidden');
}

function closeDetectedModal() {
    document.getElementById('detectedBackdrop').classList.add('hidden');
}

function closeDetectedBackdrop(e) {
    if (e.target === document.getElementById('detectedBackdrop')) closeDetectedModal();
}

function importDetected() {
    let imported = 0;
    detectedSubs.forEach((r, i) => {
        if (!document.getElementById(`det_${i}`)?.checked) return;
        const cost = parseFloat(document.getElementById(`det_cost_${i}`).value) || r.cost;
        const date = document.getElementById(`det_date_${i}`).value || new Date().toISOString().split('T')[0];
        subs.push({
            id: Date.now() + i,
            name: r.name,
            emoji: r.emoji,
            cost,
            cycle: 'monthly',
            renewalDate: date,
            category: r.category,
            notes: detectedSource === 'csv' ? 'Imported from bank CSV' : 'Auto-detected from Gmail',
            createdAt: new Date().toISOString(),
        });
        imported++;
    });
    persistSubs();
    closeDetectedModal();
    renderAll();
    document.getElementById('gmailDoneSub').textContent = `${imported} subscription${imported !== 1 ? 's' : ''} imported`;
}
