function showModalTab(tab) {
    const isCatalog = tab === 'catalog';
    document.getElementById('catalogSection').classList.toggle('hidden', !isCatalog);
    document.getElementById('manualSection').classList.toggle('hidden', isCatalog);
    document.getElementById('modalActions').classList.toggle('hidden', isCatalog);
    document.getElementById('tabCatalog').classList.toggle('active', isCatalog);
    document.getElementById('tabManual').classList.toggle('active', !isCatalog);
    document.querySelector('#modalBackdrop .modal').classList.toggle('modal-wide', isCatalog);
    if (isCatalog) buildCatalog(document.getElementById('catalogSearch').value);
}

function buildCatalog(query) {
    const q = (query || '').toLowerCase();
    const filtered = SERVICE_CATALOG.filter(s => !q || s.name.toLowerCase().includes(q));
    window._catalogFiltered = filtered;
    const grid = document.getElementById('catalogGrid');
    if (!filtered.length) {
        grid.innerHTML = '<p class="catalog-empty">No match — use "Enter Manually" to add it.</p>';
        return;
    }
    grid.innerHTML = filtered.map((s, i) => {
        const logoHtml = s.logo
            ? `<img src="${s.logo}" alt="${escHtml(s.name)}" class="catalog-brand-logo"` +
              ` onerror="this.style.display='none';this.nextSibling.style.display='inline'" />` +
              `<span class="catalog-tile-icon" style="display:none">${s.emoji}</span>`
            : `<span class="catalog-tile-icon">${s.emoji}</span>`;
        return `<button class="catalog-tile" onclick="fillFromCatalog(${i})">
            <div class="catalog-logo-wrap">${logoHtml}</div>
            <span class="catalog-tile-name">${escHtml(s.name)}</span>
            <span class="catalog-tile-cost">$${s.cost}/mo</span>
        </button>`;
    }).join('');
}

function fillFromCatalog(idx) {
    const s = (window._catalogFiltered || [])[idx];
    if (!s) return;
    document.getElementById('fName').value     = s.name;
    document.getElementById('fCost').value     = s.cost;
    document.getElementById('fCycle').value    = 'monthly';
    document.getElementById('fCategory').value = s.category;
    document.getElementById('fNotes').value    = '';
    selectedEmoji = s.emoji;
    clearFieldErrors();
    buildEmojiPicker();
    showModalTab('manual');
    setTimeout(() => document.getElementById('fDate').focus(), 80);
}

function buildEmojiPicker() {
    const picker = document.getElementById('emojiPicker');
    picker.innerHTML = EMOJIS.map(e => `
        <button class="emoji-opt ${e === selectedEmoji ? 'selected' : ''}" onclick="selectEmoji('${e}')">${e}</button>
    `).join('');
}

function selectEmoji(e) {
    selectedEmoji = e;
    document.querySelectorAll('.emoji-opt').forEach(el => {
        el.classList.toggle('selected', el.textContent === e);
    });
}

function setFieldError(errId, inputId, msg) {
    const err = document.getElementById(errId);
    const inp = document.getElementById(inputId);
    if (err) { err.textContent = msg; err.classList.toggle('hidden', !msg); }
    if (inp) inp.classList.toggle('input-error', !!msg);
}

function clearFieldErrors() {
    setFieldError('errName', 'fName', '');
    setFieldError('errCost', 'fCost', '');
    setFieldError('errDate', 'fDate', '');
}

function openModal(id = null) {
    editingId = id;
    selectedEmoji = '📦';
    clearFieldErrors();

    const isNew = id === null;
    document.getElementById('modalTabs').classList.toggle('hidden', !isNew);

    if (isNew) {
        document.getElementById('modalTitle').textContent = 'Add Subscription';
        document.getElementById('fName').value     = '';
        document.getElementById('fCost').value     = '';
        document.getElementById('fCycle').value    = 'monthly';
        document.getElementById('fDate').value     = '';
        document.getElementById('fCategory').value = 'Entertainment';
        document.getElementById('fNotes').value    = '';
        document.getElementById('catalogSearch').value = '';
        showModalTab('catalog');
    } else {
        const sub = subs.find(s => s.id === id);
        document.getElementById('modalTitle').textContent = 'Edit Subscription';
        document.getElementById('fName').value     = sub.name;
        document.getElementById('fCost').value     = sub.cost;
        document.getElementById('fCycle').value    = sub.cycle;
        document.getElementById('fDate').value     = sub.renewalDate;
        document.getElementById('fCategory').value = sub.category;
        document.getElementById('fNotes').value    = sub.notes || '';
        selectedEmoji = sub.emoji || '📦';
        showModalTab('manual');
    }

    buildEmojiPicker();
    document.getElementById('modalBackdrop').classList.remove('hidden');
    setTimeout(() => {
        if (isNew) document.getElementById('catalogSearch').focus();
        else document.getElementById('fName').focus();
    }, 100);
}

function closeModal() {
    document.getElementById('modalBackdrop').classList.add('hidden');
    clearFieldErrors();
    editingId = null;
}

function closeModalBackdrop(e) {
    if (e.target === document.getElementById('modalBackdrop')) closeModal();
}

function saveSub() {
    const name     = document.getElementById('fName').value.trim();
    const cost     = parseFloat(document.getElementById('fCost').value);
    const cycle    = document.getElementById('fCycle').value;
    const date     = document.getElementById('fDate').value;
    const category = document.getElementById('fCategory').value;
    const notes    = document.getElementById('fNotes').value.trim();

    clearFieldErrors();
    let hasError = false;

    if (!name)            { setFieldError('errName', 'fName', 'Please enter a name.'); hasError = true; }
    if (!cost || cost < 0){ setFieldError('errCost', 'fCost', 'Please enter a valid cost.'); hasError = true; }
    if (!date)            { setFieldError('errDate', 'fDate', 'Please select a date.'); hasError = true; }
    if (hasError) return;

    const isEdit = editingId !== null;
    if (isEdit) {
        const idx = subs.findIndex(s => s.id === editingId);
        if (idx >= 0) {
            subs[idx] = { ...subs[idx], name, emoji: selectedEmoji, cost, cycle, renewalDate: date, category, notes };
        }
    } else {
        subs.push({
            id: Date.now(),
            name,
            emoji: selectedEmoji,
            cost,
            cycle,
            renewalDate: date,
            category,
            notes,
            createdAt: new Date().toISOString(),
        });
    }

    persistSubs();
    closeModal();
    renderAll();
    toast(isEdit ? `Updated ${name}` : `Added ${name}`, 'success');
}
