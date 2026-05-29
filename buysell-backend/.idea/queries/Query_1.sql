INSERT INTO "user" (avatar_id, created_at, email, password, display_name, phone_number) VALUES
    (1, '2024-01-10 10:00:00+03', 'ivan@example.com', '$2a$10$hash1...', 'Иван Петров', '+79001112233'),
    (2, '2024-02-15 14:30:00+03', 'maria@example.com', '$2a$10$hash2...', 'Мария Сидорова', '+79004445566'),
    (NULL, '2024-03-20 09:15:00+03', 'alex@example.com', '$2a$10$hash3...', 'Алексей Волков', NULL),
    (3, '2024-04-05 18:45:00+03', 'elena@example.com', '$2a$10$hash4...', 'Елена Козлова', '+79007778899');

INSERT INTO user_role (user_id, role_id) VALUES
     (1, 1), (1, 2),
     (2, 1),
     (3, 2),
     (4, 1);

INSERT INTO product (seller_id, city_id, created_at, title, description, price, sold) VALUES
      (1, 1, '2024-05-10 12:00:00+03', 'Велосипед горный', 'Почти новый, 21 скорость', 15000.00, false),
      (1, 1, '2024-06-12 15:30:00+03', 'Ноутбук gaming', 'RTX 3060, 16GB RAM', 75000.00, true),
      (3, 3, '2024-07-01 08:00:00+03', 'Стол письменный', 'Дуб, 120x60 см', 8000.00, false);

INSERT INTO dialog (product_id, buyer_id, created_at, updated_at) VALUES
      (1, 2, '2024-05-11 10:00:00+03', '2024-05-11 10:05:00+03'),
      (3, 4, '2024-07-02 09:00:00+03', '2024-07-02 09:10:00+03');

INSERT INTO product_image (product_id, is_main, file_path, file_name, file_size) VALUES
     (1, true, '/uploads/products/', 'bike_main.jpg', 512000),
     (1, false, '/uploads/products/', 'bike_side.jpg', 480000),
     (2, true, '/uploads/products/', 'laptop.jpg', 320000),
     (3, true, '/uploads/products/', 'desk.jpg', 290000);

INSERT INTO deal (product_id, buyer_id, created_at, is_approved, state) VALUES
    (2, 2, '2024-06-15 16:00:00+03', true, 'COMPLETED'),
    (3, 4, '2024-07-03 11:00:00+03', false, 'PENDING');