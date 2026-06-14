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

function openModal(id = null) {
    editingId = id;
    selectedEmoji = '📦';

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

    if (!name)           return alert('Please enter a subscription name.');
    if (!cost || cost < 0) return alert('Please enter a valid cost.');
    if (!date)           return alert('Please select a renewal date.');

    if (editingId !== null) {
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
}
