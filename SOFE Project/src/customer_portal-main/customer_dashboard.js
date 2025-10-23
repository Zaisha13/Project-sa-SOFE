const ADMIN_MENU_KEY = "jessieCaneMenu";
const CUSTOMER_MENU_KEY = "jessie_menu";
const DEFAULT_IMAGE = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' fill='%23FFD966'/><text x='50' y='55' font-size='30' fill='%23146B33' text-anchor='middle'>🥤</text></svg>";

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

    try { initFeaturedTextRotation(container, { interval: 4500 }); } catch (err) { console.warn('initFeaturedTextRotation error', err); }
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

function renderFeaturedDrinks() {
    const allMenuItems = getMenuItems();
    const container = document.getElementById("featured-drinks");
    const emptyState = document.getElementById("empty-featured");

    container.innerHTML = '';

    if (!allMenuItems || allMenuItems.length === 0) {
        emptyState.style.display = 'block';
        container.appendChild(emptyState);
        console.log("📭 No menu items to display in featured section");
        return;
    }

    emptyState.style.display = 'none';

    const slots = Math.min(3, allMenuItems.length);

    function buildSlotElement(drink) {
        const el = document.createElement('div');
        el.className = 'product featured-slot';

        const imageHtml = drink && drink.img && !drink.img.includes('JC') ? `<img src="${drink.img}" alt="${drink.name}" class="drink-image">` : '<div class="no-image">🍹</div>';
        const nameHtml = `<h3>${drink && drink.name ? drink.name : ''}</h3>`;
                const descHtml = `<div class="description">${drink && drink.desc ? drink.desc : ''}</div>`;
                const pricesHtml = `<div class="prices" aria-hidden="true"><div class="price-option">Regular: ₱${Number(drink && drink.priceRegular || 0).toFixed(2)}</div><div class="price-option">Tall: ₱${Number((drink && drink.priceTall) || (drink && drink.priceRegular) || 0).toFixed(2)}</div></div>`;

        el.innerHTML = `${imageHtml}${nameHtml}${descHtml}${pricesHtml}<button class="view-btn" onclick="location.href='drinks.html'">View Menu</button>`;
        return el;
    }

    function pickRandomSet() {
        const pool = [...allMenuItems];
        const result = [];
        while (result.length < slots && pool.length > 0) {
            const idx = Math.floor(Math.random() * pool.length);
            result.push(pool.splice(idx, 1)[0]);
        }
        return result;
    }

    const initialSet = pickRandomSet();
    initialSet.forEach(drink => container.appendChild(buildSlotElement(drink)));
    // ensure we always have the number of slots
    while (container.children.length < slots) container.appendChild(buildSlotElement({}));
    const interval = 6000;
    if (container._rotTimer) clearInterval(container._rotTimer);

    let previousIds = initialSet.map(d => d && d.id ? d.id : (d && d.name) || JSON.stringify(d));

    function rotateOnce() {
        let attempts = 0;
        let next = pickRandomSet();
        const nextIds = next.map(d => d && d.id ? d.id : (d && d.name) || JSON.stringify(d));
        while (arraysEqual(nextIds, previousIds) && attempts < 8) {
            next = pickRandomSet();
            attempts++;
        }

        const slotEls = Array.from(container.querySelectorAll('.featured-slot'));
            slotEls.forEach((oldSlot, i) => {
                const drink = next[i] || {};
                try {
                                        const newInner = (function(d){
                                                var imageHtml = (d && d.img && !d.img.includes('JC')) ? ('<img src="' + (d.img || '') + '" alt="' + (d.name || '') + '" class="drink-image">') : ('<div class="no-image">🍹</div>');
                                                var nameHtml = '<h3>' + (d && d.name ? d.name : '') + '</h3>';
                                                var descHtml = '<div class="description-wrapper"><div class="desc-rotator">' +
                                                        '<div class="alt-item alt-visible">' + (d && d.desc ? d.desc : '') + '</div>' +
                                                        '<div class="alt-item alt-hidden">Regular: ₱' + Number(d && d.priceRegular || 0).toFixed(2) + '</div>' +
                                                        '<div class="alt-item alt-hidden">Tall: ₱' + Number((d && d.priceTall) || (d && d.priceRegular) || 0).toFixed(2) + '</div>' +
                                                        '</div></div>';
                                                var pricesHtml = '<div class="prices" aria-hidden="true"><div class="price-option">Regular: ₱' + Number(d && d.priceRegular || 0).toFixed(2) + '</div><div class="price-option">Tall: ₱' + Number((d && d.priceTall) || (d && d.priceRegular) || 0).toFixed(2) + '</div></div>';
                                                return imageHtml + nameHtml + descHtml + pricesHtml + '<button class="view-btn" onclick="location.href=\'drinks.html\'">View Menu</button>';
                                        })(drink);

                    oldSlot.innerHTML = newInner;
                } catch (err) {
                    console.warn('Error replacing slot content', err);
                }
            });

        previousIds = nextIds;
    }

    container._rotTimer = setInterval(rotateOnce, interval);
    container.addEventListener('mouseenter', () => { if (container._rotTimer) { clearInterval(container._rotTimer); container._rotTimer = null; } });
    container.addEventListener('mouseleave', () => { if (!container._rotTimer) container._rotTimer = setInterval(rotateOnce, interval); });

    function arraysEqual(a, b) {
        if (!a || !b || a.length !== b.length) return false;
        for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
        return true;
    }
}
function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

document.addEventListener("DOMContentLoaded", () => {
    const isLoggedIn = localStorage.getItem("isLoggedIn");
    console.log("customer_dashboard: isLoggedIn=", isLoggedIn);
    console.log("=== CUSTOMER DASHBOARD DEBUG INFO ===");
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.includes('menu') || key.includes('Menu')) {
            const data = JSON.parse(localStorage.getItem(key) || "[]");
            console.log(`${key}: ${data.length} items`, data);
        }
    }

    renderFeaturedDrinks();

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

function manualSync() {
    const adminMenu = JSON.parse(localStorage.getItem(ADMIN_MENU_KEY) || "[]");
    
    if (adminMenu.length === 0) {
        alert("No items in admin menu to sync!");
        return;
    }
    
    console.log("🔄 Manual sync triggered...", adminMenu);

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
    renderFeaturedDrinks();
    
    alert(`Synced ${customerMenu.length} items to customer menu! Featured drinks updated.`);
}

function forceRefresh() {
    localStorage.removeItem(CUSTOMER_MENU_KEY);
    console.log("🔄 Force refresh - cleared customer menu cache");
    renderFeaturedDrinks();
    alert("Customer menu cache cleared! Re-syncing from admin...");
}

function emergencyCleanup() {
    if (confirm('This will clear ALL menu data. Are you sure?')) {
        localStorage.removeItem(ADMIN_MENU_KEY);
        localStorage.removeItem(CUSTOMER_MENU_KEY);
        console.log("✅ Emergency cleanup completed");
        renderFeaturedDrinks();
        alert('All menu data cleared! Featured drinks section updated.');
    }
}

function debugMenuData() {
    console.log("=== DEBUG MENU DATA ===");
    console.log("Admin Menu (jessieCaneMenu):", JSON.parse(localStorage.getItem(ADMIN_MENU_KEY) || "[]"));
    console.log("Customer Menu (jessie_menu):", JSON.parse(localStorage.getItem(CUSTOMER_MENU_KEY) || "[]"));
    
    const adminCount = JSON.parse(localStorage.getItem(ADMIN_MENU_KEY) || "[]").length;
    const customerCount = JSON.parse(localStorage.getItem(CUSTOMER_MENU_KEY) || "[]").length;
    const featuredCount = document.querySelectorAll('.product').length;
    
    alert(`Admin: ${adminCount} items\nCustomer: ${customerCount} items\nFeatured Showing: ${featuredCount} items\nCheck console for details.`);
}

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
    /* Description style (static) */
    .description { color: #666; margin: 10px 0; line-height: 1.5; min-height: 40px; }
`;
document.head.appendChild(style);
console.log("✅ customer_dashboard.js loaded successfully");
console.log("Available debug commands:");
console.log("- checkSyncStatus() - Check sync status");
console.log("- manualSync() - Force manual sync and update featured drinks");
console.log("- forceRefresh() - Clear cache and refresh");
console.log("- debugMenuData() - Debug menu data");
console.log("- emergencyCleanup() - Clear all menu data");
