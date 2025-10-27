/* PURPOSE: Authentication helpers — registration, login, and smart redirects.
  Initializes default users and handles role-based redirects used across
  the auth pages. */

// Shared data structure for all users
const USER_DATA_KEY = "jessie_users_unified";

// Initialize default users with shared data structure
function initializeDefaultUsers() {
    let userData = JSON.parse(localStorage.getItem(USER_DATA_KEY) || "{}");
    
    // Initialize structure if it doesn't exist
    if (!userData.admins || userData.admins.length === 0) {
        userData.admins = [
            {
                email: "admin@gmail.com",
                password: "admin123",
                name: "Main Admin"
            }
        ];
    }
    
    if (!userData.cashiers || userData.cashiers.length === 0) {
        userData.cashiers = [
            {
                email: "cashier@gmail.com",
                password: "cashier123",
                name: "Cashier One"
            }
        ];
    }
    
    if (!userData.customers || userData.customers.length === 0) {
        userData.customers = [];
    }
    
    localStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
    
    // Also keep the old structure for backward compatibility
    const oldUsers = JSON.parse(localStorage.getItem("jessie_users") || "[]");
    if (oldUsers.length === 0) {
        const adminUser = {
            name: 'Administrator',
            username: 'admin',
            email: 'admin@jessiecane.com',
            password: 'admin123',
            role: 'admin',
            dateCreated: new Date().toISOString()
        };
        oldUsers.push(adminUser);
        localStorage.setItem("jessie_users", JSON.stringify(oldUsers));
    }
}


// Smart redirect function for src folder structure
function getRedirectPath(role) {
  const currentPath = window.location.pathname;
  
  // If we're in customer_portal-main folder (login.html location)
  if (currentPath.includes('customer_portal-main')) {
    switch(role) {
      case 'admin': return '../admin.html';
      case 'cashier': return '../cashier.html';
      default: return 'customer_dashboard.html';
    }
  } 
  // If we're somewhere else
  else {
    switch(role) {
      case 'admin': return 'admin.html';
      case 'cashier': return 'cashier.html';
      default: return 'customer_dashboard.html';
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  // Initialize default users
  initializeDefaultUsers();

  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");
  const adminLoginBtn = document.getElementById("adminLoginBtn");

  // -----------------------
  // ADMIN LOGIN FUNCTIONALITY
  // -----------------------
  if (adminLoginBtn) {
    adminLoginBtn.addEventListener("click", () => {
      // Auto-fill admin credentials
      document.getElementById("email").value = "admin";
      document.getElementById("password").value = "admin123";
      
      // Visual feedback
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

  // -----------------------
  // REGISTER FUNCTIONALITY
  // -----------------------
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

      // Check if user already exists
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

      // Create user object (default role: customer)
      const user = {
        name,
        username,
        email,
        password,
        role: 'customer',
        dateCreated: new Date().toISOString()
      };

      // Save user in localStorage (old structure for backward compatibility)
      existingUsers.push(user);
      localStorage.setItem("jessie_users", JSON.stringify(existingUsers));
      
      // Also save to unified structure
      const unifiedData = JSON.parse(localStorage.getItem(USER_DATA_KEY) || "{}");
      if (!unifiedData.customers) {
        unifiedData.customers = [];
      }
      unifiedData.customers.push({
        email: email,
        name: name,
        username: username
      });
      localStorage.setItem(USER_DATA_KEY, JSON.stringify(unifiedData));

      if (typeof showPopup !== 'undefined') {
        showPopup('success', {
          message: 'Registration successful! You can now log in.',
          actions: [
            {
              text: 'Go to Login',
              type: 'primary',
              handler: () => {
                if (typeof hidePopup !== 'undefined') hidePopup();
                window.location.href = "login_customer.html";
              }
            }
          ]
        });
      } else {
        alert('Registration successful! You can now log in.');
        window.location.href = "login_customer.html";
      }
    });
  }

  // -----------------------
  // LOGIN FUNCTIONALITY WITH ROLE-BASED REDIRECTS
  // -----------------------
  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const emailInput = document.getElementById("email").value.trim();
      const passwordInput = document.getElementById("password").value;

      // Get saved users from localStorage
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

      // Check credentials
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
          // Save login state and user info
          localStorage.setItem("isLoggedIn", "true");
          localStorage.setItem("currentUser", JSON.stringify(foundUser));
          
          if (typeof showToast !== 'undefined') {
            showToast('success', 'Welcome!', `Logged in as ${foundUser.name}`);
          }
          
          // Redirect based on role using smart path detection
          setTimeout(() => {
            const redirectPath = getRedirectPath(foundUser.role);
            console.log(`Redirecting ${foundUser.role} user to: ${redirectPath}`);
            window.location.href = redirectPath;
          }, 1000);
        }, 1500);
      } else {
        // Shake animation for error
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

  // -----------------------
  // GOOGLE AUTH PLACEHOLDER
  // -----------------------
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

// -----------------------
// UNIFIED LOGIN FUNCTION
// -----------------------
function loginUser(role) {
  const emailInput = document.getElementById("email").value.trim();
  const passwordInput = document.getElementById("password").value;

  const userData = JSON.parse(localStorage.getItem(USER_DATA_KEY) || "{}");
  
  let foundUser = null;
  
  // Check the appropriate array based on role
  if (role === 'admin' && userData.admins) {
    foundUser = userData.admins.find(user => 
      user.email === emailInput && user.password === passwordInput
    );
  } else if (role === 'cashier' && userData.cashiers) {
    foundUser = userData.cashiers.find(user => 
      user.email === emailInput && user.password === passwordInput
    );
  } else if (role === 'customer') {
    // For customers, also check the old structure for backward compatibility
    const oldUsers = JSON.parse(localStorage.getItem("jessie_users") || "[]");
    foundUser = oldUsers.find(user => 
      (user.email === emailInput || user.username === emailInput) && 
      user.password === passwordInput && user.role === 'customer'
    );
  }

  if (foundUser) {
    const submitBtn = document.querySelector('.btn-main');
    const originalText = submitBtn ? submitBtn.innerHTML : '';
    
    if (submitBtn) {
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging In...';
      submitBtn.disabled = true;
    }
    
    setTimeout(() => {
      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("currentUser", JSON.stringify({ ...foundUser, role }));
      
      alert(`Welcome! Logged in as ${foundUser.name}`);
      
      // Redirect based on role
      setTimeout(() => {
        if (role === 'admin') {
          window.location.href = "../admin_portal-main/admin.html";
        } else if (role === 'cashier') {
          window.location.href = "../cashier_portal-main/cashier.html";
        } else {
          window.location.href = "customer_dashboard.html";
        }
      }, 1000);
    }, 1500);
  } else {
    const form = document.querySelector('form');
    form.classList.add('animate-shake');
    setTimeout(() => form.classList.remove('animate-shake'), 500);
    alert('Incorrect email or password.');
  }
}

// -----------------------
// FORGOT PASSWORD FUNCTION
// -----------------------
function handleForgotPassword(role) {
  // Get role-specific colors
  const roleColors = {
    admin: { bg: '#8B4513', accent: '#A0522D' },
    cashier: { bg: '#1E3A8A', accent: '#3B82F6' },
    customer: { bg: '#2E5D47', accent: '#3d8f43' }
  };
  
  const colors = roleColors[role] || roleColors.customer;
  
  // Create modal overlay
  const overlay = document.createElement('div');
  overlay.className = 'forgot-password-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10000;
    animation: fadeIn 0.3s ease;
  `;
  
  // Create modal content
  const modal = document.createElement('div');
  modal.className = 'forgot-password-modal';
  modal.style.cssText = `
    background: white;
    padding: 30px 40px;
    border-radius: 15px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
    max-width: 450px;
    width: 90%;
    animation: slideDown 0.3s ease;
    position: relative;
  `;
  
  modal.innerHTML = `
    <div class="modal-header" style="margin-bottom: 20px;">
      <h2 style="color: ${colors.bg}; margin: 0; font-size: 24px; display: flex; align-items: center; gap: 10px;">
        <i class="fas fa-key"></i> Reset Password
      </h2>
      <p style="color: #666; margin: 5px 0 0 0; font-size: 14px;">
        Enter your email to reset your password
      </p>
    </div>
    
    <form id="forgotPasswordForm" style="display: flex; flex-direction: column; gap: 15px;">
      <div>
        <label for="resetEmail" style="display: block; margin-bottom: 5px; color: #333; font-weight: 600;">
          Email Address
        </label>
        <input 
          type="email" 
          id="resetEmail" 
          placeholder="Enter your email" 
          required
          style="width: 100%; padding: 12px; border: 1px solid #c9e4b6; background-color: #f5fff3; border-radius: 8px; font-size: 14px; font-family: 'Century Gothic', sans-serif; transition: all 0.3s; box-sizing: border-box;"
        >
      </div>
      
      <div style="margin-top: 5px;">
        <label for="newPassword" style="display: block; margin-bottom: 5px; color: #333; font-weight: 600;">
          New Password
        </label>
        <div style="position: relative;">
          <input 
            type="password" 
            id="newPassword" 
            placeholder="Enter new password (min 4 characters)" 
            required
            style="width: 100%; padding: 12px 40px 12px 12px; border: 1px solid #c9e4b6; background-color: #f5fff3; border-radius: 8px; font-size: 14px; font-family: 'Century Gothic', sans-serif; transition: all 0.3s; box-sizing: border-box;"
          >
          <button 
            type="button" 
            id="toggleNewPassword"
            style="position: absolute; right: 5px; top: 50%; transform: translateY(-50%); background: transparent; border: none; color: #888; cursor: pointer; font-size: 16px; padding: 5px 8px; display: flex; align-items: center; justify-content: center; transition: color 0.2s ease;"
          >
            <i class="fas fa-eye"></i>
          </button>
        </div>
      </div>
      
      <div style="margin-top: 10px; display: flex; gap: 10px;">
        <button 
          type="button" 
          id="cancelResetBtn"
          style="flex: 1; padding: 12px; border: 2px solid #ddd; border-radius: 8px; background: white; color: #666; font-weight: 600; cursor: pointer; transition: all 0.3s;"
        >
          Cancel
        </button>
        <button 
          type="submit" 
          style="flex: 2; padding: 12px; border: none; border-radius: 8px; background: linear-gradient(135deg, ${colors.bg}, ${colors.accent}); color: white; font-weight: 600; cursor: pointer; transition: all 0.3s;"
        >
          <i class="fas fa-sync-alt"></i> Reset Password
        </button>
      </div>
    </form>
    
    <button 
      class="close-modal-btn" 
      style="position: absolute; top: 15px; right: 15px; background: none; border: none; font-size: 24px; color: #999; cursor: pointer; padding: 5px; transition: all 0.3s;"
    >
      <i class="fas fa-times"></i>
    </button>
  `;
  
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  
  // Add CSS animations
  if (!document.getElementById('forgotPasswordStyles')) {
    const style = document.createElement('style');
    style.id = 'forgotPasswordStyles';
    style.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes slideDown {
        from { transform: translateY(-20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      .forgot-password-modal input {
        border: 1px solid #c9e4b6 !important;
        background-color: #f5fff3 !important;
      }
      .forgot-password-modal input:focus {
        outline: none;
        border-color: ${colors.bg} !important;
        box-shadow: 0 0 4px ${colors.bg} !important;
      }
      .forgot-password-modal button:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      }
      .close-modal-btn:hover {
        color: ${colors.bg} !important;
        transform: rotate(90deg);
      }
    `;
    document.head.appendChild(style);
  }
  
  // Focus on email input
  setTimeout(() => {
    document.getElementById('resetEmail').focus();
  }, 100);
  
  // Password toggle functionality for modal
  const toggleNewPasswordBtn = document.getElementById('toggleNewPassword');
  const newPasswordInput = document.getElementById('newPassword');
  
  if (toggleNewPasswordBtn && newPasswordInput) {
    toggleNewPasswordBtn.addEventListener('click', function() {
      const type = newPasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
      newPasswordInput.setAttribute('type', type);
      
      // Toggle icon
      const icon = toggleNewPasswordBtn.querySelector('i');
      if (type === 'password') {
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
      } else {
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
      }
    });
    
    // Hover effect for toggle button
    toggleNewPasswordBtn.addEventListener('mouseenter', function() {
      this.style.color = colors.bg;
    });
    
    toggleNewPasswordBtn.addEventListener('mouseleave', function() {
      this.style.color = '#888';
    });
  }
  
  // Close modal functions
  const closeModal = () => {
    overlay.style.animation = 'fadeIn 0.3s ease reverse';
    setTimeout(() => overlay.remove(), 300);
  };
  
  overlay.querySelector('.close-modal-btn').addEventListener('click', closeModal);
  document.getElementById('cancelResetBtn').addEventListener('click', closeModal);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });
  
  // Handle form submission
  document.getElementById('forgotPasswordForm').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const email = document.getElementById('resetEmail').value.trim();
    const newPassword = document.getElementById('newPassword').value;
    
    if (!email) {
      alert('Please enter your email address.');
      return;
    }
    
    if (!newPassword || newPassword.length < 4) {
      alert('Password must be at least 4 characters long.');
      return;
    }
    
    const userData = JSON.parse(localStorage.getItem(USER_DATA_KEY) || "{}");
    let foundUser = null;
    
    if (role === 'admin' && userData.admins) {
      foundUser = userData.admins.find(user => user.email === email);
    } else if (role === 'cashier' && userData.cashiers) {
      foundUser = userData.cashiers.find(user => user.email === email);
    } else if (role === 'customer') {
      const oldUsers = JSON.parse(localStorage.getItem("jessie_users") || "[]");
      foundUser = oldUsers.find(user => user.email === email && user.role === 'customer');
    }
    
    if (foundUser) {
      // Update password based on role
      if (role === 'admin') {
        const index = userData.admins.findIndex(user => user.email === email);
        if (index !== -1) {
          userData.admins[index].password = newPassword;
        }
      } else if (role === 'cashier') {
        const index = userData.cashiers.findIndex(user => user.email === email);
        if (index !== -1) {
          userData.cashiers[index].password = newPassword;
        }
      } else if (role === 'customer') {
        const oldUsers = JSON.parse(localStorage.getItem("jessie_users") || "[]");
        const index = oldUsers.findIndex(user => user.email === email && user.role === 'customer');
        if (index !== -1) {
          oldUsers[index].password = newPassword;
          localStorage.setItem("jessie_users", JSON.stringify(oldUsers));
        }
      }
      
      localStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
      
      // Show success message
      modal.innerHTML = `
        <div style="text-align: center; padding: 20px;">
          <div style="font-size: 48px; color: ${colors.accent}; margin-bottom: 15px;">
            <i class="fas fa-check-circle"></i>
          </div>
          <h3 style="color: ${colors.bg}; margin: 0 0 10px 0;">Password Reset Successful!</h3>
          <p style="color: #666; margin: 0 0 20px 0;">You can now log in with your new password.</p>
          <button 
            onclick="this.closest('.forgot-password-overlay').remove();"
            style="padding: 12px 30px; border: none; border-radius: 8px; background: linear-gradient(135deg, ${colors.bg}, ${colors.accent}); color: white; font-weight: 600; cursor: pointer; transition: all 0.3s;"
          >
            Close
          </button>
        </div>
      `;
    } else {
      alert('Email not found. Please check your email address.');
    }
  });
}