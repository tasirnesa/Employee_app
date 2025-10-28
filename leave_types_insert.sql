-- Insert Leave Types Manually
-- Run these queries in your PostgreSQL database

-- 1. Annual Leave (Vacation)
INSERT INTO "LeaveType" (name, description, "maxDays", "isPaid", "isActive", "createdAt", "updatedAt")
VALUES (
    'Annual Leave',
    'Paid vacation time for employees',
    25,
    true,
    true,
    NOW(),
    NOW()
);

-- 2. Sick Leave
INSERT INTO "LeaveType" (name, description, "maxDays", "isPaid", "isActive", "createdAt", "updatedAt")
VALUES (
    'Sick Leave',
    'Leave for illness or medical appointments',
    12,
    true,
    true,
    NOW(),
    NOW()
);

-- 3. Personal Leave
INSERT INTO "LeaveType" (name, description, "maxDays", "isPaid", "isActive", "createdAt", "updatedAt")
VALUES (
    'Personal Leave',
    'Personal time off for various reasons',
    5,
    true,
    true,
    NOW(),
    NOW()
);

-- 4. Maternity Leave
INSERT INTO "LeaveType" (name, description, "maxDays", "isPaid", "isActive", "createdAt", "updatedAt")
VALUES (
    'Maternity Leave',
    'Leave for new mothers',
    90,
    true,
    true,
    NOW(),
    NOW()
);

-- 5. Paternity Leave
INSERT INTO "LeaveType" (name, description, "maxDays", "isPaid", "isActive", "createdAt", "updatedAt")
VALUES (
    'Paternity Leave',
    'Leave for new fathers',
    15,
    true,
    true,
    NOW(),
    NOW()
);

-- 6. Bereavement Leave
INSERT INTO "LeaveType" (name, description, "maxDays", "isPaid", "isActive", "createdAt", "updatedAt")
VALUES (
    'Bereavement Leave',
    'Leave for death of family member',
    3,
    true,
    true,
    NOW(),
    NOW()
);

-- 7. Emergency Leave
INSERT INTO "LeaveType" (name, description, "maxDays", "isPaid", "isActive", "createdAt", "updatedAt")
VALUES (
    'Emergency Leave',
    'Leave for family emergencies',
    3,
    true,
    true,
    NOW(),
    NOW()
);

-- 8. Study Leave
INSERT INTO "LeaveType" (name, description, "maxDays", "isPaid", "isActive", "createdAt", "updatedAt")
VALUES (
    'Study Leave',
    'Leave for educational purposes',
    10,
    false,
    true,
    NOW(),
    NOW()
);

-- 9. Unpaid Leave
INSERT INTO "LeaveType" (name, description, "maxDays", "isPaid", "isActive", "createdAt", "updatedAt")
VALUES (
    'Unpaid Leave',
    'Leave without pay',
    30,
    false,
    true,
    NOW(),
    NOW()
);

-- 10. Compensatory Leave
INSERT INTO "LeaveType" (name, description, "maxDays", "isPaid", "isActive", "createdAt", "updatedAt")
VALUES (
    'Compensatory Leave',
    'Compensatory time off for overtime work',
    10,
    true,
    true,
    NOW(),
    NOW()
);
