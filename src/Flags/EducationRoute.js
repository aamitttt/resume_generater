

const express = require("express");

const userController = require('./EducationUtility')

const router= express.Router();

router.post('/updateData',userController.register)
router.get('/getData',userController.getData);

module.exports=router;