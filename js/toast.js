let _lastDeleted = null;

function toast(message, type = 'success', duration = 3000) {
    const container = document.getElementById('toastContainer');
    const t = document.createElement('div');
    t.className = `toast toast-${type}`;
    t.innerHTML = `<span class="toast-accent"></span><span class="toast-msg">${message}</span>`;
    container.appendChild(t);
    requestAnimationFrame(() => requestAnimationFrame(() => t.classList.add('toast-show')));
    const remove = () => {
        t.classList.remove('toast-show');
        t.addEventListener('transitionend', () => t.remove(), { once: true });
    };
    const timer = setTimeout(remove, duration);
    t.addEventListener('click', () => { clearTimeout(timer); remove(); });
}

function toastUndo(message, onUndo, duration = 4000) {
    const container = document.getElementById('toastContainer');
    const t = document.createElement('div');
    t.className = 'toast toast-info';
    t.innerHTML = `
        <span class="toast-accent"></span>
        <span class="toast-msg">${message}</span>
        <button class="toast-undo-btn" id="toastUndoBtn">Undo</button>
    `;
    container.appendChild(t);
    requestAnimationFrame(() => requestAnimationFrame(() => t.classList.add('toast-show')));

    const remove = () => {
        t.classList.remove('toast-show');
        t.addEventListener('transitionend', () => t.remove(), { once: true });
    };

    const timer = setTimeout(remove, duration);

    t.querySelector('#toastUndoBtn').addEventListener('click', () => {
        clearTimeout(timer);
        remove();
        onUndo();
    });
}
