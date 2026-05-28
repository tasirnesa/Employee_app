const prisma = require('../config/prisma');

const assetService = {
  assignAsset: async (employeeId, data) => {
    return await prisma.employeeAsset.create({
      data: {
        ...data,
        employeeId: parseInt(employeeId)
      }
    });
  },

  getEmployeeAssets: async (employeeId) => {
    return await prisma.employeeAsset.findMany({
      where: { employeeId: parseInt(employeeId) },
      orderBy: { assignedDate: 'desc' }
    });
  },

  updateAssetStatus: async (assetId, data) => {
    const updateData = { ...data };
    if (data.status === 'Returned' && !data.returnedDate) {
      updateData.returnedDate = new Date();
    }
    return await prisma.employeeAsset.update({
      where: { id: parseInt(assetId) },
      data: updateData
    });
  },

  deleteAsset: async (assetId) => {
    return await prisma.employeeAsset.delete({
      where: { id: parseInt(assetId) }
    });
  }
};

module.exports = assetService;
