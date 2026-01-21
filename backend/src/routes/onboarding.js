const express = require('express');
const { prisma } = require('../prisma/client');
const bcrypt = require('bcrypt');
const router = express.Router();

// Atomic Hire Wizard: User -> Employee -> Goals
router.post('/wizard', async (req, res) => {
    const { userData, employeeData, goals, candidateId } = req.body;

    // Trim critical fields to avoid whitespace issues
    const userName = userData.userName?.trim();
    const email = employeeData.email?.trim();

    console.log(`[Onboarding Wizard] Attempting to onboard user: ${userName} (Email: ${email}, CandidateId: ${candidateId})`);

    try {
        // Pre-check unique constraints to provide better error messages
        const existingUser = await prisma.user.findUnique({
            where: { userName }
        });
        if (existingUser) {
            console.warn(`[Onboarding Wizard] Username collision: ${userName}`);
            return res.status(400).json({ error: `Username "${userName}" already exists. Please choose another.` });
        }

        const existingEmployee = await prisma.employee.findUnique({
            where: { email }
        });
        if (existingEmployee) {
            console.warn(`[Onboarding Wizard] Email collision: ${email}`);
            return res.status(400).json({ error: `Email "${email}" is already used for another employee.` });
        }


        const result = await prisma.$transaction(async (tx) => {
            // 1. Create User
            const hashedPassword = await bcrypt.hash(userData.password, 10);

            // Try to find department and position IDs for linking
            let deptId = null;
            let posId = null;

            if (employeeData.department) {
                const dept = await tx.department.findUnique({ where: { name: employeeData.department } });
                if (dept) deptId = dept.id;
            }
            if (employeeData.position) {
                const pos = await tx.position.findFirst({ where: { name: employeeData.position } });
                if (pos) posId = pos.id;
            }

            const user = await tx.user.create({
                data: {
                    fullName: userData.fullName.trim(),
                    userName: userName,
                    password: hashedPassword,
                    role: userData.role || 'Employee',
                    gender: userData.gender,
                    age: userData.age ? parseInt(userData.age) : null,
                    status: 'true',
                    activeStatus: 'true',
                    isFirstLogin: 'true',
                    locked: 'false',
                    createdDate: new Date(),
                    createdBy: req.user.id,
                    departmentId: deptId,
                    positionId: posId
                }
            });

            // 2. Create Employee Profile
            const employee = await tx.employee.create({
                data: {
                    firstName: employeeData.firstName || userData.fullName.split(' ')[0],
                    lastName: employeeData.lastName || userData.fullName.split(' ').slice(1).join(' '),
                    email: email,
                    phone: employeeData.phone,
                    department: employeeData.department,
                    position: employeeData.position,
                    hireDate: employeeData.hireDate ? new Date(employeeData.hireDate) : new Date(),
                    userId: user.id,
                    isActive: true
                }
            });

            // 3. Create Initial Goals (if any)
            let createdGoals = [];
            if (goals && Array.isArray(goals) && goals.length > 0) {
                for (const goal of goals) {
                    const g = await tx.goal.create({
                        data: {
                            objective: goal.objective,
                            priority: goal.priority || 'Normal',
                            status: 'In Progress',
                            progress: 0,
                            duedate: goal.duedate ? new Date(goal.duedate) : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days default
                            category: 'Onboarding',
                            activatedBy: user.id
                        }
                    });
                    createdGoals.push(g);
                }
            }

            // 4. Create welcome notification
            await tx.notification.create({
                data: {
                    userId: user.id,
                    title: 'Welcome to the Team!',
                    message: `Hello ${user.fullName}, welcome aboard! Your account and goals have been set up.`,
                    type: 'SUCCESS',
                    link: '/dashboard'
                }
            });

            // 5. Update Candidate status (if applicable)
            if (candidateId) {
                await tx.candidate.update({
                    where: { id: parseInt(candidateId) },
                    data: { status: 'Hired' }
                });
                console.log(`[Onboarding Wizard] Candidate ${candidateId} status updated to Hired.`);
            }

            return { user, employee, goals: createdGoals };

        });

        console.log(`[Onboarding Wizard] Success: User ${userName} created.`);
        res.status(201).json(result);
    } catch (error) {
        console.error('Onboarding Wizard Error:', error);

        // Handle Prisma unique constraint error specifically
        if (error.code === 'P2002') {
            const field = error.meta?.target?.[0] || 'Field';
            return res.status(400).json({ error: `${field} already exists. Please use a unique value.` });
        }

        res.status(500).json({ error: 'Failed to complete onboarding wizard', details: error.message });
    }
});

module.exports = router;
