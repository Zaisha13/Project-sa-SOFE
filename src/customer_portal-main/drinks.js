/* PURPOSE: Customer menu and cart logic — rendering products, cart management,
   checkout flow, modals and localStorage persistence (jessie_orders). This file
   handles user interactions on the drinks/menu pages. */

// Get menu items from localStorage (synced from admin)
function getMenuItems() {
    try {
        const storedMenu = JSON.parse(localStorage.getItem("jessie_menu") || "[]");
        // Return only valid items
        // Migrate old price fields (priceSmall/priceMedium/priceLarge) to priceRegular/priceTall if needed
        const migrated = Array.isArray(storedMenu) ? storedMenu.map(item => {
            if (!item) return null;
            // If already has new fields, keep
            if (typeof item.priceRegular === 'number' && typeof item.priceTall === 'number') return item;

            // Migrate using reasonable mapping: Small -> Regular, Medium -> Tall, Large -> Tall (if present, prefer Medium->Tall else Large->Tall)
            const ps = parseFloat(item.priceSmall) || 0;
            const pm = parseFloat(item.priceMedium);
            const pl = parseFloat(item.priceLarge);

            const priceRegular = ps || 0;
            const priceTall = (!isNaN(pm) && pm > 0) ? pm : ( (!isNaN(pl) && pl > 0) ? pl : priceRegular );

            return Object.assign({}, item, { priceRegular, priceTall });
        }).filter(Boolean) : [];

        // keep only items with a positive priceRegular
        return migrated.filter(item => item && item.name && item.name.trim() !== "" && typeof item.priceRegular === 'number' && item.priceRegular > 0);
    } catch (error) {
        console.error('Error parsing menu items:', error);
        return [];
    }
}

const DEFAULT_MENU_ITEMS = [
    { id: 1, name: 'Pure Sugarcane', desc: 'Freshly pressed sugarcane juice in its purest form — naturally sweet, refreshing, and energizing with no added sugar or preservatives.', priceRegular: 79, priceTall: 109, img: 'images/pure-sugarcane.png' },
    { id: 2, name: 'Calamansi Cane', desc: 'A zesty twist on classic sugarcane juice, blended with the tangy freshness of calamansi for a perfectly balanced sweet and citrusy drink.', priceRegular: 89, priceTall: 119, img: 'images/calamansi-cane.png' },
    { id: 3, name: 'Lemon Cane', desc: 'Freshly squeezed lemon combined with pure sugarcane juice, creating a crisp and revitalizing drink that awakens your senses.', priceRegular: 89, priceTall: 119, img: 'images/lemon-cane.png' },
    { id: 4, name: 'Yakult Cane', desc: 'A delightful mix of sugarcane juice and Yakult — smooth, creamy, and packed with probiotics for a unique sweet-tangy flavor.', priceRegular: 89, priceTall: 119, img: 'images/yakult-cane.png' },
    { id: 5, name: 'Calamansi Yakult Cane', desc: 'A refreshing blend of calamansi, Yakult, and sugarcane juice — the perfect harmony of sweet, sour, and creamy goodness.', priceRegular: 99, priceTall: 129, img: 'images/calamansi-yakult-cane.png' },
    { id: 6, name: 'Lemon Yakult Cane', desc: 'Experience a fusion of lemon’s zesty tang with Yakult’s smooth creaminess, all complemented by naturally sweet sugarcane.', priceRegular: 99, priceTall: 129, img: 'images/lemon-yakult-cane.png' },
    { id: 7, name: 'Lychee Cane', desc: 'A fragrant and fruity treat made with the exotic sweetness of lychee and the crisp freshness of sugarcane juice.', priceRegular: 99, priceTall: 129, img: 'images/lychee-cane.png' },
    { id: 8, name: 'Orange Cane', desc: 'Fresh orange juice blended with pure sugarcane extract for a bright, citrusy burst of sunshine in every sip.', priceRegular: 109, priceTall: 139, img: 'images/orange-cane.png' },
    { id: 9, name: 'Passion Fruit Cane', desc: 'A tropical blend of tangy passion fruit and naturally sweet sugarcane — vibrant, juicy, and irresistibly refreshing.', priceRegular: 119, priceTall: 149, img: 'images/passion-fruit-cane.png' },
    { id: 10, name: 'Watermelon Cane', desc: 'A hydrating fusion of freshly pressed watermelon and sugarcane juice, offering a light, cooling sweetness that’s perfect for hot days.', priceRegular: 119, priceTall: 149, img: 'images/watermelon-cane.png' },
    { id: 11, name: 'Strawberry Yogurt Cane', desc: 'Creamy strawberry yogurt meets sweet sugarcane for a smooth, fruity, and indulgent drink that’s both refreshing and satisfying.', priceRegular: 119, priceTall: 149, img: 'images/strawberry-yogurt-cane.png' },
    { id: 12, name: 'Dragon Fruit Cane', desc: 'A vibrant blend of dragon fruit and pure sugarcane juice — visually stunning, naturally sweet, and loaded with antioxidants.', priceRegular: 119, priceTall: 149, img: 'images/dragon-fruit-cane.png' }
];

// Normalize image path: allow data: URLs, absolute http(s) or already-relative 'images/...', otherwise prefix with images/
function normalizeImagePath(src) {
    if (!src) return '';
    try {
        if (typeof src !== 'string') return '';
        const s = src.trim();
        if (!s) return '';
        if (s.startsWith('data:') || s.startsWith('http://') || s.startsWith('https://') || s.startsWith('images/') || s.startsWith('./') || s.startsWith('../')) return s;
        return 'images/' + s;
    } catch (err) {
        return '';
    }
}

// Small helper to escape HTML when injecting user-provided values into strings
function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

// Ensure default menu items exist even before DOMContentLoaded (so site shows items on first visit)
(function ensureDefaultMenuOnLoad() {
    try {
        const existing = JSON.parse(localStorage.getItem('jessie_menu') || '[]');
        if (Array.isArray(existing) && existing.length > 0) return;

        // use canonical DEFAULT_MENU_ITEMS and ensure they appear in storage with new price fields
        const defaults = DEFAULT_MENU_ITEMS.map(i => Object.assign({}, i));
        // If storage empty, set defaults
        localStorage.setItem('jessie_menu', JSON.stringify(defaults));
    } catch (err) {
        console.error('Failed to initialize default menu:', err);
    }
})();

// If running pages via file:// the browser may isolate localStorage per file.
// That causes orders placed from the customer pages to not appear in the
// cashier page. Recommend running a local HTTP server so pages share the
// same origin (http://localhost).
if (typeof window !== 'undefined' && window.location && window.location.protocol === 'file:') {
    console.warn('Running via file:// — localStorage may be isolated between files. Start a local server (e.g. python -m http.server) and open pages via http://localhost to persist orders across pages.');
    document.addEventListener('DOMContentLoaded', () => {
        try {
            if (typeof showPopup === 'function') {
                showPopup('warning', {
                    title: 'Run a local server',
                    message: 'You are viewing the app with file:// protocol. Orders may not persist across pages. Run a local server (e.g. `python -m http.server`) and open pages via http://localhost to ensure persistence.',
                    actions: [ { text: 'OK', type: 'primary', handler: hidePopup } ]
                });
            } else {
                alert('Note: you are running the app via file://. Orders may not persist across pages. Run a local server (for example: `python -m http.server`) and open via http://localhost to persist orders.');
            }
        } catch (e) { /* ignore */ }
    });
}

window.addEventListener("DOMContentLoaded", () => {
    // Public page: allow visiting the menu without logging in.
    // No informational popup is displayed for guests — page loads silently.
    // Keep a light debug trace for diagnostics.
    console.debug('drinks.js: visitor isLoggedIn=', localStorage.getItem('isLoggedIn'));

    // DOM references
    const productsContainer = document.getElementById("products");
    const cartItemsEl = document.getElementById("cart-items");
    const totalDisplay = document.getElementById("total");
    const checkoutBtn = document.getElementById("checkout-btn");
    const clearOrderBtn = document.getElementById("clear-order");

    // Modal references
    const modalBackdrop = document.getElementById("modal-backdrop");
    const modalClose = document.getElementById("modal-close");
    const modalImg = document.getElementById("modal-img");
    const modalName = document.getElementById("modal-name");
    const modalDesc = document.getElementById("modal-desc");
    const sizeButtons = [...document.querySelectorAll(".size-btn")];
    const specialButtons = [...document.querySelectorAll(".special-btn")];
    const qtyDisplay = document.getElementById("qty-display");
    const qtyIncrease = document.getElementById("qty-increase");
    const qtyDecrease = document.getElementById("qty-decrease");
    const notesInput = document.getElementById("notes");
    const modalPriceEl = document.getElementById("modal-price");
    let addConfirmBtn = document.getElementById("add-confirm-btn");
    let isProcessingAdd = false; // guard to avoid duplicate handling when multiple listeners fire
    const modalCancelBtn = document.getElementById('modal-cancel-btn');

    // State
    let cart = [];
    let modalState = { productId: null, size: "Regular", qty: 1, special: "None", notes: "" };

    // No-op: default menu behavior handled by ensureDefaultMenuOnLoad and DEFAULT_MENU_ITEMS
    function initializeDefaultMenuItems() { }

    // Ensure modal is hidden on load
    if (modalBackdrop) {
        modalBackdrop.style.display = "none";
        modalBackdrop.classList.add("hidden");
        modalBackdrop.setAttribute("aria-hidden", "true");
    }

            // Inline login modal helpers (shown on Checkout when visitor not logged in)
            function showLoginModal() {
                console.debug('showLoginModal called');
                const modal = document.getElementById('login-modal');
                if (!modal) { console.warn('login-modal not found'); return; }
                modal.classList.remove('hidden');
                modal.style.display = 'flex';
                modal.setAttribute('aria-hidden', 'false');
                document.body.classList.add('modal-open');

                // wire once
                if (modal.dataset.wired === 'true') return;
                modal.dataset.wired = 'true';

                const closeBtn = document.getElementById('login-close');
                const cancelBtn = document.getElementById('login-cancel');
                const submitBtn = document.getElementById('login-submit');
                const userEl = document.getElementById('inline-username');
                const passEl = document.getElementById('inline-password');

                function hide() { hideLoginModal(); }
                if (closeBtn) closeBtn.addEventListener('click', hide);
                if (cancelBtn) cancelBtn.addEventListener('click', hide);

                if (submitBtn) submitBtn.addEventListener('click', () => {
                    const ident = (userEl?.value || '').trim();
                    const pass = (passEl?.value || '');
                    if (!ident || !pass) { alert('Please enter username/email and password'); return; }
                    const users = JSON.parse(localStorage.getItem('jessie_users') || '[]');
                    const found = users.find(u => (u.email === ident || u.username === ident) && u.password === pass);
                    if (!found) { alert('Incorrect username/email or password'); return; }
                    localStorage.setItem('isLoggedIn', 'true');
                    localStorage.setItem('currentUser', JSON.stringify(found));
                    hideLoginModal();
                    setTimeout(() => { const cb = document.getElementById('checkout-btn'); if (cb) cb.click(); }, 120);
                });
            }

            function hideLoginModal() {
                const modal = document.getElementById('login-modal');
                if (!modal) return;
                modal.classList.add('hidden');
                modal.style.display = 'none';
                modal.setAttribute('aria-hidden', 'true');
                document.body.classList.remove('modal-open');
        }

    // Render product cards using synced menu
    function renderProducts() {
        if (!productsContainer) return;
        const PRODUCTS = getMenuItems();
        productsContainer.innerHTML = "";
        if (PRODUCTS.length === 0) {
            productsContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-glass-water"></i>
                    <h3>Menu Coming Soon!</h3>
                    <p>Our delicious sugarcane drinks are being prepared. Please check back later for our refreshing menu!</p>
                </div>
            `;
            return;
        }

        PRODUCTS.forEach(p => {
            const card = document.createElement("div");
            card.className = "product";
            const imgSrc = normalizeImagePath(p.img);
            const imageHtml = imgSrc && !imgSrc.includes('JC')
                ? `<img src="${imgSrc}" alt="${p.name}" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 100 100\\"><rect width=\\"100\\" height=\\"100\\" fill=\\"%23FFD966\\"/><text x=\\"50\\" y=\\"55\\" font-size=\\"30\\" fill=\\"%23146B33\\" text-anchor=\\"middle\\"></text></svg>`
                : '<div class="no-image-placeholder">🥤</div>';
            card.innerHTML = `
                ${imageHtml}
                <h3>${p.name}</h3>
                <p>${p.desc}</p>
                <div class="price">
                    Regular: ₱${(p.priceRegular || 0).toFixed(2)}<br>
                    Tall: ₱${(p.priceTall || p.priceRegular || 0).toFixed(2)}
                </div>
                <button class="add-btn" data-id="${p.id}">Add to Cart</button>
            `;

            const btn = card.querySelector(".add-btn");
            if (btn) {
                btn.addEventListener("click", (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    openModal(p.id);
                });
            }
            productsContainer.appendChild(card);
        });
    }

    // Open modal (for Add/Edit)
    function openModal(productId) {
        const PRODUCTS = getMenuItems();
        const product = PRODUCTS.find(x => String(x.id) === String(productId));
        if (!product || !modalBackdrop) return;

    modalState = { productId, size: "Regular", qty: 1, special: "None", notes: "" };
    if (modalImg) modalImg.src = normalizeImagePath(product.img) || "";
        if (modalName) modalName.textContent = product.name || "";
        if (modalDesc) modalDesc.textContent = product.desc || "";
        if (notesInput) notesInput.value = "";
        if (qtyDisplay) qtyDisplay.textContent = modalState.qty;

        sizeButtons.forEach(b => {
            const ds = (b.dataset && b.dataset.size) || b.getAttribute && b.getAttribute('data-size') || '';
            b.classList.toggle('active', ds === 'Regular');
        });
        specialButtons.forEach(b => b.classList.toggle("active", b.dataset.special === "None"));
        updateModalPrice();

        modalBackdrop.classList.remove("hidden");
        modalBackdrop.style.display = "flex";
        modalBackdrop.setAttribute("aria-hidden", "false");
        document.body.classList.add("modal-open");

        // Ensure the confirm button gets its handler after modal is inserted into DOM
        // (the modal may be rendered or moved by other code, so query it each time)
        try {
            addConfirmBtn = document.getElementById('add-confirm-btn');
            if (addConfirmBtn) {
                // remove first to avoid duplicate listeners
                addConfirmBtn.removeEventListener('click', handleAddConfirm);
                addConfirmBtn.addEventListener('click', handleAddConfirm);
                // mark the button so delegated click handler knows a direct listener exists
                try { addConfirmBtn.dataset.handlerAttached = 'true'; } catch (err) { /* ignore */ }
            }
        } catch (err) {
            // non-fatal
            console.error('Failed to attach add-confirm handler:', err);
        }
    }

    function closeModal() {
        if (!modalBackdrop) return;
        modalBackdrop.classList.add("hidden");
        modalBackdrop.style.display = "none";
        modalBackdrop.setAttribute("aria-hidden", "true");
        document.body.classList.remove("modal-open");
        // clear handler flag to ensure delegated handler can work correctly next time
        try {
            if (addConfirmBtn && addConfirmBtn.dataset) delete addConfirmBtn.dataset.handlerAttached;
        } catch (err) { /* ignore */ }
    }

    // Quick-add: add a product to cart as Regular size, qty 1 (used by Add to Cart buttons)
    function addToCartQuick(productId) {
        const PRODUCTS = getMenuItems();
        const product = PRODUCTS.find(x => String(x.id) === String(productId));
        if (!product) return;

        const basePrice = Number(product.priceRegular || 0);
        const unitPrice = basePrice; // no extras when quick-adding

        const existingIndex = cart.findIndex(item =>
            item.productId === productId &&
            item.size === 'Regular' &&
            item.special === 'None' &&
            (item.notes || '') === ''
        );

        if (existingIndex > -1) {
            cart[existingIndex].qty += 1;
            showToast && showToast('success', 'Cart Updated', `Added 1 more ${product.name} to cart`);
        } else {
            cart.push({
                cartId: Date.now() + Math.random(),
                productId: productId,
                name: product.name,
                img: normalizeImagePath(product.img),
                size: 'Regular',
                special: 'None',
                notes: '',
                qty: 1,
                unitPrice: unitPrice
            });
            showToast && showToast('success', 'Added to Cart', `${product.name} added to your order!`);
        }

        updateCartUI();
    }

    // Update price preview inside modal
function updateModalPrice() {
    const PRODUCTS = getMenuItems();
    const product = PRODUCTS.find(p => p.id === modalState.productId);
    if (!product) {
        modalPriceEl.textContent = `₱0.00`;
        return;
    }

    // Get base price based on selected size - FIXED
    let basePrice = 0;
    switch(modalState.size) {
        case "Regular":
            basePrice = product.priceRegular || 0;
            break;
        case "Tall":
            basePrice = (product.priceTall || product.priceRegular) || 0;
            break;
        default:
            basePrice = product.priceRegular || 0; // Default to regular
    }
    
    const extra = modalState.special === "No Ice" ? 20 : 0;
    const total = (basePrice + extra) * modalState.qty;
    modalPriceEl.textContent = `₱${total.toFixed(2)}`;
}
    

    // Modal controls wiring (size, special, qty, notes)
    sizeButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            sizeButtons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            // dataset.size should already be "Regular" or "Tall"
            modalState.size = btn.dataset.size || btn.getAttribute('data-size') || "Regular";
            updateModalPrice();
        });
    });

    specialButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            specialButtons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            modalState.special = btn.dataset.special || "None";
            updateModalPrice();
        });
    });

    qtyIncrease && qtyIncrease.addEventListener("click", () => {
        modalState.qty++;
        qtyDisplay.textContent = modalState.qty;
        updateModalPrice();
    });

    qtyDecrease && qtyDecrease.addEventListener("click", () => {
        if (modalState.qty > 1) modalState.qty--;
        qtyDisplay.textContent = modalState.qty;
        updateModalPrice();
    });

    notesInput && notesInput.addEventListener("input", (e) => {
        modalState.notes = e.target.value || "";
    });

    // Modal cancel button closes the modal without adding to cart
    if (modalCancelBtn) {
        modalCancelBtn.addEventListener('click', (e) => {
            e.preventDefault();
            closeModal();
        });
    }

    // Add to cart confirm handler
    function handleAddConfirm(e) {
        // Prevent duplicate execution from multiple handlers or rapid clicks.
        // Time-based throttle: ignore calls within 600ms of the last call.
        const now = Date.now();
        if (handleAddConfirm._lastCall && (now - handleAddConfirm._lastCall) < 600) {
            console.debug && console.debug('handleAddConfirm: ignored due to rapid repeat');
            return;
        }
        handleAddConfirm._lastCall = now;

        // Re-entrancy guard shared across delegated and direct handlers
        if (isProcessingAdd) {
            console.debug && console.debug('handleAddConfirm: already processing, ignoring');
            return;
        }
        isProcessingAdd = true;

        // Prevent duplicate execution: if the button is disabled, bail out.
        if (addConfirmBtn && addConfirmBtn.disabled) {
            console.debug && console.debug('handleAddConfirm: ignored because button is disabled');
            isProcessingAdd = false;
            return;
        }

        // disable immediately to guard against duplicate handlers/clicks
        try { if (addConfirmBtn) addConfirmBtn.disabled = true; } catch (err) { /* ignore */ }
        // re-enable after short delay
        setTimeout(() => { try { if (addConfirmBtn) addConfirmBtn.disabled = false; } catch (err) { } }, 400);
        console.debug && console.debug('handleAddConfirm invoked, qty=', modalState.qty);

        try {
            const PRODUCTS = getMenuItems();
            const product = PRODUCTS.find(p => p.id === modalState.productId);
            if (!product) return;

            // Get base price based on selected size - now Regular/Tall
            let basePrice = 0;
            switch(modalState.size) {
                case "Regular":
                    basePrice = product.priceRegular || 0;
                    break;
                case "Tall":
                    basePrice = (product.priceTall || product.priceRegular) || 0;
                    break;
                default:
                    basePrice = product.priceRegular || 0;
            }
            const noIceExtra = modalState.special === "No Ice" ? 20 : 0;
            const unitPrice = basePrice + noIceExtra;

            // merge identical (product+size+special+notes)
            const existingIndex = cart.findIndex(item =>
                item.productId === modalState.productId &&
                item.size === modalState.size &&
                item.special === modalState.special &&
                item.notes === modalState.notes
            );

            // If editing an existing cart item, update it instead of adding new
            if (modalState && modalState.editingCartId) {
                const editId = String(modalState.editingCartId);
                const idxToEdit = cart.findIndex(i => String(i.cartId) === editId);
                if (idxToEdit > -1) {
                    cart[idxToEdit].productId = modalState.productId;
                    cart[idxToEdit].size = modalState.size;
                    cart[idxToEdit].special = modalState.special;
                    cart[idxToEdit].notes = modalState.notes;
                    cart[idxToEdit].qty = modalState.qty;
                    cart[idxToEdit].unitPrice = unitPrice;
                    if (typeof showToast === 'function') showToast('success', 'Cart Updated', `${product.name} updated in your cart`);
                } else {
                    // fallback to add new if the original item no longer exists
                    cart.push({
                        cartId: Date.now() + Math.random(),
                        productId: modalState.productId,
                        name: product.name,
                        img: normalizeImagePath(product.img),
                        size: modalState.size,
                        special: modalState.special,
                        notes: modalState.notes,
                        qty: modalState.qty,
                        unitPrice: unitPrice
                    });
                    if (typeof showToast === 'function') showToast('success', 'Added to Cart', `${product.name} added to your order!`);
                }
                // clear editing flag after applying
                try { delete modalState.editingCartId; } catch (err) { modalState.editingCartId = null; }
            } else if (existingIndex > -1) {
                cart[existingIndex].qty += modalState.qty;
                if (typeof showToast === 'function') showToast('success', 'Cart Updated', `Added ${modalState.qty} more ${product.name} to cart!`);
            } else {
                cart.push({
                    cartId: Date.now() + Math.random(),
                    productId: modalState.productId,
                    name: product.name,
                    img: normalizeImagePath(product.img),
                    size: modalState.size,
                    special: modalState.special,
                    notes: modalState.notes,
                    qty: modalState.qty,
                    unitPrice: unitPrice
                });
                if (typeof showToast === 'function') showToast('success', 'Added to Cart', `${product.name} added to your order!`);
            }

            updateCartUI();
            closeModal();
        } catch (err) {
            console.error('Failed to add to cart:', err);
        } finally {
            // ensure processing flag is cleared after a short delay to avoid races
            setTimeout(() => { try { isProcessingAdd = false; } catch (err) {} }, 300);
        }
    }

    // Fallback: delegate click events for dynamically rendered buttons
    document.addEventListener('click', function (ev) {
        const target = ev.target.closest && ev.target.closest('#add-confirm-btn');
        if (!target) return;
        ev.preventDefault();

        // If this button already has a direct handler attached (we set dataset.handlerAttached),
        // skip the delegated invocation to avoid double-handling.
        try {
            if (target.dataset && target.dataset.handlerAttached === 'true') return;
        } catch (err) {
            // ignore dataset access errors
        }

        // guard against re-entrancy or duplicate handlers
        if (isProcessingAdd) return;
        try {
            isProcessingAdd = true;
            handleAddConfirm(ev);
        } finally {
            // small timeout to prevent accidental double-taps from UI
            setTimeout(() => { isProcessingAdd = false; }, 250);
        }
    });

    // Update cart UI
    function updateCartUI() {
    cartItemsEl.innerHTML = "";
    let total = 0;

    if (cart.length === 0) {
        const emptyMessage = document.createElement('li');
        emptyMessage.className = 'cart-item';
        emptyMessage.innerHTML = `
            <div style="text-align: center; color: #666; font-style: italic; padding: 20px;">
                <i class="fas fa-shopping-cart" style="font-size: 2em; margin-bottom: 10px; display: block;"></i>
                Your cart is empty. Please add items from the menu.
            </div>
        `;
        cartItemsEl.appendChild(emptyMessage);
    } else {
            cart.forEach(item => {
                const subtotal = item.unitPrice * item.qty;
                total += subtotal;

                const li = document.createElement("li");
                li.className = "cart-item";
                li.innerHTML = `
                    <div class="meta">
                        <div class="name">${item.name} <span style="font-weight:600;">(${item.size})</span></div>
                        <div class="sub">${item.special}${item.notes ? " • " + item.notes : ""}</div>
                        <div class="item-price">₱${subtotal}</div>
                    </div>
                    <div class="actions">
                        <div class="qty-mini">
                            <button class="mini-decrease" data-id="${item.cartId}">−</button>
                            <div class="mini-qty">${item.qty}</div>
                            <button class="mini-increase" data-id="${item.cartId}">+</button>
                        </div>
                        <div class="action-buttons">
                            <button class="edit-item" data-id="${item.cartId}" title="Edit">Edit</button>
                            <button class="remove-item" data-id="${item.cartId}" title="Remove">Remove</button>
                        </div>
                    </div>
                `;
                cartItemsEl.appendChild(li);
            });
        }

        totalDisplay.textContent = `₱${total}`;
        attachCartListeners();
    }

    // Attach dynamic cart listeners
    function attachCartListeners() {
        document.querySelectorAll(".mini-increase").forEach(btn => {
            btn.onclick = () => {
                const id = btn.dataset.id;
                const item = cart.find(i => `${i.cartId}` === id);
                if (item) {
                    item.qty++;
                    updateCartUI();
                    showToast('info', 'Quantity Updated', `Increased ${item.name} to ${item.qty}`);
                }
            };
        });

        document.querySelectorAll(".mini-decrease").forEach(btn => {
            btn.onclick = () => {
                const id = btn.dataset.id;
                const idx = cart.findIndex(i => `${i.cartId}` === id);
                if (idx > -1) {
                    if (cart[idx].qty > 1) {
                        cart[idx].qty--;
                        updateCartUI();
                        showToast('info', 'Quantity Updated', `Decreased ${cart[idx].name} to ${cart[idx].qty}`);
                    } else {
                        const itemName = cart[idx].name;
                        cart.splice(idx, 1);
                        updateCartUI();
                        showToast('warning', 'Item Removed', `${itemName} removed from cart`);
                    }
                }
            };
        });

        document.querySelectorAll(".remove-item").forEach(btn => {
            btn.onclick = () => {
                const id = btn.dataset.id;
                const idx = cart.findIndex(i => `${i.cartId}` === id);
                if (idx > -1) {
                    const itemName = cart[idx].name;
                    showPopup('warning', {
                        title: 'Remove Item',
                        message: `Are you sure you want to remove "${itemName}" from your cart?`,
                        actions: [
                            {
                                text: 'Cancel',
                                type: 'secondary',
                                handler: hidePopup
                            },
                            {
                                text: 'Remove',
                                type: 'primary',
                                handler: () => {
                                    // Remove the item, update UI and hide the confirmation
                                    cart.splice(idx, 1);
                                    updateCartUI();
                                    hidePopup();

                                    // Show follow-up confirmation with OK button that closes modal and navigates to dashboard
                                    showPopup('success', {
                                        title: 'Item Removed',
                                        message: `${itemName} has been removed.`,
                                        actions: [
                                            {
                                                text: 'OK',
                                                type: 'primary',
                                                handler: () => {
                                                    hidePopup();
                                                    try { closeModal(); } catch (err) { /* ignore */ }
                                                    // navigate to dashboard to reflect cart changes clearly
                                                    window.location.href = 'customer_dashboard.html';
                                                }
                                            }
                                        ]
                                    });
                                }
                            }
                        ]
                    });
                }
            };
        });

        document.querySelectorAll(".edit-item").forEach(btn => {
            btn.onclick = () => {
                const id = btn.dataset.id;
                const item = cart.find(i => `${i.cartId}` === id);
                if (!item) return;
                // Open modal and populate it for editing the existing cart item
                // Set editingCartId so confirm handler knows to update instead of adding
                modalState.editingCartId = item.cartId;
                modalState.productId = item.productId;
                modalState.size = item.size;
                modalState.qty = item.qty;
                modalState.special = item.special;
                modalState.notes = item.notes || '';

                // Populate modal UI (reuse the same fields as openModal)
                const PRODUCTS = getMenuItems(); // Get synced menu
                const product = PRODUCTS.find(p => p.id === item.productId);
                if (modalImg) modalImg.src = item.img || (product && product.img) || '';
                if (modalName) modalName.textContent = item.name || (product && product.name) || '';
                if (modalDesc) modalDesc.textContent = (product && product.desc) || '';
                if (notesInput) notesInput.value = modalState.notes;
                if (qtyDisplay) qtyDisplay.textContent = String(modalState.qty || 1);

                sizeButtons.forEach(b => b.classList.toggle('active', (b.dataset.size || b.getAttribute('data-size')) === modalState.size));
                specialButtons.forEach(b => b.classList.toggle('active', b.dataset.special === modalState.special));
                updateModalPrice();

                // Show modal using same approach as openModal
                if (modalBackdrop) {
                    modalBackdrop.classList.remove('hidden');
                    modalBackdrop.style.display = 'flex';
                    modalBackdrop.setAttribute('aria-hidden', 'false');
                    document.body.classList.add('modal-open');
                }
            };
        });
    }

    // Clear order with popup confirmation
    clearOrderBtn && clearOrderBtn.addEventListener("click", () => {
        if (cart.length === 0) {
            showPopup('info', {
                message: 'Your cart is already empty.'
            });
            return;
        }

        showPopup('warning', {
            title: 'Clear Cart',
            message: 'Are you sure you want to remove all items from your cart?',
            actions: [
                {
                    text: 'Cancel',
                    type: 'secondary',
                    handler: hidePopup
                },
                {
                    text: 'Clear All',
                    type: 'primary',
                    handler: () => {
                        cart = [];
                        updateCartUI();
                        showToast('success', 'Cart Cleared', 'All items removed from cart');
                    }
                }
            ]
        });
    });

    // Checkout with popup confirmation
    checkoutBtn && checkoutBtn.addEventListener("click", () => {
    if (cart.length === 0) {
        showPopup('warning', {
            message: 'Your cart is empty. Add some items before checking out.'
        });
        return;
    }
    // If not logged in, show inline login modal before continuing to checkout
    if (localStorage.getItem('isLoggedIn') !== 'true') {
        // Show the inline login dialog which resumes checkout after successful login
        showLoginModal();
        return;
    }

    const total = cart.reduce((sum, item) => sum + (item.unitPrice * item.qty), 0);
    const itemCount = cart.reduce((sum, item) => sum + item.qty, 0);
    
    // Prefer logged-in user info when available
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');

    showPopup('success', {
        title: 'Order Confirmation',
        message: currentUser && currentUser.name ? `Confirm your details and place the order:` : `Please enter your details to complete your order:`,
        actions: [
            {
                text: 'Cancel',
                type: 'secondary',
                handler: hidePopup
            },
            {
                text: 'Place Order',
                type: 'primary',
                handler: () => {
                    // Prefer currentUser values when present, otherwise read from inputs
                    const storedUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
                    const customerName = (storedUser && storedUser.name) ? storedUser.name : (document.getElementById('customer-name-input')?.value || 'Walk-in Customer');
                    const customerUsername = (storedUser && storedUser.username) ? storedUser.username : (document.getElementById('customer-username-input')?.value || '');
                    const customerEmail = (storedUser && storedUser.email) ? storedUser.email : (document.getElementById('customer-email-input')?.value || 'N/A');
                    const customerPhone = document.getElementById('customer-phone-input')?.value || 'N/A';
                    const customerNotes = document.getElementById('customer-notes-input')?.value || '';

                    if (!customerName || !customerName.trim()) {
                        alert('Please enter your name to place the order.');
                        return;
                    }

                    // Create order object, include user identity fields
                    const order = {
                        id: generateOrderId(),
                        customerName: customerName.trim(),
                        customerUsername: customerUsername || '',
                        customerEmail: customerEmail || '',
                        customerPhone: customerPhone.trim(),
                        customerNotes: customerNotes.trim(),
                        items: cart.map(item => ({
                            name: item.name,
                            size: item.size,
                            special: item.special,
                            notes: item.notes,
                            qty: item.qty,
                            price: item.unitPrice
                        })),
                        subtotal: total,
                        tax: parseFloat((total * 0.085).toFixed(2)), // 8.5% tax
                        total: parseFloat((total * 1.085).toFixed(2)),
                        status: 'pending',
                        date: new Date().toLocaleDateString(),
                        time: new Date().toLocaleTimeString()
                    };

                    // Save order to localStorage
                    saveOrder(order);

                    // Clear cart after successful checkout
                    cart = [];
                    updateCartUI();
                    hidePopup();

                    showToast('success', 'Order Placed!', `Your order #${order.id} has been received!`);
                }
            }
        ],
        // Add form fields for customer information; if logged-in, show their details and allow editing
        customContent: `
            <div class="customer-info-form" style="margin: 15px 0;">
                ${currentUser && currentUser.name ? `
                    <div style="margin-bottom:10px;">
                        <strong>Name:</strong> ${escapeHtml(currentUser.name)}<br>
                        <strong>Username:</strong> ${escapeHtml(currentUser.username || '')}<br>
                        <strong>Email:</strong> ${escapeHtml(currentUser.email || '')}
                    </div>
                ` : `
                    <div style="margin-bottom: 10px;">
                        <label style="display: block; margin-bottom: 5px; font-weight: bold;">Your Name *</label>
                        <input type="text" id="customer-name-input" placeholder="Enter your name" required 
                               style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                    </div>
                    <div style="margin-bottom: 10px;">
                        <label style="display: block; margin-bottom: 5px; font-weight: bold;">Username</label>
                        <input type="text" id="customer-username-input" placeholder="Username (optional)" 
                               style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                    </div>
                    <div style="margin-bottom: 10px;">
                        <label style="display: block; margin-bottom: 5px; font-weight: bold;">Email</label>
                        <input type="email" id="customer-email-input" placeholder="Enter your email" 
                               style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                    </div>
                `}
                </div>
                <div style="background: #f8f5e9; padding: 10px; border-radius: 5px; margin-top: 10px;">
                    <strong>Order Summary:</strong><br>
                    Items: ${itemCount}<br>
                    Subtotal: ₱${total.toFixed(2)}<br>
                    Tax (8.5%): ₱${(total * 0.085).toFixed(2)}<br>
                    <strong>Total: ₱${(total * 1.085).toFixed(2)}</strong>
                </div>
            </div>
        `
    });
});

    function generateOrderId() {
        // Generate a simple incremental order id starting at 001.
        try {
            const orders = JSON.parse(localStorage.getItem('jessie_orders') || '[]');
            let maxNum = 0;
            orders.forEach(o => {
                if (!o || !o.id) return;
                const id = String(o.id).trim();
                // If id is purely numeric, use it
                if (/^\d+$/.test(id)) {
                    maxNum = Math.max(maxNum, parseInt(id, 10));
                    return;
                }
                // Try to extract trailing number from other formats (e.g., ORD-123)
                const m = id.match(/(\d+)$/);
                if (m) maxNum = Math.max(maxNum, parseInt(m[1], 10));
            });
            const next = maxNum + 1;
            return 'ORD-' + String(next).padStart(3, '0');
        } catch (err) {
            // Fallback to timestamp-based id if anything goes wrong
            return 'ORD-' + String(1).padStart(3, '0');
        }
    }

    function saveOrder(order) {
        // Save order to orders list
        const orders = JSON.parse(localStorage.getItem("jessie_orders") || "[]");
        console.log('[drinks.js] saveOrder() current orders count:', orders.length, 'saving order id:', order.id);
        orders.push(order);
        localStorage.setItem("jessie_orders", JSON.stringify(orders));
        console.log('[drinks.js] saveOrder() saved. new orders count:', orders.length);

        // Ensure sales summary reflects the new pending order count so cashier metrics stay up-to-date
        const sales = JSON.parse(localStorage.getItem("jessie_sales") || "{}");
        sales.totalSales = sales.totalSales || 0;
        sales.totalOrders = (sales.totalOrders || 0) + 1;
        sales.pendingOrders = (sales.pendingOrders || 0) + 1;
        // approvedOrders remains unchanged here
        localStorage.setItem("jessie_sales", JSON.stringify(sales));

        // order saved (silent) - no verbose logging in production
}

    // Modal close events (close button and backdrop click)
    modalClose && modalClose.addEventListener("click", closeModal);
    modalBackdrop && modalBackdrop.addEventListener("click", (e) => {
        // if backdrop itself clicked (not the inner modal), close
        if (e.target === modalBackdrop) closeModal();
    });

    // Initialize UI
    initializeDefaultMenuItems();
    renderProducts();
    updateCartUI();

    // Delegated fallback: if per-card add-btn listeners fail to attach, this will still open the modal
    document.addEventListener('click', function delegatedAddBtn(e) {
        try {
            const btn = e.target.closest && e.target.closest('.add-btn');
            if (!btn) return;
            e.preventDefault();
            e.stopPropagation();
            const id = btn.getAttribute('data-id') || btn.dataset.id;
            if (id) openModal(id);
        } catch (err) {
            // keep silent but report critical errors
            console.error('delegatedAddBtn error:', err);
        }
    });

        // modal element presence check removed (no verbose logs)

    // Initialize the modal as hidden on load
    if (modalBackdrop) {
        modalBackdrop.style.display = "none";
        modalBackdrop.classList.add("hidden");
    }

    // Rest of your initialization code...
    renderProducts();
    updateCartUI();
});

// Merge admin menu updates with existing default layout when localStorage changes (cross-tab)
window.addEventListener('storage', (e) => {
    if (e.key !== 'jessie_menu') return;
    try {
        const incoming = JSON.parse(e.newValue || '[]');

        // If incoming is not array or empty, just re-render (no change)
        if (!Array.isArray(incoming) || incoming.length === 0) {
            renderProducts();
            return;
        }

        // Merge strategy: start from DEFAULT_MENU_ITEMS (ensure ids), overlay incoming items by id first then name, append new items
        const merged = DEFAULT_MENU_ITEMS.slice().map((it, idx) => Object.assign({}, it, { id: it.id || idx + 1 }));
        const byId = {};
        const byName = {};
        merged.forEach(it => {
            if (it.id) byId[it.id] = it;
            if (it.name) byName[(it.name || '').toLowerCase()] = it;
        });

        let maxId = merged.reduce((m, it) => Math.max(m, (it.id || 0)), 0);

        incoming.forEach(aItem => {
            const finalImage = aItem.image || aItem.img || normalizeImagePath(aItem.img) || '';
            const migratedRegular = (typeof aItem.priceRegular === 'number') ? aItem.priceRegular : (parseFloat(aItem.priceRegular) || parseFloat(aItem.priceSmall) || 0);
            const migratedTall = (typeof aItem.priceTall === 'number') ? aItem.priceTall : (parseFloat(aItem.priceTall) || parseFloat(aItem.priceMedium) || parseFloat(aItem.priceLarge) || migratedRegular);

            const normalized = {
                name: aItem.name || 'Unnamed',
                desc: aItem.description || aItem.desc || '',
                priceRegular: Number(migratedRegular || 0),
                priceTall: Number(migratedTall || migratedRegular || 0),
                img: finalImage
            };

            if (aItem.id && byId[aItem.id]) {
                Object.assign(byId[aItem.id], normalized);
            } else if (aItem.id) {
                normalized.id = aItem.id;
                merged.push(normalized);
                byId[normalized.id] = normalized;
                byName[(normalized.name||'').toLowerCase()] = normalized;
                maxId = Math.max(maxId, normalized.id || 0);
            } else if (aItem.name && byName[(aItem.name||'').toLowerCase()]) {
                Object.assign(byName[(aItem.name||'').toLowerCase()], normalized);
            } else {
                maxId++;
                normalized.id = maxId;
                merged.push(normalized);
                byId[normalized.id] = normalized;
                byName[(normalized.name||'').toLowerCase()] = normalized;
            }
        });

        const final = merged.map(it => Object.assign({}, it, { id: Number(it.id) }));
        localStorage.setItem('jessie_menu', JSON.stringify(final));
        renderProducts();
    } catch (err) {
        console.error('Failed to process jessie_menu storage event:', err);
    }
});

// Note: menu rendering is handled by renderProducts() above.


// Helper function to validate images
// utility functions retained elsewhere in the app; removed duplicate helpers here to reduce noise

// NOTE: Initialization (login guard, logout wiring, and UI setup) is handled
// inside the primary DOMContentLoaded listener earlier in this file. The
// duplicate initialization block that referenced undefined helpers was removed
// to avoid cross-scope errors and prevent the modal/add-to-cart flow from
// breaking.

// Debug and sync functions
// Removed debug/test utilities (checkDrinksSync, forceRefreshMenu, clearAllMenuData)
    // Enhanced showPopup function to support custom content
function showPopup(type, options) {
    const popup = document.createElement('div');
    popup.className = 'popup-overlay';

    const inner = document.createElement('div');
    inner.className = `popup popup-${type}`;

    // Title
    if (options.title) {
        const h = document.createElement('h3');
        h.textContent = options.title;
        inner.appendChild(h);
    }

    // Message
    if (options.message) {
        const p = document.createElement('p');
        p.textContent = options.message;
        inner.appendChild(p);
    }

    // Custom content (may be HTML string)
    if (options.customContent) {
        const wrapper = document.createElement('div');
        wrapper.innerHTML = options.customContent;
        inner.appendChild(wrapper);
    }

    // Actions container
    const actionsContainer = document.createElement('div');
    actionsContainer.className = 'popup-actions';

    if (Array.isArray(options.actions)) {
        options.actions.forEach(action => {
            const btn = document.createElement('button');
            btn.className = `btn btn-${action.type}`;
            btn.textContent = action.text || 'Action';
            // Attach handler directly (preserves closure scope)
            if (typeof action.handler === 'function') {
                btn.addEventListener('click', (e) => action.handler(e));
            }
            actionsContainer.appendChild(btn);
        });
    }

    inner.appendChild(actionsContainer);
    popup.appendChild(inner);
    document.body.appendChild(popup);

    // Add click handler for backdrop to close when clicking outside the popup
    popup.addEventListener('click', function(e) {
        if (e.target === popup) {
            hidePopup();
        }
    });
}

function hidePopup() {
    const popup = document.querySelector('.popup-overlay');
    if (popup) popup.remove();
}

// Removed test helpers (testModal, openModalForTest) and their global exposures

    // Expose placeOrder/closeCheckout into the main scope so they have access
    // to `cart`, `generateOrderId` and `saveOrder` defined above.
    function closeCheckout() {
        const modal = document.getElementById('checkout-modal');
        if (modal) modal.style.display = 'none';
    }

    function placeOrder() {
        // Prefer inputs from popup (customer-name-input) but fallback to static modal inputs
        const nameInput = document.getElementById('customer-name-input') || document.getElementById('customer-name');
        const phoneInput = document.getElementById('customer-phone-input') || document.getElementById('customer-phone');
        const notesInputEl = document.getElementById('customer-notes-input') || document.getElementById('customer-notes');

    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const customerName = (currentUser && currentUser.name) ? currentUser.name : (nameInput ? nameInput.value : 'Walk-in Customer');
    const customerUsername = (currentUser && currentUser.username) ? currentUser.username : (document.getElementById('customer-username')?.value || '');
    const customerPhone = phoneInput ? phoneInput.value : (currentUser && currentUser.phone ? currentUser.phone : 'N/A');
    const customerNotes = notesInputEl ? notesInputEl.value : '';

        if (!customerName || !customerName.trim()) {
            alert('Please enter your name to place the order.');
            return;
        }

        const total = cart.reduce((sum, item) => sum + (item.unitPrice * item.qty), 0);

        const order = {
            id: generateOrderId(),
            customerName: customerName.trim(),
            customerUsername: customerUsername || '',
            customerPhone: customerPhone.trim(),
            customerNotes: (customerNotes || '').trim(),
            items: cart.map(item => ({
                name: item.name,
                size: item.size,
                special: item.special,
                notes: item.notes,
                qty: item.qty,
                price: item.unitPrice
            })),
            subtotal: total,
            tax: parseFloat((total * 0.085).toFixed(2)),
            total: parseFloat((total * 1.085).toFixed(2)),
            status: 'pending',
            date: new Date().toLocaleDateString(),
            time: new Date().toLocaleTimeString()
        };

        // Save and cleanup
        saveOrder(order);
        cart = [];
        updateCartUI();

        // Close either popup or static modal
        hidePopup();
        closeCheckout();

        if (typeof showToast === 'function') showToast('success', 'Order Placed!', `Your order #${order.id} has been received!`);
    }

    // Expose to global scope for inline onclick handlers
    window.placeOrder = placeOrder;
    window.closeCheckout = closeCheckout;

    // Initialize UI
    renderProducts();
    updateCartUI();
