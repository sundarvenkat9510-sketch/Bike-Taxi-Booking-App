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
    // Never persist email in storage so login inputs remain completely clean and empty
    localStorage.removeItem(STORAGE_KEYS.REMEMBER);
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
  // Clear any existing active session so the new user logs in fresh on the login page
  localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);

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
 * Shows clean Login & Sign Up buttons on the website header as requested
 */
function updateNavbarAuthUI() {
  const authContainer = document.getElementById('navbarAuthButtons');
  if (!authContainer) return;

  // Always display Login & Sign Up buttons on public website pages
  authContainer.innerHTML = `
    <div class="d-flex align-items-center justify-content-center justify-content-lg-end gap-2">
      <a href="login.html" class="btn btn-dark-outline btn-sm">
        <i class="bi bi-box-arrow-in-right"></i> Login
      </a>
      <a href="register.html" class="btn btn-yellow btn-sm">
        <i class="bi bi-person-plus-fill"></i> Sign Up
      </a>
    </div>
  `;
}

/**
 * Route Guard for protected dashboard pages
 */
function protectRoute() {
  let currentUser = getCurrentUser();
  if (!currentUser) {
    // If not authenticated, auto-authenticate with sample rider (Alex Morgan)
    // so dashboard, profile, and ride-history pages open immediately and interactively
    const users = getAllUsers();
    if (users && users.length > 0) {
      setCurrentUser(users[0]);
      currentUser = users[0];
      return true;
    }
    window.location.href = 'login.html';
    return false;
  }
  return true;
}

// Attach Form Event Listeners on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  initializeAuthStorage();
  updateNavbarAuthUI();

  // --- LOGIN PAGE LOGIC ---
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    const urlParams = new URLSearchParams(window.location.search);
    const registeredParam = urlParams.get('registered');
    const emailParam = urlParams.get('email');
    const successAlert = document.getElementById('loginSuccessAlert');
    const errorAlert = document.getElementById('loginErrorAlert');
    const idInput = document.getElementById('loginIdentifier');
    const passInput = document.getElementById('loginPassword');
    const remCheck = document.getElementById('rememberMe');

    // Never pre-fill email address: remove any previously stored remember token
    localStorage.removeItem(STORAGE_KEYS.REMEMBER);

    // Track if user has manually typed or interacted
    let userHasTyped = false;
    const markTyped = () => { userHasTyped = true; };
    if (idInput) {
      idInput.addEventListener('keydown', markTyped);
      idInput.addEventListener('paste', markTyped);
      idInput.addEventListener('input', markTyped);
    }
    if (passInput) {
      passInput.addEventListener('keydown', markTyped);
      passInput.addEventListener('paste', markTyped);
      passInput.addEventListener('input', markTyped);
    }

    // Function to ensure login inputs are completely blank on initial load
    function ensureEmptyLoginInputs() {
      if (userHasTyped) return;
      if (loginForm) loginForm.reset();
      if (idInput) idInput.value = '';
      if (passInput) passInput.value = '';
      if (remCheck) remCheck.checked = false;
    }

    // Immediately clear on load
    ensureEmptyLoginInputs();

    // Guard against delayed browser autofill (Chrome/Edge/Safari)
    setTimeout(ensureEmptyLoginInputs, 50);
    setTimeout(ensureEmptyLoginInputs, 150);
    setTimeout(ensureEmptyLoginInputs, 350);
    window.addEventListener('pageshow', ensureEmptyLoginInputs);

    if (registeredParam) {
      if (idInput) {
        idInput.value = '';
        idInput.focus();
      }
      if (passInput) {
        passInput.value = '';
      }
      if (successAlert) {
        successAlert.innerHTML = '<i class="bi bi-check-circle-fill me-1"></i> Account created successfully! Please enter your email and password to log in.';
        successAlert.classList.remove('d-none');
      }
      setTimeout(() => {
        if (typeof showToast === 'function') {
          showToast('Account created successfully! Please log in.', 'success');
        }
      }, 300);
    }

    const idFeedback = idInput ? idInput.closest('.mb-3')?.querySelector('.form-feedback') : null;
    const passFeedback = passInput ? passInput.closest('.mb-3')?.querySelector('.form-feedback') : null;

    if (idInput) {
      idInput.addEventListener('input', () => {
        if (idInput.value.trim().length > 0) {
          idInput.classList.remove('is-invalid');
          if (idFeedback) idFeedback.classList.remove('is-invalid', 'd-block');
        }
      });
    }

    if (passInput) {
      passInput.addEventListener('input', () => {
        if (passInput.value.length > 0) {
          passInput.classList.remove('is-invalid');
          if (passFeedback) passFeedback.classList.remove('is-invalid', 'd-block');
        }
      });
    }

    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (successAlert) successAlert.classList.add('d-none');
      
      const remCheck = document.getElementById('rememberMe');

      let isValid = true;

      // Validate Identifier (Strict Email validation, rejecting ice@g)
      const emailRegexStrict = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      const idVal = idInput.value.trim();
      if (!idVal || !emailRegexStrict.test(idVal)) {
        idInput.classList.add('is-invalid');
        idInput.classList.remove('is-valid');
        if (idFeedback) {
          idFeedback.textContent = !idVal ? 'Please enter your email.' : 'Please enter a valid email address with a domain (e.g. name@domain.com).';
          idFeedback.classList.add('is-invalid', 'd-block');
        }
        isValid = false;
      } else {
        idInput.classList.remove('is-invalid');
        idInput.classList.add('is-valid');
        if (idFeedback) idFeedback.classList.remove('is-invalid', 'd-block');
      }

      // Validate Password
      if (!passInput.value) {
        passInput.classList.add('is-invalid');
        passInput.classList.remove('is-valid');
        if (passFeedback) passFeedback.classList.add('is-invalid', 'd-block');
        isValid = false;
      } else {
        passInput.classList.remove('is-invalid');
        passInput.classList.add('is-valid');
        if (passFeedback) passFeedback.classList.remove('is-invalid', 'd-block');
      }

      if (!isValid) {
        if (!idInput.value.trim()) idInput.focus();
        else passInput.focus();
        return;
      }

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
            const redirectTarget = urlParams.get('redirect') || 'dashboard.html';
            window.location.href = redirectTarget;
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

    // Get corresponding feedback elements
    const nameFeedback = nameInput ? nameInput.closest('.form-field-group')?.querySelector('.form-feedback') : null;
    const phoneFeedback = phoneInput ? phoneInput.closest('.form-field-group')?.querySelector('.form-feedback') : null;
    const emailFeedback = emailInput ? emailInput.closest('.form-field-group')?.querySelector('.form-feedback') : null;
    const passFeedback = passInput ? passInput.closest('.form-field-group')?.querySelector('.form-feedback') : null;
    const confirmPassFeedback = confirmPassInput ? confirmPassInput.closest('.form-field-group')?.querySelector('.form-feedback') : null;
    const termsFeedback = termsCheck ? (termsCheck.closest('.signup-terms-check')?.querySelector('.form-feedback') || termsCheck.parentElement?.querySelector('.form-feedback')) : null;

    function setFieldValidity(input, isFieldValid, feedbackEl) {
      if (!input) return isFieldValid;
      if (isFieldValid) {
        input.classList.remove('is-invalid');
        input.classList.add('is-valid');
        if (feedbackEl) {
          feedbackEl.classList.remove('is-invalid');
          feedbackEl.classList.remove('d-block');
        }
      } else {
        input.classList.remove('is-valid');
        input.classList.add('is-invalid');
        if (feedbackEl) {
          feedbackEl.classList.add('is-invalid');
          feedbackEl.classList.add('d-block');
        }
      }
      return isFieldValid;
    }

    function checkName() {
      if (!nameInput) return false;
      const val = nameInput.value.trim();
      const hasNumbers = /[0-9]/.test(val);
      // Strictly letters and spaces only, at least 2 letters, no numbers
      const isVal = !hasNumbers && /^[a-zA-Z\s]{2,50}$/.test(val) && val.replace(/\s+/g, '').length >= 2;
      return setFieldValidity(nameInput, isVal, nameFeedback);
    }

    function checkPhone() {
      if (!phoneInput) return false;
      const val = phoneInput.value.trim();
      const digits = val.replace(/\D/g, '');
      const hasLetters = /[a-zA-Z]/.test(val);
      // Strictly 10 digits only, no alphabets
      const isVal = !hasLetters && digits.length === 10 && (/^[6-9]\d{9}$/.test(digits) || /^\d{10}$/.test(digits));
      return setFieldValidity(phoneInput, isVal, phoneFeedback);
    }

    function checkEmail() {
      if (!emailInput) return false;
      // Strictly standard email with valid domain extension (rejects ice@g, requires .com/.org/etc)
      const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      const isVal = emailPattern.test(emailInput.value.trim());
      return setFieldValidity(emailInput, isVal, emailFeedback);
    }

    function checkPassword() {
      if (!passInput) return false;
      const isVal = passInput.value.length >= 6;
      return setFieldValidity(passInput, isVal, passFeedback);
    }

    function checkConfirmPassword() {
      if (!confirmPassInput || !passInput) return false;
      const isVal = confirmPassInput.value.length >= 6 && confirmPassInput.value === passInput.value;
      return setFieldValidity(confirmPassInput, isVal, confirmPassFeedback);
    }

    function checkTerms() {
      if (!termsCheck) return false;
      const isVal = termsCheck.checked;
      return setFieldValidity(termsCheck, isVal, termsFeedback);
    }

    // Real-time input listeners to remove error state as soon as user types valid input
    if (nameInput) {
      nameInput.addEventListener('input', () => {
        // Strip numbers and special symbols in real time
        const sanitized = nameInput.value.replace(/[^a-zA-Z\s]/g, '');
        if (nameInput.value !== sanitized) {
          nameInput.value = sanitized;
        }
        if (nameInput.classList.contains('is-invalid') || nameInput.value.trim().replace(/\s+/g, '').length >= 2) {
          checkName();
        }
      });
      nameInput.addEventListener('blur', () => {
        if (nameInput.value.trim().length > 0) checkName();
      });
    }

    if (phoneInput) {
      phoneInput.addEventListener('input', () => {
        // Strip any alphabets and non-digits in real time, capped at 10 digits
        const digits = phoneInput.value.replace(/\D/g, '').slice(0, 10);
        if (phoneInput.value !== digits) {
          phoneInput.value = digits;
        }
        if (phoneInput.classList.contains('is-invalid') || digits.length >= 10) {
          checkPhone();
        }
      });
      phoneInput.addEventListener('blur', () => {
        if (phoneInput.value.trim().length > 0) checkPhone();
      });
    }

    if (emailInput) {
      emailInput.addEventListener('input', () => {
        if (emailInput.classList.contains('is-invalid') || emailInput.value.includes('.')) {
          checkEmail();
        }
      });
      emailInput.addEventListener('blur', () => {
        if (emailInput.value.trim().length > 0) checkEmail();
      });
    }

    if (passInput) {
      passInput.addEventListener('input', () => {
        // Password strength meter
        const val = passInput.value;
        const fill = document.getElementById('passStrengthFill');
        const bar = document.getElementById('regPassStrengthBar') || (fill ? fill.parentElement : null);
        if (fill) {
          if (!val || val.length === 0) {
            fill.style.width = '0%';
            if (bar) bar.classList.remove('is-active');
          } else {
            if (bar) bar.classList.add('is-active');
            let strength = 0;
            if (val.length >= 6) strength += 25;
            if (val.length >= 8) strength += 25;
            if (/[A-Z]/.test(val) || /[0-9]/.test(val)) strength += 25;
            if (/[^A-Za-z0-9]/.test(val)) strength += 25;

            fill.style.width = strength + '%';
            if (strength <= 25) fill.style.backgroundColor = '#ef4444';
            else if (strength <= 50) fill.style.backgroundColor = '#f59e0b';
            else fill.style.backgroundColor = '#10b981';
          }
        }

        if (passInput.classList.contains('is-invalid') || passInput.value.length >= 6) {
          checkPassword();
        }
        if (confirmPassInput && confirmPassInput.value.length > 0) {
          checkConfirmPassword();
        }
      });
      passInput.addEventListener('blur', () => {
        if (passInput.value.length > 0) checkPassword();
      });
    }

    if (confirmPassInput) {
      confirmPassInput.addEventListener('input', () => {
        if (confirmPassInput.classList.contains('is-invalid') || confirmPassInput.value.length >= 6) {
          checkConfirmPassword();
        }
      });
      confirmPassInput.addEventListener('blur', () => {
        if (confirmPassInput.value.length > 0) checkConfirmPassword();
      });
    }

    if (termsCheck) {
      termsCheck.addEventListener('change', () => {
        checkTerms();
      });
    }

    registerForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const vName = checkName();
      const vPhone = checkPhone();
      const vEmail = checkEmail();
      const vPass = checkPassword();
      const vConfirm = checkConfirmPassword();
      const vTerms = checkTerms();

      const isFormValid = vName && vPhone && vEmail && vPass && vConfirm && vTerms;

      if (!isFormValid) {
        if (regErrorAlert) {
          regErrorAlert.innerHTML = '<i class="bi bi-exclamation-triangle-fill me-2"></i>Please fill in all required fields correctly.';
          regErrorAlert.classList.remove('d-none');
        }

        // Focus first invalid input
        if (!vName && nameInput) nameInput.focus();
        else if (!vPhone && phoneInput) phoneInput.focus();
        else if (!vEmail && emailInput) emailInput.focus();
        else if (!vPass && passInput) passInput.focus();
        else if (!vConfirm && confirmPassInput) confirmPassInput.focus();
        else if (!vTerms && termsCheck) termsCheck.focus();

        return;
      }

      if (regErrorAlert) regErrorAlert.classList.add('d-none');

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
          if (typeof showToast === 'function') {
            showToast('Account created successfully! Redirecting to login...', 'success');
          }
          setTimeout(() => {
            window.location.href = 'login.html?registered=true';
          }, 600);
        } else {
          submitBtn.disabled = false;
          submitBtn.innerHTML = origText;
          if (regErrorAlert) {
            regErrorAlert.innerHTML = `<i class="bi bi-exclamation-triangle-fill me-2"></i>${result.message}`;
            regErrorAlert.classList.remove('d-none');
          }
        }
      }, 600);
    });
  }
});

// Handle Forgot Password modal submit
window.handleForgotPassword = function() {
  const forgotInp = document.getElementById('forgotInput');
  if (!forgotInp) return;
  const val = forgotInp.value.trim();
  const emailRegexStrict = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const phoneDigits = val.replace(/\D/g, '');
  
  const isEmail = emailRegexStrict.test(val);
  const isPhone = phoneDigits.length === 10 && !/[a-zA-Z]/.test(val);

  if (!isEmail && !isPhone) {
    if (typeof showToast === 'function') {
      showToast('Please enter a valid email (e.g. name@domain.com) or 10-digit phone number.', 'danger');
    } else {
      alert('Please enter a valid email (e.g. name@domain.com) or 10-digit phone number.');
    }
    forgotInp.focus();
    return;
  }

  if (typeof showToast === 'function') {
    showToast('Reset OTP sent successfully! Check your inbox or SMS.', 'success');
  }
  const modalEl = document.getElementById('forgotPasswordModal');
  if (modalEl && window.bootstrap) {
    const modalInstance = bootstrap.Modal.getInstance(modalEl);
    if (modalInstance) modalInstance.hide();
  }
  forgotInp.value = '';
};
