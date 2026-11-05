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
          <div class="d-flex align-items-center justify-content-between p-2 rounded bg-dark border border-secondary mb-3">
            <div class="d-flex align-items-center gap-2">
              <span class="badge badge-yellow"><i class="bi bi-clock"></i> ~${est.etaMinutes} mins</span>
              <span class="small text-muted">• ~${sampleDist} km</span>
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
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      showToast('Thank you! Your message has been sent to VeloMoto Support.', 'success');
      contactForm.reset();
    });
  }

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
});
