
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const crypto = require('crypto');
//const nodemailer = require('nodemailer');
//const router = express.Router();

//realtime updates

const http = require('http');
const { ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
const User = require('./models/user');
const Register = require('./models/register');

const Drugs = require('./models/Drug');
const app = express();
const router = express.Router()

const port = 8000;
const axios = require('axios');
//const { request } = require('http');
const cors = require('cors');
//const { register } = require('module');
const socketIO = require('socket.io');
app.use(cors());
const Server = http.createServer(app);
const io = socketIO(Server, {
  cors: {
    origin: '*', // Replace with your React Native app's URL
    methods: ['GET', 'POST'],
  },
});
Server.listen(8080, () => {
  console.log('server.io is running on port 8080');
}
)

app.use(cors({
  origin: '*', // Replace with your React Native app's URL
  methods: 'GET,POST',
}));
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

mongoose
  .connect('mongodb+srv://muzammilsiddiqui826:rL8rOvuarN9oYrVM@cluster0.g8thyaz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', {
   
  })
  .then(() => {
    console.log('connnected to mongoDB');
  })
  .catch(err => {
    console.log('error connecting to mongoDB', err);
  });

app.listen(port, () => {
  console.log('server is running on port 8000');
});











// get users




















const generateSecretKey = () => {
  const secretkey = crypto.randomBytes(32).toString('hex');
  return secretkey;
};

const secretkey = generateSecretKey();




//endpoint of the login application
 


app.post('/login', async (req, res) => {
  try {
    console.log(req.body);
    const {UserName: username, Password: password} = req.body;
    console.log(username);
    console.log(password); 
    //check user exist
    const user = await User.findOne({username});
    console.log(user);
    if (!user){
      return res.status(401).json({message: 'invalid doctor id or password !'});
    }

    //check user password
    if (user.password !== password) {
      return res.status(402).json({Message: 'ivalid password !'});
    }
    console.log(res);

    //generate a token
    const token = jwt.sign({userId: user._id}, secretkey, {expiresIn: '999h'});
    console.log("from login", token)
    res.status(200).json({token});
  } catch (error) {
    console.log('error logging user', error);
    res.status(500).json({Message: 'Login failed'});
  }
});


// ... existing code ...
app.post('/register', async (req, res) => {
  try {
    const { name, username, password, doctorID } = req.body;
    // Check if username or doctorID already exists
    const existingUser = await User.findOne({ $or: [{ username }, { doctorID }] });
    if (existingUser) {
      return res.status(409).json({ message: 'Username or DoctorID already exists' });
    }
    const newUser = new User({ name, username, password, doctorID });
    await newUser.save();
    res.status(201).json({ message: 'User registered successfully', user: newUser });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ message: 'Registration failed' });
  }
});
// ... existing code ...



// Middleware to verify and decode the token
/*{const authMiddleware = async (req, res, next) => {
  const token = req.header('Authorization');

  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, 'your-secret-key');

    // Attach the User ID to the request object
    req.user = decoded.user;

    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};
}*/






  ///
  // get current user
  {/*app.get('/user', async (req, res) => {
    const usertoken = req.headers.authorization
    if (!usertoken) {
      // If there is no 'Authorization' header, the token is missing.
      return res.status(405).json({ message: 'Authorization header is missing' });
  }
    const token = jwt.verify(usertoken, 'secret-key');
    console.log(token);
  
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized request' });
    }
    try {
      const user = await User.findOne(token)
      if (user) {
        return res.json(user);
      } else {
        return res.status(407).json({ message: 'Unauthorized' });
      }
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  });*/}

  app.get('/user', async (req, res) => {
    const usertoken = req.headers.authorization;
    console.log(usertoken);
    if (!usertoken) {
        return res.status(401).json({ message: 'Authorization header is missing' });
    }
    try {
        const token = usertoken.split(' ')[1]; // Extract the token part
        const decodedToken = jwt.verify(token, secretkey);
        console.log(decodedToken);
        

        if (!decodedToken) {
            return res.status(401).json({ message: 'Unauthorized request' });
        }

        // Assuming 'User' is a valid Mongoose model
        const user = await User.findOne({ _id: decodedToken.userId });

        if (user) {
            return res.json(user);
        } else {
            return res.status(401).json({ message: 'Unauthorized' });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
});


// adding patient information


// Create a new patient






app.post('/patients', async (req, res) => {
  try {
    console.log("Received patient data:", req.body);

    // Validate required fields
    const requiredFields = ['name', 'patientId', 'age', 'gender', 'doctorID'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        error: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    const {
      name,
      patientId,
      age,
      gender,
      treatmentType,
      haemoglobin,
      bloodGroup,
      mobile,
      height,
      weight,
      doctorID,
    } = req.body;

    const newPatient = new Register({ 
      name,
      patientId,
      age, 
      gender,
      treatmentType,
      haemoglobin,
      bloodGroup,
      mobile,
      height,
      weight,  
      doctorID,
    });

    console.log("Attempting to save patient:", newPatient);
    
    const savedPatient = await newPatient.save();
    console.log("Patient saved successfully:", savedPatient);
    
    // Emit socket event after successful save
    io.emit('new-patient', savedPatient);
    
    return res.status(201).json({
      success: true,
      message: 'Patient created successfully',
      patient: savedPatient
    });

  } catch (error) {
    console.error("Error saving patient:", error);
    return res.status(500).json({ 
      success: false,
      error: 'Error saving patient details',
      message: error.message 
    });
  }
});
//get list api
app.get('/patients', async (req, res) => {
  try {
    const doctorID = req.query.doctorID;
    const patients = await Register.find({doctorID});
    return res.json(patients);
  } catch (error) {
    console.error('Error retrieving patients:', error);
    return res.status(500).json({ error: 'Error retrieving patients' });
  }
});

//add drug api

app.post('/drugs', async (req, res) => {
  
  try {
    const {
      drugname,
      category,
      agegroup,
      dosage,
      fataldosage,
    } = req.body;
    const { min, max } = dosage;
    const newDrug = new Drugs({ 
     drugname,
     category,
     agegroup,
     dosage: {
      min: {
        value: min.value,
        unit: min.unit,
      },
      max: {
        value: max.value,
        unit: max.unit,
      },
    },
     fataldosage,
    })
      console.log(newDrug);
    await newDrug.save();
    io.emit('new-drug', newDrug); // Emit a 'new-drug' event
    res.status(201).json(newDrug);
    console.log(newDrug);
  } catch (error) {
    res.status(500).json({ error: 'Error saving drug details' });
  }
});

//getting drug list
app.get('/drugs', async (req, res) => {
  try {
    const drugs = await Drugs.find();
    res.json(drugs);
  } catch (error) {
    console.error('Error retrieving patients:', error);
    res.status(500).json({ error: 'Error retrieving patients' });
  }
});






app.delete('/patients/:id', async (req, res) => {
  const patientId = req.params.id;

  // Use Mongoose to find and remove the patient by _id
  try {
    const patient = await Register.findByIdAndDelete(patientId);

    if (patient) {
      res.sendStatus(204);
      io.emit('delete-patient');  //emits delete-patient
    } else {
      res.status(404).json({ error: 'Patient not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});


// Your patient data - replace this with your data store (e.g., database)


// Define the endpoint to update a patient


app.put('/patients/:patientId', async (req, res) => {
  const patientId = req.params.patientId;
  const updatedPatientData = req.body;

  try {
    // Find and update the patient with the specified ID
    const patientToUpdate = await Register.findByIdAndUpdate(
      patientId,
      updatedPatientData,
      { new: true }
    );

    if (!patientToUpdate) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    res.json({ success: true, message: 'Patient details updated successfully', updatedPatient: patientToUpdate });
  } catch (error) {
    console.error('Error updating patient details:', error);
    res.status(500).json({ success: false, message: 'Failed to update patient details' });
  }
});



// reset password endpoint




// Reset password endpoint
app.post('/reset-password/:doctorID', async (req, res) => {
  try {
    const { doctorID } = req.params;
    const { newPassword } = req.body;
    // Update the user's password in the database using doctorID
    const result = await User.findOneAndUpdate({ doctorID }, { password: newPassword },{ new: true });

    if (result) {
      // Password updated successfully
      res.json({ success: true, message: 'Password reset successful' });
    } else {
      // No document matching the given doctorID
      res.status(404).json({ success: false, message: 'User not found' });
    }
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});
















  module.exports = app;




  


