const ROLES = {
  ADMIN: 'Admin',
  MANAGER: 'Manager',
  EMPLOYEE: 'Employee'
};

const PERMISSIONS = {
  // Employee management
  EMPLOYEE_VIEW: 'employee:view',
  EMPLOYEE_CREATE: 'employee:create',
  EMPLOYEE_UPDATE: 'employee:update',
  EMPLOYEE_DELETE: 'employee:delete',

  // Payroll management
  PAYROLL_VIEW: 'payroll:view',
  PAYROLL_RUN: 'payroll:run',
  PAYROLL_UPDATE: 'payroll:update',

  // User management
  USER_VIEW: 'user:view',
  USER_CREATE: 'user:create',
  USER_UPDATE: 'user:update',
  USER_DELETE: 'user:delete',

  // Offboarding
  OFFBOARDING_INITIATE: 'offboarding:initiate',
  OFFBOARDING_VIEW: 'offboarding:view',
  OFFBOARDING_COMPLETE: 'offboarding:complete',

  // Onboarding
  ONBOARDING_VIEW: 'onboarding:view',
  ONBOARDING_UPDATE: 'onboarding:update',
  ONBOARDING_MANAGE: 'onboarding:manage'
};

const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: Object.values(PERMISSIONS),
  [ROLES.MANAGER]: [
    PERMISSIONS.EMPLOYEE_VIEW,
    PERMISSIONS.EMPLOYEE_CREATE,
    PERMISSIONS.EMPLOYEE_UPDATE,
    PERMISSIONS.PAYROLL_VIEW,
    PERMISSIONS.PAYROLL_RUN,
    PERMISSIONS.PAYROLL_UPDATE,
    PERMISSIONS.OFFBOARDING_INITIATE,
    PERMISSIONS.OFFBOARDING_VIEW,
    PERMISSIONS.OFFBOARDING_COMPLETE,
    PERMISSIONS.ONBOARDING_VIEW,
    PERMISSIONS.ONBOARDING_UPDATE,
    PERMISSIONS.ONBOARDING_MANAGE
  ],
  [ROLES.EMPLOYEE]: [
    PERMISSIONS.EMPLOYEE_VIEW,
    PERMISSIONS.USER_VIEW
  ]
};

module.exports = {
  ROLES,
  PERMISSIONS,
  ROLE_PERMISSIONS
};
