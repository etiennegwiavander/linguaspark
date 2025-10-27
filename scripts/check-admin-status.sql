-- Check admin status for the user
SELECT id, email, is_admin, created_at
FROM tutors
WHERE id = '67cbea4f-c49e-4d45-a112-309f942f6120';

-- Also check if the column exists and its type
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'tutors' AND column_name = 'is_admin';
