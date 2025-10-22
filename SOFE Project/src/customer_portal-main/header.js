// header.js - shared header behaviors
document.addEventListener('DOMContentLoaded', function(){
  try {
    // highlight active nav link by matching pathname
    const path = window.location.pathname.split('/').pop() || 'customer_dashboard.html';
    document.querySelectorAll('.nav-btn, .navbar a').forEach(a => {
      const href = (a.getAttribute('href') || '').split('/').pop();
      if (href === path) a.classList.add('active');
    });

    // logout handling: clear login keys and redirect
    document.querySelectorAll('.logout, .logout-btn').forEach(btn => {
      btn.addEventListener('click', function(e){
        e.preventDefault();
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('currentUser');
        window.location.href = 'login.html';
      });
    });
  } catch (err) { console.warn('header.js init error', err); }
});
