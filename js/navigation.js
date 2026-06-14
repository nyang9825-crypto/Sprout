function showPage(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(`page-${id}`).classList.add('active');

    const pages = ['dashboard', 'subscriptions', 'analytics', 'upcoming'];
    const idx = pages.indexOf(id);

    document.querySelectorAll('.nav-item').forEach((n, i) => n.classList.toggle('active', i === idx));
    document.querySelectorAll('.mobile-nav-item').forEach((n, i) => n.classList.toggle('active', i === idx));

    renderAll();
}

function setGreeting() {
    const h = new Date().getHours();
    const greet = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
    document.getElementById('greetingText').textContent = `${greet} 👋`;
}
