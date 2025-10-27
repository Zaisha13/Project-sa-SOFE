// header.js - shared header behaviors
/* PURPOSE: Shared header behaviors — highlights active nav links, builds the
  right-side auth/navigation area, shows auth banners and adds sticky header
  scroll effects used across customer-facing pages. */
document.addEventListener('DOMContentLoaded', function(){
  try {
    // highlight active nav link by matching pathname
    const path = window.location.pathname.split('/').pop() || 'customer_dashboard.html';
    document.querySelectorAll('.nav-btn, .navbar a').forEach(a => {
      const href = (a.getAttribute('href') || '').split('/').pop();
      if (href === path) a.classList.add('active');
    });

    // Authentication-aware header: create a single managed auth link and disable Profile when not logged in
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const rightHeader = document.querySelector('.right-header');
    // helper to show an in-page auth banner then optionally redirect
    function showAuthBanner(message, redirectUrl, delayMs = 1400) {
      try {
        let banner = document.querySelector('.auth-banner');
        if (!banner) {
          banner = document.createElement('div');
          banner.className = 'auth-banner';
          banner.setAttribute('role', 'status');
          document.body.appendChild(banner);
        }
        banner.innerHTML = `<div>${message}</div><small>You will be redirected shortly.</small>`;
        // force layout then show
        // eslint-disable-next-line no-unused-expressions
        banner.getBoundingClientRect();
        banner.classList.add('auth-banner--visible');
        // Make sure banner does not block clicks
        banner.style.pointerEvents = 'none';

        const t = setTimeout(() => {
          try {
            if (redirectUrl) window.location.href = redirectUrl;
          } finally {
            // remove banner after redirect attempt or when time elapses
            banner.classList.remove('auth-banner--visible');
            setTimeout(() => { if (banner && banner.parentNode) banner.parentNode.removeChild(banner); }, 300);
            // remove the click cancel listener when done
            document.removeEventListener('click', cancelFn, true);
          }
        }, delayMs);

        // cancel function to abort the pending redirect if user interacts
        function cancelFn() {
          try { clearTimeout(t); } catch (e) {}
          try { banner.classList.remove('auth-banner--visible'); } catch (e) {}
          setTimeout(() => { if (banner && banner.parentNode) banner.parentNode.removeChild(banner); }, 300);
          document.removeEventListener('click', cancelFn, true);
        }

        // If user clicks anywhere, cancel the redirect so navigation can proceed
        document.addEventListener('click', cancelFn, true);

        // return a handle so caller can cancel if needed
        return { timeoutId: t, banner, cancel: cancelFn };
      } catch (err) { console.warn('showAuthBanner error', err); }
    }

    if (rightHeader) {
      // Build a canonical right-header navbar so every page is consistent.
      // Desired order: Home, Menu, Profile, Inquiry, (Register, Login) OR (Logout)
      rightHeader.innerHTML = ''; // clear any existing children

      const navItems = [
        { href: 'customer_dashboard.html', text: 'Home' },
        { href: 'drinks.html', text: 'Menu' },
        { href: 'profile.html', text: 'Profile' },
        { href: 'inquiry.html', text: 'Inquiry' }
      ];

      const anchors = {};
      navItems.forEach(item => {
        const a = document.createElement('a');
        a.href = item.href;
        a.className = 'nav-btn';
        a.textContent = item.text;
        rightHeader.appendChild(a);
        anchors[item.text.toLowerCase()] = a;
      });

      // Authentication area
      if (!isLoggedIn) {
        // Profile should be present but disabled
        const profileAnchor = anchors['profile'];
        if (profileAnchor) {
          profileAnchor.classList.add('disabled');
          profileAnchor.setAttribute('aria-disabled', 'true');
          if (!profileAnchor.dataset.origHref) profileAnchor.dataset.origHref = profileAnchor.getAttribute('href') || '';
          profileAnchor.removeAttribute('href');
          profileAnchor.addEventListener('click', function authRedirect(e){
            e.preventDefault();
            showAuthBanner('Please log in or register to access your profile.', 'login.html', 1400);
          });
        }

        // Register then Login links
        const reg = document.createElement('a');
        reg.href = 'register.html'; reg.className = 'nav-btn auth-link register-link'; reg.textContent = 'Register';
        rightHeader.appendChild(reg);

        const log = document.createElement('a');
        log.href = 'login_customer.html'; log.className = 'nav-btn auth-link login-link'; log.textContent = 'Login';
        rightHeader.appendChild(log);
      } else {
        // Logged in: enable profile and add Logout
        const profileAnchor = anchors['profile'];
        if (profileAnchor) {
          profileAnchor.classList.remove('disabled');
          profileAnchor.removeAttribute('aria-disabled');
          if (profileAnchor.dataset.origHref) {
            profileAnchor.setAttribute('href', profileAnchor.dataset.origHref);
            delete profileAnchor.dataset.origHref;
          }
        }

        const logoutEl = document.createElement('a');
        logoutEl.href = '#'; logoutEl.className = 'nav-btn auth-link logout-btn'; logoutEl.textContent = 'Logout';
        logoutEl.addEventListener('click', function(e){
          e.preventDefault();
          localStorage.removeItem('isLoggedIn');
          localStorage.removeItem('currentUser');
          window.location.href = 'login_customer.html';
        });
        rightHeader.appendChild(logoutEl);
      }

      // After building, mark the active link
      const pathName = path;
      Array.from(rightHeader.querySelectorAll('a')).forEach(a => {
        const href = (a.getAttribute('href') || '').split('/').pop();
        if (href === pathName) a.classList.add('active');
      });
    }

    // toggle a small scrolled state on the header for sticky shadow/backdrop effects
    const headerEl = document.querySelector('header');
    if (headerEl) {
      let ticking = false;
      const update = () => {
        const scrolled = window.scrollY > 8; // threshold
        headerEl.classList.toggle('scrolled', scrolled);
        ticking = false;
      };
      window.addEventListener('scroll', function onScroll() {
        if (!ticking) {
          window.requestAnimationFrame(update);
          ticking = true;
        }
      }, { passive: true });
      // run once to set initial state
      update();

      /* Zoom features removed per request */
    }
  } catch (err) { console.warn('header.js init error', err); }
});
