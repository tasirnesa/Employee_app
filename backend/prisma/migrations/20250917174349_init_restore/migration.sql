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

    CONSTRAINT "User_pkey" PRIMARY KEY ("Id")
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

    CONSTRAINT "EvaluationCriteria_pkey" PRIMARY KEY ("CriteriaID")
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
CREATE TABLE "EvaluationSession" (
    "SessionID" SERIAL NOT NULL,
    "Title" TEXT NOT NULL,
    "StartDate" TIMESTAMP(3) NOT NULL,
    "EndDate" TIMESTAMP(3) NOT NULL,
    "ActivatedBy" INTEGER NOT NULL,

    CONSTRAINT "EvaluationSession_pkey" PRIMARY KEY ("SessionID")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_UserName_key" ON "User"("UserName");
