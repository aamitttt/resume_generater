const Sequelize = require('sequelize')
const sequelize = new Sequelize(
 "postgres","postgres","o3hut0KxaKMEqNPb",
    {
dialect:"postgres",
host:"34.71.26.124",
port: 5432

});


sequelize
  .authenticate()
  .then(() => {
    console.log('Connection has been established successfully.');
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });


const User = sequelize.define("details",{
      
        college:{
            type:Sequelize.STRING
        },
    degree: {
            type:Sequelize.STRING
          },
          stream: {
                  type:Sequelize.STRING
                },
         specialization: {
                    type:Sequelize.STRING
                 },
        graduation_year: {
                    type:Sequelize.STRING
                },
      performance_scale: {
                   type:Sequelize.STRING
              },
    performance: {
                   type:Sequelize.STRING
            }
    
},
{sequelize,
    modelName: 'User',
    tableName: 'details',
    timestamps:false,
    freezeTableName: true
}
);


User.sync({force: false}).then(() => {
    console.log("syn-successfully")
  }).catch((error)=>{
      console.log("not able to sync",error);
  })

module.exports=User