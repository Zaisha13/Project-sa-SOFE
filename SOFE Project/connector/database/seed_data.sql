-- Insert default admin user
INSERT OR IGNORE INTO users (username, password, role, email, full_name) VALUES 
('admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Admin', 'admin@jessiecane.com', 'System Administrator'),
('cashier1', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Cashier', 'cashier@jessiecane.com', 'Cashier User');

-- Insert sample menu items
INSERT OR IGNORE INTO menu_items (name, description, price, image) VALUES 
('Classic Sugarcane Juice', 'Freshly pressed pure sugarcane juice, served chilled', 4.99, 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23FFD966"/><text x="50" y="55" font-size="30" fill="%23146B33" text-anchor="middle">JC</text></svg>'),
('Ginger Cane', 'Sugarcane juice with a spicy ginger kick', 5.49, 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23FFD966"/><text x="50" y="55" font-size="30" fill="%23146B33" text-anchor="middle">GC</text></svg>'),
('Lychee Cane', 'Tropical sweetness of lychee meets fresh cane juice', 6.99, 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23FFD966"/><text x="50" y="55" font-size="30" fill="%23146B33" text-anchor="middle">LC</text></svg>'),
('Orange Cane', 'Citrus twist with fresh sugarcane base', 6.49, 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23FFD966"/><text x="50" y="55" font-size="30" fill="%23146B33" text-anchor="middle">OC</text></svg>');

-- Insert sample announcement
INSERT OR IGNORE INTO announcements (title, content, created_by) VALUES 
('Welcome to Jessie Cane!', 'We are excited to serve you the freshest sugarcane juice in town. Check out our new seasonal specials!', 1);