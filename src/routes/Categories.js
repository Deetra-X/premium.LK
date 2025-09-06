const express = require('express');
const router = express.Router();
const db = require('../db');
const CategoryMaintenance = require('../utils/database-maintenance');

// Startup marker to confirm this version is loaded
console.log('🔥 Categories route loaded - HARD DELETE ONLY VERSION');

/*
 Legacy (now unused) helper snippet that tried to parse service_types for a freshly
 created category. Kept here for reference but not executed.
*/
/******************* CATEGORY ROUTES ********************/
/**
 * Fetches all product categories from the database.
 * Returns array of category objects with id, name, description, icon, color, service_types, created_at, is_active.
 */
router.get('/', async (req, res) => {
  try {
    console.log('📋 Fetching categories from database...');
    const [rows] = await db.query(`
      SELECT 
        id, 
        name, 
        description, 
        icon, 
        color, 
        service_types, 
        created_at, 
        is_active 
      FROM product_categories 
      WHERE is_active = 1 
      ORDER BY name ASC
    `);
    
    console.log(`✅ Found ${rows.length} categories`);
    
    // Parse service_types JSON string back to array for frontend
    const categories = rows.map(category => {
      let serviceTypes = [];
      try {
        if (!category.service_types) {
          serviceTypes = [];
        } else if (typeof category.service_types === 'string') {
          if (category.service_types === 'other') {
            // Handle the simple 'other' case
            serviceTypes = ['other'];
          } else if (category.service_types.includes(',') && 
                    !category.service_types.startsWith('[')) {
            // Handle comma-separated values that aren't JSON
            serviceTypes = category.service_types.split(',').map(type => type.trim());
          } else if (category.service_types.startsWith('[') && 
                    category.service_types.endsWith(']')) {
            // Handle JSON arrays
            try {
              serviceTypes = JSON.parse(category.service_types);
            } catch (jsonError) {
              console.warn(`⚠️ Failed to parse JSON array for category ${category.id}:`, jsonError);
              serviceTypes = [category.service_types]; // Use as is if JSON parse fails
            }
          } else {
            // Any other string format
            serviceTypes = [category.service_types];
          }
        } else if (Array.isArray(category.service_types)) {
          serviceTypes = category.service_types;
        }
      } catch (parseError) {
        console.warn(`⚠️ Failed to parse service_types for category ${category.id}:`, parseError);
        serviceTypes = category.service_types ? [String(category.service_types)] : ['other']; // fallback
      }
      
      return {
        ...category,
        service_types: serviceTypes
      };
    });
    
    res.json(categories);
  } catch (err) {
    console.error('❌ Error fetching categories:', err);
    res.status(500).json({ 
      error: 'Failed to fetch categories', 
      details: err.message,
      code: 'CATEGORIES_FETCH_ERROR'
    });
  }
});

/**
 * POST /api/categories
 * Creates a new product category
 * Body: { name, description, icon, color, service_types }
 * Returns the created category object
 */
router.post('/', async (req, res) => {
  try {
    console.log('📝 Creating new category:', req.body);
    const { name, description, icon, color, service_types } = req.body;
    
    // Enhanced validation
    if (!name || !name.trim()) {
      console.log('❌ Validation failed: Category name is required');
      return res.status(400).json({ 
        error: 'Category name is required',
        code: 'VALIDATION_ERROR',
        field: 'name'
      });
    }
    
    // Handle service_types to make sure it's an array
    let serviceTypesArray = [];
    
    if (service_types) {
      if (Array.isArray(service_types)) {
        if (service_types.length === 0) {
          console.log('❌ Validation failed: service_types is an empty array');
          return res.status(400).json({
            error: 'At least one service type is required',
            code: 'VALIDATION_ERROR',
            field: 'service_types'
          });
        }
        serviceTypesArray = service_types;
      } else if (typeof service_types === 'string') {
        // Handle case when string is sent (could be a single value or comma-separated)
        // Check if it's a comma-separated list
        if (service_types.includes(',')) {
          serviceTypesArray = service_types.split(',').map(type => type.trim());
        } else {
          // Single string value
          serviceTypesArray = [service_types];
        }
      } else {
        console.log('❌ Validation failed: service_types is not a valid format:', service_types);
        return res.status(400).json({
          error: 'Service types must be an array or string',
          code: 'VALIDATION_ERROR',
          field: 'service_types'
        });
      }
    } else {
      console.log('❌ Validation failed: service_types is required');
      return res.status(400).json({
        error: 'At least one service type is required',
        code: 'VALIDATION_ERROR',
        field: 'service_types'
      });
    }
    
    // First check for active categories with this name
    const [activeCategory] = await db.query(
      'SELECT id FROM product_categories WHERE name = ? AND is_active = 1',
      [name.trim()]
    );
    
    if (activeCategory.length > 0) {
      console.log('❌ Category with this name already exists and is active');
      return res.status(409).json({
        error: 'A category with this name already exists',
        code: 'DUPLICATE_NAME_ERROR'
      });
    }
    
    // Then check for inactive (previously "deleted") categories with this name
    const [inactiveCategory] = await db.query(
      'SELECT id FROM product_categories WHERE name = ? AND is_active = 0',
      [name.trim()]
    );
    
    let categoryId;
    
    if (inactiveCategory.length > 0) {
      // Found an inactive category with this name - we'll reuse its ID
      // This effectively reactivates the previously deleted category
      categoryId = inactiveCategory[0].id;
      console.log('🔄 Reactivating previously deleted category:', categoryId);
    } else {
      // No existing category with this name, generate a new UUID
      categoryId = require('crypto').randomUUID();
    }
    console.log('🆔 Generated category ID:', categoryId);
    
    // Safely stringify service_types array
    let serviceTypesString;
    try {
      serviceTypesString = JSON.stringify(serviceTypesArray);
    } catch (error) {
      console.error('❌ Error stringifying service_types:', error);
      // Fallback to a safe string representation
      serviceTypesString = JSON.stringify(['other']);
    }
    
    console.log('📦 Service types to be stored:', serviceTypesString);
    
    let insertResult;
    
    // If we have an inactive category to reactivate
    if (inactiveCategory && inactiveCategory.length > 0) {
      console.log('🔄 Updating existing inactive category:', categoryId);
      
      // Update the inactive category instead of inserting a new one
      insertResult = await db.query(`
        UPDATE product_categories 
        SET name = ?, description = ?, icon = ?, color = ?, 
            service_types = ?, updated_at = NOW(), is_active = 1
        WHERE id = ?
      `, [
        name.trim(),
        description || '',
        icon || '📱',
        color || 'bg-gray-500/20 text-gray-300 border-gray-500/30',
        serviceTypesString,
        categoryId
      ]);
    } else {
      // Insert a completely new category
      console.log('🆕 Creating brand new category:', categoryId);
      insertResult = await db.query(`
        INSERT INTO product_categories 
        (id, name, description, icon, color, service_types, created_at, is_active) 
        VALUES (?, ?, ?, ?, ?, ?, NOW(), 1)
      `, [
        categoryId,
        name.trim(),
        description || '',
        icon || '📱',
        color || 'bg-gray-500/20 text-gray-300 border-gray-500/30',
        serviceTypesString
      ]);
    }
    
    console.log('✅ Insert result:', insertResult);
    
    // Fetch and return the created category
    const [createdCategory] = await db.query(`
      SELECT * FROM product_categories WHERE id = ?
    `, [categoryId]);
    
    if (createdCategory.length === 0) {
      console.error('❌ Category was inserted but not found');
      return res.status(500).json({ 
        error: 'Category was created but could not be retrieved',
        code: 'CREATION_VERIFICATION_ERROR'
      });
    }
    
    // Parse the service_types safely
    let parsedServiceTypes = [];
    try {
      if (createdCategory[0].service_types) {
        parsedServiceTypes = typeof createdCategory[0].service_types === 'string' 
          ? JSON.parse(createdCategory[0].service_types)
          : createdCategory[0].service_types;
      }
    } catch (parseError) {
      console.warn(`⚠️ Failed to parse service_types for new category:`, parseError);
      // If it's a simple string, use it as a single element array
      parsedServiceTypes = [createdCategory[0].service_types || 'other'];
    }
    
    const category = {
      ...createdCategory[0],
      service_types: parsedServiceTypes
    };
    
    console.log('✅ Category created successfully:', category);
    res.status(201).json(category);
  } catch (err) {
    console.error('❌ Error creating category:', err);
    res.status(500).json({ 
      error: 'Failed to create category', 
      details: err.message,
      code: 'CATEGORY_CREATION_ERROR'
    });
  }
});

/**
 * PUT /api/categories/:id
 * Updates an existing product category
 * Body: { name, description, icon, color, service_types, is_active }
 * Returns the updated category object
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, icon, color, service_types, is_active } = req.body;
    
    console.log(`📝 Updating category ${id} with:`, req.body);
    
    // Validation
    if (!name || !name.trim()) {
      return res.status(400).json({ 
        error: 'Category name is required',
        code: 'VALIDATION_ERROR',
        field: 'name'
      });
    }
    
    if (!service_types || !Array.isArray(service_types) || service_types.length === 0) {
      return res.status(400).json({ 
        error: 'At least one service type is required',
        code: 'VALIDATION_ERROR',
        field: 'service_types'
      });
    }
    
    // Check if category exists
    const [existingCategory] = await db.query('SELECT id, name FROM product_categories WHERE id = ?', [id]);
    if (existingCategory.length === 0) {
      console.log(`❌ Category ${id} not found`);
      return res.status(404).json({ 
        error: 'Category not found',
        code: 'CATEGORY_NOT_FOUND'
      });
    }
    
    // Check for duplicate names (excluding current category)
    const [duplicateCheck] = await db.query(
      'SELECT id FROM product_categories WHERE name = ? AND id != ? AND is_active = 1',
      [name.trim(), id]
    );
    
    if (duplicateCheck.length > 0) {
      return res.status(409).json({
        error: 'A category with this name already exists',
        code: 'DUPLICATE_NAME_ERROR'
      });
    }
    
    // Update category
    const updateResult = await db.query(`
      UPDATE product_categories 
      SET name = ?, description = ?, icon = ?, color = ?, service_types = ?, is_active = ?
      WHERE id = ?
    `, [
      name.trim(),
      description || '',
      icon || '📱',
      color || 'bg-gray-500/20 text-gray-300 border-gray-500/30',
      JSON.stringify(service_types),
      is_active !== undefined ? is_active : 1,
      id
    ]);
    
    console.log('✅ Update result:', updateResult);
    
    // Fetch and return updated category
    const [updatedCategory] = await db.query('SELECT * FROM product_categories WHERE id = ?', [id]);
    
    const category = {
      ...updatedCategory[0],
      service_types: JSON.parse(updatedCategory[0].service_types)
    };
    
    console.log('✅ Category updated successfully:', category);
    res.json(category);
  } catch (err) {
    console.error('❌ Error updating category:', err);
    res.status(500).json({ 
      error: 'Failed to update category', 
      details: err.message,
      code: 'CATEGORY_UPDATE_ERROR'
    });
  }
});

/**
 * DELETE /api/categories/:id
 * PERMANENTLY deletes a category from the database (hard delete only).
 * Guards against deletion if category is referenced by active accounts.
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🗑️ PERMANENTLY deleting category ${id}`);
    
    // Check if category exists
    const [existingCategory] = await db.query('SELECT id, name FROM product_categories WHERE id = ?', [id]);
    if (existingCategory.length === 0) {
      console.log(`❌ Category ${id} not found`);
      return res.status(404).json({ 
        error: 'Category not found',
        code: 'CATEGORY_NOT_FOUND'
      });
    }
    
    const categoryName = existingCategory[0].name;
    console.log(`📋 Found category to permanently delete: ${categoryName}`);
    
    // Check if category is being used by any accounts
    const [accountsUsingCategory] = await db.query(
      'SELECT COUNT(*) as count FROM accounts WHERE category_id = ? AND is_active = 1',
      [id]
    );
    
    if (accountsUsingCategory[0].count > 0) {
      console.log(`❌ Category ${id} is being used by ${accountsUsingCategory[0].count} accounts`);
      return res.status(400).json({ 
        error: `Cannot delete category "${categoryName}" because it is being used by ${accountsUsingCategory[0].count} active account(s)`,
        code: 'CATEGORY_IN_USE',
        accountsCount: accountsUsingCategory[0].count
      });
    }

    // Permanent delete only
    const deleteResult = await db.query('DELETE FROM product_categories WHERE id = ?', [id]);
    console.log('✅ PERMANENT delete result:', deleteResult);
    
    if (deleteResult[0].affectedRows === 0) {
      return res.status(500).json({
        error: 'Category deletion failed - no rows affected',
        code: 'DELETE_NO_EFFECT'
      });
    }
    
    console.log(`✅ Category "${categoryName}" PERMANENTLY deleted from database`);
    return res.json({
      success: true,
      message: `Category "${categoryName}" permanently deleted`,
      deletedId: id,
      deletedName: categoryName,
      code: 'CATEGORY_PERMANENTLY_DELETED'
    });
  } catch (err) {
    console.error('❌ Error deleting category:', err);
    res.status(500).json({ 
      error: 'Failed to delete category', 
      details: err.message,
      code: 'CATEGORY_DELETE_ERROR'
    });
  }
});

/**
 * GET /api/categories/:id
 * Fetches a single category by ID
 * Returns category object
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [category] = await db.query(`
      SELECT * FROM product_categories WHERE id = ? AND is_active = 1
    `, [id]);
    
    if (category.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    const categoryData = {
      ...category[0],
      service_types: typeof category[0].service_types === 'string' 
        ? JSON.parse(category[0].service_types) 
        : category[0].service_types || []
    };
    
    res.json(categoryData);
  } catch (err) {
    console.error('Error fetching category:', err);
    res.status(500).json({ error: 'Failed to fetch category', details: err.message });
  }
});

/**
 * POST /api/categories/maintenance/cleanup
 * Cleanup and fix category data issues
 */
router.post('/maintenance/cleanup', async (req, res) => {
  try {
    console.log('🧹 Running category maintenance cleanup...');
    const result = await CategoryMaintenance.cleanupCategories();
    
    res.json({
      success: true,
      message: 'Category cleanup completed',
      result
    });
  } catch (err) {
    console.error('❌ Error during category cleanup:', err);
    res.status(500).json({ 
      error: 'Failed to cleanup categories', 
      details: err.message 
    });
  }
});

/**
 * GET /api/categories/maintenance/verify
 * Verify category data integrity
 */
router.get('/maintenance/verify', async (req, res) => {
  try {
    console.log('🔍 Verifying category data...');
    const result = await CategoryMaintenance.verifyCategories();
    
    res.json({
      success: true,
      message: 'Category verification completed',
      result
    });
  } catch (err) {
    console.error('❌ Error during category verification:', err);
    res.status(500).json({ 
      error: 'Failed to verify categories', 
      details: err.message 
    });
  }
});

/**
 * POST /api/categories/maintenance/reset-permissions
 * Reset category permissions and fix access issues
 */
router.post('/maintenance/reset-permissions', async (req, res) => {
  try {
    console.log('🔧 Resetting category permissions...');
    const affectedRows = await CategoryMaintenance.resetCategoryPermissions();
    
    res.json({
      success: true,
      message: 'Category permissions reset successfully',
      affectedRows
    });
  } catch (err) {
    console.error('❌ Error resetting category permissions:', err);
    res.status(500).json({ 
      error: 'Failed to reset category permissions', 
      details: err.message 
    });
  }
});

module.exports = router;