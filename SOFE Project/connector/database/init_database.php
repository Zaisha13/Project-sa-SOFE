<?php
class DatabaseInitializer {
    private $pdo;
    private $db_path;
    
    public function __construct($db_path) {
        $this->db_path = $db_path;
        $this->initialize();
    }
    
    private function initialize() {
        try {
            // Create database directory if it doesn't exist
            $db_dir = dirname($this->db_path);
            if (!file_exists($db_dir)) {
                mkdir($db_dir, 0755, true);
            }
            
            // Connect to SQLite database
            $this->pdo = new PDO('sqlite:' . $this->db_path);
            $this->pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            
            // Enable foreign keys
            $this->pdo->exec('PRAGMA foreign_keys = ON');
            
            // Create schema
            $this->createSchema();
            
            // Insert default data
            $this->insertDefaultData();
            
            echo "Database initialized successfully!\n";
            
        } catch (PDOException $e) {
            die("Database initialization failed: " . $e->getMessage());
        }
    }
    
    private function createSchema() {
        // Users table
        $this->pdo->exec("CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username VARCHAR(50) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            role VARCHAR(20) DEFAULT 'Customer' CHECK (role IN ('Admin', 'Cashier', 'Customer')),
            email VARCHAR(100),
            full_name VARCHAR(100),
            is_active BOOLEAN DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )");
        
        // Menu items table
        $this->pdo->exec("CREATE TABLE IF NOT EXISTS menu_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name VARCHAR(100) NOT NULL,
            description TEXT,
            price DECIMAL(10,2) NOT NULL,
            image TEXT,
            is_active BOOLEAN DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )");
        
        // Orders table
        $this->pdo->exec("CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
            status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled')),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )");
        
        // Order items table
        $this->pdo->exec("CREATE TABLE IF NOT EXISTS order_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id INTEGER NOT NULL,
            menu_item_id INTEGER NOT NULL,
            quantity INTEGER NOT NULL DEFAULT 1,
            unit_price DECIMAL(10,2) NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
            FOREIGN KEY (menu_item_id) REFERENCES menu_items(id)
        )");
        
        // Announcements table
        $this->pdo->exec("CREATE TABLE IF NOT EXISTS announcements (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title VARCHAR(200) NOT NULL,
            content TEXT NOT NULL,
            image TEXT,
            is_active BOOLEAN DEFAULT 1,
            created_by INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (created_by) REFERENCES users(id)
        )");
        
        // Create indexes
        $this->pdo->exec("CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)");
        $this->pdo->exec("CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)");
        $this->pdo->exec("CREATE INDEX IF NOT EXISTS idx_menu_items_active ON menu_items(is_active)");
        $this->pdo->exec("CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)");
        $this->pdo->exec("CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id)");
        $this->pdo->exec("CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id)");
    }
    
    private function insertDefaultData() {
        // Default users
        $stmt = $this->pdo->query("SELECT COUNT(*) FROM users");
        if ($stmt->fetchColumn() == 0) {
            $this->pdo->exec("INSERT INTO users (username, password, role, email, full_name) VALUES 
                ('admin', '\$2y\$10\$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Admin', 'admin@jessiecane.com', 'System Administrator'),
                ('cashier1', '\$2y\$10\$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Cashier', 'cashier@jessiecane.com', 'Cashier User')");
        }
        
        // Default menu items
        $stmt = $this->pdo->query("SELECT COUNT(*) FROM menu_items");
        if ($stmt->fetchColumn() == 0) {
            $this->pdo->exec("INSERT INTO menu_items (name, description, price, image) VALUES 
                ('Classic Sugarcane Juice', 'Freshly pressed pure sugarcane juice, served chilled', 4.99, 'data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><rect width=\"100\" height=\"100\" fill=\"%23FFD966\"/><text x=\"50\" y=\"55\" font-size=\"30\" fill=\"%23146B33\" text-anchor=\"middle\">JC</text></svg>'),
                ('Ginger Cane', 'Sugarcane juice with a spicy ginger kick', 5.49, 'data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><rect width=\"100\" height=\"100\" fill=\"%23FFD966\"/><text x=\"50\" y=\"55\" font-size=\"30\" fill=\"%23146B33\" text-anchor=\"middle\">GC</text></svg>'),
                ('Lychee Cane', 'Tropical sweetness of lychee meets fresh cane juice', 6.99, 'data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><rect width=\"100\" height=\"100\" fill=\"%23FFD966\"/><text x=\"50\" y=\"55\" font-size=\"30\" fill=\"%23146B33\" text-anchor=\"middle\">LC</text></svg>'),
                ('Orange Cane', 'Citrus twist with fresh sugarcane base', 6.49, 'data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><rect width=\"100\" height=\"100\" fill=\"%23FFD966\"/><text x=\"50\" y=\"55\" font-size=\"30\" fill=\"%23146B33\" text-anchor=\"middle\">OC</text></svg>')");
        }
        
        // Default announcement
        $stmt = $this->pdo->query("SELECT COUNT(*) FROM announcements");
        if ($stmt->fetchColumn() == 0) {
            $this->pdo->exec("INSERT INTO announcements (title, content, created_by) VALUES 
                ('Welcome to Jessie Cane!', 'We are excited to serve you the freshest sugarcane juice in town. Check out our new seasonal specials!', 1)");
        }
    }
    
    public function getConnection() {
        return $this->pdo;
    }
}
?>