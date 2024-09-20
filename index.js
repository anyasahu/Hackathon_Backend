import express from "express";
import bodyParser from "body-parser"; 
import mongoose from "mongoose";
import 'dotenv/config';

const app = express();
const port=3000;

app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json())

mongoose.connect(process.env.MONGO_URL)
  .then(()=>{
    console.log("Connected!");
}).catch((err)=>{
  console.log(err)
});
const truckSchema = new mongoose.Schema({
  truck_id: {
    type: String,
    required: true,
    unique: true
  },
  is_filled: {
    type: Boolean,
    required: true,
    default: false // Assume the truck starts empty
  },
  has_reached_destination: {
    type: Boolean,
    required: true,
    default: false // Initially, the truck has not reached the destination
  },
  destination: {
    type: String,
    required: true
  },
  current_location: {
    latitude: {
      type: Number,
      required: false
    },
    longitude: {
      type: Number,
      required: false
    }
  },
  location_name: {    //Optional field for converting the latitude/longitude into a readable location name.
    type: String,
    required: false // Optional if using an external API to convert lat/long to location name
  },
  last_updated: {
    type: Date,
    required: true,
    default: Date.now
  },
  image_url: {        //Stores the URL of the image captured by the CCTV (required).
    type: String,
    required: true
  },
  
})

const userSchema = mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  role: {
    type: String,
    enum: ['customer', 'administrator'], // Define roles
    required: true
  },
  
  action_plan: [    //An array of objects containing label (name of the action, e.g., "Clean Now") and action_url
    {
      label: {
        type: String,
        required: true
      },
      action_url: {
        type: String,
        required: true
      }
    }
  ]
})
const User = mongoose.model("User", userSchema)
const Truck =mongoose.model("Truck",truckSchema)

// Create a new user (Customer/Administrator)
app.post('/users', async (req, res) => {
  try {
    // const { username, role } = req.body;

    const username = req.body.username;
    const role = req.body.role;
    console.log(username,role);

    // Validate the role
    if (!['customer', 'administrator'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role specified' });
    }

    const newUser = new User({ username, role });
    await newUser.save();
    
    res.status(201).json(newUser);
  } catch (err) {
    res.status(500).json({ message: 'Error creating user', error: err });
  }
});

// Create a new truck status entry
app.post('/trucks', async (req, res) => {
  try {
    const { truck_id, is_filled, has_reached_destination, destination, current_location,image_url } = req.body;

    const newTruck = new Truck({
      truck_id,
      is_filled,
      has_reached_destination,
      destination,
      current_location,
      image_url
    });

    await newTruck.save();
    
    res.status(201).json(newTruck);
  } catch (err) {
    res.status(500).json({ message: 'Error creating truck entry', error: err });
  }
});

// Get the status of a specific truck
app.get('/trucks/:truck_id', async (req, res) => {
  try {
    const truck = await Truck.findOne({ truck_id: req.params.truck_id });
    
    if (!truck) {
      return res.status(404).json({ message: 'Truck not found' });
    }

    res.status(200).json(truck);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching truck status', error: err });
  }
});

// Update the status of a truck (whether it’s filled or has reached the destination)
app.put('/trucks/:truck_id', async (req, res) => {
  try {
    const { is_filled, has_reached_destination, current_location } = req.body;

    const truck = await Truck.findOneAndUpdate(
      { truck_id: req.params.truck_id },
      { is_filled, has_reached_destination, current_location, last_updated: Date.now() },
      { new: true }
    );
    
    if (!truck) {
      return res.status(404).json({ message: 'Truck not found' });
    }

    res.status(200).json(truck);
  } catch (err) {
    res.status(500).json({ message: 'Error updating truck status', error: err });
  }
});

// Get a list of all trucks and their statuses (admin feature)
app.get('/trucks', async (req, res) => {
  try {
    const trucks = await Truck.find();
    
    res.status(200).json(trucks);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching trucks', error: err });
  }
});

app.listen(port,()=>{
    console.log(`this server is running on port ${port}`);
}); 