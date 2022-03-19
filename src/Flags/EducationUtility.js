

const express=require('express')
const userModel = require('../Models/educationModel')

const register = async (req, res) => {

    try {
        let result = await userModel.create(req.body);
        res.send({status:"success", data:{id:result.dataValues.id}});
    } catch (error) {
        res.send({status:"error", message:"User registration failed"});
    }

}

const getData = async (req, res) => {

	try {
        let user = await userModel.findAll();
        res.send(user);
    } catch (error) {
        res.send({status:"error", message:"can not be send data"});
       
    }



}

module.exports={
    
	getData,register
}