function getMenuItems() {
    try {
        const storedMenu = JSON.parse(localStorage.getItem("jessie_menu") || "[]");
        const migrated = Array.isArray(storedMenu) ? storedMenu.map(item => {
            if (!item) return null;

            if (typeof item.priceRegular === 'number' && typeof item.priceTall === 'number') return item;

            const ps = parseFloat(item.priceSmall) || 0;
            const pm = parseFloat(item.priceMedium);
            const pl = parseFloat(item.priceLarge);

            const priceRegular = ps || 0;
            const priceTall = (!isNaN(pm) && pm > 0) ? pm : ( (!isNaN(pl) && pl > 0) ? pl : priceRegular );

            return Object.assign({}, item, { priceRegular, priceTall });
        }).filter(Boolean) : [];

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

function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

(function ensureDefaultMenuOnLoad() {
    try {
        const existing = JSON.parse(localStorage.getItem('jessie_menu') || '[]');
        if (Array.isArray(existing) && existing.length > 0) return;
        const defaults = DEFAULT_MENU_ITEMS.map(i => Object.assign({}, i));

        localStorage.setItem('jessie_menu', JSON.stringify(defaults));
    } catch (err) {
        console.error('Failed to initialize default menu:', err);
    }
})();

window.addEventListener("DOMContentLoaded", () => {
    console.debug('drinks.js: visitor isLoggedIn=', localStorage.getItem('isLoggedIn'));

    const productsContainer = document.getElementById("products");
    const cartItemsEl = document.getElementById("cart-items");
    const totalDisplay = document.getElementById("total");
    const checkoutBtn = document.getElementById("checkout-btn");
    const clearOrderBtn = document.getElementById("clear-order");

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
    let isProcessingAdd = false;
    const modalCancelBtn = document.getElementById('modal-cancel-btn');

    let cart = [];
    let modalState = { productId: null, size: "Regular", qty: 1, special: "None", notes: "" };

    function initializeDefaultMenuItems() { }

    if (modalBackdrop) {
        modalBackdrop.style.display = "none";
        modalBackdrop.classList.add("hidden");
        modalBackdrop.setAttribute("aria-hidden", "true");
    }
            function showLoginModal() {
                console.debug('showLoginModal called');
                const modal = document.getElementById('login-modal');
                if (!modal) { console.warn('login-modal not found'); return; }
                modal.classList.remove('hidden');
                modal.style.display = 'flex';
                modal.setAttribute('aria-hidden', 'false');
                document.body.classList.add('modal-open');

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

        try {
            addConfirmBtn = document.getElementById('add-confirm-btn');
            if (addConfirmBtn) {
                addConfirmBtn.removeEventListener('click', handleAddConfirm);
                addConfirmBtn.addEventListener('click', handleAddConfirm);

                try { addConfirmBtn.dataset.handlerAttached = 'true'; } catch (err) { /* ignore */ }
            }
        } catch (err) {
            console.error('Failed to attach add-confirm handler:', err);
        }
    }

    function closeModal() {
        if (!modalBackdrop) return;
        modalBackdrop.classList.add("hidden");
        modalBackdrop.style.display = "none";
        modalBackdrop.setAttribute("aria-hidden", "true");
        document.body.classList.remove("modal-open");
        
        try {
            if (addConfirmBtn && addConfirmBtn.dataset) delete addConfirmBtn.dataset.handlerAttached;
        } catch (err) { /* ignore */ }
    }
    
    function addToCartQuick(productId) {
        const PRODUCTS = getMenuItems();
        const product = PRODUCTS.find(x => String(x.id) === String(productId));
        if (!product) return;

        const basePrice = Number(product.priceRegular || 0);
        const unitPrice = basePrice;

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

function updateModalPrice() {
    const PRODUCTS = getMenuItems();
    const product = PRODUCTS.find(p => p.id === modalState.productId);
    if (!product) {
        modalPriceEl.textContent = `₱0.00`;
        return;
    }

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
    
    const extra = modalState.special === "No Ice" ? 20 : 0;
    const total = (basePrice + extra) * modalState.qty;
    modalPriceEl.textContent = `₱${total.toFixed(2)}`;
}
    
    sizeButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            sizeButtons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
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

    if (modalCancelBtn) {
        modalCancelBtn.addEventListener('click', (e) => {
            e.preventDefault();
            closeModal();
        });
    }

    function handleAddConfirm(e) {
        const now = Date.now();
        if (handleAddConfirm._lastCall && (now - handleAddConfirm._lastCall) < 600) {
            console.debug && console.debug('handleAddConfirm: ignored due to rapid repeat');
            return;
        }
        handleAddConfirm._lastCall = now;

        if (isProcessingAdd) {
            console.debug && console.debug('handleAddConfirm: already processing, ignoring');
            return;
        }
        isProcessingAdd = true;

        if (addConfirmBtn && addConfirmBtn.disabled) {
            console.debug && console.debug('handleAddConfirm: ignored because button is disabled');
            isProcessingAdd = false;
            return;
        }
        
        try { if (addConfirmBtn) addConfirmBtn.disabled = true; } catch (err) { /* ignore */ }
        setTimeout(() => { try { if (addConfirmBtn) addConfirmBtn.disabled = false; } catch (err) { } }, 400);
        console.debug && console.debug('handleAddConfirm invoked, qty=', modalState.qty);

        try {
            const PRODUCTS = getMenuItems();
            const product = PRODUCTS.find(p => p.id === modalState.productId);
            if (!product) return;

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

            const existingIndex = cart.findIndex(item =>
                item.productId === modalState.productId &&
                item.size === modalState.size &&
                item.special === modalState.special &&
                item.notes === modalState.notes
            );

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
            setTimeout(() => { try { isProcessingAdd = false; } catch (err) {} }, 300);
        }
    }

    document.addEventListener('click', function (ev) {
        const target = ev.target.closest && ev.target.closest('#add-confirm-btn');
        if (!target) return;
        ev.preventDefault();

        try {
            if (target.dataset && target.dataset.handlerAttached === 'true') return;
        } catch (err) {
            
        }
        if (isProcessingAdd) return;
        try {
            isProcessingAdd = true;
            handleAddConfirm(ev);
        } finally {
            setTimeout(() => { isProcessingAdd = false; }, 250);
        }
    });

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
                                    cart.splice(idx, 1);
                                    updateCartUI();
                                    hidePopup();

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
                modalState.editingCartId = item.cartId;
                modalState.productId = item.productId;
                modalState.size = item.size;
                modalState.qty = item.qty;
                modalState.special = item.special;
                modalState.notes = item.notes || '';
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

                if (modalBackdrop) {
                    modalBackdrop.classList.remove('hidden');
                    modalBackdrop.style.display = 'flex';
                    modalBackdrop.setAttribute('aria-hidden', 'false');
                    document.body.classList.add('modal-open');
                }
            };
        });
    }

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

    checkoutBtn && checkoutBtn.addEventListener("click", () => {
    if (cart.length === 0) {
        showPopup('warning', {
            message: 'Your cart is empty. Add some items before checking out.'
        });
        return;
    }
    if (localStorage.getItem('isLoggedIn') !== 'true') {

        showLoginModal();
        return;
    }

    const total = cart.reduce((sum, item) => sum + (item.unitPrice * item.qty), 0);
    const itemCount = cart.reduce((sum, item) => sum + item.qty, 0);

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
                    saveOrder(order);
                    cart = [];
                    updateCartUI();
                    hidePopup();

                    showToast('success', 'Order Placed!', `Your order #${order.id} has been received!`);
                }
            }
        ],
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
    return 'ORD-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5).toUpperCase();
}

    function saveOrder(order) {
        const orders = JSON.parse(localStorage.getItem("jessie_orders") || "[]");
        orders.push(order);
        localStorage.setItem("jessie_orders", JSON.stringify(orders));

        const sales = JSON.parse(localStorage.getItem("jessie_sales") || "{}");
        sales.totalSales = sales.totalSales || 0;
        sales.totalOrders = (sales.totalOrders || 0) + 1;
        sales.pendingOrders = (sales.pendingOrders || 0) + 1;

        localStorage.setItem("jessie_sales", JSON.stringify(sales));
}

    modalClose && modalClose.addEventListener("click", closeModal);
    modalBackdrop && modalBackdrop.addEventListener("click", (e) => {
        if (e.target === modalBackdrop) closeModal();
    });
    
    initializeDefaultMenuItems();
    renderProducts();
    updateCartUI();

    document.addEventListener('click', function delegatedAddBtn(e) {
        try {
            const btn = e.target.closest && e.target.closest('.add-btn');
            if (!btn) return;
            e.preventDefault();
            e.stopPropagation();
            const id = btn.getAttribute('data-id') || btn.dataset.id;
            if (id) openModal(id);
        } catch (err) {
            console.error('delegatedAddBtn error:', err);
        }
    });

    if (modalBackdrop) {
        modalBackdrop.style.display = "none";
        modalBackdrop.classList.add("hidden");
    }

    renderProducts();
    updateCartUI();
});

window.addEventListener('storage', (e) => {
    if (e.key !== 'jessie_menu') return;
    try {
        const incoming = JSON.parse(e.newValue || '[]');

        if (!Array.isArray(incoming) || incoming.length === 0) {
            renderProducts();
            return;
        }

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

function showPopup(type, options) {
    const popup = document.createElement('div');
    popup.className = 'popup-overlay';

    const inner = document.createElement('div');
    inner.className = `popup popup-${type}`;

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
        wrapper.innerHTML = options.customContent;
        inner.appendChild(wrapper);
    }

    const actionsContainer = document.createElement('div');
    actionsContainer.className = 'popup-actions';

    if (Array.isArray(options.actions)) {
        options.actions.forEach(action => {
            const btn = document.createElement('button');
            btn.className = `btn btn-${action.type}`;
            btn.textContent = action.text || 'Action';
            if (typeof action.handler === 'function') {
                btn.addEventListener('click', (e) => action.handler(e));
            }
            actionsContainer.appendChild(btn);
        });
    }

    inner.appendChild(actionsContainer);
    popup.appendChild(inner);
    document.body.appendChild(popup);

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
    function closeCheckout() {
        const modal = document.getElementById('checkout-modal');
        if (modal) modal.style.display = 'none';
    }

    function placeOrder() {
        const nameInput = document.getElementById('customer-name-input') || document.getElementById('customer-name');
        const phoneInput = document.getElementById('customer-phone-input') || document.getElementById('customer-phone');
        const notesInputEl = document.getElementById('customer-notes-input') || document.getElementById('customer-notes');

        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        const customerName = (currentUser && currentUser.name) ? currentUser.name : (nameInput ? nameInput.value : 'Walk-in Customer');
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
        saveOrder(order);
        cart = [];
        updateCartUI();

        hidePopup();
        closeCheckout();

        if (typeof showToast === 'function') showToast('success', 'Order Placed!', `Your order #${order.id} has been received!`);
    }

    window.placeOrder = placeOrder;
    window.closeCheckout = closeCheckout;
    renderProducts();
    updateCartUI();
