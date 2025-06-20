INSERT INTO Users (username, email, password_hash, role) VALUES
('alice123', 'alice@example.com', 'hashed123', 'owner'),
('bobwalker', 'bob@example.com', 'hashed456', 'walker'),
('carol123', 'carol@example.com', 'hashed789', 'owner'),
('daveowner', 'dave@example.com', 'hashedabc', 'owner'),
('emilywalker', 'emily@example.com', 'hasheddef', 'walker');

INSERT INTO Dogs (name, size, owner_id) VALUES
('Max', 'medium', (SELECT user_id FROM Users WHERE username = 'alice123' LIMIT 1)),
('Bella', 'small', (SELECT user_id FROM Users WHERE username = 'carol123' LIMIT 1)),
('Charlie', 'large', (SELECT user_id FROM Users WHERE username = 'alice123' LIMIT 1)),
('Lucy', 'small', (SELECT user_id FROM Users WHERE username = 'daveowner' LIMIT 1)),
('Rocky', 'medium', (SELECT user_id FROM Users WHERE username = 'daveowner' LIMIT 1));

INSERT INTO WalkRequests (dog_id, requested_time, duration_minutes, location, status) VALUES
((SELECT dog_id FROM Dogs WHERE name = 'Max' LIMIT 1), '2025-06-10 08:00:00', 30, 'Parklands', 'open'),
((SELECT dog_id FROM Dogs WHERE name = 'Bella' LIMIT 1), '2025-06-10 09:30:00', 45, 'Beachside Ave', 'accepted'),
((SELECT dog_id FROM Dogs WHERE name = 'Charlie' LIMIT 1), '2025-06-11 17:00:00', 60, 'City Central', 'open'),
((SELECT dog_id FROM Dogs WHERE name = 'Lucy' LIMIT 1), '2025-06-12 10:00:00', 20, 'River Trail', 'open'),
((SELECT dog_id FROM Dogs WHERE name = 'Rocky' LIMIT 1), '2025-06-12 14:00:00', 40, 'Hilltop View', 'completed');

INSERT INTO WalkApplications (request_id, walker_id, status) VALUES
(
    (SELECT request_id FROM WalkRequests WHERE dog_id = (SELECT dog_id FROM Dogs WHERE name = 'Bella' LIMIT 1) LIMIT 1),
    (SELECT user_id FROM Users WHERE username = 'bobwalker' LIMIT 1),
    'accepted'
),
(
    (SELECT request_id FROM WalkRequests WHERE dog_id = (SELECT dog_id FROM Dogs WHERE name = 'Rocky' LIMIT 1) LIMIT 1),
    (SELECT user_id FROM Users WHERE username = 'emilywalker' LIMIT 1),
    'accepted'
);
