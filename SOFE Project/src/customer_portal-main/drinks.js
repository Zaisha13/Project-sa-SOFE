// ===== drinks.js =====

// Get menu items from localStorage (synced from admin)
function getMenuItems() {
    try {
        // Read from the same storage key as customer dashboard
        const storedMenu = JSON.parse(localStorage.getItem("jessie_menu") || "[]");
        console.log("Drinks page - Loaded menu items:", storedMenu);
        
        // Return only valid items
        return Array.isArray(storedMenu) ? storedMenu.filter(item => 
            item && 
            item.name && 
            item.name.trim() !== "" &&
            typeof item.priceSmall === 'number' &&
            item.priceSmall > 0
        ) : [];
    } catch (error) {
        console.error('Error parsing menu items:', error);
        return [];
    }
}

window.addEventListener("DOMContentLoaded", () => {
    // Check if user is logged in
    if (localStorage.getItem("isLoggedIn") !== "true") {
        showPopup('info', {
            title: 'Login Required',
            message: 'Please log in to access the menu.',
            actions: [
                {
                    text: 'Go to Login',
                    type: 'primary',
                    handler: () => {
                        window.location.href = "login.html";
                    }
                }
            ]
        });
        return;
    }

    // Handle logout
    const logoutBtn = document.querySelector(".logout");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", (e) => {
            e.preventDefault();
            
            showPopup('warning', {
                title: 'Confirm Logout',
                message: 'Are you sure you want to log out?',
                actions: [
                    {
                        text: 'Cancel',
                        type: 'secondary',
                        handler: hidePopup
                    },
                    {
                        text: 'Log Out',
                        type: 'primary',
                        handler: () => {
                            localStorage.removeItem("isLoggedIn");
                            localStorage.removeItem("currentUser");
                            showToast('success', 'Logged Out', 'You have been successfully logged out.');
                            setTimeout(() => {
                                window.location.href = "login.html";
                            }, 1500);
                        }
                    }
                ]
            });
        });
    }

    function showToast(type, title, message) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <strong>${title}</strong>
        <span>${message}</span>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}


    // DOM references
    const productsContainer = document.getElementById("products");
    const cartItemsEl = document.getElementById("cart-items");
    const totalDisplay = document.getElementById("total");
    const checkoutBtn = document.getElementById("checkout-btn");
    const clearOrderBtn = document.getElementById("clear-order");

    // Modal references
    const modalBackdrop = document.getElementById("modal-backdrop");
    const modal = document.getElementById("order-modal"); // inner modal
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
    const addConfirmBtn = document.getElementById("add-confirm-btn");

    // State
    let cart = [];
    let modalState = {
        productId: null,
        size: "Regular",
        qty: 1,
        special: "None",
        notes: ""
    };

    // Ensure modal is hidden on load (robust)
    if (modalBackdrop) {
        modalBackdrop.style.display = "none";
        modalBackdrop.classList.add("hidden");
        modalBackdrop.setAttribute("aria-hidden", "true");
        document.body.style.overflow = "";
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
        
        const imageHtml = p.img && !p.img.includes('JC') 
            ? `<img src="${p.img}" alt="${p.name}" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><rect width=\"100\" height=\"100\" fill=\"%23FFD966\"/><text x=\"50\" y=\"55\" font-size=\"30\" fill=\"%23146B33\" text-anchor=\"middle\"></text></svg>`
            : '<div class="no-image-placeholder">🥤</div>';
        
        card.innerHTML = `
            ${imageHtml}
            <h3>${p.name}</h3>
            <p>${p.desc}</p>
            <div class="price">
                Small: ₱${p.priceSmall.toFixed(2)}<br>
                Medium: ₱${p.priceMedium.toFixed(2)}<br>
                Large: ₱${p.priceLarge.toFixed(2)}
            </div>
            <button class="add-btn" data-id="${p.id}">Add to Cart</button>
        `;
        
        const btn = card.querySelector(".add-btn");
        console.log(`Adding event listener for product ${p.id}, button found:`, !!btn);
        
        btn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Add to cart clicked for product ID:", p.id);
            openModal(p.id);
        });
        productsContainer.appendChild(card);
    });
}

    // Open modal (only when user clicks Add/Edit)
    function openModal(productId) {
    console.log("Opening modal for product ID:", productId);
    
    const PRODUCTS = getMenuItems();
    const product = PRODUCTS.find(x => x.id === productId);
    if (!product) {
        console.error("Product not found with ID:", productId);
        return;
    }

    if (!modalBackdrop) {
        console.error("Modal backdrop element not found!");
        return;
    }

    // Reset modal state
    modalState = {
        productId,
        size: "Small",
        qty: 1,
        special: "None",
        notes: ""
    };

    // Populate modal content
    if (modalImg) modalImg.src = product.img || "";
    if (modalName) modalName.textContent = product.name || "";
    if (modalDesc) modalDesc.textContent = product.desc || "";
    if (notesInput) notesInput.value = "";
    if (qtyDisplay) qtyDisplay.textContent = modalState.qty;

    // Reset controls to defaults
    sizeButtons.forEach(b => {
        b.classList.toggle("active", b.dataset.size === "Small");
    });
    
    specialButtons.forEach(b => {
        b.classList.toggle("active", b.dataset.special === "None");
    });

    updateModalPrice();

    // Show modal - FIXED: Remove hidden class and set display to flex
    modalBackdrop.classList.remove("hidden");
    modalBackdrop.style.display = "flex";
    modalBackdrop.setAttribute("aria-hidden", "false");
    
    // Add class to body to prevent scrolling
    document.body.classList.add("modal-open");
    
    console.log("Modal should be visible now");
}

    // Close modal
    function closeModal() {
    if (!modalBackdrop) return;
    
    // Hide modal - FIXED: Add hidden class and set display to none
    modalBackdrop.classList.add("hidden");
    modalBackdrop.style.display = "none";
    modalBackdrop.setAttribute("aria-hidden", "true");
    
    // Remove class from body to allow scrolling
    document.body.classList.remove("modal-open");
    
    console.log("Modal closed");
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
        case "Small":
            basePrice = product.priceSmall;
            break;
        case "Medium":
            basePrice = product.priceMedium;
            break;
        case "Large":
            basePrice = product.priceLarge;
            break;
        default:
            basePrice = product.priceSmall; // Default to small
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
            modalState.size = btn.dataset.size || "Regular";
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

    // Add to cart confirm
addConfirmBtn && addConfirmBtn.addEventListener("click", () => {
    const PRODUCTS = getMenuItems();
    const product = PRODUCTS.find(p => p.id === modalState.productId);
    if (!product) return;

    // Get base price based on selected size - FIXED
    let basePrice = 0;
    switch(modalState.size) {
        case "Small":
            basePrice = product.priceSmall;
            break;
        case "Medium":
            basePrice = product.priceMedium;
            break;
        case "Large":
            basePrice = product.priceLarge;
            break;
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

    if (existingIndex > -1) {
        cart[existingIndex].qty += modalState.qty;
        showToast('success', 'Cart Updated', `Added ${modalState.qty} more ${product.name} to cart!`);
    } else {
        cart.push({
            cartId: Date.now() + Math.random(),
            productId: modalState.productId,
            name: product.name,
            img: product.img,
            size: modalState.size,
            special: modalState.special,
            notes: modalState.notes,
            qty: modalState.qty,
            unitPrice: unitPrice
        });
        showToast('success', 'Added to Cart', `${product.name} added to your order!`);
    }

    updateCartUI();
    closeModal();
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
                                    cart.splice(idx, 1);
                                    updateCartUI();
                                    showToast('success', 'Item Removed', `${itemName} removed from cart`);
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

                // populate modal state for editing
                modalState = {
                    productId: item.productId,
                    size: item.size,
                    qty: item.qty,
                    special: item.special,
                    notes: item.notes
                };

                // remove the item temporarily (will re-add on confirm)
                cart = cart.filter(i => `${i.cartId}` !== id);
                updateCartUI();

                // populate modal UI
                const PRODUCTS = getMenuItems(); // Get synced menu
                const product = PRODUCTS.find(p => p.id === item.productId);
                modalImg.src = item.img;
                modalName.textContent = item.name;
                modalDesc.textContent = product ? product.desc : "";
                notesInput.value = item.notes;
                qtyDisplay.textContent = item.qty;

                sizeButtons.forEach(b => b.classList.toggle("active", b.dataset.size === item.size));
                specialButtons.forEach(b => b.classList.toggle("active", b.dataset.special === item.special));
                updateModalPrice();

                modalBackdrop.classList.remove("hidden");
                modalBackdrop.setAttribute("aria-hidden", "false");
                document.body.style.overflow = "hidden";
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

    const total = cart.reduce((sum, item) => sum + (item.unitPrice * item.qty), 0);
    const itemCount = cart.reduce((sum, item) => sum + item.qty, 0);
    
    showPopup('success', {
        title: 'Order Confirmation',
        message: `Please enter your details to complete your order:`,
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
                    // Get customer information from modal inputs
                    const customerName = document.getElementById('customer-name-input')?.value || 'Walk-in Customer';
                    const customerPhone = document.getElementById('customer-phone-input')?.value || 'N/A';
                    const customerNotes = document.getElementById('customer-notes-input')?.value || '';
                    
                    if (!customerName.trim()) {
                        alert('Please enter your name to place the order.');
                        return;
                    }
                    
                    // Create order object
                    const order = {
                        id: generateOrderId(),
                        customerName: customerName.trim(),
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
        // Add form fields for customer information
        customContent: `
            <div class="customer-info-form" style="margin: 15px 0;">
                <div style="margin-bottom: 10px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: bold;">Your Name *</label>
                    <input type="text" id="customer-name-input" placeholder="Enter your name" required 
                           style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                </div>
                <div style="margin-bottom: 10px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: bold;">Phone Number</label>
                    <input type="tel" id="customer-phone-input" placeholder="Enter your phone number" 
                           style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                </div>
                <div style="margin-bottom: 10px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: bold;">Special Instructions</label>
                    <textarea id="customer-notes-input" placeholder="Any special instructions..." 
                              style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; height: 60px;"></textarea>
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
        // Save order to orders list
        const orders = JSON.parse(localStorage.getItem("jessie_orders") || "[]");
        orders.push(order);
        localStorage.setItem("jessie_orders", JSON.stringify(orders));

        // Ensure sales summary reflects the new pending order count so cashier metrics stay up-to-date
        const sales = JSON.parse(localStorage.getItem("jessie_sales") || "{}");
        sales.totalSales = sales.totalSales || 0;
        sales.totalOrders = (sales.totalOrders || 0) + 1;
        sales.pendingOrders = (sales.pendingOrders || 0) + 1;
        // approvedOrders remains unchanged here
        localStorage.setItem("jessie_sales", JSON.stringify(sales));

        console.log('Order saved:', order);
}

    // Modal close events (close button and backdrop click)
    modalClose && modalClose.addEventListener("click", closeModal);
    modalBackdrop && modalBackdrop.addEventListener("click", (e) => {
        // if backdrop itself clicked (not the inner modal), close
        if (e.target === modalBackdrop) closeModal();
    });

    // Initialize UI
    renderProducts();
    updateCartUI();

      // Debug: Check if all modal elements exist
    console.log("=== MODAL ELEMENTS CHECK ===");
    console.log("modalBackdrop:", modalBackdrop);
    console.log("modal:", modal);
    console.log("modalClose:", modalClose);
    console.log("modalImg:", modalImg);
    console.log("modalName:", modalName);
    console.log("modalDesc:", modalDesc);
    console.log("addConfirmBtn:", addConfirmBtn);
    console.log("sizeButtons:", sizeButtons);
    console.log("specialButtons:", specialButtons);

    // Initialize the modal as hidden on load
    if (modalBackdrop) {
        modalBackdrop.style.display = "none";
        modalBackdrop.classList.add("hidden");
    }

    // Rest of your initialization code...
    renderProducts();
    updateCartUI();
});

// Load and display menu items - FIXED VERSION
function loadMenuItems() {
    const menuItems = getMenuItems();
    const container = document.getElementById("products"); // Use the correct container
    const emptyMessage = document.getElementById("empty-featured"); // Use existing empty state if available

    console.log("Rendering menu items:", menuItems);

    // Clear container
    if (container) {
        container.innerHTML = '';

        if (menuItems.length === 0) {
            // Show empty state
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-glass-water"></i>
                    <h3>Menu Coming Soon!</h3>
                    <p>Our delicious sugarcane drinks are being prepared. Please check back later for our refreshing menu!</p>
                </div>
            `;
        } else {
            // Render menu items using the same structure as renderProducts()
            menuItems.forEach(p => {
                const card = document.createElement("div");
                card.className = "product";
                
                // Use the same image handling as renderProducts()
                const imageHtml = p.img && !p.img.includes('JC')
                    ? `<img src="${p.img}" alt="${p.name}" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\\\"http://www.w3.org/2000/svg\\\" viewBox=\\\"0 0 100 100\\\"><rect width=\\\"100\\\" height=\\\"100\\\" fill=\\\"%23FFD966\\\"/><text x=\\\"50\\\" y=\\\"55\\\" font-size=\\\"30\\\" fill=\\\"%23146B33\\\" text-anchor=\\\"middle\\\"></text></svg>'" />`
                    : '<div class="no-image-placeholder">🥤</div>';
                
                card.innerHTML = `
                    ${imageHtml}
                    <h3>${p.name}</h3>
                    <p>${p.desc}</p>
                    <div class="price">
                        Small: ₱${p.priceSmall.toFixed(2)}<br>
                        Medium: ₱${p.priceMedium.toFixed(2)}<br>
                        Large: ₱${p.priceLarge.toFixed(2)}
                    </div>
                    <button class="add-btn" data-id="${p.id}">Add to Cart</button>
                `;
                
                // Add event listener for the button (guard in case element is missing)
                const btn = card.querySelector(".add-btn");
                if (btn) {
                    btn.addEventListener("click", (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log("Add to cart clicked for product ID:", p.id);
                        openModal(p.id);
                    });
                }
                
                container.appendChild(card);
            });
        }
    }
}


// Helper function to validate images
function isValidImage(src) {
    return src && 
           src !== 'JC' && 
           !src.includes('JC') && 
           (src.startsWith('http') || src.startsWith('data:image') || src.startsWith('images/'));
}

// Add to cart function
function addToCart(itemIndex) {
    const menuItems = getMenuItems();
    const item = menuItems[itemIndex];
    
    if (!item) return;
    
    // Get existing cart or create new one
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    
    // Add item to cart
    cart.push({
        id: Date.now(),
        name: item.name,
        price: item.priceSmall, // Default to small size
        size: "Small",
        image: item.img
    });
    
    // Save cart
    localStorage.setItem("cart", JSON.stringify(cart));
    
    // Show success message
    alert(`Added ${item.name} to cart!`);
}


// Clean up any existing default/placeholder items
function cleanupMenuData() {
    const menuItems = JSON.parse(localStorage.getItem("jessie_menu") || "[]");
    
    // Filter out any items with JC or placeholder data
    const validItems = menuItems.filter(item => {
        if (!item || typeof item !== 'object') return false;
        if (item.img && (item.img === 'JC' || item.img.includes('JC'))) return false;
        if (item.name && (item.name === 'JC' || item.name.includes('JC'))) return false;
        if (!item.priceSmall || item.priceSmall <= 0) return false;
        return true;
    });
    
    if (validItems.length !== menuItems.length) {
        localStorage.setItem("jessie_menu", JSON.stringify(validItems));
        console.log(`Cleaned up ${menuItems.length - validItems.length} invalid menu items`);
    }
    
    return validItems;
}

// Initialize when page loads
document.addEventListener("DOMContentLoaded", function() {
    // Check if user is logged in
    const isLoggedIn = localStorage.getItem("isLoggedIn");
    if (!isLoggedIn || isLoggedIn !== "true") {
        window.location.href = "login.html";
        return;
    }

    // Debug: Check storage
    console.log("Drinks page - All relevant localStorage:");
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.includes('menu') || key.includes('Menu')) {
            console.log(key + ":", localStorage.getItem(key));
        }
    }

    // Load menu items
    loadMenuItems();

    // Logout functionality
    const logoutBtn = document.querySelector(".logout");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", function(e) {
            e.preventDefault();
            if (confirm('Are you sure you want to log out?')) {
                localStorage.removeItem("isLoggedIn");
                localStorage.removeItem("currentUser");
                window.location.href = "login.html";
            }
        });
    }
});

// Debug and sync functions
function checkDrinksSync() {
    const menuItems = getMenuItems();
    alert(`Drinks page has ${menuItems.length} menu items\nCheck console for details.`);
    console.log("Drinks menu items:", menuItems);
}   

function forceRefreshMenu() {
    localStorage.removeItem("jessie_menu");
    alert("Menu cache cleared! Page will reload.");
    location.reload();
}

// EMERGENCY FIX: Completely clear menu data
function clearAllMenuData() {
    if (confirm('This will remove ALL menu items. Are you sure?')) {
        localStorage.removeItem("jessie_menu");
        localStorage.removeItem("jessieCaneMenu");
        alert('All menu data cleared! Page will reload.');
        location.reload();
    }
}
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
                btn.addEventListener('click', (e) => {
                    try {
                        action.handler(e);
                    } catch (err) {
                        console.error('Popup action handler error:', err);
                    }
                });
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

function testModal() {
    const PRODUCTS = getMenuItems();
    if (PRODUCTS.length > 0) {
        console.log("Testing modal with product:", PRODUCTS[0]);
        openModal(PRODUCTS[0].id);
    } else {
        // Create a test product if none exist
        const testProduct = {
            id: 999,
            name: "Test Drink",
            desc: "Test description",
            priceSmall: 50,
            priceMedium: 70,
            priceLarge: 90,
            img: ""
        };
        console.log("Testing modal with test product");
        openModal(testProduct.id);
    }
}

// Make it available globally
window.testModal = testModal;

// Debug helper: open modal directly with a product object (useful when menu is empty)
function openModalForTest(product) {
    if (!product) {
        console.error('openModalForTest requires a product object');
        return;
    }

    if (!modalBackdrop) {
        console.error('Modal backdrop element not found!');
        return;
    }

    modalState = {
        productId: product.id,
        size: 'Small',
        qty: 1,
        special: 'None',
        notes: ''
    };

    if (modalImg) modalImg.src = product.img || '';
    if (modalName) modalName.textContent = product.name || '';
    if (modalDesc) modalDesc.textContent = product.desc || '';
    if (notesInput) notesInput.value = '';
    if (qtyDisplay) qtyDisplay.textContent = modalState.qty;

    sizeButtons.forEach(b => b.classList.toggle('active', b.dataset.size === 'Small'));
    specialButtons.forEach(b => b.classList.toggle('active', b.dataset.special === 'None'));
    updateModalPrice();

    modalBackdrop.classList.remove('hidden');
    modalBackdrop.style.display = 'flex';
    modalBackdrop.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');

    console.log('openModalForTest: modal opened for', product);
}

window.debugOpenModal = openModalForTest;

// Global function used by static checkout modal in drinks.html
function closeCheckout() {
    const modal = document.getElementById('checkout-modal');
    if (modal) modal.style.display = 'none';
}

// Global placeOrder function to support both popup and static modal flows
function placeOrder() {
    // Prefer inputs from popup (customer-name-input) but fallback to static modal inputs
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

    // Save and cleanup
    saveOrder(order);
    cart = [];
    updateCartUI();

    // Close either popup or static modal
    hidePopup();
    closeCheckout();

    showToast('success', 'Order Placed!', `Your order #${order.id} has been received!`);
}

// Expose to global scope for inline onclick handlers
window.placeOrder = placeOrder;
window.closeCheckout = closeCheckout;

