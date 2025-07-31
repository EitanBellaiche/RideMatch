const express = require('express');
const router = express.Router();
const {
    deleteUser,
    getUserById,
    getAllUsers,
    updateUser

} = require('../controllers/userController');

router.delete('/users/:id', deleteUser);
router.get('/user/:id', getUserById);
router.get('/users', getAllUsers);
router.put('/users/:id', updateUser);





module.exports = router;
