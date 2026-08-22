// Shared across every page of The Undertow site: escapeHtml/formatDate
// helpers, the ambient mouse-mist effect, scroll-reveal animations, and the
// nav's login/logout widget. Page-specific data loading (rules list, news
// list, lore timeline, admin console, etc.) lives in each page's own inline
// <script> at the bottom, after this file is loaded.

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}

// ---- scroll reveal ----
document.addEventListener('DOMContentLoaded', () => {
  const revealEls = document.querySelectorAll('.reveal');
  const io = new IntersectionObserver(
    entries => {
      entries.forEach(e => {
        if (e.isIntersecting) e.target.classList.add('is-visible');
      });
    },
    { threshold: 0.15 }
  );
  revealEls.forEach(el => io.observe(el));
});

// ---- mouse mist trail ----
(function () {
  let lastMist = 0;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) return;
  window.addEventListener('mousemove', e => {
    const now = Date.now();
    if (now - lastMist < 45) return;
    lastMist = now;
    const p = document.createElement('div');
    p.className = 'mist-particle';
    p.style.left = e.clientX + 'px';
    p.style.top = e.clientY + 'px';
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 1900);
  });
})();

// ---- nav auth widget (login / logged-in state) ----
async function renderAuthState() {
  const container = document.getElementById('navAuth');
  if (!container) return;
  try {
    const res = await fetch('/api/auth/me');
    if (res.ok) {
      const user = await res.json();
      const name = escapeHtml(user.display_name || user.discord_username || 'Resident');
      container.innerHTML = `
        <div class="nav-user">
          ${user.avatar_url ? `<img class="nav-avatar" src="${user.avatar_url}" alt="">` : ''}
          <span class="nav-user-name">${name}</span>
          <span class="nav-role-badge">${escapeHtml(user.role)}</span>
          <button class="nav-logout-btn" id="navLogoutBtn" type="button">Log out</button>
        </div>
      `;
      document.getElementById('navLogoutBtn').addEventListener('click', async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        location.reload();
      });
      return;
    }
  } catch (err) {
    // network hiccup — fall through to the logged-out state below
  }
  container.innerHTML = `<a class="nav-login-btn" href="/api/auth/discord/login">Login with Discord</a>`;
}

document.addEventListener('DOMContentLoaded', renderAuthState);
