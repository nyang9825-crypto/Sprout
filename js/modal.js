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

    if (id !== null) {
        const sub = subs.find(s => s.id === id);
        document.getElementById('modalTitle').textContent = 'Edit Subscription';
        document.getElementById('fName').value     = sub.name;
        document.getElementById('fCost').value     = sub.cost;
        document.getElementById('fCycle').value    = sub.cycle;
        document.getElementById('fDate').value     = sub.renewalDate;
        document.getElementById('fCategory').value = sub.category;
        document.getElementById('fNotes').value    = sub.notes || '';
        selectedEmoji = sub.emoji || '📦';
    } else {
        document.getElementById('modalTitle').textContent = 'Add Subscription';
        document.getElementById('fName').value     = '';
        document.getElementById('fCost').value     = '';
        document.getElementById('fCycle').value    = 'monthly';
        document.getElementById('fDate').value     = '';
        document.getElementById('fCategory').value = 'Entertainment';
        document.getElementById('fNotes').value    = '';
    }

    buildEmojiPicker();
    document.getElementById('modalBackdrop').classList.remove('hidden');
    setTimeout(() => document.getElementById('fName').focus(), 100);
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
