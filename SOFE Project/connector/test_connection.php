<?php
// Test SQLite Connection for connector folder
$db_path = __DIR__ . '/database/jessie_cane.sqlite';

echo "🧪 Testing SQLite Connection in connector folder...\n";

try {
    // Create database directory
    if (!file_exists(dirname($db_path))) {
        mkdir(dirname($db_path), 0755, true);
        echo "✅ Created database directory\n";
    }
    
    // Connect to SQLite using SQLite3 class (which we know works)
    $db = new SQLite3($db_path);
    echo "✅ Connected to SQLite database\n";
    
    // Test SQLite version
    $version = $db->querySingle('SELECT sqlite_version()');
    echo "📊 SQLite Version: $version\n";
    
    // Create tables from schema
    $schema = file_get_contents(__DIR__ . '/database/schema.sql');
    $db->exec($schema);
    echo "✅ Database schema created successfully\n";
    
    // List tables
    $result = $db->query("SELECT name FROM sqlite_master WHERE type='table'");
    $tables = [];
    while ($row = $result->fetchArray(SQLITE3_ASSOC)) {
        $tables[] = $row['name'];
    }
    echo "📋 Tables created: " . implode(', ', $tables) . "\n";
    
    echo "🎉 Database setup completed successfully!\n";
    
    $db->close();
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
?>