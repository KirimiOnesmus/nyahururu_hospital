const express = require("express");
const router = express.Router();
const {   getAllUsers,
  getUserById,
  createUser,
  updateUser,
  verifyEmail,
  deleteUser } = require("../controllers/userController");

const { verifyToken, authorizeRoles } = require('../middleware/auth');

//all users
router.get('/', verifyToken, authorizeRoles('admin', 'it'), getAllUsers);

//View a single user by ID
router.get('/:id', verifyToken, authorizeRoles('admin', 'it'), getUserById);

//add users
router.post('/', verifyToken, authorizeRoles('admin', 'it'), createUser);

//update users
router.put('/:id', verifyToken, authorizeRoles('admin', 'it'), updateUser);

//verifying email
router.post('/verify-email',verifyEmail);

//delete users
router.delete('/:id', verifyToken, authorizeRoles('admin', 'it'), deleteUser);

module.exports = router;