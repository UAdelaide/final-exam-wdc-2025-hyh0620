-- This clears the tables in the correct order to avoid foreign key errors.
-- It makes the script safe to run multiple times.
DELETE FROM WalkRequests;
DELETE FROM Dogs;
DELETE FROM Users;

-- Step 1: Insert Users
INSERT INTO Users (username, email, password_hash, role) VALUES
('ownerJane', 'jane@example.com', 'hashedpassword123', 'owner'),
('walkerMike', 'mike@example.com', 'hashedpassword456', 'walker'),
('ownerBob', 'bob@example.com', 'hashedpassword789', 'owner'),
('ownerSue', 'sue@example.com', 'hashedabc', 'owner'),
('walkerTom', 'tom@example.com', 'hasheddef', 'walker');

-- Step 2: Insert Dogs
INSERT INTO Dogs (name, size, owner_id) VALUES
('Buddy', 'large', (SELECT user_id FROM Users WHERE username = 'ownerJane' LIMIT 1)),
('Lucy', 'small', (SELECT user_id FROM Users WHERE username = 'ownerJane' LIMIT 1)),
('Max', 'medium', (SELECT user_id FROM Users WHERE username = 'ownerBob' LIMIT 1)),
('Bella', 'small', (SELECT user_id FROM Users WHERE username = 'ownerBob' LIMIT 1)),
('Rocky', 'medium', (SELECT user_id FROM Users WHERE username = 'ownerSue' LIMIT 1));

-- Step 3: Insert some Walk Requests to match the video demo
INSERT INTO WalkRequests (dog_id, requested_time, duration_minutes, location, status) VALUES
((SELECT dog_id FROM Dogs WHERE name = 'Buddy' LIMIT 1), '2025-07-22 10:00:00', 30, 'Central Park', 'open'),
((SELECT dog_id FROM Dogs WHERE name = 'Lucy' LIMIT 1), '2025-07-22 14:00:00', 45, 'Beach Front', 'open');
