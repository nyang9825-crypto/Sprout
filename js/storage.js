function persistSubs() {
    localStorage.setItem('st_subs_demo', JSON.stringify(subs));
}

function loadSubs() {
    return JSON.parse(localStorage.getItem('st_subs_demo') || '[]');
}
