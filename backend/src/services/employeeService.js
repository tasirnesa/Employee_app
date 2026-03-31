const employeeRepository = require('../repositories/employeeRepository');
const userRepository = require('../repositories/userRepository');
const bcrypt = require('bcrypt');
const path = require('path');

const employeeService = {
  getAllEmployees: async (isActive) => {
    const where = {};
    if (isActive === 'true') where.isActive = true;
    if (isActive === 'false') where.isActive = false;
    return await employeeRepository.findAll(where);
  },

  getEmployeeById: async (id) => {
    const employee = await employeeRepository.findById(id);
    if (!employee) throw new Error('Employee not found');
    return employee;
  },

  createEmployee: async (employeeData, authUserId) => {
    const { username, password, profileImage, ...data } = employeeData;

    // Handle profile image path
    if (profileImage) {
      data.profileImageUrl = `/uploads/${path.basename(profileImage)}`;
    }

    // Normalize relational IDs
    if (data.departmentId) data.departmentId = parseInt(data.departmentId);
    if (data.positionId) data.positionId = parseInt(data.positionId);
    if (data.age) data.age = parseInt(data.age);
    if (data.userId) data.userId = parseInt(data.userId);

    // Remove string fields that conflict with relation names
    delete data.department;
    delete data.position;

    // Handle optional linked user creation
    if (!data.userId && username && password) {
      const userNameNormalized = String(username).trim().toLowerCase();
      const existingUser = await userRepository.findByUsername(userNameNormalized);
      if (existingUser) throw new Error('Username already exists');

      const hashedPassword = await bcrypt.hash(String(password), 10);
      const createdUser = await userRepository.create({
        fullName: `${data.firstName} ${data.lastName}`.trim(),
        userName: userNameNormalized,
        password: hashedPassword,
        gender: data.gender || null,
        age: data.age == null ? null : Number(data.age),
        role: 'Employee',
        status: 'true',
        locked: 'false',
        isFirstLogin: 'true',
        activeStatus: 'true',
        createdDate: new Date(),
        createdBy: authUserId || 1,
      });
      data.userId = createdUser.id;
    }

    try {
      return await employeeRepository.create(data);
    } catch (error) {
      if (error.code === 'P2002') throw new Error('Email already exists');
      throw error;
    }
  },

  updateEmployee: async (id, employeeData, authUserId) => {
    const existing = await employeeRepository.findById(id);
    if (!existing) throw new Error('Employee not found');

    const { username, password, profileImage, ...updateFields } = employeeData;
    
    const data = { ...updateFields };
    if (profileImage) {
      data.profileImageUrl = `/uploads/${path.basename(profileImage)}`;
    }

    // Normalize field types matching existing logic
    if (data.hireDate) data.hireDate = new Date(data.hireDate);
    if (data.birthDate) data.birthDate = new Date(data.birthDate);
    if (data.age !== undefined) data.age = data.age == null ? null : parseInt(data.age);
    if (data.isActive !== undefined) data.isActive = (String(data.isActive).toLowerCase() === 'true');
    if (data.userId !== undefined) data.userId = data.userId != null ? parseInt(data.userId) : null;
    if (data.departmentId !== undefined) data.departmentId = data.departmentId != null ? parseInt(data.departmentId) : null;
    if (data.positionId !== undefined) data.positionId = data.positionId != null ? parseInt(data.positionId) : null;

    // Remove string fields that conflict with relation names
    delete data.department;
    delete data.position;

    const updated = await employeeRepository.update(id, data);

    // Optionally create or update linked user credentials
    if (username || password) {
      if (!updated.userId) {
        if (!username || !password) throw new Error('Both username and password required to create linked user');
        
        const userNameNormalized = String(username).trim().toLowerCase();
        const existingUser = await userRepository.findByUsername(userNameNormalized);
        if (existingUser) throw new Error('Username already exists');

        const hashedPassword = await bcrypt.hash(password, 10);
        const createdUser = await userRepository.create({
          fullName: `${updated.firstName} ${updated.lastName}`.trim(),
          userName: userNameNormalized,
          password: hashedPassword,
          gender: updated.gender || null,
          age: updated.age == null ? null : Number(updated.age),
          role: 'Employee',
          status: 'true',
          locked: 'false',
          isFirstLogin: 'true',
          activeStatus: 'true',
          createdDate: new Date(),
          createdBy: authUserId || 1,
        });
        await employeeRepository.update(id, { userId: createdUser.id });
      } else {
        const userUpdateData = {};
        if (username) userUpdateData.userName = String(username).trim().toLowerCase();
        if (password) userUpdateData.password = await bcrypt.hash(password, 10);
        if (Object.keys(userUpdateData).length) {
          await userRepository.update(updated.userId, userUpdateData);
        }
      }
    }

    return updated;
  },

  activateEmployee: async (id) => {
    return await employeeRepository.update(id, { isActive: true });
  },

  deactivateEmployee: async (id) => {
    return await employeeRepository.update(id, { isActive: false });
  },
};

module.exports = employeeService;
