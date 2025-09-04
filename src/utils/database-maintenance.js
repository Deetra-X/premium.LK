const db = require('../db');

/**
 * Database maintenance utility for categories
 */
class CategoryMaintenance {
  /**
   * Clean up orphaned or invalid category records
   */
  static async cleanupCategories() {
    try {
      console.log('🧹 Starting category cleanup...');
      
      // Find categories with invalid JSON in service_types
      const [invalidCategories] = await db.query(`
        SELECT id, name, service_types 
        FROM product_categories 
        WHERE service_types IS NOT NULL 
        AND service_types != ''
        AND JSON_VALID(service_types) = 0
      `);
      
      console.log(`Found ${invalidCategories.length} categories with invalid JSON`);
      
      for (const category of invalidCategories) {
        console.log(`🔧 Fixing category ${category.name} (${category.id})`);
        
        // Try to fix the service_types field
        let fixedServiceTypes = '["other"]'; // default fallback
        
        if (typeof category.service_types === 'string') {
          // Try to convert comma-separated to JSON array
          const types = category.service_types.split(',').map(s => s.trim()).filter(s => s);
          if (types.length > 0) {
            fixedServiceTypes = JSON.stringify(types);
          }
        }
        
        await db.query(
          'UPDATE product_categories SET service_types = ? WHERE id = ?',
          [fixedServiceTypes, category.id]
        );
        
        console.log(`✅ Fixed category ${category.name}`);
      }
      
      // Reset any soft-deleted categories that might be stuck
      const [softDeleted] = await db.query(`
        SELECT id, name FROM product_categories WHERE is_active = 0
      `);
      
      console.log(`Found ${softDeleted.length} soft-deleted categories`);
      
      return {
        fixedInvalidJson: invalidCategories.length,
        softDeletedCount: softDeleted.length
      };
      
    } catch (error) {
      console.error('❌ Error during category cleanup:', error);
      throw error;
    }
  }
  
  /**
   * Verify category data integrity
   */
  static async verifyCategories() {
    try {
      console.log('🔍 Verifying category data integrity...');
      
      const [categories] = await db.query(`
        SELECT id, name, service_types, is_active 
        FROM product_categories
      `);
      
      const issues = [];
      
      for (const category of categories) {
        // Check for empty names
        if (!category.name || category.name.trim() === '') {
          issues.push(`Category ${category.id} has empty name`);
        }
        
        // Check for invalid service_types
        try {
          if (category.service_types) {
            JSON.parse(category.service_types);
          }
        } catch (e) {
          issues.push(`Category ${category.name} (${category.id}) has invalid service_types JSON`);
        }
      }
      
      return {
        totalCategories: categories.length,
        activeCategories: categories.filter(c => c.is_active === 1).length,
        issues
      };
      
    } catch (error) {
      console.error('❌ Error during category verification:', error);
      throw error;
    }
  }
  
  /**
   * Force enable/disable category management
   */
  static async resetCategoryPermissions() {
    try {
      console.log('🔧 Resetting category permissions...');
      
      // You can add specific permission/access control logic here
      // For now, just ensure all active categories are properly formatted
      
      const [result] = await db.query(`
        UPDATE product_categories 
        SET service_types = '["other"]' 
        WHERE service_types IS NULL 
        OR service_types = '' 
        OR JSON_VALID(service_types) = 0
      `);
      
      console.log(`✅ Updated ${result.affectedRows} categories with default service types`);
      
      return result.affectedRows;
      
    } catch (error) {
      console.error('❌ Error resetting category permissions:', error);
      throw error;
    }
  }

  /**
   * Clean up sales and order data
   */
  static async cleanupSales() {
    try {
      console.log('🧹 Starting sales cleanup...');
      
      // Find sales with invalid JSON in items
      const [invalidSales] = await db.query(`
        SELECT id, order_number, items 
        FROM sales 
        WHERE items IS NOT NULL 
        AND items != ''
        AND JSON_VALID(items) = 0
      `);
      
      console.log(`Found ${invalidSales.length} sales with invalid JSON`);
      
      for (const sale of invalidSales) {
        console.log(`🔧 Fixing sale ${sale.order_number} (${sale.id})`);
        
        // Try to fix the items field
        let fixedItems = '[]'; // default fallback
        
        if (typeof sale.items === 'string') {
          // Try to parse or create valid JSON
          try {
            JSON.parse(sale.items);
            fixedItems = sale.items;
          } catch {
            fixedItems = '[]';
          }
        }
        
        await db.query(
          'UPDATE sales SET items = ? WHERE id = ?',
          [fixedItems, sale.id]
        );
        
        console.log(`✅ Fixed sale ${sale.order_number}`);
      }
      
      return {
        fixedInvalidJson: invalidSales.length
      };
      
    } catch (error) {
      console.error('❌ Error during sales cleanup:', error);
      throw error;
    }
  }

  /**
   * Generate next order number
   */
  static async generateOrderNumber() {
    try {
      const year = new Date().getFullYear();
      const prefix = `ORD-${year}-`;
      
      // Get the latest order number for this year
      const [latestOrder] = await db.query(`
        SELECT order_number FROM sales 
        WHERE order_number LIKE ?
        ORDER BY created_at DESC 
        LIMIT 1
      `, [`${prefix}%`]);
      
      let nextNumber = 1;
      if (latestOrder.length > 0) {
        const lastNumber = latestOrder[0].order_number.split('-').pop();
        nextNumber = parseInt(lastNumber) + 1;
      }
      
      return `${prefix}${nextNumber.toString().padStart(4, '0')}`;
    } catch (error) {
      console.error('❌ Error generating order number:', error);
      // Fallback to timestamp-based number
      return `ORD-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;
    }
  }
}

module.exports = CategoryMaintenance;
