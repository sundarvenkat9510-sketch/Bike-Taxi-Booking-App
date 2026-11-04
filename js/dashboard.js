/**
 * VELOMOTO - Rider Dashboard Logic & Ride Simulation Engine
 * Handles Booking, Leaflet Live Map Simulation, Driver Matching,
 * Status Updates, LocalStorage Ride History, and Wallet Management.
 */

// Storage Keys
const DASHBOARD_STORAGE_KEYS = {
  RIDE_HISTORY: 'velomoto_ride_history',
  ACTIVE_RIDE: 'velomoto_active_ride'
};

// Available Captains Pool
const CAPTAINS_POOL = [
  {
    id: 'cap_01',
    name: 'Vikram Singh',
    phone: '+91 98112 34567',
    rating: 4.9,
    totalRides: 3840,
    vehicleModel: 'Yamaha FZ-S (Black/Yellow)',
    plateNumber: 'DL-04-AB-2983',
    avatar: 'assets/images/driver-avatar-1.svg',
    helmetSanitized: true
  },
  {
    id: 'cap_02',
    name: 'Arjun Sharma',
    phone: '+91 98765 88990',
    rating: 4.8,
    totalRides: 2190,
    vehicleModel: 'Honda Hornet 160R (Charcoal)',
    plateNumber: 'HR-26-CD-1190',
    avatar: 'assets/images/driver-avatar-2.svg',
    helmetSanitized: true
  },
  {
    id: 'cap_03',
    name: 'Sneha Patel',
    phone: '+91 97654 32198',
    rating: 4.95,
    totalRides: 1940,
    vehicleModel: 'Ather 450X (Eco Electric)',
    plateNumber: 'KA-01-EE-4412',
    avatar: 'assets/images/driver-avatar-1.svg',
    helmetSanitized: true
  },
  {
    id: 'cap_04',
    name: 'Rajesh Kumar',
    phone: '+91 98234 11223',
    rating: 4.9,
    totalRides: 4120,
    vehicleModel: 'Bajaj Pulsar 150 (Silver)',
    plateNumber: 'MH-02-XY-8834',
    avatar: 'assets/images/driver-avatar-2.svg',
    helmetSanitized: true
  }
];

// Default Sample Ride History
const DEFAULT_RIDE_HISTORY = [
  {
    id: 'VM-9842',
    date: 'Today, 10:15 AM',
    timestamp: Date.now() - 3600000 * 2,
    pickup: 'Central Metro Station',
    drop: 'Tech Park Cyber City',
    bikeType: 'Standard Moto',
    distanceKm: 6.2,
    fare: 74.00,
    status: 'Completed',
    driverName: 'Vikram Singh',
    driverPlate: 'DL-04-AB-2983',
    paymentMethod: 'VeloMoto Wallet',
    ratingGiven: 5
  },
  {
    id: 'VM-8731',
    date: 'Yesterday, 06:40 PM',
    timestamp: Date.now() - 3600000 * 26,
    pickup: 'Grand City Mall & Cineplex',
    drop: 'Old Town Heritage Square',
    bikeType: 'Eco Electric Scooter',
    distanceKm: 4.5,
    fare: 52.00,
    status: 'Completed',
    driverName: 'Sneha Patel',
    driverPlate: 'KA-01-EE-4412',
    paymentMethod: 'UPI / GPay',
    ratingGiven: 5
  },
  {
    id: 'VM-7619',
    date: '28 Oct 2026, 08:30 AM',
    timestamp: Date.now() - 3600000 * 120,
    pickup: 'North University Campus',
    drop: 'International Airport Terminal 1',
    bikeType: 'Express Moto Pro',
    distanceKm: 14.8,
    fare: 188.50,
    status: 'Completed',
    driverName: 'Rajesh Kumar',
    driverPlate: 'MH-02-XY-8834',
    paymentMethod: 'Card (•••• 4921)',
    ratingGiven: 4
  }
];

// Active Map and Booking State
let dashboardMap = null;
let pickupMarker = null;
let dropMarker = null;
let driverMarker = null;
let routeLine = null;
let activeRideSimulationTimer = null;

/**
 * Initialize / Get Ride History from LocalStorage
 */
function getRideHistory() {
  const data = localStorage.getItem(DASHBOARD_STORAGE_KEYS.RIDE_HISTORY);
  if (!data) {
    localStorage.setItem(DASHBOARD_STORAGE_KEYS.RIDE_HISTORY, JSON.stringify(DEFAULT_RIDE_HISTORY));
    return DEFAULT_RIDE_HISTORY;
  }
  try {
    return JSON.parse(data);
  } catch (e) {
    return DEFAULT_RIDE_HISTORY;
  }
}

/**
 * Save new ride to LocalStorage
 */
function saveRideToHistory(ride) {
  const history = getRideHistory();
  history.unshift(ride);
  localStorage.setItem(DASHBOARD_STORAGE_KEYS.RIDE_HISTORY, JSON.stringify(history));
  updateDashboardStats();
  renderRideHistoryTable();
  renderRecentRidesWidget();
}

/**
 * Get active ride state
 */
function getActiveRide() {
  const data = localStorage.getItem(DASHBOARD_STORAGE_KEYS.ACTIVE_RIDE);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch (e) {
    return null;
  }
}

function setActiveRide(ride) {
  if (ride) {
    localStorage.setItem(DASHBOARD_STORAGE_KEYS.ACTIVE_RIDE, JSON.stringify(ride));
  } else {
    localStorage.removeItem(DASHBOARD_STORAGE_KEYS.ACTIVE_RIDE);
  }
}

/**
 * Update Dashboard Statistics & Counters
 */
function updateDashboardStats() {
  const history = getRideHistory();
  const completedRides = history.filter(r => r.status === 'Completed');
  
  const totalRidesCount = completedRides.length;
  const totalSpent = completedRides.reduce((sum, r) => sum + parseFloat(r.fare || 0), 0);
  const rewardPoints = Math.floor(totalSpent * 0.1);
  const totalKm = completedRides.reduce((sum, r) => sum + parseFloat(r.distanceKm || 0), 0);
  const co2SavedKg = (totalKm * 0.12).toFixed(1);

  // Update DOM Elements
  const elemTotalRides = document.getElementById('statTotalRides');
  const elemTotalSpent = document.getElementById('statTotalSpent');
  const elemRewardPts = document.getElementById('statRewardPoints');
  const elemCo2 = document.getElementById('statCo2Saved');

  if (elemTotalRides) elemTotalRides.textContent = totalRidesCount;
  if (elemTotalSpent) elemTotalSpent.textContent = '₹' + totalSpent.toFixed(2);
  if (elemRewardPts) elemRewardPts.textContent = rewardPoints;
  if (elemCo2) elemCo2.textContent = co2SavedKg + ' kg';

  // Update User Wallet display
  const user = getCurrentUser();
  if (user) {
    const elemWallet = document.getElementById('dashWalletBalance');
    const elemProfileWallet = document.getElementById('profileWalletBalance');
    if (elemWallet) elemWallet.textContent = '₹' + (parseFloat(user.walletBalance) || 0).toFixed(2);
    if (elemProfileWallet) elemProfileWallet.textContent = '₹' + (parseFloat(user.walletBalance) || 0).toFixed(2);

    const elemUserName = document.getElementById('dashUserName');
    const elemSidebarName = document.getElementById('sidebarUserName');
    const elemUserEmail = document.getElementById('dashUserEmail');
    const elemUserPhone = document.getElementById('dashUserPhone');
    if (elemUserName) elemUserName.textContent = user.name;
    if (elemSidebarName) elemSidebarName.textContent = user.name;
    if (elemUserEmail) elemUserEmail.textContent = user.email;
    if (elemUserPhone) elemUserPhone.textContent = user.phone;
  }
}

/**
 * Initialize Leaflet Map
 */
function initDashboardMap() {
  const mapElement = document.getElementById('dashboardMap');
  if (!mapElement || typeof L === 'undefined') return;

  // Default coordinates: Downtown City Center
  const defaultCoords = [28.6139, 77.2090]; // Urban Center

  if (!dashboardMap) {
    dashboardMap = L.map('dashboardMap', {
      zoomControl: true,
      attributionControl: false
    }).setView(defaultCoords, 13);

    // Dark-themed tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19
    }).addTo(dashboardMap);
  }

  // Handle resize and draw initial route
  setTimeout(() => {
    if (dashboardMap) {
      dashboardMap.invalidateSize();
      updateMapRoute('Central Metro Station', 'Tech Park Cyber City');
    }
  }, 200);
}

/**
 * Draw Simulated Route on Map
 */
function updateMapRoute(pickupText, dropText) {
  if (!dashboardMap || typeof L === 'undefined') return;

  // Clear previous markers
  if (pickupMarker) dashboardMap.removeLayer(pickupMarker);
  if (dropMarker) dashboardMap.removeLayer(dropMarker);
  if (driverMarker) dashboardMap.removeLayer(driverMarker);
  if (routeLine) dashboardMap.removeLayer(routeLine);

  // Generate realistic coordinates around center
  const pLat = 28.6139 + (Math.random() * 0.02 - 0.01);
  const pLng = 77.2090 + (Math.random() * 0.02 - 0.01);
  const dLat = pLat + (Math.random() * 0.05 + 0.02);
  const dLng = pLng + (Math.random() * 0.05 + 0.02);

  // Custom Icon Helpers
  const pickupIcon = L.divIcon({
    className: 'custom-map-pin',
    html: `<div style="background:#10b981; color:#fff; width:32px; height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 0 10px rgba(16,185,129,0.7); border:2px solid #fff;"><i class="bi bi-geo-alt-fill"></i></div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32]
  });

  const dropIcon = L.divIcon({
    className: 'custom-map-pin',
    html: `<div style="background:#ef4444; color:#fff; width:32px; height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 0 10px rgba(239,68,68,0.7); border:2px solid #fff;"><i class="bi bi-flag-fill"></i></div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32]
  });

  pickupMarker = L.marker([pLat, pLng], { icon: pickupIcon }).addTo(dashboardMap)
    .bindPopup(`<b>Pickup:</b> ${pickupText}`).openPopup();

  dropMarker = L.marker([dLat, dLng], { icon: dropIcon }).addTo(dashboardMap)
    .bindPopup(`<b>Drop:</b> ${dropText}`);

  // Create curved waypoints
  const midLat = (pLat + dLat) / 2 + 0.005;
  const midLng = (pLng + dLng) / 2 - 0.005;

  const latlngs = [
    [pLat, pLng],
    [midLat, midLng],
    [dLat, dLng]
  ];

  routeLine = L.polyline(latlngs, {
    color: '#ffc107',
    weight: 5,
    opacity: 0.9,
    dashArray: '8, 8'
  }).addTo(dashboardMap);

  dashboardMap.fitBounds(routeLine.getBounds(), { padding: [50, 50] });
}

/**
 * Render Recent Rides on Dashboard Overview
 */
function renderRecentRidesWidget() {
  const container = document.getElementById('recentRidesList');
  if (!container) return;

  const history = getRideHistory().slice(0, 3);
  if (history.length === 0) {
    container.innerHTML = `
      <div class="empty-state-box text-center py-4">
        <i class="bi bi-clock-history empty-state-icon"></i>
        <h6>No rides yet</h6>
        <p class="small text-muted">Book your first bike taxi ride today to beat the city rush!</p>
      </div>
    `;
    return;
  }

  container.innerHTML = history.map(ride => `
    <div class="urban-card p-3 mb-3 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
      <div class="d-flex align-items-center gap-3">
        <div class="stat-icon yellow">
          <i class="bi bi-bicycle"></i>
        </div>
        <div>
          <div class="d-flex align-items-center gap-2 mb-1">
            <span class="fw-bold text-white">${ride.pickup}</span>
            <i class="bi bi-arrow-right text-warning small"></i>
            <span class="fw-bold text-white">${ride.drop}</span>
          </div>
          <div class="small text-muted">
            <span>${ride.date}</span> • <span>${ride.bikeType}</span> • <span>${ride.distanceKm} km</span>
          </div>
        </div>
      </div>
      <div class="d-flex align-items-center justify-content-between justify-content-md-end gap-3">
        <div class="text-md-end">
          <div class="fw-bold text-warning fs-5">₹${parseFloat(ride.fare).toFixed(2)}</div>
          <span class="badge-status ${ride.status.toLowerCase()}">${ride.status}</span>
        </div>
        <button class="btn btn-dark-outline btn-sm" onclick="viewRideReceipt('${ride.id}')">
          <i class="bi bi-receipt"></i> Receipt
        </button>
      </div>
    </div>
  `).join('');
}

/**
 * Render Full Ride History Table on History Tab / Page
 */
function renderRideHistoryTable(filterStatus = 'all') {
  const tbody = document.getElementById('rideHistoryTableBody');
  const emptyState = document.getElementById('historyEmptyState');
  if (!tbody) return;

  let history = getRideHistory();
  if (filterStatus !== 'all') {
    history = history.filter(r => r.status.toLowerCase() === filterStatus.toLowerCase());
  }

  if (history.length === 0) {
    tbody.innerHTML = '';
    if (emptyState) emptyState.classList.remove('d-none');
    return;
  }

  if (emptyState) emptyState.classList.add('d-none');

  tbody.innerHTML = history.map(ride => `
    <tr class="ride-row">
      <td>
        <span class="fw-bold text-warning">${ride.id}</span>
        <div class="small text-muted">${ride.date}</div>
      </td>
      <td>
        <div class="fw-semibold text-white"><i class="bi bi-geo-alt-fill text-success small me-1"></i>${ride.pickup}</div>
        <div class="fw-semibold text-muted small"><i class="bi bi-flag-fill text-danger small me-1"></i>${ride.drop}</div>
      </td>
      <td>
        <span class="badge badge-yellow">${ride.bikeType}</span>
        <div class="small text-muted">${ride.distanceKm} km</div>
      </td>
      <td>
        <div class="fw-semibold text-white">${ride.driverName}</div>
        <div class="small text-muted">${ride.driverPlate}</div>
      </td>
      <td>
        <div class="fw-bold text-warning">₹${parseFloat(ride.fare).toFixed(2)}</div>
        <div class="small text-muted">${ride.paymentMethod || 'Wallet'}</div>
      </td>
      <td>
        <span class="badge-status ${ride.status.toLowerCase()}">${ride.status}</span>
      </td>
      <td>
        <button class="btn btn-dark-outline btn-sm" onclick="viewRideReceipt('${ride.id}')" title="View Invoice">
          <i class="bi bi-receipt"></i>
        </button>
      </td>
    </tr>
  `).join('');
}

/**
 * View & Print Ride Invoice Receipt Modal
 */
function viewRideReceipt(rideId) {
  const history = getRideHistory();
  const ride = history.find(r => r.id === rideId);
  if (!ride) return;

  const modalEl = document.getElementById('receiptModal');
  const contentEl = document.getElementById('receiptModalContent');
  if (!modalEl || !contentEl) return;

  const baseCharge = (ride.fare * 0.75).toFixed(2);
  const platformFee = '3.50';
  const tax = (ride.fare * 0.05).toFixed(2);

  contentEl.innerHTML = `
    <div class="receipt-sheet shadow-sm">
      <div class="receipt-header text-center">
        <h4 class="fw-bold mb-1">VELOMOTO TAXI RECEIPT</h4>
        <div class="text-muted small">Ride ID: <strong>${ride.id}</strong> | ${ride.date}</div>
        <div class="badge bg-success mt-1">PAID VIA ${ride.paymentMethod ? ride.paymentMethod.toUpperCase() : 'WALLET'}</div>
      </div>

      <div class="my-3">
        <div class="row g-2 mb-2">
          <div class="col-6">
            <small class="text-muted d-block">Pickup Location</small>
            <strong class="text-dark small">${ride.pickup}</strong>
          </div>
          <div class="col-6">
            <small class="text-muted d-block">Drop Location</small>
            <strong class="text-dark small">${ride.drop}</strong>
          </div>
        </div>

        <div class="row g-2 pt-2 border-top">
          <div class="col-6">
            <small class="text-muted d-block">Assigned Captain</small>
            <strong class="text-dark small">${ride.driverName}</strong>
          </div>
          <div class="col-6">
            <small class="text-muted d-block">Vehicle / Reg. No.</small>
            <strong class="text-dark small">${ride.driverPlate}</strong>
          </div>
        </div>
      </div>

      <div class="pt-2 border-top">
        <div class="d-flex justify-content-between py-1 small">
          <span class="text-muted">Base & Distance Fare (${ride.distanceKm} km):</span>
          <strong class="text-dark">₹${baseCharge}</strong>
        </div>
        <div class="d-flex justify-content-between py-1 small">
          <span class="text-muted">Safety & Platform Charges:</span>
          <strong class="text-dark">₹${platformFee}</strong>
        </div>
        <div class="d-flex justify-content-between py-1 small">
          <span class="text-muted">Applicable Taxes (GST 5%):</span>
          <strong class="text-dark">₹${tax}</strong>
        </div>
        <div class="receipt-total d-flex justify-content-between fw-bold fs-5 text-dark">
          <span>Total Fare Paid:</span>
          <span class="text-success fw-bold">₹${parseFloat(ride.fare).toFixed(2)}</span>
        </div>
      </div>

      <div class="text-center mt-3 pt-2 text-muted small border-top">
        <em>Thank you for riding green and beating city traffic with VeloMoto!</em>
      </div>
    </div>
  `;

  const bsModal = new bootstrap.Modal(modalEl);
  bsModal.show();
}

// Make accessible
window.viewRideReceipt = viewRideReceipt;

/**
 * Live Ride Booking Flow & Simulation Engine
 */
function setupRideBookingEngine() {
  const bookForm = document.getElementById('dashBookingForm');
  if (!bookForm) return;

  const pickupInput = document.getElementById('dashPickupInput');
  const dropInput = document.getElementById('dashDropInput');
  const bikeCards = document.querySelectorAll('.bike-option-card');
  const distancePreview = document.getElementById('dashEstDistance');
  const etaPreview = document.getElementById('dashEstDuration');
  const farePreview = document.getElementById('dashEstFare');
  let selectedBikeType = 'standard';

  // Handle prefilled locations from SessionStorage (from homepage)
  const savedPickup = sessionStorage.getItem('velomoto_quick_pickup');
  const savedDrop = sessionStorage.getItem('velomoto_quick_drop');
  if (savedPickup && pickupInput) {
    pickupInput.value = savedPickup;
    sessionStorage.removeItem('velomoto_quick_pickup');
  }
  if (savedDrop && dropInput) {
    dropInput.value = savedDrop;
    sessionStorage.removeItem('velomoto_quick_drop');
  }

  // Bike Type card selection
  bikeCards.forEach(card => {
    card.addEventListener('click', () => {
      bikeCards.forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      selectedBikeType = card.getAttribute('data-type') || 'standard';
      updateBookingCalculations();
    });
  });

  // Location inputs change
  function updateBookingCalculations() {
    const pickupVal = pickupInput ? pickupInput.value.trim() : '';
    const dropVal = dropInput ? dropInput.value.trim() : '';

    if (!pickupVal || !dropVal) {
      if (distancePreview) distancePreview.textContent = '-- km';
      if (etaPreview) etaPreview.textContent = '-- mins';
      if (farePreview) farePreview.textContent = '₹--';
      return;
    }

    // Realistic calculated distance between 4.2 to 9.8 km
    const simDistance = 5.8;
    const est = calculateFareBreakdown(simDistance, selectedBikeType);

    if (distancePreview) distancePreview.textContent = est.distanceKm + ' km';
    if (etaPreview) etaPreview.textContent = est.etaMinutes + ' mins';
    if (farePreview) farePreview.textContent = '₹' + est.totalFare;

    // Update Map
    updateMapRoute(pickupVal, dropVal);
  }

  if (pickupInput && dropInput) {
    pickupInput.addEventListener('change', updateBookingCalculations);
    dropInput.addEventListener('change', updateBookingCalculations);
    pickupInput.addEventListener('input', updateBookingCalculations);
    dropInput.addEventListener('input', updateBookingCalculations);
    window.addEventListener('velomoto:locationChange', updateBookingCalculations);

    // Initial check if values are present
    if (pickupInput.value && dropInput.value) {
      updateBookingCalculations();
    }
  }

  // Booking Form Submission
  bookForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const pickup = pickupInput ? pickupInput.value.trim() : '';
    const drop = dropInput ? dropInput.value.trim() : '';

    if (!pickup || !drop) {
      showToast('Please select both pickup and drop destinations.', 'error');
      return;
    }

    // Check if ride already in progress
    const activeRide = getActiveRide();
    if (activeRide && activeRide.phase !== 'completed') {
      showToast('You already have an active ride! View it below.', 'warning');
      switchDashboardTab('nav-book');
      return;
    }

    // Pick a driver from pool
    const driver = CAPTAINS_POOL[Math.floor(Math.random() * CAPTAINS_POOL.length)];
    const simDistance = 5.8;
    const fareDetails = calculateFareBreakdown(simDistance, selectedBikeType);
    const otp = Math.floor(1000 + Math.random() * 9000); // 4 digit OTP

    const newRide = {
      id: 'VM-' + Math.floor(1000 + Math.random() * 9000),
      pickup,
      drop,
      bikeType: fareDetails.typeName,
      distanceKm: fareDetails.distanceKm,
      fare: fareDetails.totalFare,
      etaMinutes: fareDetails.etaMinutes,
      driver,
      otp,
      phase: 'searching', // searching -> assigned -> arrived -> started -> completed
      startTime: Date.now()
    };

    setActiveRide(newRide);
    startRideSimulation(newRide);
  });
}

/**
 * Start Live Simulation of Driver Assignment & Ride Stages
 */
function startRideSimulation(ride) {
  const bookingBox = document.getElementById('bookingFormContainer');
  const searchingBox = document.getElementById('searchingCaptainContainer');
  const activeRideBox = document.getElementById('activeRideStatusContainer');

  if (bookingBox) bookingBox.classList.add('d-none');
  if (searchingBox) searchingBox.classList.remove('d-none');
  if (activeRideBox) activeRideBox.classList.add('d-none');

  showToast('Connecting with nearby Captains...', 'info');

  // Step 1: Searching for captain (2.5 seconds)
  clearTimeout(activeRideSimulationTimer);
  activeRideSimulationTimer = setTimeout(() => {
    ride.phase = 'assigned';
    setActiveRide(ride);

    if (searchingBox) searchingBox.classList.add('d-none');
    if (activeRideBox) activeRideBox.classList.remove('d-none');

    renderActiveRideDetails(ride);
    showToast(`Captain ${ride.driver.name} is on the way!`, 'success');
  }, 2500);
}

/**
 * Render Active Ride UI Box
 */
function renderActiveRideDetails(ride) {
  const container = document.getElementById('activeRideStatusContainer');
  if (!container || !ride) return;

  container.innerHTML = `
    <div class="active-ride-card">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <div>
          <span class="badge badge-yellow mb-1"><i class="bi bi-broadcast"></i> LIVE RIDE</span>
          <h5 class="fw-bold text-white mb-0">Booking #${ride.id}</h5>
        </div>
        <div class="text-end">
          <span class="badge-status ongoing" id="activeRideBadgeStatus">Captain Arriving</span>
          <div class="text-warning fw-bold fs-5">₹${ride.fare}</div>
        </div>
      </div>

      <!-- Route overview -->
      <div class="p-3 rounded bg-dark border border-secondary mb-3">
        <div class="d-flex align-items-center gap-2 mb-2">
          <i class="bi bi-geo-alt-fill text-success fs-5"></i>
          <div>
            <div class="small text-muted">Pickup Location</div>
            <strong class="text-white">${ride.pickup}</strong>
          </div>
        </div>
        <div class="d-flex align-items-center gap-2">
          <i class="bi bi-flag-fill text-danger fs-5"></i>
          <div>
            <div class="small text-muted">Destination</div>
            <strong class="text-white">${ride.drop}</strong>
          </div>
        </div>
      </div>

      <!-- Driver Details Box -->
      <div class="driver-info-box">
        <div class="driver-profile">
          <img src="${ride.driver.avatar}" alt="Captain" class="driver-avatar-img">
          <div>
            <h6 class="fw-bold text-white mb-1">${ride.driver.name}</h6>
            <div class="small text-warning mb-1">
              <i class="bi bi-star-fill"></i> ${ride.driver.rating} ★ (${ride.driver.totalRides}+ rides)
            </div>
            <div class="small text-muted">${ride.driver.vehicleModel} • <strong class="text-white">${ride.driver.plateNumber}</strong></div>
          </div>
        </div>

        <div class="text-end">
          <div class="small text-muted mb-1">Start OTP</div>
          <div class="otp-box">
            <div class="otp-number">${ride.otp}</div>
          </div>
        </div>
      </div>

      <!-- Live Action & Progress Buttons -->
      <div class="d-flex flex-wrap align-items-center justify-content-between gap-2 pt-2">
        <div class="d-flex gap-2">
          <a href="tel:${ride.driver.phone}" class="btn btn-yellow btn-sm">
            <i class="bi bi-telephone-fill"></i> Call Captain
          </a>
          <button class="btn btn-dark-outline btn-sm" onclick="showToast('Safety Alert: GPS live-shared with trusted emergency contact!', 'success')">
            <i class="bi bi-shield-check text-success"></i> Share Trip
          </button>
        </div>

        <div class="d-flex gap-2">
          <button class="btn btn-outline-danger btn-sm" id="btnCancelActiveRide">
            <i class="bi bi-x-circle"></i> Cancel Ride
          </button>
          <button class="btn btn-success btn-sm" id="btnAdvanceRideStatus">
            <i class="bi bi-play-circle-fill"></i> Advance Ride Stage
          </button>
        </div>
      </div>
    </div>
  `;

  // Attach button events
  const cancelBtn = document.getElementById('btnCancelActiveRide');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to cancel this booking?')) {
        cancelActiveRide();
      }
    });
  }

  const advanceBtn = document.getElementById('btnAdvanceRideStatus');
  if (advanceBtn) {
    advanceBtn.addEventListener('click', advanceRideStage);
  }
}

/**
 * Step through simulation stages: Assigned -> Arrived -> Started -> Completed
 */
function advanceRideStage() {
  const ride = getActiveRide();
  if (!ride) return;

  const badge = document.getElementById('activeRideBadgeStatus');
  const advanceBtn = document.getElementById('btnAdvanceRideStatus');

  if (ride.phase === 'assigned') {
    ride.phase = 'arrived';
    setActiveRide(ride);
    if (badge) {
      badge.textContent = 'Captain Arrived at Pickup';
      badge.className = 'badge-status ongoing';
    }
    if (advanceBtn) advanceBtn.innerHTML = '<i class="bi bi-bicycle"></i> Start Trip';
    showToast('Your captain has arrived at the pickup location! Share OTP: ' + ride.otp, 'success');
  } 
  else if (ride.phase === 'arrived') {
    ride.phase = 'started';
    setActiveRide(ride);
    if (badge) {
      badge.textContent = 'Trip in Progress';
      badge.className = 'badge-status ongoing';
    }
    if (advanceBtn) advanceBtn.innerHTML = '<i class="bi bi-check2-circle"></i> Complete Trip';
    showToast('Trip started! Have a smooth and safe ride.', 'info');
  } 
  else if (ride.phase === 'started') {
    completeActiveRide();
  }
}

/**
 * Complete Active Ride & Show Rating Modal
 */
function completeActiveRide() {
  const ride = getActiveRide();
  if (!ride) return;

  const completedEntry = {
    id: ride.id,
    date: 'Just now',
    timestamp: Date.now(),
    pickup: ride.pickup,
    drop: ride.drop,
    bikeType: ride.bikeType,
    distanceKm: ride.distanceKm,
    fare: ride.fare,
    status: 'Completed',
    driverName: ride.driver.name,
    driverPlate: ride.driver.plateNumber,
    paymentMethod: 'VeloMoto Wallet',
    ratingGiven: 5
  };

  // Deduct from wallet if possible
  const user = getCurrentUser();
  if (user) {
    const currentBal = parseFloat(user.walletBalance) || 0;
    const fareCost = parseFloat(ride.fare);
    if (currentBal >= fareCost) {
      user.walletBalance = (currentBal - fareCost).toFixed(2);
    }
    setCurrentUser(user);
  }

  saveRideToHistory(completedEntry);
  setActiveRide(null);

  // Reset UI
  const bookingBox = document.getElementById('bookingFormContainer');
  const searchingBox = document.getElementById('searchingCaptainContainer');
  const activeRideBox = document.getElementById('activeRideStatusContainer');

  if (bookingBox) bookingBox.classList.remove('d-none');
  if (searchingBox) searchingBox.classList.add('d-none');
  if (activeRideBox) activeRideBox.classList.add('d-none');

  showToast('You have arrived at your destination! Ride Completed.', 'success');

  // Trigger Rating Modal
  openRatingModal(completedEntry);
}

/**
 * Cancel Active Ride
 */
function cancelActiveRide() {
  const ride = getActiveRide();
  if (ride) {
    const cancelledEntry = {
      id: ride.id,
      date: 'Just now',
      timestamp: Date.now(),
      pickup: ride.pickup,
      drop: ride.drop,
      bikeType: ride.bikeType,
      distanceKm: ride.distanceKm,
      fare: '0.00',
      status: 'Cancelled',
      driverName: ride.driver ? ride.driver.name : 'Unassigned',
      driverPlate: ride.driver ? ride.driver.plateNumber : '--',
      paymentMethod: '--',
      ratingGiven: 0
    };
    saveRideToHistory(cancelledEntry);
  }

  clearTimeout(activeRideSimulationTimer);
  setActiveRide(null);

  const bookingBox = document.getElementById('bookingFormContainer');
  const searchingBox = document.getElementById('searchingCaptainContainer');
  const activeRideBox = document.getElementById('activeRideStatusContainer');

  if (bookingBox) bookingBox.classList.remove('d-none');
  if (searchingBox) searchingBox.classList.add('d-none');
  if (activeRideBox) activeRideBox.classList.add('d-none');

  showToast('Ride has been cancelled.', 'info');
}

/**
 * Open Star Rating Modal
 */
function openRatingModal(ride) {
  const modalEl = document.getElementById('ratingModal');
  if (!modalEl) return;

  const captainNameEl = document.getElementById('ratingCaptainName');
  if (captainNameEl) captainNameEl.textContent = ride.driverName;

  const bsModal = new bootstrap.Modal(modalEl);
  bsModal.show();
}

/**
 * Switch Dashboard Tabs & Ensure Content Visibility
 */
function switchDashboardTab(tabId) {
  let targetTab = tabId;
  let shouldScrollToBooking = false;

  // If user clicks Book Ride, switch to overview where the booking form & map live
  if (tabId === 'nav-book') {
    targetTab = 'nav-overview';
    shouldScrollToBooking = true;
  }

  const navLinks = document.querySelectorAll('.sidebar-nav-link');
  const tabPanes = document.querySelectorAll('.dashboard-tab-pane');

  navLinks.forEach(link => {
    const lTab = link.getAttribute('data-tab');
    if (lTab === tabId) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  tabPanes.forEach(pane => {
    if (pane.id === targetTab) {
      pane.classList.remove('d-none');
    } else {
      pane.classList.add('d-none');
    }
  });

  // Re-invalidate map so Leaflet tiles calculate full dimensions
  if (dashboardMap) {
    setTimeout(() => {
      dashboardMap.invalidateSize();
    }, 150);
  }

  if (shouldScrollToBooking) {
    setTimeout(() => {
      const bookingSec = document.getElementById('dashboardBookingSection');
      if (bookingSec) {
        bookingSec.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      const pInp = document.getElementById('dashPickupInput');
      if (pInp) pInp.focus();
    }, 100);
  }
}

// Make accessible
window.switchDashboardTab = switchDashboardTab;

/**
 * Setup Star Rating Interactive Visualizer
 */
function setupStarRating() {
  const stars = document.querySelectorAll('.star-rate');
  stars.forEach(star => {
    star.addEventListener('click', () => {
      const selected = parseInt(star.getAttribute('data-star') || '5', 10);
      stars.forEach(s => {
        const val = parseInt(s.getAttribute('data-star') || '5', 10);
        if (val <= selected) {
          s.className = 'bi bi-star-fill mx-1 star-rate text-warning';
        } else {
          s.className = 'bi bi-star mx-1 star-rate text-muted';
        }
      });
    });
  });
}

/**
 * Setup Wallet Top-up and Transactions
 */
function setupWalletOperations() {
  const addMoneyForm = document.getElementById('addMoneyForm');
  if (addMoneyForm) {
    addMoneyForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const amountInput = document.getElementById('addMoneyAmount');
      const amount = parseFloat(amountInput.value);

      if (isNaN(amount) || amount <= 0) {
        showToast('Please enter a valid amount.', 'error');
        return;
      }

      const user = getCurrentUser();
      if (user) {
        user.walletBalance = ((parseFloat(user.walletBalance) || 0) + amount).toFixed(2);
        setCurrentUser(user);
        updateDashboardStats();
        showToast(`₹${amount.toFixed(2)} added to your VeloMoto Wallet!`, 'success');
        
        // Hide modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('addMoneyModal'));
        if (modal) modal.hide();
        addMoneyForm.reset();
      }
    });
  }

  // Quick amount preset buttons
  document.querySelectorAll('.btn-preset-amount').forEach(btn => {
    btn.addEventListener('click', () => {
      const amt = btn.getAttribute('data-amt');
      const input = document.getElementById('addMoneyAmount');
      if (input) input.value = amt;
    });
  });
}

/**
 * Setup Profile Edit Form
 */
function setupProfileForm() {
  const profileForm = document.getElementById('profileEditForm');
  if (!profileForm) return;

  const user = getCurrentUser();
  if (user) {
    const nameInp = document.getElementById('profileName');
    const emailInp = document.getElementById('profileEmail');
    const phoneInp = document.getElementById('profilePhone');
    const emgInp = document.getElementById('profileEmergency');
    const homeInp = document.getElementById('profileHome');
    const workInp = document.getElementById('profileWork');

    if (nameInp) nameInp.value = user.name || '';
    if (emailInp) emailInp.value = user.email || '';
    if (phoneInp) phoneInp.value = user.phone || '';
    if (emgInp) emgInp.value = user.emergencyContact || '';
    if (homeInp) homeInp.value = user.homeAddress || '';
    if (workInp) workInp.value = user.workAddress || '';
  }

  profileForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const user = getCurrentUser();
    if (!user) return;

    user.name = document.getElementById('profileName').value.trim();
    user.phone = document.getElementById('profilePhone').value.trim();
    user.emergencyContact = document.getElementById('profileEmergency').value.trim();
    user.homeAddress = document.getElementById('profileHome').value.trim();
    user.workAddress = document.getElementById('profileWork').value.trim();

    setCurrentUser(user);
    updateDashboardStats();
    showToast('Profile updated successfully!', 'success');
  });
}

// DOM Initialization
document.addEventListener('DOMContentLoaded', () => {
  protectRoute();
  initDashboardMap();
  updateDashboardStats();
  renderRecentRidesWidget();
  renderRideHistoryTable();
  setupRideBookingEngine();
  setupWalletOperations();
  setupProfileForm();
  setupStarRating();

  // Setup Autocomplete for Dashboard Booking
  setupLocationAutocomplete('dashPickupInput', 'dashPickupList');
  setupLocationAutocomplete('dashDropInput', 'dashDropList');

  // Sidebar Tab click handlers
  document.querySelectorAll('.sidebar-nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      const tabId = link.getAttribute('data-tab');
      if (tabId) {
        e.preventDefault();
        switchDashboardTab(tabId);
      }
    });
  });

  // History Filter Buttons
  document.querySelectorAll('.btn-history-filter').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.btn-history-filter').forEach(b => b.classList.remove('active', 'btn-yellow'));
      document.querySelectorAll('.btn-history-filter').forEach(b => b.classList.add('btn-dark-outline'));
      btn.classList.remove('btn-dark-outline');
      btn.classList.add('btn-yellow', 'active');
      const filter = btn.getAttribute('data-filter') || 'all';
      renderRideHistoryTable(filter);
    });
  });

  // Check URL params for direct action
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('action') === 'book') {
    switchDashboardTab('nav-book');
  } else if (urlParams.get('tab')) {
    switchDashboardTab('nav-' + urlParams.get('tab'));
  }

  // Check if there was an active ride stored
  const activeRide = getActiveRide();
  if (activeRide && activeRide.phase !== 'completed') {
    const bookingBox = document.getElementById('bookingFormContainer');
    const activeRideBox = document.getElementById('activeRideStatusContainer');
    if (bookingBox) bookingBox.classList.add('d-none');
    if (activeRideBox) activeRideBox.classList.remove('d-none');
    renderActiveRideDetails(activeRide);
  }
});
