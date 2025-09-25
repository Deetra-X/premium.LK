-- Sample data for POS database
USE POS;

-- Insert sample product categories
INSERT INTO product_categories (id, name, description, icon, color, service_types, created_at, is_active) VALUES
('streaming', 'Streaming Services', 'Video and audio streaming platforms', '🎬', 'bg-red-500/20 text-red-300 border-red-500/30', '["streaming"]', NOW(), TRUE),
('productivity', 'Productivity Tools', 'Office and work productivity software', '💼', 'bg-blue-500/20 text-blue-300 border-blue-500/30', '["productivity"]', NOW(), TRUE),
('design', 'Design & Creative', 'Graphic design and creative software', '🎨', 'bg-purple-500/20 text-purple-300 border-purple-500/30', '["design"]', NOW(), TRUE),
('storage', 'Cloud Storage', 'File storage and backup services', '☁️', 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30', '["storage"]', NOW(), TRUE),
('music', 'Music Services', 'Music streaming and audio platforms', '🎵', 'bg-green-500/20 text-green-300 border-green-500/30', '["music"]', NOW(), TRUE),
('gaming', 'Gaming Platforms', 'Gaming services and platforms', '🎮', 'bg-orange-500/20 text-orange-300 border-orange-500/30', '["gaming"]', NOW(), TRUE);

-- Insert sample customers
INSERT INTO customers (id, name, email, phone, created_at, customer_type) VALUES
('customer_1', 'John Smith', 'john.smith@email.com', '+1234567890', NOW(), 'standard'),
('customer_2', 'Sarah Johnson', 'sarah.johnson@email.com', '+1234567891', NOW(), 'reseller'),
('customer_3', 'Mike Wilson', 'mike.wilson@email.com', '+1234567892', NOW(), 'standard'),
('customer_4', 'Emily Davis', 'emily.davis@email.com', '+1234567893', NOW(), 'standard'),
('customer_5', 'Robert Brown', 'robert.brown@email.com', '+1234567894', NOW(), 'reseller');

-- Insert sample accounts
INSERT INTO accounts (
  id, product_name, label, email, renewal_status, days_until_renewal, cost, 
  description, created_at, updated_at, is_active, service_type, subscription_type, 
  renewal_date, category_id, brand, max_user_slots, available_slots, current_users,
  is_shared_account, family_features, primary_holder_name, primary_holder_email
) VALUES
('acc_1', 'Netflix Premium', 'Family Netflix', 'netflix@family.com', 'renewable', 15, 15.99, 
 'Netflix Premium family plan', NOW(), NOW(), TRUE, 'streaming', 'monthly', 
 DATE_ADD(CURDATE(), INTERVAL 15 DAY), 'streaming', 'Netflix', 4, 1, 3, TRUE, 
 '["4K Streaming", "Multiple Profiles", "Download Content"]', 'John Smith', 'john.smith@email.com'),

('acc_2', 'Microsoft 365 Family', 'Office Suite', 'office@family.com', 'renewable', 45, 99.99, 
 'Microsoft Office family subscription', NOW(), NOW(), TRUE, 'productivity', 'annual', 
 DATE_ADD(CURDATE(), INTERVAL 45 DAY), 'productivity', 'Microsoft', 6, 2, 4, TRUE, 
 '["Word", "Excel", "PowerPoint", "OneDrive 1TB"]', 'Sarah Johnson', 'sarah.johnson@email.com'),

('acc_3', 'Adobe Creative Cloud', 'Design Tools', 'adobe@creative.com', 'renewable', 5, 52.99, 
 'Adobe Creative Suite for designers', NOW(), NOW(), TRUE, 'design', 'monthly', 
 DATE_ADD(CURDATE(), INTERVAL 5 DAY), 'design', 'Adobe', 1, 0, 1, FALSE, 
 '["Photoshop", "Illustrator", "InDesign", "Premiere Pro"]', 'Mike Wilson', 'mike.wilson@email.com'),

('acc_4', 'Spotify Family', 'Music Streaming', 'spotify@family.com', 'renewable', 22, 15.99, 
 'Spotify Premium family plan', NOW(), NOW(), TRUE, 'music', 'monthly', 
 DATE_ADD(CURDATE(), INTERVAL 22 DAY), 'music', 'Spotify', 6, 3, 3, TRUE, 
 '["Ad-free Music", "Download Offline", "High Quality Audio"]', 'Emily Davis', 'emily.davis@email.com'),

('acc_5', 'Google Drive Storage', 'Cloud Storage', 'gdrive@storage.com', 'renewable', 8, 9.99, 
 'Google Drive 2TB storage plan', NOW(), NOW(), TRUE, 'storage', 'monthly', 
 DATE_ADD(CURDATE(), INTERVAL 8 DAY), 'storage', 'Google', 1, 0, 1, FALSE, 
 '["2TB Storage", "File Sync", "Mobile Access"]', 'Robert Brown', 'robert.brown@email.com'),

('acc_6', 'Xbox Game Pass Ultimate', 'Gaming Service', 'xbox@gaming.com', 'non-renewable', 120, 14.99, 
 'Xbox Game Pass Ultimate subscription', NOW(), NOW(), TRUE, 'gaming', 'monthly', 
 DATE_ADD(CURDATE(), INTERVAL 120 DAY), 'gaming', 'Microsoft', 1, 0, 1, FALSE, 
 '["Game Library", "Cloud Gaming", "Xbox Live Gold"]', 'John Smith', 'john.smith@email.com');

-- Insert sample subscriptions
INSERT INTO subscriptions (id, customer_id, account_id, customer_name, product_name, duration, start_date, end_date, status, price, created_at) VALUES
('sub_1', 'customer_1', 'acc_1', 'John Smith', 'Netflix Premium', 12, '2024-01-01', '2024-12-31', 'active', 15.99, NOW()),
('sub_2', 'customer_2', 'acc_2', 'Sarah Johnson', 'Microsoft 365 Family', 12, '2024-02-01', '2025-01-31', 'active', 99.99, NOW()),
('sub_3', 'customer_3', 'acc_3', 'Mike Wilson', 'Adobe Creative Cloud', 12, '2024-03-01', '2025-02-28', 'active', 52.99, NOW()),
('sub_4', 'customer_4', 'acc_4', 'Emily Davis', 'Spotify Family', 12, '2024-01-15', '2025-01-14', 'active', 15.99, NOW()),
('sub_5', 'customer_5', 'acc_5', 'Robert Brown', 'Google Drive Storage', 6, '2024-06-01', '2024-11-30', 'active', 9.99, NOW());

-- Insert sample transactions
INSERT INTO transactions (id, subscription_id, customer_id, customer_name, product_name, date, created_at, amount, type, status) VALUES
('trans_1', 'sub_1', 'customer_1', 'John Smith', 'Netflix Premium', NOW(), NOW(), 15.99, 'sale', 'completed'),
('trans_2', 'sub_2', 'customer_2', 'Sarah Johnson', 'Microsoft 365 Family', NOW(), NOW(), 99.99, 'sale', 'completed'),
('trans_3', 'sub_3', 'customer_3', 'Mike Wilson', 'Adobe Creative Cloud', NOW(), NOW(), 52.99, 'sale', 'completed'),
('trans_4', 'sub_4', 'customer_4', 'Emily Davis', 'Spotify Family', NOW(), NOW(), 15.99, 'renewal', 'completed'),
('trans_5', 'sub_5', 'customer_5', 'Robert Brown', 'Google Drive Storage', NOW(), NOW(), 9.99, 'sale', 'completed');

-- Insert sample sales
INSERT INTO sales (order_number, customer_id, customer_name, customer_email, customer_phone, items, total_amount, payment_method, order_date, status) VALUES
('#10001', 'customer_1', 'John Smith', 'john.smith@email.com', '+1234567890', 
 '[{"productId": "netflix_premium", "productName": "Netflix Premium", "price": 15.99, "quantity": 1}]', 
 15.99, 'card', NOW(), 'completed'),
('#10002', 'customer_2', 'Sarah Johnson', 'sarah.johnson@email.com', '+1234567891', 
 '[{"productId": "office365", "productName": "Microsoft 365 Family", "price": 99.99, "quantity": 1}]', 
 99.99, 'bank_transfer', NOW(), 'completed'),
('#10003', 'customer_3', 'Mike Wilson', 'mike.wilson@email.com', '+1234567892', 
 '[{"productId": "adobe_cc", "productName": "Adobe Creative Cloud", "price": 52.99, "quantity": 1}]', 
 52.99, 'card', NOW(), 'completed');
