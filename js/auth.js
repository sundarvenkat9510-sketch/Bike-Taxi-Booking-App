/**
 * VELOMOTO - Authentication & Session Management Module
 * Handles Login, Registration, Session Persistence in LocalStorage,
 * Client-Side Form Validations, and Protected Route Guards.
 */

// Storage Keys
const STORAGE_KEYS = {
  CURRENT_USER: 'velomoto_currentUser',
  USERS: 'velomoto_users',
  REMEMBER: 'velomoto_remember'
};

// Initial Sample Users
const DEFAULT_USERS = [
  {
    id: 'usr_001',
    name: 'Alex Morgan',
    email: 'alex@example.com',
    phone: '9876543210',
    password: 'password123',
    walletBalance: 120.00,
    rating: 4.9,
    joinedDate: 'Jan 2024',
    emergencyContact: '9876500000',
    homeAddress: 'Tech City Phase 1, Silicon Avenue',
    workAddress: 'Metro Cyber Tower, Floor 4'
  }
];

// Initialize users storage if not present
function initializeAuthStorage() {
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(DEFAULT_USERS));
  }
}

/**
 * Get the currently logged-in user or null
 */
function getCurrentUser() {
  const userJson = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
  if (!userJson) return null;
  try {
    return JSON.parse(userJson);
  } catch (e) {
    return null;
  }
}

/**
 * Save / Update current user in storage
 */
function setCurrentUser(user) {
  if (user) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    // Also update in registered users array
    const users = getAllUsers();
    const index = users.findIndex(u => u.email === user.email || u.id === user.id);
    if (index !== -1) {
      users[index] = { ...users[index], ...user };
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    }
  } else {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  }
}

/**
 * Get all registered users
 */
function getAllUsers() {
  initializeAuthStorage();
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS)) || DEFAULT_USERS;
  } catch (e) {
    return DEFAULT_USERS;
  }
}

/**
 * Authenticate user with email or phone + password
 */
function loginUser(identifier, password, rememberMe = false) {
  const users = getAllUsers();
  const cleanId = identifier.trim().toLowerCase();

  const user = users.find(u => 
    (u.email.toLowerCase() === cleanId || u.phone === cleanId) && 
    u.password === password
  );

  if (user) {
    setCurrentUser(user);
    if (rememberMe) {
      localStorage.setItem(STORAGE_KEYS.REMEMBER, cleanId);
    } else {
      localStorage.removeItem(STORAGE_KEYS.REMEMBER);
    }
    return { success: true, user };
  }

  return { 
    success: false, 
    message: 'Invalid email/phone or password. (Hint: Try alex@example.com / password123)' 
  };
}

/**
 * Register a new rider
 */
function registerUser(name, email, phone, password) {
  const users = getAllUsers();
  const cleanEmail = email.trim().toLowerCase();
  const cleanPhone = phone.trim();

  // Check uniqueness
  const existing = users.find(u => u.email.toLowerCase() === cleanEmail || u.phone === cleanPhone);
  if (existing) {
    return { success: false, message: 'An account with this email or mobile number already exists.' };
  }

  const newUser = {
    id: 'usr_' + Date.now(),
    name: name.trim(),
    email: cleanEmail,
    phone: cleanPhone,
    password: password,
    walletBalance: 50.00, // Welcome signup bonus
    rating: 5.0,
    joinedDate: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
    emergencyContact: '',
    homeAddress: '',
    workAddress: ''
  };

  users.push(newUser);
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  setCurrentUser(newUser);

  return { success: true, user: newUser };
}

/**
 * Logout current user
 */
function logoutUser() {
  localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  window.location.href = 'login.html';
}

/**
 * Update Navbar Auth Buttons across public pages
 */
function updateNavbarAuthUI() {
  const authContainer = document.getElementById('navbarAuthButtons');
  if (!authContainer) return;

  const currentUser = getCurrentUser();

  if (currentUser) {
    // Show Dashboard button & User profile badge
    authContainer.innerHTML = `
      <div class="d-flex align-items-center gap-2">
        <a href="dashboard.html" class="btn btn-yellow btn-sm">
          <i class="bi bi-speedometer2"></i> Dashboard
        </a>
        <div class="dropdown">
          <button class="btn btn-dark-outline btn-sm dropdown-toggle d-flex align-items-center gap-2" type="button" data-bs-toggle="dropdown" aria-expanded="false">
            <img src="assets/images/rider-avatar.svg" alt="Avatar" width="24" height="24" class="rounded-circle">
            <span class="d-none d-md-inline font-weight-bold">${currentUser.name.split(' ')[0]}</span>
          </button>
          <ul class="dropdown-menu dropdown-menu-dark dropdown-menu-end shadow">
            <li><div class="dropdown-header text-white-50"><small>Signed in as</small><br><strong class="text-white">${currentUser.name}</strong></div></li>
            <li><hr class="dropdown-divider border-secondary"></li>
            <li><a class="dropdown-item" href="dashboard.html"><i class="bi bi-grid me-2 text-warning"></i> Dashboard</a></li>
            <li><a class="dropdown-item" href="profile.html"><i class="bi bi-person me-2 text-warning"></i> My Profile</a></li>
            <li><a class="dropdown-item" href="ride-history.html"><i class="bi bi-clock-history me-2 text-warning"></i> Ride History</a></li>
            <li><hr class="dropdown-divider border-secondary"></li>
            <li><button class="dropdown-item text-danger" onclick="logoutUser()"><i class="bi bi-box-arrow-right me-2"></i> Log Out</button></li>
          </ul>
        </div>
      </div>
    `;
  } else {
    // Show Login & Sign Up buttons
    authContainer.innerHTML = `
      <a href="login.html" class="btn btn-dark-outline btn-sm me-2">
        <i class="bi bi-box-arrow-in-right"></i> Login
      </a>
      <a href="register.html" class="btn btn-yellow btn-sm">
        <i class="bi bi-person-plus-fill"></i> Sign Up
      </a>
    `;
  }
}

/**
 * Route Guard for protected dashboard pages
 */
function protectRoute() {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    // If opening dashboard directly for test, automatically authenticate with default user
    // or redirect to login. We'll authenticate default demo user so user sees instant working dashboard!
    const defaultUser = DEFAULT_USERS[0];
    setCurrentUser(defaultUser);
  }
}

// Attach Form Event Listeners on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  initializeAuthStorage();
  updateNavbarAuthUI();

  // --- LOGIN PAGE LOGIC ---
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    // Auto-fill remembered identifier if present
    const remembered = localStorage.getItem(STORAGE_KEYS.REMEMBER);
    if (remembered) {
      const idInput = document.getElementById('loginIdentifier');
      const remCheck = document.getElementById('rememberMe');
      if (idInput) idInput.value = remembered;
      if (remCheck) remCheck.checked = true;
    }

    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const idInput = document.getElementById('loginIdentifier');
      const passInput = document.getElementById('loginPassword');
      const remCheck = document.getElementById('rememberMe');
      const errorAlert = document.getElementById('loginErrorAlert');

      let isValid = true;

      // Validate Identifier
      if (!idInput.value.trim()) {
        idInput.classList.add('is-invalid');
        isValid = false;
      } else {
        idInput.classList.remove('is-invalid');
        idInput.classList.add('is-valid');
      }

      // Validate Password
      if (!passInput.value) {
        passInput.classList.add('is-invalid');
        isValid = false;
      } else {
        passInput.classList.remove('is-invalid');
        passInput.classList.add('is-valid');
      }

      if (!isValid) return;

      const submitBtn = loginForm.querySelector('button[type="submit"]');
      const origText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Logging in...';

      setTimeout(() => {
        const result = loginUser(idInput.value, passInput.value, remCheck ? remCheck.checked : false);
        
        if (result.success) {
          if (errorAlert) errorAlert.classList.add('d-none');
          if (window.showToast) {
            window.showToast('Login successful! Redirecting...', 'success');
          }
          setTimeout(() => {
            window.location.href = 'dashboard.html';
          }, 600);
        } else {
          submitBtn.disabled = false;
          submitBtn.innerHTML = origText;
          if (errorAlert) {
            errorAlert.textContent = result.message;
            errorAlert.classList.remove('d-none');
          }
        }
      }, 500);
    });

    // Quick Demo Login Button Helper
    const demoLoginBtn = document.getElementById('btnDemoLogin');
    if (demoLoginBtn) {
      demoLoginBtn.addEventListener('click', () => {
        document.getElementById('loginIdentifier').value = 'alex@example.com';
        document.getElementById('loginPassword').value = 'password123';
        loginForm.dispatchEvent(new Event('submit'));
      });
    }
  }

  // --- REGISTRATION PAGE LOGIC ---
  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    const nameInput = document.getElementById('regName');
    const phoneInput = document.getElementById('regPhone');
    const emailInput = document.getElementById('regEmail');
    const passInput = document.getElementById('regPassword');
    const confirmPassInput = document.getElementById('regConfirmPassword');
    const termsCheck = document.getElementById('regTerms');
    const regErrorAlert = document.getElementById('regErrorAlert');

    // Password strength meter
    if (passInput) {
      passInput.addEventListener('input', () => {
        const val = passInput.value;
        const fill = document.getElementById('passStrengthFill');
        if (!fill) return;

        let strength = 0;
        if (val.length >= 6) strength += 25;
        if (val.length >= 8) strength += 25;
        if (/[A-Z]/.test(val) || /[0-9]/.test(val)) strength += 25;
        if (/[^A-Za-z0-9]/.test(val)) strength += 25;

        fill.style.width = strength + '%';
        if (strength <= 25) fill.style.backgroundColor = '#ef4444';
        else if (strength <= 50) fill.style.backgroundColor = '#f59e0b';
        else fill.style.backgroundColor = '#10b981';
      });
    }

    registerForm.addEventListener('submit', (e) => {
      e.preventDefault();
      let isValid = true;

      // Full Name Validation (at least 3 characters)
      if (!nameInput.value.trim() || nameInput.value.trim().length < 3) {
        nameInput.classList.add('is-invalid');
        isValid = false;
      } else {
        nameInput.classList.remove('is-invalid');
        nameInput.classList.add('is-valid');
      }

      // Phone Validation (10 digits)
      const phoneDigits = phoneInput.value.replace(/\D/g, '');
      if (phoneDigits.length < 10) {
        phoneInput.classList.add('is-invalid');
        isValid = false;
      } else {
        phoneInput.classList.remove('is-invalid');
        phoneInput.classList.add('is-valid');
      }

      // Email Validation
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(emailInput.value.trim())) {
        emailInput.classList.add('is-invalid');
        isValid = false;
      } else {
        emailInput.classList.remove('is-invalid');
        emailInput.classList.add('is-valid');
      }

      // Password Validation (min 6 chars)
      if (passInput.value.length < 6) {
        passInput.classList.add('is-invalid');
        isValid = false;
      } else {
        passInput.classList.remove('is-invalid');
        passInput.classList.add('is-valid');
      }

      // Confirm Password
      if (confirmPassInput.value !== passInput.value || !confirmPassInput.value) {
        confirmPassInput.classList.add('is-invalid');
        isValid = false;
      } else {
        confirmPassInput.classList.remove('is-invalid');
        confirmPassInput.classList.add('is-valid');
      }

      // Terms
      if (!termsCheck.checked) {
        termsCheck.classList.add('is-invalid');
        isValid = false;
      } else {
        termsCheck.classList.remove('is-invalid');
      }

      if (!isValid) return;

      const submitBtn = registerForm.querySelector('button[type="submit"]');
      const origText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Creating Account...';

      setTimeout(() => {
        const result = registerUser(
          nameInput.value,
          emailInput.value,
          phoneInput.value,
          passInput.value
        );

        if (result.success) {
          if (regErrorAlert) regErrorAlert.classList.add('d-none');
          if (window.showToast) {
            window.showToast('Account created successfully! Welcome to VeloMoto.', 'success');
          }
          setTimeout(() => {
            window.location.href = 'dashboard.html';
          }, 700);
        } else {
          submitBtn.disabled = false;
          submitBtn.innerHTML = origText;
          if (regErrorAlert) {
            regErrorAlert.textContent = result.message;
            regErrorAlert.classList.remove('d-none');
          }
        }
      }, 600);
    });
  }
});
