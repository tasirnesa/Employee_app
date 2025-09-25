const express = require('express');
const router = express.Router();
const { prisma } = require('../prisma/client');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname || '') || '';
    cb(null, `employee-${unique}${ext}`);
  },
});

const upload = multer({ storage });

// List employees with optional query: isActive=true/false
router.get('/', async (req, res) => {
  try {
    const { isActive } = req.query;
    const where = {};
    if (isActive === 'true') where.isActive = true;
    if (isActive === 'false') where.isActive = false;
    const employees = await prisma.employee.findMany({ where, orderBy: { id: 'desc' } });
    res.json(employees);
  } catch (error) {
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Get one employee
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
    const employee = await prisma.employee.findUnique({ where: { id } });
    if (!employee) return res.status(404).json({ error: 'Employee not found' });
    res.json(employee);
  } catch (error) {
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Create employee (supports multipart for profile image)
router.post('/', upload.fields([{ name: 'profileImage', maxCount: 1 }]), async (req, res) => {
  try {
    // Debug: log incoming form data
    console.log('Create employee body keys:', Object.keys(req.body || {}));
    console.log('Create employee files:', Object.keys(req.files || {}));

    // Normalize potential array values from multipart
    const pick = (v) => Array.isArray(v) ? v[0] : v;
    const rawFirstName = pick(req.body.firstName);
    const rawLastName = pick(req.body.lastName);
    const rawEmail = pick(req.body.email);
    const rawPhone = pick(req.body.phone);
    const rawDepartment = pick(req.body.department);
    const rawPosition = pick(req.body.position);
    const rawHireDate = pick(req.body.hireDate);
    const rawIsActive = pick(req.body.isActive);
    const rawUserId = pick(req.body.userId);
    const rawGender = pick(req.body.gender);
    const rawAge = pick(req.body.age);
    const rawBirthDate = pick(req.body.birthDate);
    const rawProfileImageUrl = pick(req.body.profileImageUrl);
    const rawUsername = pick(req.body.username);
    const rawPassword = pick(req.body.password);

    const firstNameTrim = typeof rawFirstName === 'string' ? rawFirstName.trim() : '';
    const lastNameTrim = typeof rawLastName === 'string' ? rawLastName.trim() : '';
    const emailTrim = typeof rawEmail === 'string' ? rawEmail.trim() : '';
    if (!firstNameTrim || !lastNameTrim || !emailTrim) {
      return res.status(400).json({ error: 'firstName, lastName, email are required' });
    }
    const uploadedFile = Array.isArray(req.files?.profileImage) ? req.files.profileImage[0] : null;
    const data = {
      firstName: firstNameTrim,
      lastName: lastNameTrim,
      email: emailTrim,
      phone: rawPhone || null,
      department: rawDepartment || null,
      position: rawPosition || null,
      hireDate: rawHireDate ? new Date(rawHireDate) : null,
      gender: rawGender || null,
      age: rawAge == null || rawAge === '' ? null : parseInt(rawAge, 10),
      birthDate: rawBirthDate ? new Date(rawBirthDate) : null,
      profileImageUrl: uploadedFile ? `/uploads/${path.basename(uploadedFile.path)}` : (rawProfileImageUrl || null),
      isActive: rawIsActive == null ? true : (String(rawIsActive).toLowerCase() === 'true'),
      userId: rawUserId != null && rawUserId !== '' && !Number.isNaN(parseInt(rawUserId, 10)) ? parseInt(rawUserId, 10) : null,
    };
    // Optionally create linked user if username/password provided
    if (!data.userId && rawUsername && rawPassword) {
      let userName = String(rawUsername).trim().toLowerCase();
      const exists = await prisma.user.findFirst({ where: { userName } });
      if (exists) return res.status(409).json({ error: 'Username already exists' });
      const hashed = await bcrypt.hash(String(rawPassword), 10);
      const createdUser = await prisma.user.create({
        data: {
          fullName: `${firstName} ${lastName}`.trim(),
          userName,
          password: hashed,
          gender: data.gender || null,
          age: data.age == null ? null : Number(data.age),
          role: 'Employee',
          status: 'true',
          locked: 'false',
          isFirstLogin: 'true',
          activeStatus: 'true',
          createdDate: new Date(),
          createdBy: req.user?.id || 1,
        },
      });
      data.userId = createdUser.id;
    }
    const created = await prisma.employee.create({ data });
    res.status(201).json(created);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Update employee (supports multipart for profile image)
router.put('/:id', upload.fields([{ name: 'profileImage', maxCount: 1 }]), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
    const { firstName, lastName, email, phone, department, position, hireDate, isActive, userId, gender, age, birthDate, profileImageUrl, username, password } = req.body;
    const existing = await prisma.employee.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Employee not found' });
    const uploadedFile = Array.isArray(req.files?.profileImage) ? req.files.profileImage[0] : null;
    const updated = await prisma.employee.update({
      where: { id },
      data: {
        firstName: firstName ?? existing.firstName,
        lastName: lastName ?? existing.lastName,
        email: email ?? existing.email,
        phone: phone === undefined ? existing.phone : phone,
        department: department === undefined ? existing.department : department,
        position: position === undefined ? existing.position : position,
        hireDate: hireDate === undefined ? existing.hireDate : (hireDate ? new Date(hireDate) : null),
        gender: gender === undefined ? existing.gender : gender,
        age: age === undefined ? existing.age : (age == null ? null : parseInt(age)),
        birthDate: birthDate === undefined ? existing.birthDate : (birthDate ? new Date(birthDate) : null),
        profileImageUrl: uploadedFile ? `/uploads/${path.basename(uploadedFile.path)}` : (profileImageUrl === undefined ? existing.profileImageUrl : profileImageUrl),
        isActive: isActive === undefined ? existing.isActive : (String(isActive).toLowerCase() === 'true'),
        userId: userId === undefined ? existing.userId : (userId != null ? parseInt(userId) : null),
      },
    });
    // Optionally create or update linked user credentials
    if (username || password) {
      if (!updated.userId) {
        if (!username || !password) {
          return res.status(400).json({ error: 'Both username and password required to create linked user' });
        }
        const existsUser = await prisma.user.findFirst({ where: { userName: String(username).trim().toLowerCase() } });
        if (existsUser) return res.status(409).json({ error: 'Username already exists' });
        const hashed = await bcrypt.hash(password, 10);
        const createdUser = await prisma.user.create({
          data: {
            fullName: `${updated.firstName} ${updated.lastName}`.trim(),
            userName: String(username).trim().toLowerCase(),
            password: hashed,
            gender: updated.gender || null,
            age: updated.age == null ? null : Number(updated.age),
            role: 'Employee',
            status: 'true',
            locked: 'false',
            isFirstLogin: 'true',
            activeStatus: 'true',
            createdDate: new Date(),
            createdBy: req.user?.id || 1,
          },
        });
        await prisma.employee.update({ where: { id }, data: { userId: createdUser.id } });
      } else {
        const userIdLinked = updated.userId;
        const dataUser = {};
        if (username) dataUser.userName = String(username).trim().toLowerCase();
        if (password) dataUser.password = await bcrypt.hash(password, 10);
        if (Object.keys(dataUser).length) {
          await prisma.user.update({ where: { id: userIdLinked }, data: dataUser });
        }
      }
    }
    res.json(updated);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Activate / Deactivate
router.patch('/:id/activate', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const updated = await prisma.employee.update({ where: { id }, data: { isActive: true } });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

router.patch('/:id/deactivate', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const updated = await prisma.employee.update({ where: { id }, data: { isActive: false } });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

module.exports = router;


