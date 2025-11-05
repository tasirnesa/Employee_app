-- CreateTable
CREATE TABLE "User" (
    "Id" SERIAL NOT NULL,
    "FullName" TEXT NOT NULL,
    "UserName" TEXT NOT NULL,
    "Password" TEXT NOT NULL,
    "Gender" TEXT,
    "Age" INTEGER,
    "Status" TEXT NOT NULL,
    "Role" TEXT NOT NULL,
    "Locked" TEXT NOT NULL,
    "IsFirstLogin" TEXT NOT NULL,
    "activeStatus" TEXT NOT NULL,
    "CreatedDate" TIMESTAMP(3) NOT NULL,
    "CreatedBy" INTEGER NOT NULL,
    "departmentId" INTEGER,
    "positionId" INTEGER,
    "managerId" INTEGER,

    CONSTRAINT "User_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "Department" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "managerId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Position" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "reportsTo" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Position_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evaluation" (
    "EvaluationID" SERIAL NOT NULL,
    "EvaluatorID" INTEGER NOT NULL,
    "EvaluateeID" INTEGER NOT NULL,
    "EvaluationType" TEXT NOT NULL,
    "SessionID" INTEGER NOT NULL,
    "EvaluationDate" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Evaluation_pkey" PRIMARY KEY ("EvaluationID")
);

-- CreateTable
CREATE TABLE "EvaluationCriteria" (
    "CriteriaID" SERIAL NOT NULL,
    "Title" TEXT NOT NULL,
    "Description" TEXT,
    "CreatedBy" INTEGER NOT NULL,
    "CreatedDate" TIMESTAMP(3) NOT NULL,
    "IsAuthorized" BOOLEAN NOT NULL DEFAULT false,
    "AuthorizedBy" INTEGER,
    "AuthorizedDate" TIMESTAMP(3),

    CONSTRAINT "EvaluationCriteria_pkey" PRIMARY KEY ("CriteriaID")
);

-- CreateTable
CREATE TABLE "EvaluationSession" (
    "SessionID" SERIAL NOT NULL,
    "Title" TEXT NOT NULL,
    "StartDate" TIMESTAMP(3) NOT NULL,
    "EndDate" TIMESTAMP(3) NOT NULL,
    "ActivatedBy" INTEGER NOT NULL,
    "type" TEXT NOT NULL DEFAULT '',
    "Department" TEXT,

    CONSTRAINT "EvaluationSession_pkey" PRIMARY KEY ("SessionID")
);

-- CreateTable
CREATE TABLE "EvaluationResult" (
    "ResultID" SERIAL NOT NULL,
    "EvaluationID" INTEGER NOT NULL,
    "CriteriaID" INTEGER NOT NULL,
    "Score" DOUBLE PRECISION NOT NULL,
    "Feedback" TEXT,

    CONSTRAINT "EvaluationResult_pkey" PRIMARY KEY ("ResultID")
);

-- CreateTable
CREATE TABLE "Goal" (
    "gid" SERIAL NOT NULL,
    "objective" TEXT NOT NULL,
    "keyResult" JSONB DEFAULT '[]',
    "priority" TEXT,
    "status" TEXT,
    "progress" INTEGER,
    "duedate" TIMESTAMP(3),
    "category" TEXT,
    "ActivatedBy" INTEGER,

    CONSTRAINT "Goal_pkey" PRIMARY KEY ("gid")
);

-- CreateTable
CREATE TABLE "KeyResultProgress" (
    "id" SERIAL NOT NULL,
    "goalId" INTEGER NOT NULL,
    "keyIndex" INTEGER NOT NULL,
    "progress" INTEGER NOT NULL,
    "notedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notedBy" INTEGER NOT NULL,

    CONSTRAINT "KeyResultProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Performance" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "evaluatorId" INTEGER NOT NULL,
    "tasksCompleted" INTEGER NOT NULL,
    "hoursWorked" INTEGER NOT NULL,
    "efficiencyScore" DOUBLE PRECISION,
    "qualityScore" DOUBLE PRECISION,
    "punctualityScore" DOUBLE PRECISION,
    "collaborationScore" DOUBLE PRECISION,
    "innovationScore" DOUBLE PRECISION,
    "overallRating" DOUBLE PRECISION,
    "feedback" TEXT,
    "evaluationPeriod" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Performance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Employee" (
    "id" SERIAL NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "department" TEXT,
    "position" TEXT,
    "hireDate" TIMESTAMP(3),
    "gender" TEXT,
    "age" INTEGER,
    "birthDate" TIMESTAMP(3),
    "profileImageUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attendance" (
    "id" SERIAL NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "checkInTime" TIMESTAMP(3),
    "checkOutTime" TIMESTAMP(3),
    "hoursWorked" DOUBLE PRECISION,
    "status" TEXT NOT NULL,
    "timeType" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Todo" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Todo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payslip" (
    "id" SERIAL NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "period" TEXT NOT NULL,
    "basicSalary" DECIMAL(10,2) NOT NULL,
    "allowances" DECIMAL(10,2) NOT NULL,
    "deductions" DECIMAL(10,2) NOT NULL,
    "netSalary" DECIMAL(10,2) NOT NULL,
    "status" TEXT NOT NULL,
    "generatedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payslip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Compensation" (
    "id" SERIAL NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "position" TEXT NOT NULL,
    "basicSalary" DECIMAL(10,2) NOT NULL,
    "allowances" DECIMAL(10,2) NOT NULL,
    "bonus" DECIMAL(10,2) NOT NULL,
    "totalCompensation" DECIMAL(10,2) NOT NULL,
    "effectiveDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Compensation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Candidate" (
    "id" SERIAL NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "experience" INTEGER NOT NULL,
    "education" TEXT NOT NULL,
    "skills" TEXT[],
    "status" TEXT NOT NULL,
    "appliedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resumeUrl" TEXT,
    "interviewDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Candidate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Benefit" (
    "id" SERIAL NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "benefitType" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "coverage" TEXT NOT NULL,
    "monthlyCost" DECIMAL(10,2) NOT NULL,
    "employeeContribution" DECIMAL(10,2) NOT NULL,
    "companyContribution" DECIMAL(10,2) NOT NULL,
    "effectiveDate" TIMESTAMP(3) NOT NULL,
    "expiryDate" TIMESTAMP(3),
    "status" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Benefit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Perk" (
    "id" SERIAL NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "perkType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "value" DECIMAL(10,2) NOT NULL,
    "frequency" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Perk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'Active',
    "managerId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Timesheet" (
    "id" SERIAL NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "projectId" INTEGER,
    "taskDescription" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "hoursWorked" DOUBLE PRECISION NOT NULL,
    "overtimeHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "approvedBy" INTEGER,
    "approvedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Timesheet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaveType" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "maxDays" INTEGER,
    "isPaid" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeaveType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Leave" (
    "id" SERIAL NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "leaveTypeId" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "days" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "appliedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedBy" INTEGER,
    "approvedAt" TIMESTAMP(3),
    "comments" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Leave_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "senderId" INTEGER NOT NULL,
    "receiverId" INTEGER NOT NULL,
    "text" TEXT,
    "image" TEXT,
    "status" TEXT NOT NULL DEFAULT 'sent',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_UserName_key" ON "User"("UserName");

-- CreateIndex
CREATE INDEX "User_managerId_idx" ON "User"("managerId");

-- CreateIndex
CREATE UNIQUE INDEX "Department_name_key" ON "Department"("name");

-- CreateIndex
CREATE INDEX "KeyResultProgress_goalId_keyIndex_notedAt_idx" ON "KeyResultProgress"("goalId", "keyIndex", "notedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_email_key" ON "Employee"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Candidate_email_key" ON "Candidate"("email");

-- CreateIndex
CREATE UNIQUE INDEX "LeaveType_name_key" ON "LeaveType"("name");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "Position"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Position" ADD CONSTRAINT "Position_reportsTo_fkey" FOREIGN KEY ("reportsTo") REFERENCES "Position"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_EvaluatorID_fkey" FOREIGN KEY ("EvaluatorID") REFERENCES "User"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_EvaluateeID_fkey" FOREIGN KEY ("EvaluateeID") REFERENCES "User"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_SessionID_fkey" FOREIGN KEY ("SessionID") REFERENCES "EvaluationSession"("SessionID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvaluationCriteria" ADD CONSTRAINT "EvaluationCriteria_CreatedBy_fkey" FOREIGN KEY ("CreatedBy") REFERENCES "User"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvaluationCriteria" ADD CONSTRAINT "EvaluationCriteria_AuthorizedBy_fkey" FOREIGN KEY ("AuthorizedBy") REFERENCES "User"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvaluationSession" ADD CONSTRAINT "EvaluationSession_ActivatedBy_fkey" FOREIGN KEY ("ActivatedBy") REFERENCES "User"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvaluationResult" ADD CONSTRAINT "EvaluationResult_EvaluationID_fkey" FOREIGN KEY ("EvaluationID") REFERENCES "Evaluation"("EvaluationID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvaluationResult" ADD CONSTRAINT "EvaluationResult_CriteriaID_fkey" FOREIGN KEY ("CriteriaID") REFERENCES "EvaluationCriteria"("CriteriaID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_ActivatedBy_fkey" FOREIGN KEY ("ActivatedBy") REFERENCES "User"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KeyResultProgress" ADD CONSTRAINT "KeyResultProgress_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal"("gid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KeyResultProgress" ADD CONSTRAINT "KeyResultProgress_notedBy_fkey" FOREIGN KEY ("notedBy") REFERENCES "User"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Performance" ADD CONSTRAINT "Performance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Performance" ADD CONSTRAINT "Performance_evaluatorId_fkey" FOREIGN KEY ("evaluatorId") REFERENCES "User"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "User"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Todo" ADD CONSTRAINT "Todo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payslip" ADD CONSTRAINT "Payslip_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "User"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Compensation" ADD CONSTRAINT "Compensation_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "User"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Benefit" ADD CONSTRAINT "Benefit_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "User"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Perk" ADD CONSTRAINT "Perk_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "User"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Timesheet" ADD CONSTRAINT "Timesheet_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "User"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Timesheet" ADD CONSTRAINT "Timesheet_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Timesheet" ADD CONSTRAINT "Timesheet_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "User"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Leave" ADD CONSTRAINT "Leave_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "User"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Leave" ADD CONSTRAINT "Leave_leaveTypeId_fkey" FOREIGN KEY ("leaveTypeId") REFERENCES "LeaveType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Leave" ADD CONSTRAINT "Leave_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "User"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;
