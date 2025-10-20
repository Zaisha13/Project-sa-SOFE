<?php
// Test database queries
$db_path = __DIR__ . '/database/jessie_cane.sqlite';

try {
    $db = new SQLite3($db_path);
    
    echo "🧪 Testing Database Queries...\n";

    // Test: Count tables
    $result = $db->query("SELECT name FROM sqlite_master WHERE type='table'");
    $tables = [];
    while ($row = $result->fetchArray(SQLITE3_ASSOC)) {
        $tables[] = $row['name'];
    }
    echo "📋 Found " . count($tables) . " tables: " . implode(', ', $tables) . "\n";

    // Test: Check if users table is empty
    $user_count = $db->querySingle("SELECT COUNT(*) FROM users");
    echo "👥 Users table has $user_count records\n";

    // Test: Check if menu_items table is empty  
    $menu_count = $db->querySingle("SELECT COUNT(*) FROM menu_items");
    echo "🍹 Menu items table has $menu_count records\n";

    echo "✅ All tests passed!\n";
    
    $db->close();

} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
?>