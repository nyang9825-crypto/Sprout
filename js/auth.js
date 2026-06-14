function getUser() {
    if (FIREBASE_ENABLED && typeof firebase !== 'undefined' && firebase.apps?.length) {
        const u = firebase.auth().currentUser;
        if (u) return { name: u.displayName || u.email, email: u.email, uid: u.uid, photoURL: u.photoURL };
    }
    try { return JSON.parse(localStorage.getItem('sprout_user') || 'null'); } catch { return null; }
}

function _storedPhoto(uid) {
    try { return localStorage.getItem(`sprout_photo_${uid}`) || null; } catch { return null; }
}

function _savePhoto(uid, dataUrl) {
    try { localStorage.setItem(`sprout_photo_${uid}`, dataUrl); } catch {}
}

function renderAllAvatars() {
    const user = getUser();
    if (!user) return;
    const photo   = _storedPhoto(user.uid) || user.photoURL || null;
    const initial = (user.name?.[0] || user.email?.[0] || 'S').toUpperCase();

    const applyAvatar = el => {
        if (!el) return;
        if (photo) {
            el.style.backgroundImage    = `url('${photo}')`;
            el.style.backgroundSize     = 'cover';
            el.style.backgroundPosition = 'center';
            el.textContent = '';
        } else {
            el.style.backgroundImage = '';
            el.textContent = initial;
        }
    };

    applyAvatar(document.getElementById('homeAvatar'));
    applyAvatar(document.getElementById('sidebarAvatar'));
    applyAvatar(document.getElementById('profileAvatarLg'));
}

// ── Profile modal ──────────────────────────────────────────────────────
function openProfile() {
    const user = getUser();
    if (!user) return;
    document.getElementById('profileName').textContent  = user.name  || '—';
    document.getElementById('profileEmail').textContent = user.email || '—';
    renderAllAvatars();
    document.getElementById('profileBackdrop').classList.remove('hidden');
}

function closeProfile() {
    document.getElementById('profileBackdrop').classList.add('hidden');
}

function handleAvatarTap() { openProfile(); }

// ── Photo upload ───────────────────────────────────────────────────────
function triggerPhotoUpload() {
    document.getElementById('profilePhotoInput').click();
}

function handlePhotoUpload(input) {
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
        const img = new Image();
        img.onload = () => {
            const MAX  = 220;
            const scale = Math.min(MAX / img.width, MAX / img.height, 1);
            const canvas = document.createElement('canvas');
            canvas.width  = Math.round(img.width  * scale);
            canvas.height = Math.round(img.height * scale);
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
            const user = getUser();
            if (user?.uid) {
                _savePhoto(user.uid, dataUrl);
                renderAllAvatars();
                toast('Profile photo updated!');
            }
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
    input.value = '';
}

// ── Sign out ───────────────────────────────────────────────────────────
function signOut() {
    closeProfile();
    if (FIREBASE_ENABLED && typeof firebase !== 'undefined' && firebase.apps?.length) {
        firebase.auth().signOut().then(() => {
            localStorage.removeItem('sprout_user');
            currentUid = null;
            window.location.href = 'index.html';
        });
    } else {
        localStorage.removeItem('sprout_user');
        window.location.href = 'index.html';
    }
}
