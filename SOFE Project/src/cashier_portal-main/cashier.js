// cashier.js - extracted from cashier.html

// Authentication and initialization
document.addEventListener("DOMContentLoaded", () => {
  // Check if user is logged in and has cashier role
  if (localStorage.getItem("isLoggedIn") !== "true") {
    showPopup('info', {
      title: 'Login Required',
      message: 'Please log in to access the cashier dashboard.',
      actions: [
        {
          text: 'Go to Login',
          type: 'primary',
          handler: () => { window.location.href = "customer_portal-main/login.html"; }
        }
      ]
    });
    return;
  }

  const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
  // Check if user has cashier role
  if (currentUser.role !== 'cashier' && currentUser.role !== 'admin') {
    showPopup('error', {
      title: 'Access Denied',
      message: 'You do not have permission to access the cashier dashboard.',
      actions: [
        {
          text: 'Go to Customer Portal',
          type: 'primary',
          handler: () => { window.location.href = "customer_portal-main/customer_dashboard.html"; }
        }
      ]
    });
    return;
  }

  // Display cashier name
  if (currentUser.name) {
    const el = document.getElementById('cashier-name');
    if (el) el.textContent = currentUser.name;
    showToast('info', 'Welcome!', `Logged in as ${currentUser.name}`);
  }

  try {
    initializeData();
    loadOrders();
    if (typeof loadInventory === 'function') loadInventory();
    if (typeof loadCustomers === 'function') loadCustomers();
  } catch (err) {
    console.warn('Initialization error (some functions may be missing):', err);
  }
});

// Sidebar navigation smooth scroll
document.querySelectorAll('.nav a').forEach(link => {
  link.addEventListener('click', function(e) {
    e.preventDefault();
    document.querySelectorAll('.nav a').forEach(a => a.classList.remove('active'));
    this.classList.add('active');
    const target = this.dataset.target;
    if (!target) return;
    const section = document.getElementById(target);
    if (section) {
      const topOffset = section.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top: topOffset, behavior: 'smooth' });
    }
  });
});

// Order management functions
function approveOrder(orderId) {
  const orders = JSON.parse(localStorage.getItem("jessie_orders") || "[]");
  const sales = JSON.parse(localStorage.getItem("jessie_sales") || "{}");
  const orderIndex = orders.findIndex(order => order.id === orderId);
  if (orderIndex !== -1 && orders[orderIndex].status === 'pending') {
    orders[orderIndex].status = 'approved';
    localStorage.setItem("jessie_orders", JSON.stringify(orders));
    const orderTotal = orders[orderIndex].total;
    sales.totalSales = (sales.totalSales || 0) + orderTotal;
    sales.totalOrders = (sales.totalOrders || 0) + 1;
    sales.approvedOrders = (sales.approvedOrders || 0) + 1;
    sales.pendingOrders = Math.max(0, (sales.pendingOrders || 1) - 1);
    localStorage.setItem("jessie_sales", JSON.stringify(sales));
    updateInventoryForOrder(orders[orderIndex]);
    loadOrders();
    if (typeof loadInventory === 'function') loadInventory();
    if (typeof loadCustomers === 'function') loadCustomers();
    showToast('success', 'Order Approved!', `Order #${orderId} has been approved and sales updated.`);
  }
}

function cancelOrder(orderId) {
  const orders = JSON.parse(localStorage.getItem("jessie_orders") || "[]");
  const sales = JSON.parse(localStorage.getItem("jessie_sales") || "{}");
  const orderIndex = orders.findIndex(order => order.id === orderId);
  if (orderIndex === -1) return;
  if (orders[orderIndex].status !== 'pending') { showToast('info', 'Cannot Cancel', 'Only pending orders can be cancelled.'); return; }
  showPopup('warning', {
    title: 'Confirm Delete',
    message: `Are you sure you want to delete Order #${orderId}? This will remove the entire order.`,
    actions: [
      { text: 'No', type: 'secondary', handler: hidePopup },
      { text: 'Yes, Delete', type: 'primary', handler: () => {
          orders.splice(orderIndex, 1);
          localStorage.setItem("jessie_orders", JSON.stringify(orders));
          sales.pendingOrders = Math.max(0, (sales.pendingOrders || 1) - 1);
          localStorage.setItem("jessie_sales", JSON.stringify(sales));
          loadOrders(); if (typeof loadCustomers === 'function') loadCustomers(); hidePopup(); showToast('warning', 'Order Deleted', `Order #${orderId} has been deleted.`);
      }}
    ]
  });
}

function stockIn(item) {
  showPopup('info', { title: 'Stock In', message: `Enter quantity to stock in for ${item}:`, actions: [ { text: 'Cancel', type: 'secondary', handler: hidePopup }, { text: 'Confirm Stock In', type: 'primary', handler: () => { showToast('success', 'Stock Updated', `${item} stock has been increased.`); hidePopup(); } } ] });
}

function stockOut(item) {
  showPopup('warning', { title: 'Stock Out', message: `Enter quantity to stock out for ${item}:`, actions: [ { text: 'Cancel', type: 'secondary', handler: hidePopup }, { text: 'Confirm Stock Out', type: 'primary', handler: () => { showToast('info', 'Stock Updated', `${item} stock has been decreased.`); hidePopup(); } } ] });
}

function generateReport() { showPopup('success', { title: 'Generate Report', message: 'Branch report is being generated. This may take a few moments...', actions: [ { text: 'Download Report', type: 'primary', handler: () => { showToast('success', 'Report Generated', 'Branch report downloaded successfully!'); hidePopup(); } } ] }); }

function viewOrderDetails(orderId) {
  const orders = JSON.parse(localStorage.getItem("jessie_orders") || "[]");
  const order = orders.find(o => o.id === orderId);
  if (order) {
    let details = `Order #${order.id}\n`;
    details += `Customer: ${order.customerName}\n`;
    details += `Phone: ${order.customerPhone}\n`;
    details += `Date: ${order.date} ${order.time}\n`;
    details += `Status: ${order.status.toUpperCase()}\n\n`;
    details += 'Items:\n';
    order.items.forEach(item => { details += `- ${item.qty}x ${item.name} (${item.size})`; if (item.special !== 'None') details += ` - ${item.special}`; if (item.notes) details += ` - Notes: ${item.notes}`; details += `: ₱${(item.price * item.qty).toFixed(2)}\n`; });
    details += `\nSubtotal: ₱${order.subtotal.toFixed(2)}\n`;
    details += `Tax: ₱${order.tax.toFixed(2)}\n`;
    details += `Total: ₱${order.total.toFixed(2)}\n`;
    if (order.customerNotes) details += `\nCustomer Notes: ${order.customerNotes}`;
    alert(details);
  }
}

function initializeData() {
  if (!localStorage.getItem("jessie_sales")) { const initialSales = { totalSales: 0, totalOrders: 0, pendingOrders: 0, approvedOrders: 0, lastReset: new Date().toISOString() }; localStorage.setItem("jessie_sales", JSON.stringify(initialSales)); }
  if (!localStorage.getItem("jessie_inventory")) { const initialInventory = [ { name: "Pure Sugarcane", stock: 50 }, { name: "Calamansi Cane", stock: 32 }, { name: "Lemon Cane", stock: 45 }, { name: "Yakult Cane", stock: 28 }, { name: "Lychee Cane", stock: 35 } ]; localStorage.setItem("jessie_inventory", JSON.stringify(initialInventory)); }
  if (!localStorage.getItem("jessie_orders")) { localStorage.setItem("jessie_orders", JSON.stringify([])); }
}

function loadOrders() {
  const orders = JSON.parse(localStorage.getItem("jessie_orders") || "[]");
  const sales = JSON.parse(localStorage.getItem("jessie_sales") || "{}");
  const tbody = document.getElementById("ordersTbody");
  const noOrders = document.getElementById("no-orders");
  tbody.innerHTML = '';
  if (orders.length === 0) { noOrders.style.display = 'block'; } else {
    noOrders.style.display = 'none';
    const sortedOrders = orders.slice().sort((a, b) => { const dateA = new Date(a.date + ' ' + a.time); const dateB = new Date(b.date + ' ' + b.time); return dateA - dateB; });
    function padNumber(n, width = 3) { const s = String(n); return s.padStart(width, '0'); }
    const renderList = sortedOrders.slice().reverse();
    renderList.forEach((order, idx) => {
      order.items = Array.isArray(order.items) ? order.items : [];
      const chronoIndexRaw = sortedOrders.findIndex(o => o.id === order.id);
      const chronoIndex = chronoIndexRaw === -1 ? null : chronoIndexRaw + 1;
      const displayId = chronoIndex ? padNumber(chronoIndex, 3) : (order.id || '---');
      const tr = document.createElement('tr');
      const drinksList = order.items.map(i => `${i.qty}x ${i.name}`).join('<br>');
      const sizesList = order.items.map(i => `${i.size} ${i.qty ? '×' + i.qty : ''}`).join('<br>');
      const specialList = order.items.map(i => { let s = i.special && i.special !== 'None' ? i.special : ''; if (i.notes) s = (s ? s + ' • ' : '') + `Notes: ${i.notes}`; return s || '-'; }).join('<br>');
      const orderLevelNotes = order.customerNotes && order.customerNotes.trim() !== '' ? `<div style="margin-top:6px; font-style:italic; color:#666;">Customer Notes: ${order.customerNotes}</div>` : '';
      tr.innerHTML = `\n  <td>${displayId}</td>\n        <td>\n          <strong>${order.customerName}</strong><br>\n          <small class="muted">${order.customerPhone}</small>\n        </td>\n        <td>${drinksList}${orderLevelNotes}</td>\n        <td>${sizesList}</td>\n        <td>${specialList}</td>\n        <td>\n          <span class="badge ${order.status === 'pending' ? 'badge-pending' : 'badge-approved'}">\n            ${order.status.toUpperCase()}\n          </span>\n        </td>\n        <td>\n          ${order.status === 'pending' ? `\n            <button class="action-btn action-approve" onclick="approveOrder('${order.id}')">Approve</button>\n            <button class="action-btn action-cancel" onclick="cancelOrder('${order.id}')">Cancel</button>\n          ` : `\n            <span class="muted">Completed</span>\n          `}\n          <button class="action-btn action-cancel" onclick="viewOrderDetails('${order.id}')" style="margin-left: 5px;">\n            <i class="fa-solid fa-eye"></i>\n          </button>\n        </td>\n        <td>₱${(Number(order.total) || 0).toFixed(2)}</td>\n      `;
      tbody.appendChild(tr);
    });
  }
  updateSalesStats(orders, sales);
}

function updateSalesStats(orders, sales) {
  const pendingOrders = orders.filter(order => order.status === 'pending').length;
  const approvedOrders = orders.filter(order => order.status === 'approved').length;
  sales.pendingOrders = pendingOrders; sales.approvedOrders = approvedOrders; sales.totalOrders = orders.length; localStorage.setItem("jessie_sales", JSON.stringify(sales));
  const elSales = document.getElementById('total-sales'); if (elSales) elSales.textContent = `₱${(sales.totalSales || 0).toFixed(2)}`;
  const elTotalOrders = document.getElementById('total-orders'); if (elTotalOrders) elTotalOrders.textContent = sales.totalOrders || 0;
  const elPending = document.getElementById('pending-orders'); if (elPending) elPending.textContent = pendingOrders;
  const elApproved = document.getElementById('approved-orders'); if (elApproved) elApproved.textContent = approvedOrders;
}

window.addEventListener('storage', (e) => {
  if (!e.key) return;
  if (e.key === 'jessie_orders' || e.key === 'jessie_sales') {
    try { loadOrders(); const salesObj = JSON.parse(localStorage.getItem('jessie_sales') || '{}'); const ordersObj = JSON.parse(localStorage.getItem('jessie_orders') || '[]'); updateSalesStats(ordersObj, salesObj); } catch (err) { console.error('Error refreshing data from storage event:', err); }
  }
});

function viewDetailedReport() { showPopup('info', { title: 'Detailed Sales Report', message: 'Loading detailed sales analytics and charts...', actions: [ { text: 'View Charts', type: 'primary', handler: () => { showToast('info', 'Report Opened', 'Detailed sales report is now displayed.'); hidePopup(); } } ] }); }

function applyPromo() { showPopup('success', { title: 'Apply Promotion', message: '10% discount will be applied to the selected order.', actions: [ { text: 'Apply Discount', type: 'primary', handler: () => { showToast('success', 'Promo Applied', '10% discount has been applied to the order!'); hidePopup(); } } ] }); }

document.getElementById('receiptForm').addEventListener('submit', function(e) { e.preventDefault(); const email = document.getElementById('email').value; showPopup('info', { title: 'Send Receipt', message: `Sending receipt to ${email}...`, actions: [ { text: 'Send Receipt', type: 'primary', handler: () => { showToast('success', 'Receipt Sent', `Receipt has been sent to ${email}`); this.reset(); hidePopup(); } } ] }); });

document.getElementById('notificationForm').addEventListener('submit', function(e) { e.preventDefault(); const message = document.getElementById('message').value; showPopup('warning', { title: 'Send Notification', message: `Are you sure you want to send this notification to all customers?\n\n"${message}"`, actions: [ { text: 'Cancel', type: 'secondary', handler: hidePopup }, { text: 'Send to All Customers', type: 'primary', handler: () => { showToast('success', 'Notification Sent', 'Message has been sent to all customers'); this.reset(); hidePopup(); } } ] }); });

document.getElementById('logoutBtn').addEventListener('click', function() { showPopup('warning', { title: 'Confirm Logout', message: 'Are you sure you want to log out from the cashier dashboard?', actions: [ { text: 'Cancel', type: 'secondary', handler: hidePopup }, { text: 'Log Out', type: 'primary', handler: () => { localStorage.removeItem("isLoggedIn"); localStorage.removeItem("currentUser"); showToast('success', 'Logged Out', 'You have been successfully logged out.'); setTimeout(() => { window.location.href = "customer_portal-main/login.html"; }, 1500); } } ] }); });

document.getElementById('newItemBtn').addEventListener('click', function() { showPopup('info', { title: 'Create New', message: 'What would you like to create?', actions: [ { text: 'New Order', type: 'primary', handler: () => { showToast('info', 'New Order', 'Opening new order form...'); hidePopup(); } }, { text: 'New Customer', type: 'primary', handler: () => { showToast('info', 'New Customer', 'Opening customer registration...'); hidePopup(); } } ] }); });

document.getElementById('searchInput').addEventListener('input', function(e) { if (e.target.value.length > 2) { showToast('info', 'Searching...', `Searching for "${e.target.value}"`); } });

setTimeout(() => { const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}"); if (currentUser.name) { showToast('success', 'Cashier Dashboard', `Welcome back, ${currentUser.name}!`); } }, 1000);
