// ===== customer_dashboard.js =====

// Storage Keys
const ADMIN_MENU_KEY = "jessieCaneMenu";
const CUSTOMER_MENU_KEY = "jessie_menu";
const DEFAULT_IMAGE = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' fill='%23FFD966'/><text x='50' y='55' font-size='30' fill='%23146B33' text-anchor='middle'>🥤</text></svg>";

// Get menu items from localStorage (synced from admin)
function getMenuItems() {
    try {
        if (typeof syncFromAdmin === 'function') syncFromAdmin();

        const storedMenu = JSON.parse(localStorage.getItem(CUSTOMER_MENU_KEY) || '[]');

        const migrated = Array.isArray(storedMenu) ? storedMenu.map(item => {
            if (!item) return null;
            if (typeof item.priceRegular === 'number' && typeof item.priceTall === 'number') return item;

            const ps = parseFloat(item.priceSmall) || 0;
            const pm = parseFloat(item.priceMedium);
            const pl = parseFloat(item.priceLarge);
            // Small -> Regular, Medium -> Tall, Large -> Tall (medium preferred)
            const priceRegular = !isNaN(ps) ? ps : 0;
            const priceTall = (!isNaN(pm) && pm > 0) ? pm : ( (!isNaN(pl) && pl > 0) ? pl : priceRegular );

            return Object.assign({}, item, { priceRegular: Number(priceRegular), priceTall: Number(priceTall) });
        }).filter(Boolean) : [];

        const validItems = migrated.filter(item => item && item.name && item.name.trim() !== '' && item.name !== 'JC' && !item.name.includes('Default') && typeof item.priceRegular === 'number' && item.priceRegular > 0);
        return validItems;
    } catch (err) {
        console.error('Error parsing customer menu items:', err);
        return [];
    }
}

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

// Render featured drinks WITH FADE TRANSITION
function renderFeaturedDrinks() {
    const allMenuItems = getMenuItems();
    console.log("🎯 Rendering featured drinks from:", allMenuItems);
    
    // Get random 3 items for featured section (or all if less than 3)
    const featured = allMenuItems.length > 3 
        ? shuffleArray([...allMenuItems]).slice(0, 3) 
        : allMenuItems;
    
    const container = document.getElementById("featured-drinks");
    const emptyState = document.getElementById("empty-featured");

    // Clear container first
    container.innerHTML = '';

    // Handle empty menu
    if (featured.length === 0) {
        emptyState.style.display = 'block';
        container.appendChild(emptyState);
        console.log("📭 No menu items to display in featured section");
    } else {
        emptyState.style.display = 'none';
        console.log(`🎉 Displaying ${featured.length} featured drinks`);
        
        // Create a featured-slider container for rotating items
        const slider = document.createElement('div');
        slider.className = 'featured-slider';
        container.appendChild(slider);

        featured.forEach((drink, index) => {
            console.log("🔄 Rendering featured drink:", drink);

            const card = document.createElement("div");
            card.classList.add("featured-item");
            if (index === 0) {
                card.classList.add("visible"); // First item is visible initially
            }

            const imageHtml = drink.img && !drink.img.includes('JC') 
                ? `<img src="${drink.img}" alt="${drink.name}" class="drink-image">`
                : '<div class="no-image">🍹</div>';

            card.innerHTML = `
                ${imageHtml}
                <h3>${drink.name}</h3>
                <p class="description">${drink.desc || 'Refreshing beverage'}</p>
                <div class="prices">
                    <div class="price-option">Regular: ₱${Number(drink.priceRegular || 0).toFixed(2)}</div>
                    ${drink.priceTall && drink.priceTall !== drink.priceRegular ? 
                      `<div class="price-option">Tall: ₱${Number(drink.priceTall || 0).toFixed(2)}</div>` : ''}
                </div>
                <button class="view-btn" onclick="location.href='drinks.html'">View Menu</button>
            `;

            slider.appendChild(card);
        });

        // Initialize rotation if we have multiple items
        if (featured.length > 1) {
            initFeaturedRotation(slider, { interval: 4500 });
        }
    }
}

// Helper function to shuffle array (for random featured items)
function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

// Rotation logic for featured-slider
function initFeaturedRotation(sliderEl, opts = {}) {
    if (!sliderEl) return;
    const interval = opts.interval || 4000;

    const items = Array.from(sliderEl.querySelectorAll('.featured-item'));
    if (items.length === 0) return;

    let current = 0;
    
    // Show the first item immediately
    items.forEach((it, i) => {
        it.classList.remove('visible', 'entering', 'exiting');
        if (i === 0) it.classList.add('visible');
    });

    // Preload images for smooth transitions
    items.forEach(it => {
        const img = it.querySelector('img');
        if (img) {
            const preload = new Image();
            preload.src = img.src;
        }
    });

    let timer = setInterval(() => {
        const next = (current + 1) % items.length;

        const curEl = items[current];
        const nextEl = items[next];

        // Start exit animation on current
        curEl.classList.remove('entering');
        curEl.classList.add('exiting');

        // Prepare next
        nextEl.classList.remove('exiting');
        nextEl.classList.add('entering');

        // Small timeout to allow entering class to take effect before marking visible
        setTimeout(() => {
            curEl.classList.remove('visible');
            curEl.classList.remove('exiting');

            nextEl.classList.add('visible');
            nextEl.classList.remove('entering');

            current = next;
        }, 80);

    }, interval);

    // Pause on hover for accessibility
    sliderEl.addEventListener('mouseenter', () => clearInterval(timer));
    sliderEl.addEventListener('mouseleave', () => {
        timer = setInterval(() => {
            const next = (current + 1) % items.length;
            const curEl = items[current];
            const nextEl = items[next];
            curEl.classList.add('exiting');
            nextEl.classList.add('entering');
            setTimeout(() => {
                curEl.classList.remove('visible', 'exiting');
                nextEl.classList.add('visible');
                nextEl.classList.remove('entering');
                current = next;
            }, 80);
        }, interval);
    });
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
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.includes('menu') || key.includes('Menu')) {
            const data = JSON.parse(localStorage.getItem(key) || "[]");
            console.log(`${key}: ${data.length} items`, data);
        }
    }

    // Initial render
    renderFeaturedDrinks();

    // Allow manual re-render via window for debugging
    window.renderFeaturedDrinks = renderFeaturedDrinks;

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
});

// Debug function to check sync status
function checkSyncStatus() {
    const adminMenu = JSON.parse(localStorage.getItem(ADMIN_MENU_KEY) || "[]");
    const customerMenu = JSON.parse(localStorage.getItem(CUSTOMER_MENU_KEY) || "[]");
    
    console.log("=== SYNC STATUS ===");
    console.log("Admin menu items:", adminMenu);
    console.log("Customer menu items:", customerMenu);
    
    const featuredContainer = document.getElementById("featured-drinks");
    const featuredCount = featuredContainer.querySelectorAll('.featured-item').length;
    
    alert(`Admin: ${adminMenu.length} items\nCustomer: ${customerMenu.length} items\nFeatured: ${featuredCount} items showing\nCheck console for details.`);
}

// Manual sync function
function manualSync() {
    const adminMenu = JSON.parse(localStorage.getItem(ADMIN_MENU_KEY) || "[]");
    
    if (adminMenu.length === 0) {
        alert("No items in admin menu to sync!");
        return;
    }
    
    console.log("🔄 Manual sync triggered...", adminMenu);
    
    // Convert and save to customer format
    const customerMenu = adminMenu.map((item, index) => {
        const imageMap = {
            "Pure Sugarcane": "images/pure-sugarcane.png",
            "Calamansi Cane": "images/calamansi-cane.png", 
            "Lemon Cane": "images/lemon-cane.png"
        };
        
        return {
            id: index + 1,
            name: item.name,
            desc: item.description,
            priceRegular: parseFloat(item.priceRegular) || parseFloat(item.priceSmall) || 0,
            priceTall: parseFloat(item.priceTall) || parseFloat(item.priceMedium) || parseFloat(item.priceLarge) || parseFloat(item.priceSmall) || 0,
            img: item.image || imageMap[item.name] || DEFAULT_IMAGE
        };
    });
    
    localStorage.setItem(CUSTOMER_MENU_KEY, JSON.stringify(customerMenu));
    console.log(`✅ Manual sync completed: ${customerMenu.length} items`, customerMenu);
    
    // Immediately re-render featured drinks
    renderFeaturedDrinks();
    
    alert(`Synced ${customerMenu.length} items to customer menu! Featured drinks updated.`);
}

// Force refresh function
function forceRefresh() {
    localStorage.removeItem(CUSTOMER_MENU_KEY);
    console.log("🔄 Force refresh - cleared customer menu cache");
    renderFeaturedDrinks();
    alert("Customer menu cache cleared! Re-syncing from admin...");
}

// Emergency cleanup function
function emergencyCleanup() {
    if (confirm('This will clear ALL menu data. Are you sure?')) {
        localStorage.removeItem(ADMIN_MENU_KEY);
        localStorage.removeItem(CUSTOMER_MENU_KEY);
        console.log("✅ Emergency cleanup completed");
        renderFeaturedDrinks();
        alert('All menu data cleared! Featured drinks section updated.');
    }
}

// Debug function to check what's in localStorage
function debugMenuData() {
    console.log("=== DEBUG MENU DATA ===");
    console.log("Admin Menu (jessieCaneMenu):", JSON.parse(localStorage.getItem(ADMIN_MENU_KEY) || "[]"));
    console.log("Customer Menu (jessie_menu):", JSON.parse(localStorage.getItem(CUSTOMER_MENU_KEY) || "[]"));
    
    const adminCount = JSON.parse(localStorage.getItem(ADMIN_MENU_KEY) || "[]").length;
    const customerCount = JSON.parse(localStorage.getItem(CUSTOMER_MENU_KEY) || "[]").length;
    const featuredCount = document.querySelectorAll('.featured-item').length;
    
    alert(`Admin: ${adminCount} items\nCustomer: ${customerCount} items\nFeatured Showing: ${featuredCount} items\nCheck console for details.`);
}

// Add CSS for the featured drinks
const style = document.createElement('style');
style.textContent = `
    .no-image {
        width: 120px;
        height: 120px;
        background: #f8f5e9;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 3rem;
        margin: 0 auto 15px;
        border: 4px solid #146B33;
    }
    
    .drink-image {
        width: 120px;
        height: 120px;
        object-fit: cover;
        border-radius: 50%;
        margin: 0 auto 15px;
        display: block;
        border: 4px solid #146B33;
    }
    
    .prices {
        margin: 15px 0;
    }
    
    .price-option {
        background: #FFD966;
        padding: 8px 15px;
        border-radius: 20px;
        margin: 5px 0;
        font-weight: bold;
        color: #146B33;
    }
    
    .description {
        color: #666;
        margin: 10px 0;
        line-height: 1.5;
        min-height: 40px;
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
console.log("✅ customer_dashboard.js loaded successfully");
console.log("Available debug commands:");
console.log("- checkSyncStatus() - Check sync status");
console.log("- manualSync() - Force manual sync and update featured drinks");
console.log("- forceRefresh() - Clear cache and refresh");
console.log("- debugMenuData() - Debug menu data");
console.log("- emergencyCleanup() - Clear all menu data");
console.log("- initFeaturedRotation() - Manually restart rotation");
