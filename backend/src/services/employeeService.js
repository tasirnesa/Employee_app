const employeeRepository = require('../repositories/employeeRepository');
const userRepository = require('../repositories/userRepository');
const bcrypt = require('bcrypt');
const path = require('path');
const prisma = require('../config/prisma');
const payrollService = require('./payrollService');

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
      const createdEmployee = await employeeRepository.create(data);

      if (createdEmployee.userId) {
        if (data.scaleKey) {
           const map = payrollService.loadScaleAssignments();
           map[String(createdEmployee.userId)] = String(data.scaleKey);
           payrollService.saveScaleAssignments(map);
           
           const scaleCfg = payrollService.loadScaleConfigs();
           const sCfg = scaleCfg[String(data.scaleKey)];
           if (sCfg) {
             await prisma.compensation.create({
                data: {
                  employeeId: createdEmployee.userId,
                  position: sCfg.label || 'Default Scale',
                  basicSalary: Number(sCfg.basicSalary || 0),
                  allowances: Number(sCfg.allowances || 0),
                  bonus: Number(sCfg.bonus || 0),
                  totalCompensation: Number(sCfg.basicSalary || 0) + Number(sCfg.allowances || 0) + Number(sCfg.bonus || 0),
                  effectiveDate: createdEmployee.hireDate || new Date(),
                  status: 'Active'
                }
             });
           }
        } else if (createdEmployee.positionId) {
          const position = await prisma.position.findUnique({
            where: { id: createdEmployee.positionId },
            include: { grade: true }
          });

          if (position) {
            let basicSalary = Number(data.basicSalary || 0);
            let housingAllowance = 0;
            let transportAllowance = 0;
            const positionAllowance = Number(position.positionAllowance || 0);
            const fuelAllowance = Number(position.fuelAllowance || 0);

            if (position.grade) {
               const g = position.grade;
               // use midSalary if no basicSalary provided
               if (!basicSalary && g.midSalary) basicSalary = Number(g.midSalary);
               // Clamp basic salary within grade bounds
               if (g.minSalary && basicSalary < Number(g.minSalary)) basicSalary = Number(g.minSalary);
               if (g.maxSalary && basicSalary > Number(g.maxSalary)) basicSalary = Number(g.maxSalary);
               
               housingAllowance = basicSalary * (Number(g.housingPct || 0) / 100);
               transportAllowance = basicSalary * (Number(g.transportPct || 0) / 100);
            }

            const allowances = housingAllowance + transportAllowance + positionAllowance + fuelAllowance;
            
            await prisma.compensation.create({
              data: {
                employeeId: createdEmployee.userId,
                position: position.name || 'Default Position',
                basicSalary: basicSalary,
                housingAllowance: housingAllowance,
                transportAllowance: transportAllowance,
                positionAllowance: positionAllowance,
                fuelAllowance: fuelAllowance,
                allowances: allowances,
                bonus: Number(data.bonus || 0),
                totalCompensation: basicSalary + allowances + Number(data.bonus || 0),
                effectiveDate: createdEmployee.hireDate || new Date(),
                status: 'Active'
              }
            });
          }
        }
      }

      return createdEmployee;
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
