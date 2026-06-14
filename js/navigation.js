function showPage(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(`page-${id}`).classList.add('active');

    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    const pages = ['dashboard', 'subscriptions', 'analytics', 'upcoming'];
    const idx = pages.indexOf(id);
    if (idx >= 0) document.querySelectorAll('.nav-item')[idx].classList.add('active');

    renderAll();
}

function setGreeting() {
    const h = new Date().getHours();
    const greet = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
    document.getElementById('greetingText').textContent = `${greet} 👋`;
}
