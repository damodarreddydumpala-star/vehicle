/**
 * Vehicle Service Centre Management System - Core Client Library
 */

const API_BASE = '/api';

// Toast Notification
function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️';
  toast.innerHTML = `<span>${icon}</span> <div>${message}</div>`;
  
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Format Currency
function formatCurrency(amount) {
  const val = Number(amount) || 0;
  return '₹' + val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Format Date
function formatDate(isoStr) {
  if (!isoStr) return '—';
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return isoStr;
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return isoStr;
  }
}

// Service Status Badge
function getServiceStatusBadge(status) {
  const s = (status || 'Booked').toLowerCase();
  let badgeClass = 'badge-booked';
  if (s.includes('progress')) badgeClass = 'badge-progress';
  else if (s.includes('complete')) badgeClass = 'badge-completed';
  else if (s.includes('cancel')) badgeClass = 'badge-cancelled';
  return `<span class="badge ${badgeClass}">${status}</span>`;
}

// Payment Status Badge
function getPaymentStatusBadge(status) {
  const s = (status || 'Pending').toLowerCase();
  let badgeClass = 'badge-pending';
  if (s.includes('paid')) badgeClass = 'badge-paid';
  else if (s.includes('fail')) badgeClass = 'badge-failed';
  return `<span class="badge ${badgeClass}">${status}</span>`;
}

// Populate Customer Select Dropdown
async function populateCustomerSelect(selectId, selectedId = null) {
  const select = document.getElementById(selectId);
  if (!select) return;

  try {
    const res = await fetch(`${API_BASE}/customers`);
    const json = await res.json();
    if (json.success && json.data) {
      select.innerHTML = '<option value="">-- Choose Customer --</option>';
      json.data.forEach(c => {
        const isSel = selectedId && Number(selectedId) === c.customer_id ? 'selected' : '';
        select.innerHTML += `<option value="${c.customer_id}" ${isSel}>${c.name} (${c.phone})</option>`;
      });
    }
  } catch (err) {
    console.error('Failed to load customers:', err);
  }
}

// Populate Vehicle Select Dropdown
async function populateVehicleSelect(selectId, selectedId = null) {
  const select = document.getElementById(selectId);
  if (!select) return;

  try {
    const res = await fetch(`${API_BASE}/vehicles`);
    const json = await res.json();
    if (json.success && json.data) {
      select.innerHTML = '<option value="">-- Choose Vehicle --</option>';
      json.data.forEach(v => {
        const isSel = selectedId && Number(selectedId) === v.vehicle_id ? 'selected' : '';
        select.innerHTML += `<option value="${v.vehicle_id}" ${isSel}>${v.vehicle_number} - ${v.vehicle_model} (${v.customer_name})</option>`;
      });
    }
  } catch (err) {
    console.error('Failed to load vehicles:', err);
  }
}

// Populate Service Select Dropdown
async function populateServiceSelect(selectId, selectedId = null) {
  const select = document.getElementById(selectId);
  if (!select) return;

  try {
    const res = await fetch(`${API_BASE}/services`);
    const json = await res.json();
    if (json.success && json.data) {
      select.innerHTML = '<option value="">-- Choose Service Ticket --</option>';
      json.data.forEach(s => {
        const isSel = selectedId && Number(selectedId) === s.service_id ? 'selected' : '';
        select.innerHTML += `<option value="${s.service_id}" data-charge="${s.service_charge}" ${isSel}>#${s.service_id}: ${s.vehicle_number} - ${s.service_type} (${s.customer_name} | Fee: ₹${s.service_charge})</option>`;
      });
    }
  } catch (err) {
    console.error('Failed to load services:', err);
  }
}

// Highlight active sidebar navigation link
document.addEventListener('DOMContentLoaded', () => {
  const path = window.location.pathname;
  const navLinks = document.querySelectorAll('.nav-links a');
  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href === path || (path === '/' && href === '/index.html') || (path.includes(href.replace('.html', '')) && href !== '/index.html')) {
      link.classList.add('active');
    }
  });
});
