const config = window.APP_CONFIG || {};
const supabaseUrl = config.supabaseUrl;
const supabaseKey = config.supabaseKey;

// Clear any stale Supabase auth tokens (avoids invalid/session-expired from old projects)
Object.keys(localStorage)
  .filter((k) => k.startsWith('sb-') && k.includes('auth-token'))
  .forEach((k) => localStorage.removeItem(k));

// Unregister any old service workers that might cache the previous domain
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((regs) => regs.forEach((r) => r.unregister()));
}

const ui = {
  loginView: document.getElementById('login-view'),
  appView: document.getElementById('app-view'),
  loginForm: document.getElementById('login-form'),
  loginEmail: document.getElementById('login-email'),
  loginPassword: document.getElementById('login-password'),
  loginError: document.getElementById('login-error'),
  logoutBtn: document.getElementById('logout-btn'),
  userName: document.getElementById('user-name'),
  brandWelcome: document.getElementById('brand-welcome'),
  viewTitle: document.getElementById('view-title'),
  contentHeader: document.getElementById('content-header'),
  salesQuickActions: document.getElementById('sales-quick-actions'),
  quickActionButtons: Array.from(document.querySelectorAll('.quick-action')),
  realtimeStatus: document.getElementById('realtime-status'),
  todayLabel: document.getElementById('today-label'),
  navLinks: Array.from(document.querySelectorAll('.nav-link')),
  salesDashboard: document.getElementById('sales-dashboard'),
  salesNew: document.getElementById('sales-new'),
  salesRouteSection: document.getElementById('sales-route'),
  salesRouteBtn: document.getElementById('sales-route-btn'),
  salesVisits: document.getElementById('sales-visits'),
  adminDashboard: document.getElementById('admin-dashboard'),
  adminUsers: document.getElementById('admin-users'),
  adminCreateForm: document.getElementById('admin-create-form'),
  adminCreateName: document.getElementById('admin-create-name'),
  adminCreateEmail: document.getElementById('admin-create-email'),
  adminCreatePassword: document.getElementById('admin-create-password'),
  adminCreateRole: document.getElementById('admin-create-role'),
  adminCreateError: document.getElementById('admin-create-error'),
  adminCreateSubmit: document.getElementById('admin-create-submit'),
  visitForm: document.getElementById('visit-form'),
  visitError: document.getElementById('visit-error'),
  gpsStatus: document.getElementById('gps-status'),
  gpsCoords: document.getElementById('gps-coords'),
  gpsAccuracy: document.getElementById('gps-accuracy'),
  gpsRefresh: document.getElementById('gps-refresh'),
  salesFilterForm: document.getElementById('sales-filter-form'),
  adminFilterForm: document.getElementById('admin-filter-form'),
  salesVisitsBody: document.getElementById('sales-visits-body'),
  adminVisitsBody: document.getElementById('admin-visits-body'),
  adminUsersBody: document.getElementById('admin-users-body'),
  adminSalespersonFilter: document.getElementById('admin-salesperson-filter'),
  adminStatusFilter: document.getElementById('admin-status-filter'),
  adminSelectAll: document.getElementById('admin-select-all'),
  adminBulkCount: document.getElementById('admin-bulk-count'),
  bulkVisitDate: document.getElementById('bulk-visit-date'),
  bulkNextVisitDate: document.getElementById('bulk-next-visit-date'),
  bulkUpdateDates: document.getElementById('bulk-update-dates'),
  bulkClearRoute: document.getElementById('bulk-clear-route'),
  bulkClearSelection: document.getElementById('bulk-clear-selection'),
  salesExport: document.getElementById('sales-export'),
  salesExportPdf: document.getElementById('sales-export-pdf'),
  adminExport: document.getElementById('admin-export'),
  adminExportPdf: document.getElementById('admin-export-pdf'),
  adminLeaderboardBody: document.getElementById('admin-leaderboard-body'),
  routeStartCoords: document.getElementById('route-start-coords'),
  routeAccuracy: document.getElementById('route-accuracy'),
  routeLocationStatus: document.getElementById('route-location-status'),
  routeVisitsBody: document.getElementById('route-visits-body'),
  routeVisitsCount: document.getElementById('route-visits-count'),
  routeRecapture: document.getElementById('route-recapture'),
  salesTomorrowList: document.getElementById('sales-tomorrow-list'),
  salesTomorrowCount: document.getElementById('sales-tomorrow-count'),
  zamzamPhotoField: document.getElementById('zamzam-photo-field'),
  zamzamPhoto: document.getElementById('zamzam-photo'),
  toast: document.getElementById('toast'),
  modal: document.getElementById('visit-modal'),
  modalTitle: document.getElementById('modal-title'),
  modalActions: document.getElementById('modal-actions'),
  modalClose: document.getElementById('modal-close'),
  saveVisit: document.getElementById('save-visit'),
  editVisitForm: document.getElementById('edit-visit-form'),
  editVisitError: document.getElementById('edit-visit-error'),
  deleteVisit: document.getElementById('delete-visit'),
  editLocation: document.getElementById('edit-location'),
  locationMap: document.getElementById('location-map'),
  callPhone: document.getElementById('call-phone'),
  whatsappLink: document.getElementById('whatsapp-link'),
  visitTimeline: document.getElementById('visit-timeline'),
  visitPhotoWrap: document.getElementById('visit-photo-wrap'),
  visitPhoto: document.getElementById('visit-photo')
};

const state = {
  user: null,
  profile: null,
  role: null,
  visits: [],
  users: [],
  channel: null,
  activeVisitId: null,
  activeSection: null,
  routeVisits: [],
  selectedVisitIds: new Set()
};

const loadingState = {
  visits: false,
  users: false,
  route: false,
  routeGenerate: false
};

  const sectionTitles = {
  'sales-dashboard': 'Sales Dashboard',
  'sales-new': 'New',
  'sales-route': 'Route Tomorrow',
  'sales-visits': 'My Visits',
  'admin-dashboard': 'Admin Dashboard',
  'admin-users': 'User Management'
  };

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    });
  }

  if (!supabaseUrl || !supabaseKey || !window.supabase) {
  ui.loginError.textContent = 'Supabase configuration is missing. Please update config.js.';
  ui.loginError.classList.remove('hidden');
  if (ui.loginForm) {
    ui.loginForm.querySelector('button').disabled = true;
  }
} else {
  const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);
  const debugChannel = supabaseClient.channel('test');
  debugChannel.subscribe((status) => console.log('realtime:', status));

  const showToast = (message, type = 'success') => {
    ui.toast.textContent = message;
    ui.toast.className = `toast ${type}`;
    ui.toast.classList.remove('hidden');
    setTimeout(() => ui.toast.classList.add('hidden'), 2800);
  };

  const installPromptCards = Array.from(document.querySelectorAll('[data-install-prompt]'));
  const installButtons = Array.from(document.querySelectorAll('.install-btn'));
  let deferredInstallPrompt = null;
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;

  const toggleInstallPrompt = (show) => {
    installPromptCards.forEach((card) => {
      card.classList.toggle('hidden', !show);
    });
  };

  if (!isStandalone) {
    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      deferredInstallPrompt = event;
      toggleInstallPrompt(true);
    });

    window.addEventListener('appinstalled', () => {
      deferredInstallPrompt = null;
      toggleInstallPrompt(false);
      showToast('App installed successfully.');
    });
  }

  installButtons.forEach((button) => {
    button.addEventListener('click', async () => {
      if (!deferredInstallPrompt) return;
      deferredInstallPrompt.prompt();
      await deferredInstallPrompt.userChoice;
      deferredInstallPrompt = null;
      toggleInstallPrompt(false);
    });
  });

  const lastLocationKey = 'zamzam_last_location';

  const saveLastKnownLocation = (location) => {
    try {
      if (!location) return;
      const payload = {
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy ?? null,
        captured_at: new Date().toISOString()
      };
      window.localStorage.setItem(lastLocationKey, JSON.stringify(payload));
    } catch (error) {
      // Ignore storage errors.
    }
  };

  const createRipple = (event) => {
    const target = event.target.closest('.icon-btn');
    if (!target || target.disabled) return;

    const rect = target.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const ripple = document.createElement('span');
    ripple.className = 'click-ripple';
    ripple.style.width = `${size}px`;
    ripple.style.height = `${size}px`;
    const x = (event.clientX || rect.left + rect.width / 2) - rect.left - size / 2;
    const y = (event.clientY || rect.top + rect.height / 2) - rect.top - size / 2;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    target.appendChild(ripple);
    setTimeout(() => ripple.remove(), 650);
  };

  const pressHighlight = (event) => {
    const target = event.target.closest('.btn, .nav-link');
    if (!target || target.disabled) return;
    document.querySelectorAll('.btn.is-pressed, .nav-link.is-pressed').forEach((el) => {
      el.classList.remove('is-pressed');
    });
    target.classList.add('is-pressed');
  };

  const updateTodayLabel = () => {
    if (!ui.todayLabel) return;
    const now = new Date();
    const formatted = now.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
    ui.todayLabel.textContent = formatted;
  };

  const setView = (view) => {
    if (view === 'login') {
      ui.loginView.classList.remove('hidden');
      ui.appView.classList.add('hidden');
    } else {
      ui.loginView.classList.add('hidden');
      ui.appView.classList.remove('hidden');
    }
  };

  const setSection = (sectionId) => {
    state.activeSection = sectionId;
    [
      ui.salesDashboard,
      ui.salesNew,
      ui.salesRouteSection,
      ui.salesVisits,
      ui.adminDashboard,
      ui.adminUsers
    ].forEach((section) => {
      if (!section) return;
      section.classList.toggle('hidden', section.id !== sectionId);
    });
    ui.navLinks.forEach((link) => {
      link.classList.toggle('active', link.dataset.section === sectionId);
    });
    if (ui.viewTitle) {
      ui.viewTitle.textContent = sectionTitles[sectionId] || 'Dashboard';
    }
    if (ui.contentHeader) {
      const showHeader =
        state.role === 'salesperson' && sectionId === 'sales-dashboard';
      ui.contentHeader.classList.toggle('hidden', !showHeader);
    }
    if (ui.salesQuickActions) {
      const showQuickActions =
        state.role === 'salesperson' && sectionId === 'sales-dashboard';
      ui.salesQuickActions.classList.toggle('hidden', !showQuickActions);
    }
    if (sectionId === 'sales-route') {
      routeStart.latitude = null;
      routeStart.longitude = null;
      routeStart.accuracy = null;
      routeStart.capturedAt = null;
      updateRouteStartDisplay();
      loadRouteVisits();
    }
    if (sectionId === 'sales-new') {
      setDefaultVisitDates();
      updatePhotoField();
    }
    if (sectionId === 'sales-visits' && state.role === 'salesperson') {
      renderSalesVisits();
    }
  };

  const setRealtimeStatus = (status) => {
    if (!ui.realtimeStatus) return;
    const normalized =
      status === true ? 'on' : status === false ? 'off' : status || 'checking';
    ui.realtimeStatus.classList.remove('on', 'off', 'checking');
    if (normalized === 'on') {
      ui.realtimeStatus.textContent = 'Realtime: On';
      ui.realtimeStatus.classList.add('on');
      return;
    }
    if (normalized === 'off') {
      ui.realtimeStatus.textContent = 'Realtime: Off';
      ui.realtimeStatus.classList.add('off');
      return;
    }
    ui.realtimeStatus.textContent = 'Realtime: Checking...';
    ui.realtimeStatus.classList.add('checking');
  };

  const normalizePhone = (value) => {
    const trimmed = `${value || ''}`.trim();
    const digits = trimmed.replace(/[^0-9]/g, '');
    let localDigits = digits;
    if (digits.startsWith('968') && digits.length === 11) {
      localDigits = digits.slice(3);
    }
    if (localDigits.length !== 8) return null;
    return `+968${localDigits}`;
  };

  const formatDate = (value) => value || '-';
  const formatDateTime = (value) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString();
  };

  const formatLocalDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatRouteSchedule = (visit, targetDate) => {
    if (visit.visit_date === targetDate) return `Visit • ${formatDate(visit.visit_date)}`;
    if (visit.next_visit_date === targetDate) return `Next • ${formatDate(visit.next_visit_date)}`;
    return formatDate(visit.visit_date || visit.next_visit_date);
  };

  const sortByArea = (a, b) => {
    const areaA = (a.area || '').toLowerCase();
    const areaB = (b.area || '').toLowerCase();
    if (areaA === areaB) {
      return (a.customer_name || '').localeCompare(b.customer_name || '');
    }
    return areaA.localeCompare(areaB);
  };

  const haversineDistance = (lat1, lon1, lat2, lon2) => {
    const toRad = (value) => (value * Math.PI) / 180;
    const r = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    return 2 * r * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const orderByDistance = (start, visits) => {
    if (!start || !Number.isFinite(start.latitude) || !Number.isFinite(start.longitude)) {
      return [...visits].sort(sortByArea);
    }
    const remaining = [...visits];
    const ordered = [];
    let current = { latitude: start.latitude, longitude: start.longitude };
    while (remaining.length) {
      let nearestIndex = 0;
      let nearestDistance = Number.POSITIVE_INFINITY;
      remaining.forEach((visit, index) => {
        const distance = haversineDistance(
          current.latitude,
          current.longitude,
          visit.latitude,
          visit.longitude
        );
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = index;
        }
      });
      const [next] = remaining.splice(nearestIndex, 1);
      ordered.push(next);
      current = { latitude: next.latitude, longitude: next.longitude };
    }
    return ordered;
  };

  const addDaysToDate = (dateStr, days) => {
    if (!dateStr) return dateStr;
    const [year, month, day] = dateStr.split('-').map(Number);
    if (!year || !month || !day) return dateStr;
    const date = new Date(Date.UTC(year, month - 1, day));
    date.setUTCDate(date.getUTCDate() + days);
    return date.toISOString().split('T')[0];
  };

  const buildMapUrl = (lat, lng) =>
    `https://www.google.com/maps?q=${encodeURIComponent(`${lat},${lng}`)}`;

  const updateLocationMap = () => {
    if (!ui.locationMap || !ui.editLocation) return;
    const value = ui.editLocation.value.trim();
    const parts = value.split(/[,\s]+/).filter(Boolean);
    const lat = parts.length > 0 ? parseFloat(parts[0]) : NaN;
    const lng = parts.length > 1 ? parseFloat(parts[1]) : NaN;
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      ui.locationMap.href = buildMapUrl(lat, lng);
      ui.locationMap.setAttribute('aria-disabled', 'false');
      ui.locationMap.classList.remove('disabled');
    } else {
      ui.locationMap.href = '#';
      ui.locationMap.setAttribute('aria-disabled', 'true');
      ui.locationMap.classList.add('disabled');
    }
  };

  const areaCache = new Map();
  let lastAreaLookup = 0;

  const pickAreaFromAddress = (address) => {
    if (!address) return null;
    const candidates = [
      address.suburb,
      address.neighbourhood,
      address.city_district,
      address.town,
      address.village,
      address.city,
      address.county,
      address.state
    ].filter(Boolean);
    return candidates.length ? candidates[0] : null;
  };

  const resolveAreaFromCoords = async (location) => {
    const areaInput = document.getElementById('area');
    if (!areaInput || areaInput.value.trim()) return;
    if (!location || !Number.isFinite(location.latitude) || !Number.isFinite(location.longitude)) {
      return;
    }

    const key = `${location.latitude.toFixed(4)},${location.longitude.toFixed(4)}`;
    if (areaCache.has(key)) {
      areaInput.value = areaCache.get(key);
      return;
    }

    const now = Date.now();
    if (now - lastAreaLookup < 1200) return;
    lastAreaLookup = now;

    const { data: sessionData } = await supabaseClient.auth.getSession();
    const token = sessionData?.session?.access_token;
    if (!token) return;

    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/reverse-geocode`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          apikey: supabaseKey
        },
        body: JSON.stringify({
          lat: location.latitude,
          lon: location.longitude
        })
      });
      if (!response.ok) return;
      const result = await response.json();
      const match = pickAreaFromAddress(result.address || {});
      if (match) {
        areaCache.set(key, match);
        areaInput.value = match;
      }
    } catch (error) {
      // Ignore lookup failures.
    }
  };

  const updateContactLinks = () => {
    const raw = document.getElementById('edit-phone-number')?.value.trim() || '';
    const normalized = normalizePhone(raw);
    if (ui.callPhone) {
      if (normalized) {
        ui.callPhone.href = `tel:${normalized}`;
        ui.callPhone.setAttribute('aria-disabled', 'false');
        ui.callPhone.classList.remove('disabled');
      } else {
        ui.callPhone.href = '#';
        ui.callPhone.setAttribute('aria-disabled', 'true');
        ui.callPhone.classList.add('disabled');
      }
    }
    if (ui.whatsappLink) {
      if (normalized) {
        const digits = normalized.replace('+', '');
        ui.whatsappLink.href = `https://wa.me/${digits}`;
        ui.whatsappLink.setAttribute('aria-disabled', 'false');
        ui.whatsappLink.classList.remove('disabled');
      } else {
        ui.whatsappLink.href = '#';
        ui.whatsappLink.setAttribute('aria-disabled', 'true');
        ui.whatsappLink.classList.add('disabled');
      }
    }
  };

  const gpsState = {
    latitude: null,
    longitude: null,
    accuracy: null
  };

  const routeStart = {
    latitude: null,
    longitude: null,
    accuracy: null,
    capturedAt: null
  };

  const routePermission = {
    state: 'unknown'
  };

  const updateRouteGenerateState = () => {
    if (!ui.salesRouteBtn) return;
    const hasCoords =
      Number.isFinite(routeStart.latitude) && Number.isFinite(routeStart.longitude);
    ui.salesRouteBtn.disabled = !hasCoords || loadingState.routeGenerate;
    ui.salesRouteBtn.classList.toggle('disabled', !hasCoords);
    ui.salesRouteBtn.title = hasCoords ? '' : 'Capture your start location first.';
  };

  const updateGpsDisplay = () => {
    if (!ui.gpsCoords || !ui.gpsAccuracy) return;
    if (Number.isFinite(gpsState.latitude) && Number.isFinite(gpsState.longitude)) {
      ui.gpsCoords.textContent = `${gpsState.latitude.toFixed(6)}, ${gpsState.longitude.toFixed(
        6
      )}`;
      ui.gpsAccuracy.textContent = `Accuracy: ${Math.round(gpsState.accuracy || 0)}m`;
    } else {
      ui.gpsCoords.textContent = 'Not captured yet.';
      ui.gpsAccuracy.textContent = 'Accuracy: -';
    }
  };

  const updateRouteStartDisplay = () => {
    if (!ui.routeStartCoords || !ui.routeAccuracy) return;
    const hasCoords =
      Number.isFinite(routeStart.latitude) && Number.isFinite(routeStart.longitude);
    if (hasCoords) {
      ui.routeStartCoords.textContent = `${routeStart.latitude.toFixed(
        6
      )}, ${routeStart.longitude.toFixed(6)}`;
      ui.routeAccuracy.textContent = `Accuracy: ${Math.round(routeStart.accuracy || 0)}m`;
    } else {
      ui.routeStartCoords.textContent = 'Not captured yet.';
      ui.routeAccuracy.textContent = 'Accuracy: -';
    }

    if (ui.routeLocationStatus) {
      const isOn = hasCoords;
      ui.routeLocationStatus.textContent = isOn ? 'Location: On' : 'Location: Off';
      ui.routeLocationStatus.classList.toggle('status-on', isOn);
      ui.routeLocationStatus.classList.toggle('status-off', !isOn);
    }
    updateRouteGenerateState();
  };

  const checkRoutePermission = async () => {
    if (!navigator.permissions?.query) {
      updateRouteStartDisplay();
      return;
    }
    try {
      const status = await navigator.permissions.query({ name: 'geolocation' });
      routePermission.state = status.state;
      status.onchange = () => {
        routePermission.state = status.state;
        updateRouteStartDisplay();
      };
    } catch (error) {
      routePermission.state = 'unknown';
    }
    updateRouteStartDisplay();
  };

  const captureGps = async (silent = false) => {
    if (!silent) {
      ui.gpsStatus.textContent = 'Capturing GPS location...';
    }
    try {
      const location = await getLocation();
      gpsState.latitude = location.latitude;
      gpsState.longitude = location.longitude;
      gpsState.accuracy = location.accuracy;
      saveLastKnownLocation(location);
      updateGpsDisplay();
      ui.gpsStatus.textContent = `GPS captured (accuracy ~${Math.round(location.accuracy)}m).`;
      resolveAreaFromCoords(location);
      return location;
    } catch (error) {
      updateGpsDisplay();
      if (!silent) {
        ui.gpsStatus.textContent = 'GPS capture failed. Please try again.';
      }
      throw error;
    }
  };

  const captureRouteStart = async () => {
    const location = await getLocation();
    routeStart.latitude = location.latitude;
    routeStart.longitude = location.longitude;
    routeStart.accuracy = location.accuracy;
    routeStart.capturedAt = Date.now();
    routePermission.state = 'granted';
    updateRouteStartDisplay();
    return location;
  };

  const getOmanDate = (offsetDays = 0) => {
    try {
      const now = new Date();
      const omanNow = new Date(
        now.toLocaleString('en-US', { timeZone: 'Asia/Muscat' })
      );
      omanNow.setDate(omanNow.getDate() + offsetDays);
      return formatLocalDate(omanNow);
    } catch (error) {
      const fallback = new Date();
      fallback.setDate(fallback.getDate() + offsetDays);
      return formatLocalDate(fallback);
    }
  };

  const setDefaultVisitDates = () => {
    const visitDateInput = document.getElementById('visit-date');
    const nextVisitInput = document.getElementById('next-visit-date');
    if (visitDateInput && !visitDateInput.value) {
      visitDateInput.value = getOmanDate(0);
    }
    if (nextVisitInput && !nextVisitInput.value) {
      nextVisitInput.value = '';
    }
  };

  const updatePhotoField = () => {
    if (!ui.zamzamPhotoField || !ui.zamzamPhoto) return;
    const haveZamzam = document.getElementById('have-zamzam')?.value === 'yes';
    ui.zamzamPhotoField.classList.toggle('hidden', !haveZamzam);
    ui.zamzamPhoto.required = haveZamzam;
    if (!haveZamzam) {
      ui.zamzamPhoto.value = '';
      ui.zamzamPhoto.removeAttribute('capture');
    } else {
      ui.zamzamPhoto.setAttribute('capture', 'environment');
    }
  };

  const getOmanNow = () => {
    try {
      return new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Muscat' }));
    } catch (error) {
      return new Date();
    }
  };

  const OMAN_OFFSET = '+04:00';
  let routeStatusTimer = null;

  const buildOmanTimestamp = (dateStr, hour, minute = 0) => {
    if (!dateStr) return null;
    const hh = String(hour).padStart(2, '0');
    const mm = String(minute).padStart(2, '0');
    return `${dateStr}T${hh}:${mm}:00${OMAN_OFFSET}`;
  };

  const getRouteStatusUntil = (status) => {
    if (status === 'move') {
      return buildOmanTimestamp(getOmanDate(1), 0, 0);
    }
    if (status === 'complete') {
      return buildOmanTimestamp(getOmanDate(0), 12, 0);
    }
    return null;
  };

  const parseRouteStatusUntil = (value) => {
    if (!value) return null;
    const parsed = new Date(value);
    const ts = parsed.getTime();
    if (Number.isNaN(ts)) return null;
    return ts;
  };

  const getActiveRouteStatus = (visit, nowTs = Date.now()) => {
    if (!visit?.route_status || !visit?.route_status_until) return null;
    const untilTs = parseRouteStatusUntil(visit.route_status_until);
    if (!untilTs || untilTs <= nowTs) return null;
    return visit.route_status;
  };

  const renderVisitTimeline = (visit) => {
    if (!ui.visitTimeline || !visit) return;
    const items = [];
    if (visit.created_at) {
      items.push({ label: 'Created', value: formatDateTime(visit.created_at) });
    }
    if (visit.visit_date) {
      items.push({ label: 'Visit Date', value: formatDate(visit.visit_date) });
    }
    if (visit.next_visit_date) {
      items.push({ label: 'Next Visit', value: formatDate(visit.next_visit_date) });
    }
    const activeStatus = getActiveRouteStatus(visit);
    if (activeStatus === 'complete') {
      items.push({
        label: 'Status',
        value: `Completed (until ${formatDateTime(visit.route_status_until)})`
      });
    }
    if (activeStatus === 'move') {
      items.push({
        label: 'Status',
        value: `Moved +7d (until ${formatDateTime(visit.route_status_until)})`
      });
    }
    if (!items.length) {
      ui.visitTimeline.innerHTML = '<li>No timeline data.</li>';
      return;
    }
    ui.visitTimeline.innerHTML = items
      .map((item) => `<li><span>${item.label}</span>${item.value}</li>`)
      .join('');
  };

  const scheduleRouteStatusRefresh = (visits) => {
    if (routeStatusTimer) {
      clearTimeout(routeStatusTimer);
      routeStatusTimer = null;
    }
    const now = Date.now();
    const expiries = (visits || [])
      .map((visit) => parseRouteStatusUntil(visit?.route_status_until))
      .filter((value) => typeof value === 'number' && value > now);
    if (!expiries.length) return;
    const nextExpiry = Math.min(...expiries);
    const delay = Math.max(nextExpiry - now, 0);
    routeStatusTimer = setTimeout(() => {
      if (state.activeSection === 'sales-route') {
        loadRouteVisits();
      }
    }, delay);
  };

  const showFormError = (element, message) => {
    element.textContent = message;
    element.classList.remove('hidden');
  };

  const clearFormError = (element) => {
    element.textContent = '';
    element.classList.add('hidden');
  };

  const setTableLoading = (body, colSpan, message = 'Loading...') => {
    if (!body) return;
    body.innerHTML = `<tr class="loading-row"><td colspan="${colSpan}"><span class="loading-spinner" aria-hidden="true"></span>${message}</td></tr>`;
  };

  const setTableMessage = (body, colSpan, message) => {
    if (!body) return;
    body.innerHTML = `<tr><td colspan="${colSpan}" class="empty">${message}</td></tr>`;
  };

  const setButtonLoading = (button, loading, label) => {
    if (!button) return;
    if (loading) {
      if (!button.dataset.originalText) {
        button.dataset.originalText = button.textContent.trim();
      }
      button.classList.add('is-loading');
      button.disabled = true;
      const text = label || button.dataset.originalText || 'Loading...';
      button.innerHTML = `<span class="btn-spinner" aria-hidden="true"></span>${text}`;
    } else {
      const original = button.dataset.originalText;
      if (original) {
        button.textContent = original;
      }
      button.classList.remove('is-loading');
      button.disabled = false;
      delete button.dataset.originalText;
    }
  };

  const applyRoleVisibility = () => {
    const role = state.role;
    document.querySelectorAll('[data-role]').forEach((el) => {
      const allowed = el.dataset.role === role;
      el.classList.toggle('hidden', !allowed);
    });
  };

  const updateUserCard = () => {
    const displayName = state.profile?.name || state.user?.email || 'User';
    if (ui.userName) {
      ui.userName.textContent = `Welcome, ${displayName}!`;
    }
    if (ui.brandWelcome) {
      ui.brandWelcome.textContent = `Welcome, ${displayName}`;
    }
  };

  const ensureProfile = async (user) => {
    const { data, error } = await supabaseClient
      .from('profiles')
      .select('id, name, role')
      .eq('id', user.id)
      .limit(1);

    if (error) throw error;

    if (data && data.length > 0) return data[0];

    const fallbackName = user.user_metadata?.name || user.email?.split('@')[0] || 'Salesperson';
    const { data: inserted, error: insertError } = await supabaseClient
      .from('profiles')
      .insert({ id: user.id, name: fallbackName, role: 'salesperson' })
      .select()
      .single();

    if (insertError) throw insertError;
    return inserted;
  };

  const loadUsers = async () => {
    if (loadingState.users) return;
    loadingState.users = true;
    setTableLoading(ui.adminUsersBody, 4, 'Loading users...');
    const { data, error } = await supabaseClient
      .from('profiles')
      .select('id, name, role, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      showToast('Unable to load users.', 'error');
      setTableMessage(ui.adminUsersBody, 4, 'Unable to load users.');
      loadingState.users = false;
      return;
    }

    state.users = data || [];
    renderUsers();
    populateSalespersonFilter();
    renderAdminLeaderboard();
    loadingState.users = false;
  };

  const buildVisitQuery = (filters) => {
    let query = supabaseClient
      .from('visits')
      .select(
        'id, customer_name, phone_number, cr_number, area, visit_date, next_visit_date, have_zamzam, latitude, longitude, notes, photo_url, salesperson_id, created_at, route_status, route_status_until, profiles(name)'
      )
      .order('visit_date', { ascending: false });

    if (filters.dateFrom) query = query.gte('visit_date', filters.dateFrom);
    if (filters.dateTo) query = query.lte('visit_date', filters.dateTo);
    if (filters.area) query = query.ilike('area', `%${filters.area}%`);
    if (filters.haveZamzam) {
      query = query.eq('have_zamzam', filters.haveZamzam === 'yes');
    }
    if (filters.search) {
      const term = filters.search.replace(/[%_]/g, '\\$&');
      query = query.or(
        `customer_name.ilike.%${term}%,area.ilike.%${term}%,cr_number.ilike.%${term}%`
      );
    }

    if (state.role === 'admin' && filters.salespersonId) {
      query = query.eq('salesperson_id', filters.salespersonId);
    }

    if (state.role === 'admin' && filters.status) {
      const nowIso = new Date().toISOString();
      if (filters.status === 'active') {
        query = query
          .not('route_status', 'is', null)
          .gte('route_status_until', nowIso);
      }
      if (filters.status === 'complete') {
        query = query
          .eq('route_status', 'complete')
          .gte('route_status_until', nowIso);
      }
      if (filters.status === 'move') {
        query = query
          .eq('route_status', 'move')
          .gte('route_status_until', nowIso);
      }
    }

    if (state.role === 'salesperson' && state.user?.id) {
      query = query.eq('salesperson_id', state.user.id);
    }

    return query;
  };

  const loadVisits = async (filters = {}) => {
    if (loadingState.visits) return;
    loadingState.visits = true;
    if (state.role === 'admin') {
      setTableLoading(ui.adminVisitsBody, 7, 'Loading visits...');
    } else {
      setTableLoading(ui.salesVisitsBody, 7, 'Loading visits...');
    }
    const { data, error } = await buildVisitQuery(filters);

    if (error) {
      showToast('Unable to load visits.', 'error');
      if (state.role === 'admin') {
        setTableMessage(ui.adminVisitsBody, 7, 'Unable to load visits.');
      } else {
        setTableMessage(ui.salesVisitsBody, 7, 'Unable to load visits.');
      }
      loadingState.visits = false;
      return;
    }

    state.visits = data || [];
    const summary = buildVisitSummary(state.visits);
    if (state.role === 'admin') {
      renderAdminVisits();
      updateStats('admin', summary);
      renderAdminLeaderboard();
    } else {
      if (state.activeSection === 'sales-visits') {
        renderSalesVisits();
      }
      updateStats('sales', summary);
      renderSalesTomorrowList(summary);
    }
    loadingState.visits = false;
  };

  const setStatValue = (key, value) => {
    const node = document.querySelector(`[data-stat="${key}"]`);
    if (node) node.textContent = value;
  };

  const buildVisitSummary = (visits) => {
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    const total = visits.length;
    let monthCount = 0;
    let followups = 0;
    let next7Count = 0;
    const todayStr = getOmanDate(0);
    const next7Str = addDaysToDate(todayStr, 7);
    const next7End = new Date(`${next7Str}T23:59:59`);
    const tomorrowStr = getOmanDate(1);
    const nowTs = Date.now();
    const tomorrowList = [];

    visits.forEach((visit) => {
      const visitDate = visit.visit_date ? new Date(`${visit.visit_date}T00:00:00`) : null;
      if (visitDate && visitDate.getMonth() === month && visitDate.getFullYear() === year) {
        monthCount += 1;
      }
      if (visit.next_visit_date) {
        const nextDate = new Date(`${visit.next_visit_date}T00:00:00`);
        if (nextDate >= today) followups += 1;
        if (nextDate >= today && nextDate <= next7End) {
          next7Count += 1;
        }
      }

      const scheduled =
        visit.visit_date === tomorrowStr || visit.next_visit_date === tomorrowStr;
      if (scheduled && !getActiveRouteStatus(visit, nowTs)) {
        tomorrowList.push(visit);
      }
    });

    return {
      total,
      monthCount,
      followups,
      next7Count,
      tomorrowList,
      tomorrowStr
    };
  };

  const updateStats = (prefix, summary) => {
    const data = summary || buildVisitSummary(state.visits);
    setStatValue(`${prefix}-total`, data.total);
    setStatValue(`${prefix}-month`, data.monthCount);
    setStatValue(`${prefix}-followups`, data.followups);
    setStatValue(`${prefix}-next7`, data.next7Count);
  };

  const getWeekStartDateStr = () => {
    const now = getOmanNow();
    const day = now.getDay();
    const diff = (day + 6) % 7;
    now.setDate(now.getDate() - diff);
    now.setHours(0, 0, 0, 0);
    return formatLocalDate(now);
  };

  const renderAdminLeaderboard = () => {
    if (!ui.adminLeaderboardBody) return;
    const weekStart = getWeekStartDateStr();
    const weekEnd = addDaysToDate(weekStart, 7);
    const userMap = new Map(state.users.map((user) => [user.id, user.name]));
    const totals = new Map();

    state.visits.forEach((visit) => {
      if (!visit.visit_date) return;
      if (visit.visit_date < weekStart || visit.visit_date >= weekEnd) return;
      const key = visit.salesperson_id || 'unknown';
      const entry = totals.get(key) || { total: 0, completed: 0, name: null };
      entry.total += 1;
      if (visit.route_status === 'complete') entry.completed += 1;
      entry.name =
        entry.name ||
        visit.profiles?.name ||
        userMap.get(key) ||
        (key === 'unknown' ? 'Unknown' : key.slice(0, 8));
      totals.set(key, entry);
    });

    const rows = Array.from(totals.entries())
      .map(([id, entry]) => ({
        id,
        name: entry.name || (id === 'unknown' ? 'Unknown' : id.slice(0, 8)),
        total: entry.total,
        completion: entry.total ? Math.round((entry.completed / entry.total) * 100) : 0
      }))
      .sort((a, b) => b.total - a.total);

    if (!rows.length) {
      ui.adminLeaderboardBody.innerHTML =
        '<tr><td colspan="3" class="empty">No data yet.</td></tr>';
      return;
    }

    ui.adminLeaderboardBody.innerHTML = rows
      .map(
        (row) => `
        <tr>
          <td data-label="Salesperson">${row.name}</td>
          <td data-label="Visits">${row.total}</td>
          <td data-label="Completion">${row.completion}%</td>
        </tr>`
      )
      .join('');
  };

  const renderSalesTomorrowList = (summary) => {
    if (!ui.salesTomorrowList || !ui.salesTomorrowCount) return;
    const data = summary || buildVisitSummary(state.visits);
    const sorted = [...data.tomorrowList].sort(sortByArea);

    ui.salesTomorrowCount.textContent = String(sorted.length);
    if (!sorted.length) {
      ui.salesTomorrowList.innerHTML =
        '<li class="empty">No visits scheduled for tomorrow.</li>';
      return;
    }

    ui.salesTomorrowList.innerHTML = sorted
      .slice(0, 5)
      .map((visit) => {
        const area = visit.area ? `<span>${visit.area}</span>` : '<span>-</span>';
        return `<li><strong>${visit.customer_name}</strong>${area}</li>`;
      })
      .join('');
  };

  const escapeCsv = (value) => {
    if (value === null || value === undefined) return '';
    const text = String(value);
    if (/[",\n]/.test(text)) {
      return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
  };

  const exportVisits = (filename, visits) => {
    if (!visits.length) {
      showToast('No visits to export.', 'error');
      return;
    }

    const headers = [
      'Customer Name',
      'Phone Number',
      'CR Number',
      'Area',
      'Visit Date',
      'Next Visit Date',
      'Have Zamzam',
      'Latitude',
      'Longitude',
      'Salesperson',
      'Salesperson ID',
      'Created At'
    ];

    const rows = visits.map((visit) => [
      visit.customer_name,
      visit.phone_number,
      visit.cr_number || '',
      visit.area,
      visit.visit_date || '',
      visit.next_visit_date || '',
      visit.have_zamzam ? 'Yes' : 'No',
      visit.latitude ?? '',
      visit.longitude ?? '',
      visit.profiles?.name || '',
      visit.salesperson_id || '',
      visit.created_at || ''
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map(escapeCsv).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const checkDuplicateVisit = async (customerName, crNumber) => {
    if (!state.user?.id) return true;
    const since = new Date(getOmanNow().getTime() - 24 * 60 * 60 * 1000).toISOString();
    const safeName = customerName.replace(/[%_]/g, '\\$&');
    const query = supabaseClient
      .from('visits')
      .select('id, customer_name, cr_number, created_at')
      .eq('salesperson_id', state.user.id)
      .gte('created_at', since)
      .or(`cr_number.eq.${crNumber},customer_name.ilike.%${safeName}%`)
      .limit(3);

    const { data, error } = await query;
    if (error) return true;
    if (!data || !data.length) return true;

    return window.confirm(
      `Duplicate warning: ${data.length} visit(s) with the same CR or customer were created in the last 24 hours. Continue?`
    );
  };

  const loadLogoDataUrl = (() => {
    let cached = null;
    return async () => {
      if (cached) return cached;
      const response = await fetch('assets/zamzam-logo-transparent.png');
      const blob = await response.blob();
      cached = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('Logo load failed.'));
        reader.readAsDataURL(blob);
      });
      return cached;
    };
  })();

  const truncatePdfText = (doc, text, maxWidth) => {
    if (!text) return '';
    const clean = String(text);
    if (doc.getTextWidth(clean) <= maxWidth) return clean;
    let trimmed = clean;
    while (trimmed.length > 0 && doc.getTextWidth(`${trimmed}…`) > maxWidth) {
      trimmed = trimmed.slice(0, -1);
    }
    return `${trimmed}…`;
  };

  const generatePdfReport = async (visits, options) => {
    const { title, includeSalesperson } = options || {};
    if (!window.jspdf?.jsPDF) {
      showToast('PDF library not loaded.', 'error');
      return;
    }
    if (!visits.length) {
      showToast('No visits to export.', 'error');
      return;
    }

    const doc = new window.jspdf.jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 36;
    let y = 40;

    try {
      const logo = await loadLogoDataUrl();
      doc.addImage(logo, 'PNG', margin, y - 6, 48, 48);
    } catch (error) {
      // Logo is optional.
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('Zamzam Visits', margin + 60, y + 14);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(title || 'Visit Report', margin + 60, y + 32);
    doc.setTextColor(90);
    doc.setFontSize(9);
    doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth - margin, y + 14, {
      align: 'right'
    });
    doc.setTextColor(0);
    y += 62;

    const columns = includeSalesperson
      ? ['Customer', 'Salesperson', 'Area', 'Visit', 'Next', 'Status']
      : ['Customer', 'Area', 'Visit', 'Next', 'Status'];
    const widths = includeSalesperson
      ? [140, 110, 90, 60, 60, 70]
      : [180, 110, 70, 70, 80];
    const lineHeight = 18;

    const renderHeader = () => {
      doc.setFillColor(247, 248, 251);
      doc.rect(margin, y - 12, pageWidth - margin * 2, 24, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      let x = margin + 6;
      columns.forEach((col, idx) => {
        doc.text(col, x, y + 4);
        x += widths[idx];
      });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      y += 20;
    };

    renderHeader();

    visits.forEach((visit) => {
      if (y + lineHeight > pageHeight - margin) {
        doc.addPage();
        y = margin + 10;
        renderHeader();
      }
      const activeStatus = getActiveRouteStatus(visit);
      const status =
        activeStatus === 'complete'
          ? 'Completed'
          : activeStatus === 'move'
            ? 'Moved +7d'
            : '-';
      const rowValues = includeSalesperson
        ? [
            visit.customer_name,
            visit.profiles?.name || visit.salesperson_id?.slice(0, 8) || '-',
            visit.area || '-',
            visit.visit_date || '-',
            visit.next_visit_date || '-',
            status
          ]
        : [
            visit.customer_name,
            visit.area || '-',
            visit.visit_date || '-',
            visit.next_visit_date || '-',
            status
          ];

      let x = margin + 6;
      rowValues.forEach((value, idx) => {
        const display = truncatePdfText(doc, value, widths[idx] - 8);
        doc.text(display, x, y);
        x += widths[idx];
      });
      y += lineHeight;
    });

    const stamp = new Date().toISOString().split('T')[0];
    const filename = `zamzam-visits-${stamp}.pdf`;
    doc.save(filename);
  };

  const openMapsRoute = (url) => {
    const opened = window.open(url, '_blank', 'noopener');
    if (!opened) {
      window.location.href = url;
    }
  };

  const generateTomorrowRoute = async () => {
    if (!state.user?.id) {
      showToast('Please log in again.', 'error');
      return;
    }

    if (loadingState.routeGenerate) return;
    const hasCoords =
      routeStart.capturedAt &&
      Number.isFinite(routeStart.latitude) &&
      Number.isFinite(routeStart.longitude);
    if (!hasCoords) {
      showToast('Please capture your start location first.', 'error');
      updateRouteGenerateState();
      return;
    }
    loadingState.routeGenerate = true;
    const originalLabel = ui.salesRouteBtn?.textContent;
    if (ui.salesRouteBtn) {
      ui.salesRouteBtn.disabled = true;
      ui.salesRouteBtn.textContent = 'Generating...';
    }

    const tomorrowStr = getOmanDate(1);

    let query = supabaseClient
      .from('visits')
      .select(
        'id, customer_name, phone_number, cr_number, area, visit_date, next_visit_date, have_zamzam, latitude, longitude, salesperson_id, created_at, route_status, route_status_until, profiles(name)'
      )
      .order('visit_date', { ascending: true })
      .or(`visit_date.eq.${tomorrowStr},next_visit_date.eq.${tomorrowStr}`);

    if (state.role === 'salesperson' && state.user?.id) {
      query = query.eq('salesperson_id', state.user.id);
    }

    try {
      const { data, error } = await query;

      if (error) {
        showToast('Unable to load tomorrow visits.', 'error');
        return;
      }

      return handleRouteResults(data, tomorrowStr);
    } finally {
      loadingState.routeGenerate = false;
      if (ui.salesRouteBtn) {
        ui.salesRouteBtn.disabled = false;
        ui.salesRouteBtn.textContent = originalLabel || 'Generate Route';
      }
      updateRouteGenerateState();
    }
  };

  const handleRouteResults = async (rawVisits, dateLabel) => {
    const nowTs = Date.now();
    const remaining = (rawVisits || []).filter(
      (visit) => !getActiveRouteStatus(visit, nowTs)
    );
    const visits = remaining
      .map((visit) => ({
        ...visit,
        latitude: Number.parseFloat(visit.latitude),
        longitude: Number.parseFloat(visit.longitude)
      }))
      .filter(
        (visit) =>
          Number.isFinite(visit.latitude) &&
          Number.isFinite(visit.longitude)
      );

    if (!visits.length) {
      showToast(`No remaining visits with GPS coordinates for ${dateLabel}.`, 'error');
      return;
    }

    if (visits.length > 23) {
      showToast('Google Maps supports up to 23 stops. Please reduce the list.', 'error');
      return;
    }

    if (!Number.isFinite(routeStart.latitude) || !Number.isFinite(routeStart.longitude)) {
      showToast('Please capture your start location.', 'error');
      return;
    }
    const origin = `${routeStart.latitude},${routeStart.longitude}`;

    const ordered = orderByDistance(routeStart, visits);

    const destination = ordered[ordered.length - 1];
    const destinationStr = `${destination.latitude},${destination.longitude}`;
    const waypoints = ordered
      .slice(0, -1)
      .map((visit) => `${visit.latitude},${visit.longitude}`)
      .join('|');

    const params = new URLSearchParams({
      api: '1',
      origin,
      destination: destinationStr,
      travelmode: 'driving'
    });

    if (waypoints) {
      params.append('waypoints', waypoints);
    }

    const url = `https://www.google.com/maps/dir/?${params.toString()}`;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(url).catch(() => undefined);
    }
    showToast('Opening Google Maps route.');
    openMapsRoute(url);
  };

  const renderRouteVisits = (visits, targetDate) => {
    if (!ui.routeVisitsBody || !ui.routeVisitsCount) return;
    const nowTs = Date.now();
    state.routeVisits = [...(visits || [])].sort(sortByArea);
    scheduleRouteStatusRefresh(state.routeVisits);
    const rows = state.routeVisits.map((visit) => {
      const lat = Number.parseFloat(visit.latitude);
      const lng = Number.parseFloat(visit.longitude);
      const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);
      const coordText = hasCoords ? `${lat.toFixed(5)}, ${lng.toFixed(5)}` : 'Missing';
      const scheduleText = formatRouteSchedule(visit, targetDate);
      const activeStatus = getActiveRouteStatus(visit, nowTs);
      const isCompleted = activeStatus === 'complete';
      const isMoved = activeStatus === 'move';
      const rowClass = isCompleted ? 'route-completed' : isMoved ? 'route-moved' : '';
      let actionsHtml = '';
      if (isCompleted) {
        actionsHtml = `
          <button class="btn success small" disabled>
            Completed
          </button>`;
      } else if (isMoved) {
        actionsHtml = `
          <button class="btn ghost small" disabled>
            Moved
          </button>`;
      } else {
        actionsHtml = `
          <button class="btn secondary small" data-action="complete" data-id="${visit.id}">
            Complete
          </button>
          <button class="btn ghost small" data-action="move" data-id="${visit.id}">
            Move +7d
          </button>`;
      }
      return `
        <tr class="${rowClass}">
          <td data-label="Customer">${visit.customer_name}</td>
          <td data-label="Area">${visit.area}</td>
          <td data-label="Scheduled">${scheduleText}</td>
          <td data-label="GPS">${coordText}</td>
          <td data-label="Actions">
            <div class="table-actions">
              ${actionsHtml}
            </div>
          </td>
        </tr>`;
    });

    ui.routeVisitsCount.textContent = `Tomorrow Visits: ${rows.length}`;
    if (!rows.length) {
      ui.routeVisitsBody.innerHTML =
        '<tr><td colspan="5" class="empty">No visits for tomorrow.</td></tr>';
      return;
    }
    ui.routeVisitsBody.innerHTML = rows.join('');
  };

  const loadRouteVisits = async () => {
    if (!state.user?.id) return;
    if (loadingState.route) return;
    loadingState.route = true;
    if (ui.routeVisitsCount) {
      ui.routeVisitsCount.textContent = 'Tomorrow Visits: ...';
    }
    setTableLoading(ui.routeVisitsBody, 5, 'Loading tomorrow visits...');
    const tomorrowStr = getOmanDate(1);
    const nowIso = new Date().toISOString();
    let query = supabaseClient
      .from('visits')
      .select(
        'id, customer_name, area, visit_date, next_visit_date, latitude, longitude, salesperson_id, route_status, route_status_until'
      )
      .order('visit_date', { ascending: true })
      .or(
        `visit_date.eq.${tomorrowStr},next_visit_date.eq.${tomorrowStr},route_status_until.gt.${nowIso}`
      );

    if (state.role === 'salesperson' && state.user?.id) {
      query = query.eq('salesperson_id', state.user.id);
    }

    const { data, error } = await query;

    if (error) {
      showToast('Unable to load tomorrow visits.', 'error');
      setTableMessage(ui.routeVisitsBody, 5, 'Unable to load tomorrow visits.');
      loadingState.route = false;
      return;
    }

    renderRouteVisits(data, tomorrowStr);
    loadingState.route = false;
  };

  const resolveRouteField = (visit, targetDate) => {
    if (visit.visit_date === targetDate) return 'visit_date';
    if (visit.next_visit_date === targetDate) return 'next_visit_date';
    return null;
  };

  const updateRouteVisit = async (visit, action) => {
    const targetDate = getOmanDate(1);
    const field = resolveRouteField(visit, targetDate);
    if (!field) {
      showToast('This visit is not scheduled for tomorrow.', 'error');
      return;
    }

    const newDate =
      action === 'move'
        ? addDaysToDate(targetDate, 7)
        : getOmanDate(0);

    const statusUntil = getRouteStatusUntil(action);
    const payload = {
      [field]: newDate,
      route_status: action,
      route_status_until: statusUntil
    };

    const { error } = await supabaseClient
      .from('visits')
      .update(payload)
      .eq('id', visit.id);

    if (error) {
      showToast(error.message || 'Unable to update visit.', 'error');
      return;
    }

    visit[field] = newDate;
    visit.route_status = action;
    visit.route_status_until = statusUntil;
    showToast(action === 'move' ? 'Moved to next week.' : 'Visit completed.');
    await loadRouteVisits();
    if (state.role === 'salesperson') {
      await loadVisits(readSalesFilters());
    } else if (state.role === 'admin') {
      await loadVisits(readAdminFilters());
    }
  };

  const clearRouteStatus = async (visit) => {
    if (!visit?.id) return;
    const { error } = await supabaseClient
      .from('visits')
      .update({ route_status: null, route_status_until: null })
      .eq('id', visit.id);

    if (error) {
      showToast(error.message || 'Unable to clear route status.', 'error');
      return;
    }

    showToast('Route status cleared.');
    await loadRouteVisits();
    if (state.role === 'salesperson') {
      await loadVisits(readSalesFilters());
    } else if (state.role === 'admin') {
      await loadVisits(readAdminFilters());
    }
  };

  const bulkUpdateVisitDates = async () => {
    const selectedIds = Array.from(state.selectedVisitIds);
    if (!selectedIds.length) {
      showToast('Select visits to update.', 'error');
      return;
    }

    const visitDate = ui.bulkVisitDate?.value || '';
    const nextVisitDate = ui.bulkNextVisitDate?.value || '';

    if (!visitDate && !nextVisitDate) {
      showToast('Choose a visit date or next visit date.', 'error');
      return;
    }

    if (visitDate && nextVisitDate && nextVisitDate < visitDate) {
      showToast('Next visit date must be on or after visit date.', 'error');
      return;
    }

    const payload = {};
    if (visitDate) payload.visit_date = visitDate;
    if (nextVisitDate) payload.next_visit_date = nextVisitDate;

    setButtonLoading(ui.bulkUpdateDates, true, 'Updating...');
    try {
      const { error } = await supabaseClient
        .from('visits')
        .update(payload)
        .in('id', selectedIds);

      if (error) {
        showToast(error.message || 'Unable to update visits.', 'error');
        return;
      }

      showToast(`Updated ${selectedIds.length} visit(s).`);
      clearBulkSelection();
      await loadVisits(readAdminFilters());
    } finally {
      setButtonLoading(ui.bulkUpdateDates, false);
    }
  };

  const bulkClearRouteStatus = async () => {
    const selectedIds = Array.from(state.selectedVisitIds);
    if (!selectedIds.length) {
      showToast('Select visits to clear.', 'error');
      return;
    }

    setButtonLoading(ui.bulkClearRoute, true, 'Clearing...');
    try {
      const { error } = await supabaseClient
        .from('visits')
        .update({ route_status: null, route_status_until: null })
        .in('id', selectedIds);

      if (error) {
        showToast(error.message || 'Unable to clear statuses.', 'error');
        return;
      }

      showToast(`Cleared status for ${selectedIds.length} visit(s).`);
      clearBulkSelection();
      await loadVisits(readAdminFilters());
    } finally {
      setButtonLoading(ui.bulkClearRoute, false);
    }
  };

  const syncBulkSelection = () => {
    if (!state.visits.length) {
      state.selectedVisitIds.clear();
    } else {
      const available = new Set(state.visits.map((visit) => visit.id));
      state.selectedVisitIds.forEach((id) => {
        if (!available.has(id)) {
          state.selectedVisitIds.delete(id);
        }
      });
    }

    const count = state.selectedVisitIds.size;
    if (ui.adminBulkCount) {
      ui.adminBulkCount.textContent = `${count} selected`;
    }
    if (ui.adminSelectAll) {
      ui.adminSelectAll.checked = count > 0 && count === state.visits.length;
      ui.adminSelectAll.indeterminate = count > 0 && count < state.visits.length;
    }
    if (ui.bulkUpdateDates) {
      ui.bulkUpdateDates.disabled = count === 0;
    }
    if (ui.bulkClearRoute) {
      ui.bulkClearRoute.disabled = count === 0;
    }
    if (ui.bulkClearSelection) {
      ui.bulkClearSelection.disabled = count === 0;
    }

    document.querySelectorAll('.row-select').forEach((checkbox) => {
      const id = checkbox.dataset.id;
      checkbox.checked = state.selectedVisitIds.has(id);
    });
  };

  const clearBulkSelection = () => {
    state.selectedVisitIds.clear();
    syncBulkSelection();
  };

  const getSelectedVisitIds = () => Array.from(state.selectedVisitIds);

  const getSelectedVisits = () =>
    state.visits.filter((visit) => state.selectedVisitIds.has(visit.id));

  const renderSalesVisits = () => {
    if (!state.visits.length) {
      ui.salesVisitsBody.innerHTML = '<tr><td colspan="7" class="empty">No visits yet.</td></tr>';
      return;
    }

    ui.salesVisitsBody.innerHTML = state.visits
      .map((visit) => {
        const activeStatus = getActiveRouteStatus(visit);
        const statusBadge =
          activeStatus === 'complete'
            ? '<span class="badge status-complete">Completed</span>'
            : activeStatus === 'move'
              ? '<span class="badge status-move">Moved +7d</span>'
              : '<span class="badge ghost">-</span>';
        const hasCoords = visit.latitude !== null && visit.longitude !== null;
        const mapUrl = hasCoords
          ? `https://www.google.com/maps?q=${encodeURIComponent(
              `${visit.latitude},${visit.longitude}`
            )}`
          : '#';
        const mapClass = hasCoords ? '' : 'disabled';
        const mapDisabled = hasCoords ? 'false' : 'true';
        const callUrl = visit.phone_number ? `tel:${visit.phone_number}` : '#';
        const callClass = visit.phone_number ? '' : 'disabled';
        const callDisabled = visit.phone_number ? 'false' : 'true';
        const waDigits = visit.phone_number ? visit.phone_number.replace('+', '') : '';
        const waUrl = waDigits ? `https://wa.me/${waDigits}` : '#';
        const waClass = waDigits ? '' : 'disabled';
        const waDisabled = waDigits ? 'false' : 'true';
        return `
        <tr>
          <td data-label="Customer">${visit.customer_name}</td>
          <td data-label="Area">${visit.area}</td>
          <td data-label="Visit Date">${formatDate(visit.visit_date)}</td>
          <td data-label="Next Visit">${formatDate(visit.next_visit_date)}</td>
          <td data-label="Have Zamzam">${visit.have_zamzam ? 'Yes' : 'No'}</td>
          <td data-label="Status">${statusBadge}</td>
          <td data-label="Actions">
            <div class="table-actions">
              <button class="btn secondary" data-action="view" data-id="${visit.id}">View</button>
              <a class="btn call small ${callClass}" href="${callUrl}" aria-disabled="${callDisabled}">
                Call
              </a>
              <a class="btn whatsapp small ${waClass}" href="${waUrl}" target="_blank" rel="noopener" aria-disabled="${waDisabled}">
                WhatsApp
              </a>
              <a class="btn map small ${mapClass}" href="${mapUrl}" target="_blank" rel="noopener" aria-disabled="${mapDisabled}">
                Map
              </a>
            </div>
          </td>
        </tr>`;
      })
      .join('');
  };

  const renderAdminVisits = () => {
    if (!state.visits.length) {
      ui.adminVisitsBody.innerHTML = '<tr><td colspan="7" class="empty">No visits found.</td></tr>';
      syncBulkSelection();
      return;
    }

    const tomorrowStr = getOmanDate(1);
    const nowTs = Date.now();
    ui.adminVisitsBody.innerHTML = state.visits
      .map((visit) => {
        const salesperson = visit.profiles?.name || visit.salesperson_id?.slice(0, 8) || 'Unknown';
        const isTomorrow =
          visit.visit_date === tomorrowStr || visit.next_visit_date === tomorrowStr;
        const activeStatus = getActiveRouteStatus(visit, nowTs);
        const quickActions = isTomorrow
          ? `
              <button class="btn secondary small" data-action="complete" data-id="${visit.id}">
                Complete
              </button>
              <button class="btn ghost small" data-action="move" data-id="${visit.id}">
                Move +7d
              </button>
            `
          : '';
        const clearAction = activeStatus
          ? `
              <button class="btn ghost small" data-action="clear-route" data-id="${visit.id}">
                Clear Route
              </button>
            `
          : '';
        const checked = state.selectedVisitIds.has(visit.id) ? 'checked' : '';
        return `
        <tr>
          <td data-label="Select">
            <input class="row-select" type="checkbox" data-id="${visit.id}" ${checked} />
          </td>
          <td data-label="Customer">${visit.customer_name}</td>
          <td data-label="Salesperson">${salesperson}</td>
          <td data-label="Area">${visit.area}</td>
          <td data-label="Visit Date">${formatDate(visit.visit_date)}</td>
          <td data-label="Next Visit">${formatDate(visit.next_visit_date)}</td>
          <td data-label="Actions">
            <div class="table-actions">
              ${quickActions}
              ${clearAction}
              <button class="btn secondary" data-action="edit" data-id="${visit.id}">
                View / Edit
              </button>
            </div>
          </td>
        </tr>`;
      })
      .join('');
    syncBulkSelection();
  };

  const renderUsers = () => {
    if (!state.users.length) {
      ui.adminUsersBody.innerHTML = '<tr><td colspan="4" class="empty">No users found.</td></tr>';
      return;
    }

    ui.adminUsersBody.innerHTML = state.users
      .map(
        (user) => `
        <tr>
          <td data-label="Name">${user.name}</td>
          <td data-label="Role">${user.role}</td>
          <td data-label="User ID">${user.id}</td>
          <td data-label="Created">${formatDate(user.created_at?.split('T')[0])}</td>
        </tr>`
      )
      .join('');
  };

  const populateSalespersonFilter = () => {
    if (!ui.adminSalespersonFilter) return;
    const current = ui.adminSalespersonFilter.value;
    const options = ['<option value="">All</option>'];
    state.users
      .filter((user) => user.role === 'salesperson')
      .forEach((user) => {
        options.push(`<option value="${user.id}">${user.name}</option>`);
      });
    ui.adminSalespersonFilter.innerHTML = options.join('');
    if (current) ui.adminSalespersonFilter.value = current;
  };

  const readSalesFilters = () => ({
    dateFrom: document.getElementById('sales-date-from').value,
    dateTo: document.getElementById('sales-date-to').value,
    area: document.getElementById('sales-area-filter').value.trim(),
    search: document.getElementById('sales-search').value.trim(),
    haveZamzam: document.getElementById('sales-have-zamzam').value
  });

  const readAdminFilters = () => ({
    dateFrom: document.getElementById('admin-date-from').value,
    dateTo: document.getElementById('admin-date-to').value,
    area: document.getElementById('admin-area-filter').value.trim(),
    salespersonId: document.getElementById('admin-salesperson-filter').value,
    search: document.getElementById('admin-search').value.trim(),
    haveZamzam: document.getElementById('admin-have-zamzam').value,
    status: document.getElementById('admin-status-filter').value
  });

  const getLocation = () =>
    new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported on this device.'));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          resolve({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy
          }),
        (err) => reject(err),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });

  const submitVisit = async (event) => {
    event.preventDefault();
    clearFormError(ui.visitError);
    const submitBtn = ui.visitForm?.querySelector('button[type="submit"]');

    const customerName = document.getElementById('customer-name').value.trim();
    const phoneDigits = document.getElementById('phone-number').value.trim();
    const crNumber = document.getElementById('cr-number').value.trim();
    const area = document.getElementById('area').value.trim();
    const visitDate = document.getElementById('visit-date').value;
    const nextVisitDate = document.getElementById('next-visit-date').value;
    const haveZamzam = document.getElementById('have-zamzam').value;
    const notes = document.getElementById('visit-notes').value.trim();
    let normalizedPhone = null;
    const photoFile = ui.zamzamPhoto?.files?.[0] || null;

    if (!customerName || !area || !visitDate || !haveZamzam || !crNumber) {
      showFormError(ui.visitError, 'Please complete all required fields.');
      return;
    }

    if (haveZamzam === 'yes' && !photoFile) {
      showFormError(ui.visitError, 'Please upload a photo for Zamzam.');
      return;
    }

    const phoneNumber = normalizePhone(phoneDigits);
    if (!phoneNumber) {
      showFormError(ui.visitError, 'Phone number must be 8 digits.');
      return;
    }
    normalizedPhone = phoneNumber;

    if (!/^\d{7}$/.test(crNumber)) {
      showFormError(ui.visitError, 'CR number must be exactly 7 digits.');
      return;
    }

    if (nextVisitDate && nextVisitDate < visitDate) {
      showFormError(ui.visitError, 'Next visit date must be on or after visit date.');
      return;
    }

    const okToContinue = await checkDuplicateVisit(customerName, crNumber);
    if (!okToContinue) return;

    setButtonLoading(submitBtn, true, 'Submitting...');
    try {
      const location = await captureGps(true);

      let photoUrl = null;
      if (photoFile) {
        const extension = photoFile.name.split('.').pop() || 'jpg';
        const filePath = `${state.user.id}/${Date.now()}_${Math.random()
          .toString(16)
          .slice(2)}.${extension}`;
        const { error: uploadError } = await supabaseClient.storage
          .from('visit-photos')
          .upload(filePath, photoFile, { contentType: photoFile.type, upsert: false });
        if (uploadError) {
          showFormError(ui.visitError, uploadError.message || 'Photo upload failed.');
          return;
        }
        const { data: publicData } = supabaseClient.storage
          .from('visit-photos')
          .getPublicUrl(filePath);
        photoUrl = publicData?.publicUrl || null;
      }

      const payload = {
        customer_name: customerName,
        phone_number: phoneNumber,
        cr_number: crNumber,
        area,
        visit_date: visitDate,
        next_visit_date: nextVisitDate || null,
        have_zamzam: haveZamzam === 'yes',
        latitude: location.latitude,
        longitude: location.longitude,
        salesperson_id: state.user.id,
        notes: notes || null,
        photo_url: photoUrl
      };

      const { error } = await supabaseClient.from('visits').insert(payload);

      if (error) throw error;

      ui.visitForm.reset();
      ui.gpsStatus.textContent = 'GPS will be captured on submission.';
      setDefaultVisitDates();
      updatePhotoField();
      showToast('Visit submitted successfully.');
      await loadVisits(readSalesFilters());
    } catch (error) {
      if (error.code === 1) {
        showFormError(ui.visitError, 'Location permission is required to submit a visit.');
      } else {
        showFormError(ui.visitError, error.message || 'Unable to submit visit.');
      }
      ui.gpsStatus.textContent = 'GPS capture failed. Please try again.';
    } finally {
      setButtonLoading(submitBtn, false);
    }
  };

  const openModal = (visit, mode = 'edit') => {
    state.activeVisitId = visit.id;
    document.getElementById('edit-customer-name').value = visit.customer_name || '';
    document.getElementById('edit-phone-number').value = visit.phone_number?.replace('+968', '') || '';
    document.getElementById('edit-cr-number').value = visit.cr_number || '';
    const editArea = document.getElementById('edit-area');
    if (editArea) {
      editArea.value = visit.area || '';
    }
    document.getElementById('edit-visit-date').value = visit.visit_date || '';
    document.getElementById('edit-next-visit-date').value = visit.next_visit_date || '';
    document.getElementById('edit-have-zamzam').value = visit.have_zamzam ? 'yes' : 'no';
    renderVisitTimeline(visit);
    if (ui.visitPhotoWrap && ui.visitPhoto) {
      if (visit.photo_url) {
        ui.visitPhoto.src = visit.photo_url;
        ui.visitPhotoWrap.classList.remove('hidden');
      } else {
        ui.visitPhoto.removeAttribute('src');
        ui.visitPhotoWrap.classList.add('hidden');
      }
    }
    updateContactLinks();
    clearFormError(ui.editVisitError);
    if (ui.editLocation) {
      const lat = visit.latitude ?? '';
      const lng = visit.longitude ?? '';
      ui.editLocation.value = lat !== '' && lng !== '' ? `${lat}, ${lng}` : '';
    }
    updateLocationMap();
    const isView = mode === 'view';
    if (ui.modalTitle) {
      ui.modalTitle.textContent = isView ? 'Visit Details' : 'Visit Details (Edit)';
    }
    if (ui.modalActions) {
      ui.modalActions.classList.remove('hidden');
    }
    if (ui.saveVisit) {
      ui.saveVisit.classList.toggle('hidden', isView);
    }
    if (ui.deleteVisit) {
      ui.deleteVisit.classList.toggle('hidden', isView);
    }
    if (ui.editVisitForm) {
      ui.editVisitForm.querySelectorAll('input, textarea').forEach((field) => {
        if (field.type === 'date') {
          field.disabled = isView;
        } else {
          field.readOnly = isView;
          field.disabled = false;
        }
      });
      ui.editVisitForm.querySelectorAll('select').forEach((field) => {
        field.disabled = isView;
      });
    }
    ui.modal.classList.toggle('readonly', isView);
    ui.modal.classList.remove('hidden');
    ui.modal.setAttribute('aria-hidden', 'false');
  };

  const closeModal = () => {
    ui.modal.classList.add('hidden');
    ui.modal.setAttribute('aria-hidden', 'true');
    if (ui.editVisitForm) {
      ui.editVisitForm.querySelectorAll('input, select, textarea').forEach((field) => {
        field.disabled = false;
      });
    }
    state.activeVisitId = null;
  };

  const saveVisitEdits = async (event) => {
    event.preventDefault();
    clearFormError(ui.editVisitError);

    const originalVisit = state.visits.find((visit) => visit.id === state.activeVisitId);
    const customerName = document.getElementById('edit-customer-name').value.trim();
    const phoneDigits = document.getElementById('edit-phone-number').value.trim();
    const crNumber = document.getElementById('edit-cr-number').value.trim();
    const area = document.getElementById('edit-area').value.trim();
    const visitDate = document.getElementById('edit-visit-date').value;
    const nextVisitDate = document.getElementById('edit-next-visit-date').value;
    const haveZamzam = document.getElementById('edit-have-zamzam').value;
    const locationValue = ui.editLocation?.value.trim() || '';
    const coordParts = locationValue.split(/[,\s]+/).filter(Boolean);
    const latitude = coordParts.length > 0 ? parseFloat(coordParts[0]) : NaN;
    const longitude = coordParts.length > 1 ? parseFloat(coordParts[1]) : NaN;

    if (!customerName || !area || !visitDate || !haveZamzam || !crNumber) {
      showFormError(ui.editVisitError, 'Please complete all required fields.');
      return;
    }

    const phoneNumber = normalizePhone(phoneDigits);
    if (!phoneNumber) {
      showFormError(ui.editVisitError, 'Phone number must be 8 digits.');
      return;
    }

    if (!/^\d{7}$/.test(crNumber)) {
      showFormError(ui.editVisitError, 'CR number must be exactly 7 digits.');
      return;
    }

    if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
      showFormError(ui.editVisitError, 'Location must be in "lat, long" format.');
      return;
    }

    if (nextVisitDate && nextVisitDate < visitDate) {
      showFormError(ui.editVisitError, 'Next visit date must be on or after visit date.');
      return;
    }

    const originalVisitDate = originalVisit?.visit_date || '';
    const originalNextDate = originalVisit?.next_visit_date || '';
    const newNextDate = nextVisitDate || '';
    const datesChanged =
      originalVisitDate !== visitDate || originalNextDate !== newNextDate;

    const payload = {
      customer_name: customerName,
      phone_number: phoneNumber,
      cr_number: crNumber,
      area,
      visit_date: visitDate,
      next_visit_date: nextVisitDate || null,
      have_zamzam: haveZamzam === 'yes',
      latitude,
      longitude
    };

    if (state.role === 'admin' && datesChanged) {
      payload.route_status = null;
      payload.route_status_until = null;
    }

    const { error } = await supabaseClient
      .from('visits')
      .update(payload)
      .eq('id', state.activeVisitId);

    if (error) {
      showFormError(ui.editVisitError, error.message || 'Unable to save changes.');
      return;
    }

    showToast('Visit updated successfully.');
    closeModal();
    await loadVisits(readAdminFilters());
  };

  const deleteVisit = async () => {
    if (!state.activeVisitId) return;
    const confirmed = window.confirm('Delete this visit? This action cannot be undone.');
    if (!confirmed) return;

    const { error } = await supabaseClient.from('visits').delete().eq('id', state.activeVisitId);

    if (error) {
      showFormError(ui.editVisitError, error.message || 'Unable to delete visit.');
      return;
    }

    showToast('Visit deleted.');
    closeModal();
    await loadVisits(readAdminFilters());
  };

  const subscribeVisits = () => {
    if (state.channel) {
      supabaseClient.removeChannel(state.channel);
    }

    setRealtimeStatus('checking');
    state.channel = supabaseClient
      .channel('visits-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'visits' }, async () => {
        if (state.role === 'admin') {
          await loadVisits(readAdminFilters());
        } else {
          await loadVisits(readSalesFilters());
          if (state.activeSection === 'sales-route') {
            await loadRouteVisits();
          }
        }
      })
      .subscribe((status) => {
        setRealtimeStatus(status === 'SUBSCRIBED');
      });
  };

  const handleSession = async (session) => {
    state.user = session.user;
    state.profile = await ensureProfile(session.user);
    state.role = state.profile.role;
    applyRoleVisibility();
    updateUserCard();
    updateRouteStartDisplay();
    checkRoutePermission();
    setView('app');
    setSection(state.role === 'admin' ? 'admin-dashboard' : 'sales-new');

    if (state.role === 'admin') {
      await Promise.all([loadUsers(), loadVisits(readAdminFilters())]);
    } else {
      await loadVisits(readSalesFilters());
    }

    subscribeVisits();
  };

  const clearSession = () => {
    state.user = null;
    state.profile = null;
    state.role = null;
    state.visits = [];
    state.users = [];
    state.selectedVisitIds.clear();
    if (state.channel) {
      supabaseClient.removeChannel(state.channel);
    }
    routeStart.latitude = null;
    routeStart.longitude = null;
    routeStart.accuracy = null;
    routeStart.capturedAt = null;
    updateRouteStartDisplay();
    setRealtimeStatus('off');
    setView('login');
  };

  ui.loginForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearFormError(ui.loginError);

    const email = ui.loginEmail.value.trim();
    const password = ui.loginPassword.value;
    const submitBtn = ui.loginForm.querySelector('button[type="submit"]');

    if (!email || !password) {
      showFormError(ui.loginError, 'Please enter email and password.');
      return;
    }

    setButtonLoading(submitBtn, true, 'Logging in...');
    try {
      const { error } = await supabaseClient.auth.signInWithPassword({ email, password });

      if (error) {
        showFormError(ui.loginError, error.message || 'Unable to log in.');
        return;
      }
    } finally {
      setButtonLoading(submitBtn, false);
    }
  });

  ui.logoutBtn?.addEventListener('click', async () => {
    await supabaseClient.auth.signOut();
    clearSession();
  });

  ui.navLinks.forEach((link) => {
    link.addEventListener('click', () => {
      setSection(link.dataset.section);
    });
  });

  ui.quickActionButtons.forEach((button) => {
    button.addEventListener('click', () => {
      if (button.dataset.section) {
        setSection(button.dataset.section);
      }
    });
  });

  ui.adminCreateForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearFormError(ui.adminCreateError);

    const { data: sessionData } = await supabaseClient.auth.getSession();
    if (!sessionData?.session) {
      showFormError(ui.adminCreateError, 'Session expired. Please log in again.');
      return;
    }

    const { data: refreshedData } = await supabaseClient.auth.refreshSession();
    const session = refreshedData?.session || sessionData.session;
    const token = session?.access_token;
    if (!token) {
      showFormError(ui.adminCreateError, 'Session expired. Please log in again.');
      return;
    }

    const payload = {
      name: ui.adminCreateName.value.trim(),
      email: ui.adminCreateEmail.value.trim().toLowerCase(),
      password: ui.adminCreatePassword.value,
      role: ui.adminCreateRole.value === 'admin' ? 'admin' : 'salesperson'
    };

    if (!payload.name || !payload.email || payload.password.length < 6) {
      showFormError(ui.adminCreateError, 'Name, email, and a 6+ char password are required.');
      return;
    }

    setButtonLoading(ui.adminCreateSubmit, true, 'Creating...');
    try {
      const res = await fetch(`${supabaseUrl}/functions/v1/create-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          apikey: supabaseKey
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const message = err.error || err.message || 'Unable to create user.';
        if (/invalid jwt/i.test(message)) {
          throw new Error('Invalid JWT. Please log out and log in again.');
        }
        throw new Error(message);
      }

      ui.adminCreateForm.reset();
      showToast('User created.');
      await loadUsers();
    } catch (error) {
      const msg = error.message || 'Unable to create user.';
      if (/invalid jwt/i.test(msg)) {
        await supabaseClient.auth.signOut();
        clearSession();
        showFormError(ui.adminCreateError, 'Session expired. Please log in again.');
        return;
      }
      showFormError(ui.adminCreateError, msg);
    } finally {
      setButtonLoading(ui.adminCreateSubmit, false);
    }
  });
 
 
    ui.visitForm?.addEventListener('submit', submitVisit);
  document.getElementById('have-zamzam')?.addEventListener('change', updatePhotoField);
  ui.gpsRefresh?.addEventListener('click', async () => {
    clearFormError(ui.visitError);
    setButtonLoading(ui.gpsRefresh, true, 'Recapturing...');
    try {
      await captureGps();
    } catch (error) {
      if (error.code === 1) {
        showFormError(ui.visitError, 'Location permission is required to capture GPS.');
      } else {
        showFormError(ui.visitError, error.message || 'Unable to capture GPS.');
      }
    } finally {
      setButtonLoading(ui.gpsRefresh, false);
    }
  });

  ui.salesFilterForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    await loadVisits(readSalesFilters());
  });

  ui.adminFilterForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearBulkSelection();
    await loadVisits(readAdminFilters());
  });

  ui.adminSelectAll?.addEventListener('change', (event) => {
    if (event.target.checked) {
      state.visits.forEach((visit) => state.selectedVisitIds.add(visit.id));
    } else {
      state.selectedVisitIds.clear();
    }
    syncBulkSelection();
  });

  ui.adminVisitsBody?.addEventListener('change', (event) => {
    const checkbox = event.target.closest('.row-select');
    if (!checkbox) return;
    const id = checkbox.dataset.id;
    if (checkbox.checked) {
      state.selectedVisitIds.add(id);
    } else {
      state.selectedVisitIds.delete(id);
    }
    syncBulkSelection();
  });

  ui.bulkClearSelection?.addEventListener('click', () => {
    clearBulkSelection();
  });

  ui.bulkUpdateDates?.addEventListener('click', () => {
    bulkUpdateVisitDates();
  });

  ui.bulkClearRoute?.addEventListener('click', () => {
    bulkClearRouteStatus();
  });

  ui.salesExport?.addEventListener('click', () => {
    const dateStamp = new Date().toISOString().split('T')[0];
    exportVisits(`zamzam-visits-sales-${dateStamp}.csv`, state.visits);
  });

  ui.salesExportPdf?.addEventListener('click', () => {
    generatePdfReport(state.visits, { title: 'Sales Visits Report' });
  });

  ui.adminExport?.addEventListener('click', () => {
    const dateStamp = new Date().toISOString().split('T')[0];
    const exportList =
      state.selectedVisitIds.size > 0 ? getSelectedVisits() : state.visits;
    exportVisits(`zamzam-visits-admin-${dateStamp}.csv`, exportList);
  });

  ui.adminExportPdf?.addEventListener('click', () => {
    const exportList =
      state.selectedVisitIds.size > 0 ? getSelectedVisits() : state.visits;
    generatePdfReport(exportList, {
      title: 'Admin Visits Report',
      includeSalesperson: true
    });
  });

  ui.salesRouteBtn?.addEventListener('click', () => {
    generateTomorrowRoute();
  });

  ui.routeRecapture?.addEventListener('click', async () => {
    setButtonLoading(ui.routeRecapture, true, 'Recapturing...');
    try {
      await captureRouteStart();
      showToast('Start location updated.');
    } catch (error) {
      showToast('Unable to capture start location.', 'error');
    } finally {
      setButtonLoading(ui.routeRecapture, false);
    }
  });

  ui.routeVisitsBody?.addEventListener('click', async (event) => {
    const button = event.target.closest('button[data-action]');
    if (!button) return;
    const visitId = button.dataset.id;
    const action = button.dataset.action;
    const visit = state.routeVisits.find((item) => item.id === visitId);
    if (!visit) return;
    const label = action === 'move' ? 'Moving...' : 'Completing...';
    setButtonLoading(button, true, label);
    try {
      await updateRouteVisit(visit, action);
    } finally {
      setButtonLoading(button, false);
    }
  });

  document.querySelectorAll('[data-reset]').forEach((button) => {
    button.addEventListener('click', async () => {
      if (button.dataset.reset === 'sales') {
        ui.salesFilterForm.reset();
        await loadVisits(readSalesFilters());
      }
      if (button.dataset.reset === 'admin') {
        ui.adminFilterForm.reset();
        clearBulkSelection();
        await loadVisits(readAdminFilters());
      }
    });
  });

  ui.adminVisitsBody?.addEventListener('click', async (event) => {
    const button = event.target.closest('button[data-action]');
    if (!button) return;
    const action = button.dataset.action;
    const visit = state.visits.find((item) => item.id === button.dataset.id);
    if (!visit) return;

    if (action === 'edit') {
      openModal(visit, 'edit');
      return;
    }

    if (action === 'complete' || action === 'move') {
      const label = action === 'move' ? 'Moving...' : 'Completing...';
      setButtonLoading(button, true, label);
      try {
        await updateRouteVisit(visit, action);
      } finally {
        setButtonLoading(button, false);
      }
      return;
    }

    if (action === 'clear-route') {
      setButtonLoading(button, true, 'Clearing...');
      try {
        await clearRouteStatus(visit);
      } finally {
        setButtonLoading(button, false);
      }
    }
  });

  ui.salesVisitsBody?.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-action="view"]');
    if (!button) return;
    const visit = state.visits.find((item) => item.id === button.dataset.id);
    if (visit) openModal(visit, 'view');
  });

  ui.closeModal?.addEventListener('click', closeModal);
  ui.modalClose?.addEventListener('click', closeModal);
  ui.editLocation?.addEventListener('input', updateLocationMap);
  document.getElementById('edit-phone-number')?.addEventListener('input', updateContactLinks);
  ui.modal?.addEventListener('click', (event) => {
    if (event.target === ui.modal) closeModal();
  });
  ui.editVisitForm?.addEventListener('submit', saveVisitEdits);
  ui.deleteVisit?.addEventListener('click', deleteVisit);

  document.addEventListener('pointerdown', createRipple);
  document.addEventListener('pointerdown', pressHighlight);
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    pressHighlight(event);
  });

  supabaseClient.auth.getSession().then(({ data }) => {
    updateTodayLabel();
    if (data.session) {
      handleSession(data.session).catch((error) => {
        showToast(error.message || 'Unable to load session.', 'error');
        clearSession();
      });
    } else {
      setView('login');
    }
  });


  supabaseClient.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT' || !session) {
      clearSession();
      return;
    }
    if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
      handleSession(session).catch((error) => {
        showToast(error.message || 'Unable to load session.', 'error');
        clearSession();
      });
    }
  });
}
