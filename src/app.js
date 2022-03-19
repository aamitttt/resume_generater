const express = require("express");
const cors = require("cors");
const app = express();
const { port } = require("../config");
var { reviseError } = require("./Common/Utility");
const morgan = require("morgan");

const Flags = require("./Flags/FlagRoute");
const Goals = require("./Goals/GoalRoute");
const CompletionStatus = require("./CompletionStatus/CompletionStatusRoute");

const userRouter= require('./Flags/EducationRoute')

app.use(express.json());



app.use(cors({
    origin:"http://localhost:3000",
}));

app.use(morgan("combined"));
app.use(express.urlencoded({extended:true}))




app.use(Goals);
app.use(Flags);
app.use(CompletionStatus);


app.use((err, req, res, next) => {
	if (err) {
		[errorStatusCode, errorMessage] = reviseError(err);
		console.log(JSON.stringify(err));
		return res.status(errorStatusCode).send({ errorMessage: errorMessage });
	}
	return res.send(404).send({ errorMessage: "Not Found" });
	
});

app.use('/profile',userRouter);

app.get('/',(req,res)=>{
	res.send("home")
})

app.listen(port, function () {
	console.log(`Server is listening on Port: `, port);
});
