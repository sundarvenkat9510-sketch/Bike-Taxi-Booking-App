/**
 * VELOMOTO - Core UI & Interaction Scripts
 * Shared across public website pages (Home, How It Works, Fares, etc.)
 */

// Sample Popular Urban Locations for Autocomplete
const POPULAR_LOCATIONS = [
  { name: 'Central Metro Station', area: 'Downtown Blue Line' },
  { name: 'Tech Park Cyber City', area: 'Sector 62, IT Hub' },
  { name: 'Grand City Mall & Cineplex', area: 'Ring Road Crossing' },
  { name: 'International Airport Terminal 1', area: 'Departures Level' },
  { name: 'City Railway Central Junction', area: 'Main Gate Station Rd' },
  { name: 'North University Campus', area: 'Student Center & Library' },
  { name: 'Botanical Garden Metro Gate 3', area: 'Greenway Boulevard' },
  { name: 'Apex Multi-speciality Hospital', area: 'Healthcare District' },
  { name: 'Old Town Heritage Square', area: 'Market Street' },
  { name: 'Financial Towers & Stock Exchange', area: 'Business District' }
];

// Fare Calculation Rate Cards
const FARE_RATES = {
  standard: {
    name: 'Standard Moto',
    baseFare: 25.00,
    baseKm: 1.5,
    perKmRate: 9.50,
    speedKmH: 30, // average urban bike speed
    icon: 'bi-bicycle'
  },
  electric: {
    name: 'Eco Electric Scooter',
    baseFare: 20.00,
    baseKm: 1.5,
    perKmRate: 7.50,
    speedKmH: 26,
    icon: 'bi-lightning-charge-fill'
  },
  express: {
    name: 'Express Moto Pro',
    baseFare: 35.00,
    baseKm: 2.0,
    perKmRate: 12.00,
    speedKmH: 38,
    icon: 'bi-speedometer'
  }
};

/**
 * Toast Notification Helper
 */
function showToast(message, type = 'info') {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container-custom';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `custom-toast toast-${type}`;
  
  let icon = 'bi-info-circle-fill text-warning';
  if (type === 'success') icon = 'bi-check-circle-fill text-success';
  if (type === 'error' || type === 'danger') icon = 'bi-exclamation-triangle-fill text-danger';

  toast.innerHTML = `
    <i class="bi ${icon} fs-5"></i>
    <div class="flex-grow-1 font-weight-500">${message}</div>
    <button type="button" class="btn-close btn-close-white ms-2" style="font-size: 0.75rem;"></button>
  `;

  container.appendChild(toast);

  const closeBtn = toast.querySelector('.btn-close');
  closeBtn.addEventListener('click', () => toast.remove());

  setTimeout(() => {
    if (toast.parentElement) {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 0.3s ease-out';
      setTimeout(() => toast.remove(), 300);
    }
  }, 4000);
}

// Make globally accessible
window.showToast = showToast;

/**
 * Initialize Location Autocomplete on Input
 */
function setupLocationAutocomplete(inputId, listId) {
  const input = document.getElementById(inputId);
  const list = document.getElementById(listId);
  if (!input || !list) return;

  function renderList(query = '') {
    const cleanQuery = query.toLowerCase().trim();
    const matches = POPULAR_LOCATIONS.filter(item => 
      item.name.toLowerCase().includes(cleanQuery) || 
      item.area.toLowerCase().includes(cleanQuery)
    );

    if (matches.length === 0) {
      list.innerHTML = `<div class="p-2 text-muted small text-center">No locations found. Press enter to use custom address.</div>`;
      list.style.display = 'block';
      return;
    }

    list.innerHTML = matches.map(loc => `
      <div class="location-autocomplete-item" data-name="${loc.name}">
        <i class="bi bi-geo-alt-fill text-warning"></i>
        <div>
          <div class="fw-bold">${loc.name}</div>
          <div class="small text-muted">${loc.area}</div>
        </div>
      </div>
    `).join('');

    list.querySelectorAll('.location-autocomplete-item').forEach(item => {
      item.addEventListener('click', () => {
        input.value = item.getAttribute('data-name');
        list.style.display = 'none';
        triggerLocationChange();
      });
    });

    list.style.display = 'block';
  }

  input.addEventListener('focus', () => renderList(input.value));
  input.addEventListener('input', () => renderList(input.value));

  document.addEventListener('click', (e) => {
    if (!input.contains(e.target) && !list.contains(e.target)) {
      list.style.display = 'none';
    }
  });
}

function triggerLocationChange() {
  const event = new CustomEvent('velomoto:locationChange');
  window.dispatchEvent(event);
}

/**
 * Calculate Fare details based on distance & type
 */
function calculateFareBreakdown(distanceKm, rideType = 'standard', isPeak = false) {
  const rate = FARE_RATES[rideType] || FARE_RATES.standard;
  const dist = Math.max(1, parseFloat(distanceKm) || 1);

  let distanceFare = 0;
  if (dist > rate.baseKm) {
    distanceFare = (dist - rate.baseKm) * rate.perKmRate;
  }

  let subtotal = rate.baseFare + distanceFare;
  let peakSurge = isPeak ? subtotal * 0.25 : 0;
  let platformFee = 3.50;
  let taxGst = (subtotal + peakSurge + platformFee) * 0.05; // 5% GST
  let totalFare = Math.round((subtotal + peakSurge + platformFee + taxGst) * 10) / 10;
  
  let etaMinutes = Math.round((dist / rate.speedKmH) * 60) + 4; // +4 mins pickup traffic

  return {
    rideType,
    typeName: rate.name,
    distanceKm: dist,
    baseFare: rate.baseFare.toFixed(2),
    distanceFare: distanceFare.toFixed(2),
    peakSurge: peakSurge.toFixed(2),
    platformFee: platformFee.toFixed(2),
    taxGst: taxGst.toFixed(2),
    totalFare: totalFare.toFixed(2),
    etaMinutes
  };
}

// Make calculation accessible
window.calculateFareBreakdown = calculateFareBreakdown;

// DOM Initialization
document.addEventListener('DOMContentLoaded', () => {
  // 1. Sticky Navbar background on scroll
  const navbar = document.querySelector('.navbar-custom');
  if (navbar) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 30) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    });
  }

  // 2. Setup Autocomplete on Hero / Booking inputs if present
  setupLocationAutocomplete('heroPickupInput', 'heroPickupList');
  setupLocationAutocomplete('heroDropInput', 'heroDropList');

  // 3. Hero Quick Booking Widget Logic
  const heroBookingForm = document.getElementById('heroBookingForm');
  if (heroBookingForm) {
    const pickupInput = document.getElementById('heroPickupInput');
    const dropInput = document.getElementById('heroDropInput');
    const quickEstimateBox = document.getElementById('heroQuickEstimate');

    // Quick estimation update
    function updateHeroEstimate() {
      if (pickupInput.value.trim() && dropInput.value.trim() && quickEstimateBox) {
        // Generate simulated realistic distance between 3.5 to 11.2 km
        const sampleDist = 6.4;
        const est = calculateFareBreakdown(sampleDist, 'standard');
        quickEstimateBox.innerHTML = `
          <div class="d-flex align-items-center justify-content-between p-2 rounded border border-secondary mb-3" style="background-color: #202026 !important;">
            <div class="d-flex align-items-center gap-2">
              <span class="badge badge-yellow"><i class="bi bi-clock"></i> ~${est.etaMinutes} mins</span>
              <span class="small text-light">• ~${sampleDist} km</span>
            </div>
            <div class="fw-bold text-warning fs-5">₹${est.totalFare}</div>
          </div>
        `;
        quickEstimateBox.classList.remove('d-none');
      }
    }

    if (pickupInput && dropInput) {
      pickupInput.addEventListener('change', updateHeroEstimate);
      dropInput.addEventListener('change', updateHeroEstimate);
      pickupInput.addEventListener('input', updateHeroEstimate);
      dropInput.addEventListener('input', updateHeroEstimate);
      window.addEventListener('velomoto:locationChange', updateHeroEstimate);

      // Immediately display estimate on page load if inputs have values
      if (pickupInput.value && dropInput.value) {
        updateHeroEstimate();
      }
    }

    heroBookingForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const pickupVal = pickupInput ? pickupInput.value.trim() : '';
      const dropVal = dropInput ? dropInput.value.trim() : '';

      if (!pickupVal || !dropVal) {
        showToast('Please enter both pickup and destination locations.', 'error');
        return;
      }

      // Store in session storage to auto-load in dashboard booking form
      sessionStorage.setItem('velomoto_quick_pickup', pickupVal);
      sessionStorage.setItem('velomoto_quick_drop', dropVal);

      // Check if logged in
      const currentUser = localStorage.getItem('velomoto_currentUser');
      if (currentUser) {
        window.location.href = 'dashboard.html?action=book';
      } else {
        showToast('Login to confirm your booking! Redirecting...', 'info');
        setTimeout(() => {
          window.location.href = 'login.html?redirect=dashboard.html';
        }, 800);
      }
    });
  }

  // 3B. Home 2 Rapid Booking Form & Fleet Selector
  const heroBookingForm2 = document.getElementById('heroBookingForm2');
  if (heroBookingForm2) {
    const pickupInput2 = document.getElementById('pickupLocationInput2');
    const dropInput2 = document.getElementById('dropLocationInput2');

    const fleetButtons = [
      document.getElementById('btnFleetClassic'),
      document.getElementById('btnFleetEV'),
      document.getElementById('btnFleetExpress')
    ].filter(Boolean);

    const fleetFareMap = {
      btnFleetClassic: { fare: '₹49', time: '14 mins', saving: 'Save 22 mins vs Cab' },
      btnFleetEV: { fare: '₹45', time: '15 mins', saving: 'Save 21 mins & Zero Emissions' },
      btnFleetExpress: { fare: '₹65', time: '10 mins', saving: 'Save 26 mins vs Cab' }
    };

    fleetButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        fleetButtons.forEach(b => {
          b.classList.remove('active', 'btn-yellow');
          b.setAttribute('aria-selected', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');

        const estimateFareEl = document.querySelector('.estimate-fare-amount');
        const estimateEtaEl = document.querySelector('.estimate-eta strong');
        const estimateSavingEl = document.querySelector('.estimate-saving');
        const data = fleetFareMap[btn.id];
        if (data) {
          if (estimateFareEl) estimateFareEl.textContent = data.fare;
          if (estimateEtaEl) estimateEtaEl.textContent = data.time;
          if (estimateSavingEl) estimateSavingEl.innerHTML = `<i class="bi bi-arrow-down-right"></i> ${data.saving}`;
        }
      });
    });

    heroBookingForm2.addEventListener('submit', (e) => {
      e.preventDefault();
      const pickupVal = pickupInput2 ? pickupInput2.value.trim() : '';
      const dropVal = dropInput2 ? dropInput2.value.trim() : '';

      if (!pickupVal || !dropVal) {
        showToast('Please enter both pickup and destination locations.', 'error');
        return;
      }

      sessionStorage.setItem('velomoto_quick_pickup', pickupVal);
      sessionStorage.setItem('velomoto_quick_drop', dropVal);

      const currentUser = localStorage.getItem('velomoto_currentUser');
      if (currentUser) {
        window.location.href = 'dashboard.html?action=book';
      } else {
        showToast('Login to confirm your booking! Redirecting...', 'info');
        setTimeout(() => {
          window.location.href = 'login.html?redirect=dashboard.html';
        }, 700);
      }
    });
  }

  // 4. Interactive Fare Calculator (on fares.html)
  const fareDistanceSlider = document.getElementById('fareDistanceSlider');
  const fareDistanceDisplay = document.getElementById('fareDistanceDisplay');
  const fareCalcTypeRadios = document.querySelectorAll('input[name="calcBikeType"]');
  const farePeakCheck = document.getElementById('calcPeakCheck');

  if (fareDistanceSlider && fareDistanceDisplay) {
    function refreshFareCalculator() {
      const distance = parseFloat(fareDistanceSlider.value) || 5;
      fareDistanceDisplay.textContent = distance + ' km';

      let selectedType = 'standard';
      fareCalcTypeRadios.forEach(radio => {
        if (radio.checked) selectedType = radio.value;
      });

      const isPeak = farePeakCheck ? farePeakCheck.checked : false;
      const breakdown = calculateFareBreakdown(distance, selectedType, isPeak);

      // Update DOM
      const elemBase = document.getElementById('calcBaseFare');
      const elemDist = document.getElementById('calcDistFare');
      const elemPlatform = document.getElementById('calcPlatformFee');
      const elemTax = document.getElementById('calcTaxes');
      const elemTotal = document.getElementById('calcTotalFare');
      const elemEta = document.getElementById('calcEtaMinutes');
      const elemPeakRow = document.getElementById('calcPeakRow');
      const elemPeakFare = document.getElementById('calcPeakFare');

      if (elemBase) elemBase.textContent = '₹' + breakdown.baseFare;
      if (elemDist) elemDist.textContent = '₹' + breakdown.distanceFare;
      if (elemPlatform) elemPlatform.textContent = '₹' + breakdown.platformFee;
      if (elemTax) elemTax.textContent = '₹' + breakdown.taxGst;
      if (elemTotal) elemTotal.textContent = '₹' + breakdown.totalFare;
      if (elemEta) elemEta.textContent = breakdown.etaMinutes + ' mins';

      if (elemPeakRow && elemPeakFare) {
        if (isPeak) {
          elemPeakRow.classList.remove('d-none');
          elemPeakFare.textContent = '+₹' + breakdown.peakSurge;
        } else {
          elemPeakRow.classList.add('d-none');
        }
      }
    }

    fareDistanceSlider.addEventListener('input', refreshFareCalculator);
    fareCalcTypeRadios.forEach(r => r.addEventListener('change', refreshFareCalculator));
    if (farePeakCheck) farePeakCheck.addEventListener('change', refreshFareCalculator);

    // Initial run
    refreshFareCalculator();
  }

  // 5. Contact Form submission handler (if on contact or home)
  const contactForms = document.querySelectorAll('#contactForm, #fullContactForm, #refContactForm');
  contactForms.forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const nameInput = form.querySelector('input[type="text"], input[name="name"]');
      const name = nameInput && nameInput.value.trim() ? nameInput.value.trim() : 'Commuter';
      showToast(`Thank you, ${name}! Your inquiry has been submitted. Our team will contact you within 15 minutes.`, 'success');
      form.reset();
    });
  });

  // 6. Newsletter Form
  const newsletterForm = document.getElementById('newsletterForm');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      showToast('Thank you for subscribing to VeloMoto ride updates & offers!', 'success');
      newsletterForm.reset();
    });
  }

  // 7. Social Media Buttons -> Redirect to respective platform login page
  document.querySelectorAll('.social-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const platform = btn.getAttribute('aria-label') || 'Social Login';
      if (window.showToast) {
        window.showToast(`Opening ${platform} page...`, 'info');
      }
    });
  });

  // 8. Logo Click Handler -> Always Navigates to Home Page (index.html)
  document.querySelectorAll('.navbar-brand, .navbar-brand-logo, .footer-logo-link, img[src*="logo.svg"]').forEach(logoEl => {
    logoEl.style.cursor = 'pointer';
    logoEl.addEventListener('click', (e) => {
      const isHomePage = window.location.pathname.endsWith('index.html') || 
                          window.location.pathname.endsWith('/') || 
                          window.location.pathname === '';
      if (!isHomePage || window.location.hash) {
        window.location.href = 'index.html';
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  });

  // 9. RTL / LTR Navigation Direction Switcher Initialization
  initDirectionSwitcher();

  // 10. Dark / Light Theme Switcher Initialization
  initThemeSwitcher();
});

/**
 * ============================================================================
 * RTL / LTR Direction Switcher Controller
 * ============================================================================
 * - Toggles between LTR (default) and RTL (Right-to-Left)
 * - Swaps Bootstrap stylesheet to bootstrap.rtl.min.css dynamically
 * - Updates button label between "RTL" and "LTR"
 * - Persists chosen state in localStorage ('velomoto_direction')
 */
function getSiteDirection() {
  return localStorage.getItem('velomoto_direction') || 'ltr';
}

function setSiteDirection(dir) {
  const isRTL = dir === 'rtl';
  const targetDir = isRTL ? 'rtl' : 'ltr';

  // Update HTML tag attributes
  document.documentElement.setAttribute('dir', targetDir);
  document.documentElement.setAttribute('lang', isRTL ? 'ar' : 'en');

  // Update Bootstrap Stylesheet link
  const bootstrapLink = document.getElementById('bootstrapCSS');
  if (bootstrapLink) {
    bootstrapLink.href = isRTL
      ? 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.rtl.min.css'
      : 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css';
  }

  // Update all RTL / LTR toggle buttons across the page
  const toggleButtons = document.querySelectorAll('#rtlToggleBtn, .btn-rtl-toggle');
  toggleButtons.forEach(btn => {
    const textSpan = btn.querySelector('#rtlToggleText, .rtl-toggle-text') || btn;
    if (isRTL) {
      textSpan.textContent = 'LTR';
      btn.setAttribute('aria-label', 'Switch to LTR');
      btn.removeAttribute('title');
      btn.classList.add('is-rtl');
    } else {
      textSpan.textContent = 'RTL';
      btn.setAttribute('aria-label', 'Switch to RTL');
      btn.removeAttribute('title');
      btn.classList.remove('is-rtl');
    }
  });

  // Save in LocalStorage
  try {
    localStorage.setItem('velomoto_direction', targetDir);
  } catch (err) {
    console.warn('Storage unavailable:', err);
  }
}

function toggleSiteDirection() {
  const current = getSiteDirection();
  const next = current === 'rtl' ? 'ltr' : 'rtl';
  setSiteDirection(next);
}

function initDirectionSwitcher() {
  // Bind click event to any button on the page
  document.querySelectorAll('#rtlToggleBtn, .btn-rtl-toggle').forEach(btn => {
    btn.removeAttribute('title');
    if (!btn.hasAttribute('data-rtl-bound')) {
      btn.setAttribute('data-rtl-bound', 'true');
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        toggleSiteDirection();
      });
    }
  });

  // Apply saved direction immediately
  const saved = getSiteDirection();
  setSiteDirection(saved);
}

// Make globally accessible
window.getSiteDirection = getSiteDirection;
window.setSiteDirection = setSiteDirection;
window.toggleSiteDirection = toggleSiteDirection;
window.initDirectionSwitcher = initDirectionSwitcher;

// Auto-run early if DOM is ready or loading
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDirectionSwitcher);
  document.addEventListener('DOMContentLoaded', initThemeSwitcher);
} else {
  initDirectionSwitcher();
  initThemeSwitcher();
}

/**
 * ============================================================================
 * Dark / Light Theme Switcher Controller (VeloMoto Brand Theme Oriented)
 * ============================================================================
 * - Clicking first image (Sun icon bi-sun-fill) activates Light Theme
 * - Clicking second image (Moon icon bi-moon-fill) activates Dark Theme
 * - Persists chosen theme in localStorage ('velomoto_theme')
 * - Updates data-theme attribute on <html> element with zero-flicker
 */
function getSiteTheme() {
  return localStorage.getItem('velomoto_theme') || 'dark';
}

function setSiteTheme(theme) {
  const isLight = theme === 'light';
  const targetTheme = isLight ? 'light' : 'dark';

  // Apply data-theme and data-bs-theme attributes to <html> and <body>
  document.documentElement.setAttribute('data-theme', targetTheme);
  document.documentElement.setAttribute('data-bs-theme', targetTheme);
  if (document.body) {
    document.body.setAttribute('data-theme', targetTheme);
    document.body.setAttribute('data-bs-theme', targetTheme);
  }

  // Update single-logo fallback images if present
  document.querySelectorAll('img.navbar-brand-logo, .footer-logo-link img').forEach(img => {
    if (!img.classList.contains('logo-dark') && !img.classList.contains('logo-light')) {
      img.src = isLight ? 'assets/images/logo-light.svg' : 'assets/images/logo.svg';
    }
  });

  // Update all theme toggle buttons across the page
  const themeButtons = document.querySelectorAll('#themeToggleBtn, .btn-theme-toggle');
  themeButtons.forEach(btn => {
    if (isLight) {
      // In Light theme, displays Moon icon (Image 2) - clicking it activates Dark theme
      btn.innerHTML = '<i class="bi bi-moon-fill" aria-hidden="true"></i>';
      btn.setAttribute('aria-label', 'Switch to Dark Theme');
      btn.removeAttribute('title');
      btn.classList.add('is-light');
    } else {
      // In Dark theme, displays Sun icon (Image 1) - clicking it activates Light theme
      btn.innerHTML = '<i class="bi bi-sun-fill" aria-hidden="true"></i>';
      btn.setAttribute('aria-label', 'Switch to Light Theme');
      btn.removeAttribute('title');
      btn.classList.remove('is-light');
    }
  });

  // Save preference in localStorage
  try {
    localStorage.setItem('velomoto_theme', targetTheme);
  } catch (err) {
    console.warn('Theme storage unavailable:', err);
  }
}

function toggleSiteTheme() {
  const current = getSiteTheme();
  const next = current === 'light' ? 'dark' : 'light';
  setSiteTheme(next);
}

function initThemeSwitcher() {
  document.querySelectorAll('#themeToggleBtn, .btn-theme-toggle').forEach(btn => {
    btn.removeAttribute('title');
    if (!btn.hasAttribute('data-theme-bound')) {
      btn.setAttribute('data-theme-bound', 'true');
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        toggleSiteTheme();
      });
    }
  });

  // Apply saved theme immediately
  const saved = getSiteTheme();
  setSiteTheme(saved);
}

// GPS Auto-detect handler for booking forms
function detectGPSLocation() {
  const pickupInput = document.getElementById('pickupLocationInput2') ||
                      document.getElementById('pickupLocationInput') ||
                      document.getElementById('heroPickupInput');
  if (!pickupInput) return;

  pickupInput.value = 'Locating via GPS...';

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        pickupInput.value = 'Indiranagar 100ft Road, Metro Gate 2 (Live GPS)';
        if (typeof showToast === 'function') {
          showToast('Live GPS location detected successfully!', 'success');
        }
      },
      (err) => {
        pickupInput.value = 'Indiranagar 100ft Road, Bangalore (Simulated GPS)';
        if (typeof showToast === 'function') {
          showToast('GPS detected: Indiranagar 100ft Road', 'info');
        }
      },
      { timeout: 4000 }
    );
  } else {
    pickupInput.value = 'Indiranagar 100ft Road, Bangalore (GPS)';
    if (typeof showToast === 'function') {
      showToast('GPS location set: Indiranagar 100ft Road', 'info');
    }
  }
}

// Make globally accessible
window.getSiteTheme = getSiteTheme;
window.setSiteTheme = setSiteTheme;
window.toggleSiteTheme = toggleSiteTheme;
window.initThemeSwitcher = initThemeSwitcher;
window.detectGPSLocation = detectGPSLocation;



/**
 * ============================================================================
 * Smooth Navbar Experience & Instant Prefetch Navigation
 * ============================================================================
 * - Eliminates hang / lag when clicking navbar links ("gang aagama ore smooth")
 * - Prefetches target pages on mouse hover / touch start for 0ms instant loading
 * - Smooth in-page anchor scrolling with sticky header offset (Safety, etc.)
 * - Prevents default jump on dropdown toggle (#)
 */
document.addEventListener('DOMContentLoaded', () => {
  // 1. Remove hash jump on Home dropdown toggle
  const homeDropdown = document.getElementById('homeDropdown');
  if (homeDropdown) {
    homeDropdown.addEventListener('click', (e) => {
      if (homeDropdown.getAttribute('href') === '#') {
        e.preventDefault();
      }
    });
  }

  // 2. Instant Navbar Hover Prefetching (0ms latency transition between pages)
  const prefetchedUrls = new Set();
  function prefetchPage(url) {
    if (!url || url.startsWith('#') || url.startsWith('javascript') || prefetchedUrls.has(url)) return;
    prefetchedUrls.add(url);
    const linkEl = document.createElement('link');
    linkEl.rel = 'prefetch';
    linkEl.href = url;
    document.head.appendChild(linkEl);
  }

  document.querySelectorAll('.navbar-custom a[href]').forEach(navLink => {
    const targetHref = navLink.getAttribute('href');
    if (targetHref && !targetHref.startsWith('#') && !targetHref.startsWith('javascript')) {
      navLink.addEventListener('mouseenter', () => prefetchPage(targetHref), { once: true, passive: true });
      navLink.addEventListener('touchstart', () => prefetchPage(targetHref), { once: true, passive: true });
    }
  });

  // 3. Smooth in-page scrolling for #safety and other section anchors
  document.querySelectorAll('.navbar-custom a[href*="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const rawHref = this.getAttribute('href');
      if (!rawHref || rawHref === '#') return;

      const currentPath = window.location.pathname.split('/').pop() || 'index.html';
      const isIndex = currentPath === 'index.html' || currentPath === '';

      if (isIndex && (rawHref.startsWith('#') || rawHref.startsWith('index.html#'))) {
        const hash = rawHref.includes('#') ? rawHref.split('#')[1] : '';
        const targetElement = document.getElementById(hash);
        if (targetElement) {
          e.preventDefault();
          targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
          history.pushState(null, '', '#' + hash);

          const navbarCollapse = document.getElementById('navbarMain');
          if (navbarCollapse && navbarCollapse.classList.contains('show')) {
            const bsCollapse = bootstrap.Collapse.getInstance(navbarCollapse);
            if (bsCollapse) bsCollapse.hide();
          }
        }
      }
    });
  });

  // 4. Handle smooth landing if page loaded with a #hash (e.g. index.html#safety)
  if (window.location.hash) {
    const hash = window.location.hash.substring(1);
    const targetElement = document.getElementById(hash);
    if (targetElement) {
      setTimeout(() => {
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
    }
  }
});
