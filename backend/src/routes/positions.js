const express = require('express');
const router = express.Router();
const positionController = require('../controllers/positionController');
const { requireRoles } = require('../middleware/auth');

router.get('/', positionController.getPositions);
router.get('/:id', positionController.getPositionById);
router.post('/', requireRoles('admin', 'superadmin'), positionController.createPosition);
router.put('/:id', requireRoles('admin', 'superadmin'), positionController.updatePosition);
router.delete('/:id', requireRoles('admin', 'superadmin'), positionController.deletePosition);

module.exports = router;
