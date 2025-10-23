function initializeDefaultUsers() {
    const storedUsers = JSON.parse(localStorage.getItem("jessie_users") || "[]");
    
    if (storedUsers.length === 0) {
        const adminUser = {
            name: 'Administrator',
            username: 'admin',
            email: 'admin@jessiecane.com',
            password: 'admin123',
            role: 'admin',
            dateCreated: new Date().toISOString()
        };
        storedUsers.push(adminUser);
    }

    localStorage.setItem("jessie_users", JSON.stringify(storedUsers));
}

function getRedirectPath(role) {
  const currentPath = window.location.pathname;
  
  if (currentPath.includes('customer_portal-main')) {
    switch(role) {
      case 'admin': return '../admin.html';
      case 'cashier': return '../cashier.html';
      default: return 'customer_dashboard.html';
    }
  } 
  else {
    switch(role) {
      case 'admin': return 'admin.html';
      case 'cashier': return 'cashier.html';
      default: return 'customer_dashboard.html';
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initializeDefaultUsers();

  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");
  const adminLoginBtn = document.getElementById("adminLoginBtn");

  if (adminLoginBtn) {
    adminLoginBtn.addEventListener("click", () => {

      document.getElementById("email").value = "admin";
      document.getElementById("password").value = "admin123";
      
      const originalText = adminLoginBtn.innerHTML;
      adminLoginBtn.innerHTML = '<i class="fas fa-check"></i> Credentials Filled';
      adminLoginBtn.style.background = 'linear-gradient(135deg, #10B981, #059669)';
      
      if (typeof showToast !== 'undefined') {
        showToast('info', 'Admin Login', 'Admin credentials filled. Click "Log In" to proceed.');
      }
      
      setTimeout(() => {
        adminLoginBtn.innerHTML = originalText;
        adminLoginBtn.style.background = 'linear-gradient(135deg, #8B4513, #A0522D)';
      }, 2000);
    });
  }

  if (registerForm) {
    registerForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const name = document.getElementById("name").value.trim();
      const username = document.getElementById("username").value.trim();
      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value;
      const confirmPassword = document.getElementById("confirm-password").value;

      if (password !== confirmPassword) {
        if (typeof showPopup !== 'undefined') {
          showPopup('error', {
            message: 'Passwords do not match!'
          });
        } else {
          alert('Passwords do not match!');
        }
        return;
      }

      const existingUsers = JSON.parse(localStorage.getItem("jessie_users") || "[]");
      const userExists = existingUsers.some(user => user.email === email || user.username === username);
      
      if (userExists) {
        if (typeof showPopup !== 'undefined') {
          showPopup('error', {
            message: 'User with this email or username already exists!'
          });
        } else {
          alert('User with this email or username already exists!');
        }
        return;
      }

      const user = {
        name,
        username,
        email,
        password,
        role: 'customer',
        dateCreated: new Date().toISOString()
      };

      existingUsers.push(user);
      localStorage.setItem("jessie_users", JSON.stringify(existingUsers));

      if (typeof showPopup !== 'undefined') {
        showPopup('success', {
          message: 'Registration successful! You can now log in.',
          actions: [
            {
              text: 'Go to Login',
              type: 'primary',
              handler: () => {
                if (typeof hidePopup !== 'undefined') hidePopup();
                window.location.href = "login.html";
              }
            }
          ]
        });
      } else {
        alert('Registration successful! You can now log in.');
        window.location.href = "login.html";
      }
    });
  }

  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const emailInput = document.getElementById("email").value.trim();
      const passwordInput = document.getElementById("password").value;

      const storedUsers = JSON.parse(localStorage.getItem("jessie_users") || "[]");

      if (storedUsers.length === 0) {
        if (typeof showPopup !== 'undefined') {
          showPopup('error', {
            message: 'No users found. Please register first.'
          });
        } else {
          alert('No users found. Please register first.');
        }
        return;
      }

      const foundUser = storedUsers.find(user => 
        (user.email === emailInput || user.username === emailInput) && 
        user.password === passwordInput
      );

      if (foundUser) {
        // Show loading state
        const submitBtn = loginForm.querySelector('.btn-main');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging In...';
        submitBtn.disabled = true;
        
        setTimeout(() => {
          localStorage.setItem("isLoggedIn", "true");
          localStorage.setItem("currentUser", JSON.stringify(foundUser));
          
          if (typeof showToast !== 'undefined') {
            showToast('success', 'Welcome!', `Logged in as ${foundUser.name}`);
          }
          
          setTimeout(() => {
            const redirectPath = getRedirectPath(foundUser.role);
            console.log(`Redirecting ${foundUser.role} user to: ${redirectPath}`);
            window.location.href = redirectPath;
          }, 1000);
        }, 1500);
      } else {
        loginForm.classList.add('animate-shake');
        setTimeout(() => {
          loginForm.classList.remove('animate-shake');
        }, 500);
        
        if (typeof showPopup !== 'undefined') {
          showPopup('error', {
            message: 'Incorrect email/username or password.'
          });
        } else {
          alert('Incorrect email/username or password.');
        }
      }
    });
  }

  const googleLogin = document.getElementById("googleLogin");
  const googleRegister = document.getElementById("googleRegister");

  [googleLogin, googleRegister].forEach((btn) => {
    if (btn) {
      btn.addEventListener("click", () => {
        if (typeof showPopup !== 'undefined') {
          showPopup('info', {
            title: 'Google Authentication',
            message: 'Google Auth simulated. Connect Firebase or OAuth here for production.',
            actions: [
              {
                text: 'Simulate Login',
                type: 'primary',
                handler: () => {
                  // Create a demo user for Google auth (customer role)
                  const demoUser = {
                    name: 'Google User',
                    username: 'google_user',
                    email: 'google@example.com',
                    password: 'google_auth',
                    role: 'customer',
                    dateCreated: new Date().toISOString()
                  };
                  
                  const existingUsers = JSON.parse(localStorage.getItem("jessie_users") || "[]");
                  existingUsers.push(demoUser);
                  localStorage.setItem("jessie_users", JSON.stringify(existingUsers));
                  
                  localStorage.setItem("isLoggedIn", "true");
                  localStorage.setItem("currentUser", JSON.stringify(demoUser));
                  
                  if (typeof showToast !== 'undefined') {
                    showToast('success', 'Google Login', 'Successfully signed in with Google!');
                  }
                  setTimeout(() => {
                    window.location.href = getRedirectPath('customer');
                  }, 1500);
                }
              }
            ]
          });
        } else {
          alert('Google authentication would be implemented here in production.');
        }
      });
    }
  });
});
