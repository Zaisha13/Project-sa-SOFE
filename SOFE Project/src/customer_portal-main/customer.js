// customer.js - lightweight sync/helper for customer dashboard

const ADMIN_MENU_KEY = "jessieCaneMenu";
const CUSTOMER_MENU_KEY = "jessie_menu";
const DEFAULT_IMAGE = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' fill='%23FFD966'/><text x='50' y='55' font-size='30' fill='%23146B33' text-anchor='middle'>🥤</text></svg>";

function migrateItemPrices(item) {
    if (!item) return null;
    if (typeof item.priceRegular === 'number' && typeof item.priceTall === 'number') return item;
    const ps = parseFloat(item.priceSmall) || 0;
    const pm = parseFloat(item.priceMedium);
    const pl = parseFloat(item.priceLarge);
    // Mapping rule: Small -> Regular, Medium -> Tall, Large -> Tall (Medium preferred when present)
    const priceRegular = !isNaN(ps) ? ps : 0;
    const priceTall = (!isNaN(pm) && pm > 0) ? pm : ( (!isNaN(pl) && pl > 0) ? pl : priceRegular );
    return Object.assign({}, item, { priceRegular: Number(priceRegular), priceTall: Number(priceTall) });
}

function syncFromAdmin() {
    const adminMenu = JSON.parse(localStorage.getItem(ADMIN_MENU_KEY) || '[]');
    if (!Array.isArray(adminMenu) || adminMenu.length === 0) return [];

    const customerMenu = adminMenu.map((item, index) => {
        const imageMap = {
            "Pure Sugarcane": "images/pure-sugarcane.png",
            "Calamansi Cane": "images/calamansi-cane.png",
            "Lemon Cane": "images/lemon-cane.png",
            "Yakult Cane": "images/yakult-cane.png",
            "Calamansi Yakult Cane": "images/calamansi-yakult-cane.png",
            "Lemon Yakult Cane": "images/lemon-yakult-cane.png",
            "Lychee Cane": "images/lychee-cane.png",
            "Orange Cane": "images/orange-cane.png",
            "Passion Fruit Cane": "images/passion-fruit-cane.png",
            "Watermelon Cane": "images/watermelon-cane.png",
            "Strawberry Yogurt Cane": "images/strawberry-yogurt-cane.png",
            "Dragonfruit Cane": "images/dragon-fruit-cane.png"
        };
        const finalImage = item.image || imageMap[item.name] || DEFAULT_IMAGE;
        const migrated = migrateItemPrices(item);
        return {
            id: index + 1,
            name: item.name || 'Unnamed',
            desc: item.description || item.desc || '',
            priceRegular: (typeof migrated.priceRegular === 'number') ? migrated.priceRegular : Number(migrated.priceRegular || 0),
            priceTall: (typeof migrated.priceTall === 'number') ? migrated.priceTall : Number(migrated.priceTall || migrated.priceRegular || 0),
            img: finalImage
        };
    });

    localStorage.setItem(CUSTOMER_MENU_KEY, JSON.stringify(customerMenu));
    return customerMenu;
}

function getMenuItems() {
    // prefer customer storage but migrate if needed
    const stored = JSON.parse(localStorage.getItem(CUSTOMER_MENU_KEY) || '[]');
    if (Array.isArray(stored) && stored.length > 0) {
        return stored.map(migrateItemPrices);
    }
    return syncFromAdmin();
}

// expose for debugging
window.getMenuItemsForCustomer = getMenuItems;

console.log('customer.js loaded');

// Show notification function
function showToast(type, title, message) {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <strong>${title}</strong>
        <span>${message}</span>
    `;
    
    // Add to page
    document.body.appendChild(toast);
    
    // Remove after 3 seconds
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Popup functions
function showPopup(type, options) {
    // Implementation for popup modal
    const popup = document.createElement('div');
    popup.className = 'popup-overlay';
    popup.innerHTML = `
        <div class="popup popup-${type}">
            <h3>${options.title}</h3>
            <p>${options.message}</p>
            <div class="popup-actions">
                ${options.actions.map(action => 
                    `<button class="btn btn-${action.type}" onclick="${action.handler}">${action.text}</button>`
                ).join('')}
            </div>
        </div>
    `;
    document.body.appendChild(popup);
}

function hidePopup() {
    const popup = document.querySelector('.popup-overlay');
    if (popup) popup.remove();
}

// Render featured drinks
function renderFeaturedDrinks() {
    const allMenuItems = getMenuItems();
    console.log("Filtered menu items for display:", allMenuItems);
    
    const featured = allMenuItems.slice(0, 3); // Show first 3 items
    const container = document.getElementById("featured-drinks");
    const emptyState = document.getElementById("empty-featured");

    // Clear container first
    container.innerHTML = '';

    // Handle empty menu
    if (featured.length === 0) {
        emptyState.style.display = 'block';
        container.appendChild(emptyState);
        console.log("No menu items to display");
    } else {
        emptyState.style.display = 'none';
        featured.forEach(drink => {
            console.log("Rendering drink:", drink);
            
            const card = document.createElement("div");
            card.classList.add("product");
            
            // Simple image handling
            const imageHtml = drink.img && drink.img !== DEFAULT_IMAGE 
                ? `<img src="${drink.img}" alt="${drink.name}" onerror="this.style.display='none'">`
                : '<div class="no-image">🍹</div>';
            
            const regular = Number(drink.priceRegular || 0).toFixed(2);
            const tall = Number(drink.priceTall || drink.priceRegular || 0).toFixed(2);
            card.innerHTML = `
                ${imageHtml}
                <h3>${drink.name}</h3>
                <p>${drink.desc}</p>
                <p class="price">
                    Regular: ₱${regular}<br>
                    Tall: ₱${tall}
                </p>
                <button class="view-btn" onclick="location.href='drinks.html'">View Menu</button>
            `;
            container.appendChild(card);
        });
    }
}

document.addEventListener("DOMContentLoaded", () => {
    // Check if user is logged in
    const isLoggedIn = localStorage.getItem("isLoggedIn");
    if (!isLoggedIn || isLoggedIn !== "true") {
        window.location.href = "login.html";
        return;
    }

    // Debug: Check what's in localStorage
    console.log("=== CUSTOMER DASHBOARD DEBUG INFO ===");
    console.log("All localStorage data:");
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.includes('menu') || key.includes('Menu')) {
            console.log(key + ":", localStorage.getItem(key));
        }
    }

    // Render featured drinks
    renderFeaturedDrinks();

    // Logout functionality
    const logoutBtn = document.querySelector(".logout");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", (e) => {
            e.preventDefault();
            
            if (confirm('Are you sure you want to log out?')) {
                localStorage.removeItem("isLoggedIn");
                localStorage.removeItem("currentUser");
                setTimeout(() => {
                    window.location.href = "login.html";
                }, 500);
            }
        });
    }

    // Auto-refresh menu every 5 seconds to catch admin updates
    setInterval(() => {
        console.log("🔄 Auto-checking for menu updates...");
        renderFeaturedDrinks();
    }, 5000);
});

// Debug function to check sync status
function checkSyncStatus() {
    const adminMenu = JSON.parse(localStorage.getItem(ADMIN_MENU_KEY) || "[]");
    const customerMenu = JSON.parse(localStorage.getItem(CUSTOMER_MENU_KEY) || "[]");
    
    console.log("=== SYNC STATUS ===");
    console.log("Admin menu items:", adminMenu.length, adminMenu);
    console.log("Customer menu items:", customerMenu.length, customerMenu);
    
    alert(`Admin: ${adminMenu.length} items\nCustomer: ${customerMenu.length} items\nCheck console for details.`);
}

// Manual sync function
function manualSync() {
    const adminMenu = JSON.parse(localStorage.getItem(ADMIN_MENU_KEY) || "[]");
    
    if (adminMenu.length === 0) {
        alert("No items in admin menu to sync!");
        return;
    }
    
    console.log("🔄 Manual sync triggered...");
    
    // Convert and save to customer format
    const customerMenu = adminMenu.map((item, index) => {
        const migrated = migrateItemPrices(item);
        return {
            id: index + 1,
            name: item.name || 'Unnamed',
            desc: item.description || item.desc || '',
            priceRegular: migrated.priceRegular || 0,
            priceTall: migrated.priceTall || migrated.priceRegular || 0,
            img: item.image || DEFAULT_IMAGE
        };
    });
    
    localStorage.setItem(CUSTOMER_MENU_KEY, JSON.stringify(customerMenu));
    console.log(`✅ Manual sync completed: ${customerMenu.length} items`);
    alert(`Synced ${customerMenu.length} items to customer menu! Page will reload.`);
    location.reload();
}

// Force refresh function
function forceRefresh() {
    localStorage.removeItem(CUSTOMER_MENU_KEY);
    console.log("🔄 Force refresh - cleared customer menu cache");
    alert("Customer menu cache cleared! Syncing from admin...");
    renderFeaturedDrinks();
}

// Emergency cleanup function
function emergencyCleanup() {
    if (confirm('This will clear ALL menu data. Are you sure?')) {
        localStorage.removeItem(ADMIN_MENU_KEY);
        localStorage.removeItem(CUSTOMER_MENU_KEY);
        console.log("✅ Emergency cleanup completed");
        alert('All menu data cleared! Page will reload.');
        location.reload();
    }
}

// Debug function to check what's in localStorage
function debugMenuData() {
    console.log("=== DEBUG MENU DATA ===");
    console.log("Admin Menu (jessieCaneMenu):", JSON.parse(localStorage.getItem(ADMIN_MENU_KEY) || "[]"));
    console.log("Customer Menu (jessie_menu):", JSON.parse(localStorage.getItem(CUSTOMER_MENU_KEY) || "[]"));
    
    const adminCount = JSON.parse(localStorage.getItem(ADMIN_MENU_KEY) || "[]").length;
    const customerCount = JSON.parse(localStorage.getItem(CUSTOMER_MENU_KEY) || "[]").length;
    
    alert(`Admin: ${adminCount} items\nCustomer: ${customerCount} items\nCheck console for details.`);
}

// Add this CSS for the no-image placeholder
const style = document.createElement('style');
style.textContent = `
    .no-image {
        width: 100px;
        height: 100px;
        background: #f8f5e9;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 2rem;
        margin: 0 auto 15px;
        border: 3px solid #146B33;
    }
    
    .toast {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 5px;
        color: white;
        z-index: 1000;
        max-width: 300px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    
    .toast-success {
        background-color: #4CAF50;
    }
    
    .toast strong {
        display: block;
        margin-bottom: 5px;
    }
`;
document.head.appendChild(style);

// Log initialization
    console.log("✅ customer.js loaded successfully");
console.log("Available commands:");
console.log("- checkSyncStatus() - Check sync status");
console.log("- manualSync() - Force manual sync");
console.log("- forceRefresh() - Clear cache and refresh");
console.log("- debugMenuData() - Debug menu data");
console.log("- emergencyCleanup() - Clear all menu data");