// ===== customer_dashboard.js =====

// Storage Keys
const ADMIN_MENU_KEY = "jessieCaneMenu";
const CUSTOMER_MENU_KEY = "jessie_menu";
const DEFAULT_IMAGE = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' fill='%23FFD966'/><text x='50' y='55' font-size='30' fill='%23146B33' text-anchor='middle'>🥤</text></svg>";

// Get menu items from localStorage (synced from admin)
function getMenuItems() {
    try {
        // First, check if we need to sync from admin
        syncFromAdmin();
        
        // Then read from customer storage
        const storedMenu = JSON.parse(localStorage.getItem(CUSTOMER_MENU_KEY) || "[]");
        console.log("🔄 Loaded menu items from customer storage:", storedMenu);
        
        // Return only valid items
        const validItems = Array.isArray(storedMenu) ? storedMenu.filter(item => 
            item && 
            item.name && 
            item.name.trim() !== "" &&
            item.name !== "JC" &&
            !item.name.includes("Default") &&
            typeof item.priceSmall === 'number' &&
            item.priceSmall > 0
        ) : [];
        
        console.log("✅ Valid menu items:", validItems);
        return validItems;
    } catch (error) {
        console.error('Error parsing menu items:', error);
        return [];
    }
}

// Sync menu from admin to customer
function syncFromAdmin() {
    const adminMenu = JSON.parse(localStorage.getItem(ADMIN_MENU_KEY) || "[]");
    const customerMenu = JSON.parse(localStorage.getItem(CUSTOMER_MENU_KEY) || "[]");
    
    console.log("🔄 Sync Check - Admin items:", adminMenu.length, "Customer items:", customerMenu.length);
    
    // Always sync if admin has items (this ensures featured drinks get updated)
    if (adminMenu.length > 0) {
        console.log("🔄 Syncing menu from admin to customer...", adminMenu);
        
        // Convert admin menu format to customer dashboard format
        const newCustomerMenu = adminMenu.map((item, index) => {
            // Use mapped images based on drink name
            const imageMap = {
                "Pure Sugarcane": "images/pure-sugarcane.png",
                "Calamansi Cane": "images/calamansi-cane.png", 
                "Lemon Cane": "images/lemon-cane.png",
                "Yakult Cane": "images/yakult-cane.png",
                "Calamansi-Yakult Cane": "images/calamansi-yakult-cane.png",
                "Lemon-Yakult Cane": "images/lemon-yakult-cane.png",
                "Lychee Cane": "images/lychee-cane.png",
                "Orange Cane": "images/orange-cane.png",
                "Passion Fruit Cane": "images/passion-fruit-cane.png",
                "Watermelon Cane": "images/watermelon-cane.png",
                "Strawberry Yogurt Cane": "images/strawberry-yogurt-cane.png",
                "Dragon Fruit Cane": "images/dragon-fruit-cane.png"
            };
            
            const finalImage = item.image || imageMap[item.name] || DEFAULT_IMAGE;
            
            return {
                id: index + 1,
                name: item.name || "Unnamed Item",
                desc: item.description || "No description available",
                priceSmall: parseFloat(item.priceSmall) || 0,
                priceMedium: parseFloat(item.priceMedium) || 0,
                priceLarge: parseFloat(item.priceLarge) || 0,
                img: finalImage
            };
        });

        // Save to customer dashboard storage
        localStorage.setItem(CUSTOMER_MENU_KEY, JSON.stringify(newCustomerMenu));
        console.log(`✅ Menu synced: ${newCustomerMenu.length} items available to customers`);
        
        return newCustomerMenu;
    }
    
    return customerMenu;
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

// Render featured drinks
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
        
        featured.forEach(drink => {
            console.log("🔄 Rendering featured drink:", drink);
            
            const card = document.createElement("div");
            card.classList.add("product");
            
            // Simple image handling - remove complex onerror that causes '"> issues
            const imageHtml = drink.img && !drink.img.includes('JC') 
                ? `<img src="${drink.img}" alt="${drink.name}" class="drink-image">`
                : '<div class="no-image">🍹</div>';
            
            card.innerHTML = `
                ${imageHtml}
                <h3>${drink.name}</h3>
                <p class="description">${drink.desc}</p>
                <div class="prices">
                    <div class="price-option">Small: ₱${drink.priceSmall.toFixed(2)}</div>
                    <div class="price-option">Medium: ₱${drink.priceMedium.toFixed(2)}</div>
                    <div class="price-option">Large: ₱${drink.priceLarge.toFixed(2)}</div>
                </div>
                <button class="view-btn" onclick="location.href='drinks.html'">View Menu</button>
            `;
            container.appendChild(card);
        });
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
    const featuredCount = featuredContainer.querySelectorAll('.product').length;
    
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
            priceSmall: parseFloat(item.priceSmall) || 0,
            priceMedium: parseFloat(item.priceMedium) || 0,
            priceLarge: parseFloat(item.priceLarge) || 0,
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
    const featuredCount = document.querySelectorAll('.product').length;
    
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