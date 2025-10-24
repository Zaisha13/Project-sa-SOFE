// admin.js - extracted from admin.html

// Authentication temporarily bypassed for development/testing.
// The admin dashboard will initialize immediately without requiring login.
document.addEventListener('DOMContentLoaded', function() {
    // NOTE: Previously this required a logged-in admin. That check is intentionally disabled now.
    initializeAdminDashboard();
});

// Lightweight popup/toast helpers (self-contained so admin page doesn't depend on other pages)
function showPopup(type, options = {}) {
    // Remove any existing popup
    hidePopup();
    const popup = document.createElement('div');
    popup.className = 'popup-overlay';
    const inner = document.createElement('div');
    inner.className = `popup popup-${type || 'info'}`;

    if (options.title) {
        const h = document.createElement('h3');
        h.textContent = options.title;
        inner.appendChild(h);
    }
    if (options.message) {
        const p = document.createElement('p');
        p.textContent = options.message;
        inner.appendChild(p);
    }
    if (options.customContent) {
        const wrapper = document.createElement('div');
        if (typeof options.customContent === 'string') wrapper.innerHTML = options.customContent; else wrapper.appendChild(options.customContent);
        inner.appendChild(wrapper);
    }

    const actionsContainer = document.createElement('div');
    actionsContainer.className = 'popup-actions';
    if (Array.isArray(options.actions)) {
        options.actions.forEach(action => {
            const btn = document.createElement('button');
            btn.className = `btn btn-${action.type || 'primary'}`;
            btn.textContent = action.text || 'Action';
            btn.addEventListener('click', (e) => {
                try { if (typeof action.handler === 'function') action.handler(e); } catch (err) { console.error(err); }
            });
            actionsContainer.appendChild(btn);
        });
    } else {
        // Default action: Close
        const btn = document.createElement('button');
        btn.className = 'btn btn-primary';
        btn.textContent = 'Close';
        btn.addEventListener('click', hidePopup);
        actionsContainer.appendChild(btn);
    }

    inner.appendChild(actionsContainer);
    popup.appendChild(inner);
    document.body.appendChild(popup);

    // allow clicking on backdrop to close if allowed
    if (options.backdrop !== false) {
        popup.addEventListener('click', function(e){ if (e.target === popup) hidePopup(); });
    }

    // focus first input if present
    setTimeout(()=>{
        const firstInput = popup.querySelector('input, button, select, textarea');
        if (firstInput) firstInput.focus();
    }, 50);
}

function hidePopup(){
    const p = document.querySelector('.popup-overlay');
    if (p) p.remove();
}

function showToast(type='info', title='', message=''){
    // simple toast bubble similar to other pages
    const t = document.createElement('div');
    t.className = `toast toast-${type}`;
    t.innerHTML = title ? `<strong>${title}</strong><div>${message}</div>` : (message || title || '');
    document.body.appendChild(t);
    setTimeout(()=> t.classList.add('visible'), 20);
    setTimeout(()=> { t.classList.remove('visible'); setTimeout(()=> t.remove(), 350); }, 3000);
}

function initializeAdminDashboard() {
    // DOM Elements
    const sidebar = document.getElementById('admin-sidebar');
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebarBackdrop = document.getElementById('sidebar-backdrop');
    const pageTitle = document.getElementById('page-title');
    const welcomeMessage = document.getElementById('welcome-message');
    const logoutBtn = document.getElementById('logout-btn');
    const sidebarLinks = document.querySelectorAll('.sidebar-link');
    const contentSections = document.querySelectorAll('.content-section');
    
    // Menu Management Elements
    const addItemBtn = document.getElementById('add-item-btn');
    const editMenuBtn = document.getElementById('edit-menu-btn');
    const modalTitle = document.getElementById('modal-title');
    const menuModal = document.getElementById('menu-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const addItemForm = document.getElementById('add-item-form');
    const menuContainer = document.getElementById('current-menu-container');
    
    const itemNameInput = document.getElementById('item-name');
    const itemDescInput = document.getElementById('item-description');
    const itemImageInput = document.getElementById('item-image');
    const itemImageDataInput = document.getElementById('item-image-data'); 
    const saveItemBtn = document.getElementById('save-item-btn');
    const deleteItemOnEditBtn = document.getElementById('delete-item-on-edit-btn');

    const menuList = document.getElementById('menu-list');
    const menuGrid = document.getElementById('menu-grid');
    const noMenuMessage = document.getElementById('no-menu-message');

    // Focus management for modal: remember last focused element and restore on close
    let _lastFocused = null;
    function modalKeyHandler(e){ if (e.key === 'Escape') closeMenuModal(); }
    function openMenuModal(){
        _lastFocused = document.activeElement;
        if (menuModal) menuModal.style.display = 'flex';
        if (itemNameInput) setTimeout(()=> itemNameInput.focus(), 50);
        document.addEventListener('keydown', modalKeyHandler);
    }
    function closeMenuModal(){
        if (menuModal) menuModal.style.display = 'none';
        document.removeEventListener('keydown', modalKeyHandler);
        try { if (_lastFocused && typeof _lastFocused.focus === 'function') _lastFocused.focus(); } catch(e){}
    }
    
    // Account Management Elements
    const createAccountForm = document.getElementById('create-account-form');
    const accountsList = document.getElementById('accounts-list');
    
    // Dashboard Elements
    const announcementForm = document.getElementById('announcement-form');
    const announcementsList = document.getElementById('announcements-list');
    
    // Settings Elements
    const generalSettingsForm = document.getElementById('general-settings-form');
    const notificationSettingsForm = document.getElementById('notification-settings-form');
    const backupBtn = document.getElementById('backup-btn');
    const clearCacheBtn = document.getElementById('clear-cache-btn');
    const clearLogsBtn = document.getElementById('clear-logs-btn');
    
    // Storage Keys
    const MENU_STORAGE_KEY = "jessieCaneMenu";
    const ACCOUNTS_STORAGE_KEY = "jessieCaneAccounts";
    const ANNOUNCEMENTS_STORAGE_KEY = "jessieCaneAnnouncements";
    const SETTINGS_STORAGE_KEY = "jessieCaneSettings";
    const CUSTOMER_MENU_KEY = "jessie_menu";
                
    const DEFAULT_IMAGE = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' fill='%23FFD966'/><text x='50' y='55' font-size='30' fill='%23146B33' text-anchor='middle'>JC</text></svg>";

    // Canonical default menu items (12 items provided by admin)
    const DEFAULT_MENU_ITEMS = [
        { id: 1, name: 'Pure Sugarcane', description: 'Freshly pressed sugarcane juice in its purest form — naturally sweet, refreshing, and energizing with no added sugar or preservatives.', priceRegular: 79, priceTall: 109, img: 'images/pure-sugarcane.png' },
        { id: 2, name: 'Calamansi Cane', description: 'A zesty twist on classic sugarcane juice, blended with the tangy freshness of calamansi for a perfectly balanced sweet and citrusy drink.', priceRegular: 89, priceTall: 119, img: 'images/calamansi-cane.png' },
        { id: 3, name: 'Lemon Cane', description: 'Freshly squeezed lemon combined with pure sugarcane juice, creating a crisp and revitalizing drink that awakens your senses.', priceRegular: 89, priceTall: 119, img: 'images/lemon-cane.png' },
        { id: 4, name: 'Yakult Cane', description: 'A delightful mix of sugarcane juice and Yakult — smooth, creamy, and packed with probiotics for a unique sweet-tangy flavor.', priceRegular: 89, priceTall: 119, img: 'images/yakult-cane.png' },
        { id: 5, name: 'Calamansi Yakult Cane', description: 'A refreshing blend of calamansi, Yakult, and sugarcane juice — the perfect harmony of sweet, sour, and creamy goodness.', priceRegular: 99, priceTall: 129, img: 'images/calamansi-yakult-cane.png' },
        { id: 6, name: 'Lemon Yakult Cane', description: 'Experience a fusion of lemon’s zesty tang with Yakult’s smooth creaminess, all complemented by naturally sweet sugarcane.', priceRegular: 99, priceTall: 129, img: 'images/lemon-yakult-cane.png' },
        { id: 7, name: 'Lychee Cane', description: 'A fragrant and fruity treat made with the exotic sweetness of lychee and the crisp freshness of sugarcane juice.', priceRegular: 99, priceTall: 129, img: 'images/lychee-cane.png' },
        { id: 8, name: 'Orange Cane', description: 'Fresh orange juice blended with pure sugarcane extract for a bright, citrusy burst of sunshine in every sip.', priceRegular: 109, priceTall: 139, img: 'images/orange-cane.png' },
        { id: 9, name: 'Passion Fruit Cane', description: 'A tropical blend of tangy passion fruit and naturally sweet sugarcane — vibrant, juicy, and irresistibly refreshing.', priceRegular: 119, priceTall: 149, img: 'images/passion-fruit-cane.png' },
        { id: 10, name: 'Watermelon Cane', description: 'A hydrating fusion of freshly pressed watermelon and sugarcane juice, offering a light, cooling sweetness that’s perfect for hot days.', priceRegular: 119, priceTall: 149, img: 'images/watermelon-cane.png' },
        { id: 11, name: 'Strawberry Yogurt Cane', description: 'Creamy strawberry yogurt meets sweet sugarcane for a smooth, fruity, and indulgent drink that’s both refreshing and satisfying.', priceRegular: 119, priceTall: 149, img: 'images/strawberry-yogurt-cane.png' },
        { id: 12, name: 'Dragon Fruit Cane', description: 'A vibrant blend of dragon fruit and pure sugarcane juice — visually stunning, naturally sweet, and loaded with antioxidants.', priceRegular: 119, priceTall: 149, img: 'images/dragon-fruit-cane.png' }
    ];

    // Set welcome message
    const sessionUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
    if (sessionUser.name) {
        welcomeMessage.textContent = `Welcome, ${sessionUser.name}!`;
        welcomeMessage.classList.remove('hidden');
    }

    // --- SYNC MENU TO CUSTOMER DASHBOARD ---
    function syncMenuToCustomerDashboard() {
        const adminMenu = JSON.parse(localStorage.getItem(MENU_STORAGE_KEY) || "[]");

        // Build a merged menu: start from canonical defaults, ensure ids, overlay admin items by id first, then by name; append new admin items with new ids
        const merged = DEFAULT_MENU_ITEMS.slice().map((item, idx) => Object.assign({}, item, { id: item.id || idx + 1 }));

        // build lookup by id and by name
        const byId = {};
        const byName = {};
        merged.forEach(it => {
            if (it.id) byId[it.id] = it;
            if (it.name) byName[(it.name || '').toLowerCase()] = it;
        });

        // find current max id to assign new ids
        let maxId = merged.reduce((m, it) => Math.max(m, (it.id || 0)), 0);

        (Array.isArray(adminMenu) ? adminMenu : []).forEach(aItem => {
            const finalImage = aItem.image || aItem.img || DEFAULT_IMAGE;
            const migratedRegular = (typeof aItem.priceRegular === 'number') ? aItem.priceRegular : (parseFloat(aItem.priceRegular) || parseFloat(aItem.priceSmall) || 0);
            const migratedTall = (typeof aItem.priceTall === 'number') ? aItem.priceTall : (parseFloat(aItem.priceTall) || parseFloat(aItem.priceMedium) || parseFloat(aItem.priceLarge) || migratedRegular);

            const normalized = {
                name: aItem.name || 'Unnamed',
                desc: aItem.description || aItem.desc || aItem.description || '',
                priceRegular: Number(migratedRegular || 0),
                priceTall: Number(migratedTall || migratedRegular || 0),
                img: finalImage
            };

            // prefer id-based overlay
            if (aItem.id && byId[aItem.id]) {
                const existing = byId[aItem.id];
                Object.assign(existing, normalized);
            } else if (aItem.id) {
                // id present but new - add it
                normalized.id = aItem.id;
                merged.push(normalized);
                byId[normalized.id] = normalized;
                byName[(normalized.name||'').toLowerCase()] = normalized;
                maxId = Math.max(maxId, normalized.id || 0);
            } else if (aItem.name && byName[(aItem.name||'').toLowerCase()]) {
                // match by name
                const existing = byName[(aItem.name||'').toLowerCase()];
                Object.assign(existing, normalized);
            } else {
                // new item - assign id
                maxId++;
                normalized.id = maxId;
                merged.push(normalized);
                byId[normalized.id] = normalized;
                byName[(normalized.name||'').toLowerCase()] = normalized;
            }
        });

        // Ensure every item has a stable numeric id (preserve existing ids where present)
        const finalForCustomer = merged.map(it => {
            if (!it.id) {
                maxId++;
                it.id = maxId;
            }
            return it;
        });

        // Persist merged arrays back to admin storage and customer storage (identical arrays)
        localStorage.setItem(MENU_STORAGE_KEY, JSON.stringify(finalForCustomer));
        localStorage.setItem(CUSTOMER_MENU_KEY, JSON.stringify(finalForCustomer));

        showToast('success','Menu updated', `Menu updated and synced to customer dashboard. ${finalForCustomer.length} items available.`);
    }

    // Update menu and sync
    function updateMenuAndSync() {
        renderMainGrid();
        renderModalList();
        syncMenuToCustomerDashboard();
    }

    // Logout functionality
    logoutBtn.addEventListener('click', () => {
        showPopup('warning', {
            title: 'Confirm Logout',
            message: 'Are you sure you want to log out?',
            actions: [
                { text: 'Cancel', type: 'secondary', handler: hidePopup },
                { text: 'Log Out', type: 'primary', handler: () => { localStorage.removeItem('isLoggedIn'); localStorage.removeItem('currentUser'); window.location.href = 'login.html'; } }
            ]
        });
    });

    // --- NAVIGATION LOGIC ---
    function switchSection(sectionId) {
        // Update active nav link
        sidebarLinks.forEach(link => {
            if (link.getAttribute('data-section') === sectionId) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
        
        // Show active section
        contentSections.forEach(section => {
            if (section.id === sectionId) {
                section.classList.add('active');
            } else {
                section.classList.remove('active');
            }
        });
        
        // Update page title
        const sectionTitles = {
            'dashboard': 'Dashboard',
            'menu-management': 'Menu Management',
            'account-management': 'Account Management',
            'settings': 'System Settings',
            'sales-report': 'Sales Report'
        };
        pageTitle.textContent = sectionTitles[sectionId];
        
        // Load section-specific data
        if (sectionId === 'menu-management') {
            renderMainGrid();
        } else if (sectionId === 'account-management') {
            renderAccountsList();
        } else if (sectionId === 'sales-report') {
            // no additional render required; iframe loads cashier
        }
    }

    // Add event listeners to nav links
    sidebarLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionId = link.getAttribute('data-section');
            switchSection(sectionId);
            
            // Close sidebar on mobile
            if (window.innerWidth < 768) {
                toggleSidebar();
            }
        });
    });

    // --- MOBILE SIDEBAR TOGGLE LOGIC ---
    const toggleSidebar = () => {
        sidebar.classList.toggle('open');
        sidebarBackdrop.classList.toggle('show');
    }

    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', toggleSidebar);
    }
    if (sidebarBackdrop) {
        sidebarBackdrop.addEventListener('click', toggleSidebar);
    }

    // --- DASHBOARD FUNCTIONALITY ---
    if (announcementForm) {
        announcementForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const title = document.getElementById('announcement-title').value;
            const content = document.getElementById('announcement-content').value;
            
            if (title && content) {
                const announcement = {
                    title,
                    content,
                    date: new Date().toLocaleDateString()
                };
                
                // Save to localStorage
                const announcements = JSON.parse(localStorage.getItem(ANNOUNCEMENTS_STORAGE_KEY) || '[]');
                announcements.unshift(announcement);
                localStorage.setItem(ANNOUNCEMENTS_STORAGE_KEY, JSON.stringify(announcements));
                
                // Update UI
                renderAnnouncements();
                showToast('success','Announcement posted','Announcement posted successfully!');
                announcementForm.reset();
            } else {
                showToast('error','Missing fields','Please fill in both title and content.');
            }
        });
    }

    function renderAnnouncements() {
        if (!announcementsList) return;
        
        const announcements = JSON.parse(localStorage.getItem(ANNOUNCEMENTS_STORAGE_KEY) || '[]');
        announcementsList.innerHTML = '';
        
        if (announcements.length === 0) {
            announcementsList.innerHTML = '<p class="text-center text-gray-500 py-4">No announcements yet.</p>';
        } else {
            announcements.forEach(announcement => {
                const announcementEl = document.createElement('div');
                announcementEl.className = 'bg-white p-4 rounded-lg border border-primary-dark';
                announcementEl.innerHTML = `
                    <h4 class="font-bold text-lg text-primary-dark">${announcement.title}</h4>
                    <p class="text-gray-700 mt-2">${announcement.content}</p>
                    <p class="text-gray-500 text-sm mt-2">Posted on: ${announcement.date}</p>
                `;
                announcementsList.appendChild(announcementEl);
            });
        }
    }

    // --- ACCOUNT MANAGEMENT FUNCTIONALITY ---
    if (createAccountForm) {
        createAccountForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = document.getElementById('account-username').value;
            const password = document.getElementById('account-password').value;
            const role = document.getElementById('account-role').value;
            
            if (username && password) {
                // Check if username already exists
                const accounts = JSON.parse(localStorage.getItem(ACCOUNTS_STORAGE_KEY) || '[]');
                const existingUser = accounts.find(acc => acc.username === username);
                
                if (existingUser) {
                    showToast('error','Duplicate','Username already exists. Please choose a different username.');
                    return;
                }
                
                // Create new account
                const newAccount = {
                    username,
                    password,
                    role
                };
                
                accounts.push(newAccount);
                localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
                
                // Update UI
                renderAccountsList();
                showToast('success','Account created', `${role} account created successfully!`);
                createAccountForm.reset();
            } else {
                showToast('error','Missing fields','Please fill in all fields.');
            }
        });
    }

    function renderAccountsList() {
        if (!accountsList) return;
        
        const accounts = JSON.parse(localStorage.getItem(ACCOUNTS_STORAGE_KEY) || '[]');
        accountsList.innerHTML = '';
        
        if (accounts.length === 0) {
            accountsList.innerHTML = '<tr><td colspan="3" class="text-center py-4">No accounts found.</td></tr>';
        } else {
            accounts.forEach((account, index) => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${account.username}</td>
                    <td>${account.role}</td>
                    <td>
                        <button class="edit-account-btn action-btn bg-primary-dark text-white text-sm px-3 py-1 rounded-lg hover:bg-accent-dark mr-2" data-index="${index}">
                            <i class="fa-solid fa-pen"></i> Edit
                        </button>
                        <button class="delete-account-btn action-btn bg-red-600 text-white text-sm px-3 py-1 rounded-lg hover:bg-red-700" data-index="${index}">
                            <i class="fa-solid fa-trash"></i> Delete
                        </button>
                    </td>
                `;
                accountsList.appendChild(row);
            });
            
            // Add event listeners to action buttons
            document.querySelectorAll('.edit-account-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const index = parseInt(this.getAttribute('data-index'));
                    editAccount(index);
                });
            });
            
            document.querySelectorAll('.delete-account-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const index = parseInt(this.getAttribute('data-index'));
                    deleteAccount(index);
                });
            });
        }
    }

    function editAccount(index) {
        const accounts = JSON.parse(localStorage.getItem(ACCOUNTS_STORAGE_KEY) || '[]');
        const account = accounts[index];

        // Build custom form inside popup
        const html = `
            <div style="display:flex;flex-direction:column;gap:8px;">
              <label>Username<br/><input id="admin-edit-username" value="${(account.username||'').replace(/\"/g,'&quot;')}" /></label>
              <label>Role<br/><select id="admin-edit-role"><option value="Customer">Customer</option><option value="Cashier">Cashier</option></select></label>
            </div>
        `;

        showPopup('info', {
            title: 'Edit Account',
            customContent: html,
            actions: [
                { text: 'Cancel', type: 'secondary', handler: hidePopup },
                { text: 'Save', type: 'primary', handler: () => {
                    const newUsername = document.getElementById('admin-edit-username').value.trim();
                    const newRole = document.getElementById('admin-edit-role').value;
                    if (!newUsername) { showToast('error','Invalid','Username cannot be empty'); return; }
                    const usernameExists = accounts.some((acc,i)=> i!==index && acc.username === newUsername);
                    if (usernameExists) { showToast('error','Duplicate','Username already exists.'); return; }
                    account.username = newUsername;
                    if (newRole === 'Customer' || newRole === 'Cashier') account.role = newRole;
                    localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
                    renderAccountsList();
                    hidePopup();
                    showToast('success','Updated','Account updated successfully!');
                } }
            ]
        });
        // set select value after popup created
        setTimeout(()=>{
            const sel = document.getElementById('admin-edit-role'); if (sel) sel.value = account.role || 'Customer';
        },50);
    }

    function deleteAccount(index) {
        const accounts = JSON.parse(localStorage.getItem(ACCOUNTS_STORAGE_KEY) || '[]');
        const account = accounts[index];
        showPopup('warning', {
            title: 'Delete Account',
            message: `Are you sure you want to delete the account: "${account.username}"?`,
            actions: [
                { text: 'Cancel', type: 'secondary', handler: hidePopup },
                { text: 'Delete', type: 'primary', handler: () => { accounts.splice(index,1); localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts)); renderAccountsList(); hidePopup(); showToast('success','Deleted','Account deleted successfully!'); } }
            ]
        });
    }

    // --- SETTINGS FUNCTIONALITY ---
    if (generalSettingsForm) {
        generalSettingsForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const businessName = document.getElementById('business-name').value;
            const defaultCurrency = document.getElementById('default-currency').value;
            const taxRate = document.getElementById('tax-rate').value;
            
            const settings = JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY) || '{}');
            settings.general = {
                businessName,
                defaultCurrency,
                taxRate: parseFloat(taxRate)
            };
            
            localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
            showToast('success','Saved','General settings saved successfully!');
        });
    }

    if (notificationSettingsForm) {
        notificationSettingsForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const lowStockNotifications = document.getElementById('low-stock-notifications').checked;
            const newOrderNotifications = document.getElementById('new-order-notifications').checked;
            const dailySalesReport = document.getElementById('daily-sales-report').checked;
            const notificationEmail = document.getElementById('notification-email').value;
            
            const settings = JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY) || '{}');
            settings.notifications = {
                lowStockNotifications,
                newOrderNotifications,
                dailySalesReport,
                notificationEmail
            };
            
            localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
            showToast('success','Saved','Notification settings saved successfully!');
        });
    }

    // System buttons functionality
    if (backupBtn) {
        backupBtn.addEventListener('click', () => {
            showToast('info','Backup','Database backup initiated!');
            // Simulate backup process
            setTimeout(() => {
                document.getElementById('last-backup').textContent = new Date().toLocaleString();
                showToast('success','Backup','Backup completed successfully!');
            }, 1000);
        });
    }

    if (clearCacheBtn) {
        clearCacheBtn.addEventListener('click', () => {
            showPopup('warning', { title: 'Clear Cache', message: 'Are you sure you want to clear the cache?', actions: [ { text: 'Cancel', type: 'secondary', handler: hidePopup }, { text: 'Clear', type: 'primary', handler: () => { showToast('success','Cache','Cache cleared successfully!'); location.reload(); } } ] });
        });
    }

    if (clearLogsBtn) {
        clearLogsBtn.addEventListener('click', () => {
            showPopup('warning', { title: 'Clear Logs', message: 'Are you sure you want to clear all logs?', actions: [ { text: 'Cancel', type: 'secondary', handler: hidePopup }, { text: 'Clear', type: 'primary', handler: () => { showToast('success','Logs','Logs cleared successfully!'); } } ] });
        });
    }

    // Load saved settings
    function loadSettings() {
        const settings = JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY) || '{}');
        
        if (settings.general) {
            document.getElementById('business-name').value = settings.general.businessName || 'Jessie Cane Juicebar';
            document.getElementById('default-currency').value = settings.general.defaultCurrency || 'PHP';
            document.getElementById('tax-rate').value = settings.general.taxRate || 8.5;
        }
        
        if (settings.notifications) {
            document.getElementById('low-stock-notifications').checked = settings.notifications.lowStockNotifications || false;
            document.getElementById('new-order-notifications').checked = settings.notifications.newOrderNotifications || false;
            document.getElementById('daily-sales-report').checked = settings.notifications.dailySalesReport || false;
            document.getElementById('notification-email').value = settings.notifications.notificationEmail || 'admin@jessiecane.com';
        }
    }

    // --- MENU MANAGEMENT FUNCTIONALITY ---

    // Function to render menu items in the main grid
    const renderMainGrid = () => {
        if (!menuGrid) return;
        
        // Prefer admin-stored menu; if empty, show defaults
        const stored = JSON.parse(localStorage.getItem(MENU_STORAGE_KEY) || '[]');
        const menuItems = (Array.isArray(stored) && stored.length > 0) ? stored : DEFAULT_MENU_ITEMS;
        menuGrid.innerHTML = '';
        
        if (menuItems.length === 0) {
            noMenuMessage.classList.remove('hidden');
        } else {
            noMenuMessage.classList.add('hidden');
            menuItems.forEach(item => {
                const card = document.createElement('div');
                const imageUrl = item.img || item.image || DEFAULT_IMAGE;
                
                card.className = 'menu-card p-6 rounded-3xl shadow-xl text-center transition-transform duration-300 hover:scale-[1.03] hover:shadow-2xl';
                
                card.innerHTML = `
                    <img src="${imageUrl}" alt="${item.name}" class="w-24 h-24 object-cover rounded-full mx-auto mb-4 border-4 border-primary-dark shadow-md">
                    <div class="mb-4">
                        <h3 class="text-3xl font-extrabold text-primary-dark mb-1 text-shadow-juice">${item.name}</h3>
                        <p class="text-accent-dark text-base">${item.description}</p>
                    </div>
                    <div class="text-center space-y-2">
                        <div class="bg-juice-highlight p-2 rounded-full shadow-inner border border-primary-dark">
                                        <p class="text-lg font-bold text-primary-dark">Regular: ₱${parseFloat(item.priceRegular||item.priceSmall||0).toFixed(2)}</p>
                        </div>
                        <div class="bg-juice-highlight p-2 rounded-full shadow-inner border border-primary-dark">
                            <p class="text-lg font-bold text-primary-dark">Tall: ₱${parseFloat(item.priceTall||item.priceMedium||item.priceLarge||item.priceSmall||0).toFixed(2)}</p>
                        </div>
                        <!-- Large size removed; show only Regular and Tall -->
                    </div>
                `;
                menuGrid.appendChild(card);
            });
        }
    };

    // Function to render menu items in the modal list for editing
    const renderModalList = () => {
        if (!menuList) return;
        // Prefer admin-stored menu; fallback to defaults so admin can edit defaults
        const stored = JSON.parse(localStorage.getItem(MENU_STORAGE_KEY) || '[]');
        const menuItems = (Array.isArray(stored) && stored.length > 0) ? stored : DEFAULT_MENU_ITEMS.slice();
        menuList.innerHTML = '';
        
        if (menuItems.length === 0) {
            menuList.innerHTML = '<p class="text-center text-primary-dark/80 pt-2 pb-1">No items have been added to the menu yet.</p>';
        } else {
            menuItems.forEach((item, index) => {
                const li = document.createElement('li');
                const imageUrl = item.img || item.image || DEFAULT_IMAGE;
                
                li.className = 'flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white p-3 rounded-xl shadow-md border border-accent-dark space-y-2 sm:space-y-0';
                
                li.innerHTML = `
                    <div class="flex items-center flex-grow min-w-0">
                        <img src="${imageUrl}" alt="${item.name}" class="w-10 h-10 object-cover rounded-full mr-3 border border-primary-dark flex-shrink-0">
                        <div class="truncate min-w-0 flex-grow">
                            <h3 class="font-bold text-lg text-primary-dark truncate">${item.name}</h3>
                            <p class="text-gray-600 text-sm">₱${parseFloat(item.priceRegular||item.priceSmall||0).toFixed(2)}</p>
                        </div>
                    </div>
                    <div class="flex space-x-2 flex-shrink-0 w-full sm:w-auto justify-end">
                        <button class="edit-item-btn bg-primary-dark text-white text-sm px-3 py-1 rounded-full font-bold shadow-md hover:bg-accent-dark transition duration-300" data-id="${item.id}">
                            <i class="fa-solid fa-pen"></i> Edit
                        </button>
                        <button class="remove-item-btn bg-red-600 text-white text-sm px-3 py-1 rounded-full font-bold shadow-md hover:bg-red-700 transition duration-300" data-id="${item.id}">
                            <i class="fa-solid fa-trash-can"></i> Del
                        </button>
                    </div>
                `;
                menuList.appendChild(li);
            });
        }
    };

    // Handles opening the modal for editing
    const handleEdit = (id) => {
        const menuItems = JSON.parse(localStorage.getItem(MENU_STORAGE_KEY) || '[]');
        const item = menuItems.find(mi => Number(mi.id) === Number(id));
        const index = menuItems.findIndex(mi => Number(mi.id) === Number(id));

        modalTitle.textContent = "Edit Menu Item";
        addItemForm.style.display = 'block';
        menuContainer.style.display = 'none';
        
        // Set form data
        itemNameInput.value = item.name;
        itemDescInput.value = item.description;
        document.getElementById('item-price-regular').value = item.priceRegular || item.priceSmall || '';
        document.getElementById('item-price-tall').value = item.priceTall || item.priceMedium || item.priceLarge || '';
        itemImageDataInput.value = item.image || item.img || ''; 
        itemImageInput.value = ''; // Clear file input
        
        // Set up form for editing
        addItemForm.setAttribute('data-editing-id', id);
        saveItemBtn.innerHTML = '<i class="fa-solid fa-save mr-2"></i> Update Item';
        deleteItemOnEditBtn.style.display = 'block';
        deleteItemOnEditBtn.setAttribute('data-id', id);
        
        menuModal.style.display = 'flex';
    }

    // Handles deletion of an item
    const handleDelete = (id) => {
        const menuItems = JSON.parse(localStorage.getItem(MENU_STORAGE_KEY) || '[]');
        const index = menuItems.findIndex(mi => Number(mi.id) === Number(id));
        if (index < 0) return;

        const removedName = menuItems[index].name;

        showPopup('warning', {
            title: 'Delete Item',
            message: `Are you sure you want to delete the item: "${removedName}"?`,
            actions: [
                { text: 'Cancel', type: 'secondary', handler: hidePopup },
                { text: 'Delete', type: 'primary', handler: () => {
                    menuItems.splice(index, 1);
                    localStorage.setItem(MENU_STORAGE_KEY, JSON.stringify(menuItems));
                    // Hide modal if deleting from the edit form or list view is active
                    closeMenuModal();
                    showToast('success','Removed', `"${removedName}" removed successfully.`);
                    updateMenuAndSync();
                } }
            ]
        });
    }

    // Handles form submission (Add or Edit)
    const handleFormSubmit = (e) => {
        e.preventDefault();
        
        const editingId = addItemForm.getAttribute('data-editing-id');
        const isEditing = editingId && editingId !== '-1';
        
        const menuItems = JSON.parse(localStorage.getItem(MENU_STORAGE_KEY) || '[]');
        let existingImage = itemImageDataInput.value; 

        const finalizeSave = (newImageData = existingImage) => {
            const newItem = {
                name: itemNameInput.value.trim(),
                description: itemDescInput.value.trim(),
                priceRegular: parseFloat(document.getElementById('item-price-regular').value),
                priceTall: parseFloat(document.getElementById('item-price-tall').value),
                image: newImageData
            };
            
            // Validate prices
            if (newItem.priceRegular <= 0 || newItem.priceTall <= 0) {
                showToast('error','Invalid prices','Please enter positive prices for Regular and Tall');
                return;
            }
            
            // Validate positive prices
            // basic positivity above
            
            if (isEditing) {
                showPopup('warning', {
                    title: 'Apply Changes',
                    message: 'Are you sure you want to apply changes?',
                    actions: [
                        { text: 'Cancel', type: 'secondary', handler: hidePopup },
                        { text: 'Apply', type: 'primary', handler: () => {
                            // proceed with update
                            // ensure both image keys exist for cross-page compatibility
                            newItem.img = newItem.image || '';
                            // locate item index by id
                            const editIndex = menuItems.findIndex(mi => String(mi.id) === String(editingId));
                            if (editIndex === -1) {
                                showToast('error','Not found','Failed to locate the item to update. It may have been removed.');
                                return;
                            }
                            // preserve id
                            newItem.id = menuItems[editIndex].id || editingId;
                            menuItems[editIndex] = newItem;
                            localStorage.setItem(MENU_STORAGE_KEY, JSON.stringify(menuItems));
                            showToast('success','Updated', `"${newItem.name}" updated successfully!`);

                            // reset editing marker
                            addItemForm.setAttribute('data-editing-id', '-1');
                            closeMenuModal();
                            updateMenuAndSync();
                        } }
                    ]
                });
                return; 
            } else {
                // Create Logic
                // ensure both image keys exist for cross-page compatibility
                newItem.img = newItem.image || '';
                // assign stable id
                const existingIds = (menuItems || []).map(i => Number(i.id || 0)).filter(Boolean);
                const nextId = existingIds.length ? Math.max(...existingIds) + 1 : 1;
                newItem.id = nextId;
                menuItems.push(newItem);
                localStorage.setItem(MENU_STORAGE_KEY, JSON.stringify(menuItems));

                showToast('success','Added', `"${newItem.name}" added successfully!`);
                addItemForm.reset();
                itemImageDataInput.value = '';
                updateMenuAndSync();
            }
        };

        const file = itemImageInput.files[0];
        if (file) {
            // Handle new image upload
            if (file.size > 500 * 1024) {
                showToast('error','Image too large','Image file is too large. Please use an image under 500KB.');
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                finalizeSave(reader.result);
            };
            reader.readAsDataURL(file);
        } else {
            // No new file uploaded, use existing image data (for edit) or default (for add)
            finalizeSave();
        }
    };

    // --- EVENT LISTENERS FOR MENU MANAGEMENT ---

    if (addItemBtn) {
        addItemBtn.addEventListener('click', () => {
            modalTitle.textContent = "Add New Item";
            addItemForm.style.display = 'block';
            menuContainer.style.display = 'none';
                addItemForm.reset(); 
            addItemForm.setAttribute('data-editing-id', '-1');
            saveItemBtn.innerHTML = '<i class="fa-solid fa-save mr-2"></i> Save Item';
            deleteItemOnEditBtn.style.display = 'none';
            itemImageDataInput.value = '';
            openMenuModal();
        });
    }

    if (editMenuBtn) {
        editMenuBtn.addEventListener('click', () => {
            modalTitle.textContent = "Edit Current Menu";
            addItemForm.style.display = 'none';
            menuContainer.style.display = 'block';
            renderModalList();
            openMenuModal();
        });
    }

    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            closeMenuModal();
            renderMainGrid();
        });
    }

    window.onclick = (event) => {
        if (event.target == menuModal) {
            menuModal.style.display = 'none';
            renderMainGrid(); 
        }
    };

    if (addItemForm) {
        addItemForm.addEventListener('submit', handleFormSubmit);
    }

    // Event listener delegation for the list container
    if (menuList) {
        menuList.addEventListener('click', (e) => {
            const deleteButton = e.target.closest('.remove-item-btn');
            const editButton = e.target.closest('.edit-item-btn');

            if (deleteButton) {
                const id = deleteButton.getAttribute('data-id');
                handleDelete(id);
            } else if (editButton) {
                const id = editButton.getAttribute('data-id');
                handleEdit(id);
            }
        });
    }

    // Event listener for the delete button on the Edit form
    if (deleteItemOnEditBtn) {
        deleteItemOnEditBtn.addEventListener('click', () => {
            const id = deleteItemOnEditBtn.getAttribute('data-id');
            handleDelete(id);
        });
    }

    // Initialize default menu if none exists
    function initializeDefaultMenu() {
        const menuItems = JSON.parse(localStorage.getItem(MENU_STORAGE_KEY) || '[]');
        // If admin menu is empty, seed with canonical defaults (assign stable ids) so admin sees them
        if (!Array.isArray(menuItems) || menuItems.length === 0) {
            const seeded = DEFAULT_MENU_ITEMS.slice().map((it, idx) => Object.assign({ id: idx + 1 }, it));
            localStorage.setItem(MENU_STORAGE_KEY, JSON.stringify(seeded));
        }
    }

    // Initial setup
    function initializeDefaultData() {
        initializeDefaultMenu();
        
        const accounts = JSON.parse(localStorage.getItem(ACCOUNTS_STORAGE_KEY) || '[]');
        if (accounts.length === 0) {
            accounts.push(
                { username: 'cashier1', password: 'password', role: 'Cashier' },
                { username: 'customer1', password: 'password', role: 'Customer' }
            );
            localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
        }
        
        const announcements = JSON.parse(localStorage.getItem(ANNOUNCEMENTS_STORAGE_KEY) || '[]');
        if (announcements.length === 0) {
            announcements.push(
                { 
                    title: 'Welcome to Jessie Cane!', 
                    content: 'We\'re excited to have you as part of our team. Please familiarize yourself with the system.',
                    date: new Date().toLocaleDateString()
                }
            );
            localStorage.setItem(ANNOUNCEMENTS_STORAGE_KEY, JSON.stringify(announcements));
        }
    }

    // Load initial data
    initializeDefaultData();
    renderAnnouncements();
    renderAccountsList();
    loadSettings();
    renderMainGrid();
    
    // Start with dashboard section
    switchSection('dashboard');

}
