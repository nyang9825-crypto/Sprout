const STORAGE_KEY     = 'sprout_data';
const STORAGE_KEY_OLD = 'st_subs_demo';

function persistSubs() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(subs));
}

function loadSubs() {
    // Migrate data from old SubTrack key if present
    const legacy = localStorage.getItem(STORAGE_KEY_OLD);
    if (legacy) {
        localStorage.setItem(STORAGE_KEY, legacy);
        localStorage.removeItem(STORAGE_KEY_OLD);
    }
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
}
