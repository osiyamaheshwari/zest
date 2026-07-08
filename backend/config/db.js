import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '..', 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Check MongoDB connection availability
let useMongoDB = false;
const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/zest';

try {
  if (process.env.MONGO_URI) {
    await mongoose.connect(mongoURI, { serverSelectionTimeoutMS: 2000 });
    console.log('Successfully connected to MongoDB');
    useMongoDB = true;
  } else {
    console.log('No MONGO_URI provided in env. Defaulting to local file-based database.');
  }
} catch (err) {
  console.log('MongoDB connection failed. Falling back to local file-based database. Error:', err.message);
  useMongoDB = false;
}

// Simple File Database Helper
class FileCollection {
  constructor(name) {
    this.filePath = path.join(DATA_DIR, `${name}.json`);
    if (!fs.existsSync(this.filePath)) {
      fs.writeFileSync(this.filePath, JSON.stringify([]));
    }
  }

  _read() {
    try {
      const data = fs.readFileSync(this.filePath, 'utf8');
      return JSON.parse(data);
    } catch (err) {
      return [];
    }
  }

  _write(data) {
    fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2));
  }

  async find(query = {}) {
    let items = this._read();
    return items.filter(item => {
      for (let key in query) {
        // Simple match
        if (query[key] !== undefined && item[key] !== query[key]) {
          // Check for array contains or simple equality
          if (Array.isArray(item[key]) && item[key].includes(query[key])) {
            continue;
          }
          return false;
        }
      }
      return true;
    });
  }

  async findOne(query = {}) {
    const items = await this.find(query);
    return items.length > 0 ? items[0] : null;
  }

  async findById(id) {
    const items = this._read();
    return items.find(item => item._id === id) || null;
  }

  async create(doc) {
    const items = this._read();
    const newDoc = {
      _id: Math.random().toString(36).substring(2, 11),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...doc
    };
    items.push(newDoc);
    this._write(items);
    return newDoc;
  }

  async findByIdAndUpdate(id, updateData, options = { new: true }) {
    const items = this._read();
    const index = items.findIndex(item => item._id === id);
    if (index === -1) return null;
    
    items[index] = {
      ...items[index],
      ...updateData,
      updatedAt: new Date().toISOString()
    };
    this._write(items);
    return items[index];
  }

  async findByIdAndDelete(id) {
    const items = this._read();
    const index = items.findIndex(item => item._id === id);
    if (index === -1) return null;
    const deleted = items.splice(index, 1);
    this._write(items);
    return deleted[0];
  }

  async updateOne(query = {}, updateData = {}) {
    const items = this._read();
    const index = items.findIndex(item => {
      for (let key in query) {
        if (item[key] !== query[key]) return false;
      }
      return true;
    });
    if (index === -1) return null;
    items[index] = {
      ...items[index],
      ...updateData,
      updatedAt: new Date().toISOString()
    };
    this._write(items);
    return items[index];
  }
}

// We define database schemas for mongoose so production deployment is fully MongoDB-ready
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  branch: String,
  year: String,
  status: String, // Hostel / Day Scholar
  profilePic: String,
  contact: String,
  contributions: { type: Number, default: 0 },
  wishlist: { type: Array, default: [] }
}, { timestamps: true });

const ItemSchema = new mongoose.Schema({
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sellerName: String,
  sellerContact: String,
  title: { type: String, required: true },
  description: String,
  category: String,
  price: Number,
  image: String,
  status: { type: String, default: 'Interested' }, // Interested, Contacted Seller, Meeting Scheduled, Negotiating, Deal Completed, Not Interested
  interestedBuyers: { type: Array, default: [] }
}, { timestamps: true });

const AccommodationSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  ownerName: String,
  ownerContact: String,
  title: { type: String, required: true },
  description: String,
  type: String, // Hostel Room, Apartment, PG, Flat
  rent: Number,
  location: String,
  occupancy: String, // Single, Double, Shared
  genderPreference: String, // Male, Female, Any
  amenities: [String],
  distance: Number, // Distance from college in km
  images: [String],
  roommateProfile: {
    needed: { type: Boolean, default: false },
    details: String
  }
}, { timestamps: true });

const ResourceSchema = new mongoose.Schema({
  contributor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  contributorName: String,
  title: { type: String, required: true },
  description: String,
  department: String,
  year: String,
  semester: String,
  subject: String,
  filePath: String,
  downloads: { type: Number, default: 0 },
  ratings: [{ userId: String, rating: Number }],
  avgRating: { type: Number, default: 0 },
  reviews: [{ userId: String, userName: String, text: String, date: Date }]
}, { timestamps: true });

const LostFoundSchema = new mongoose.Schema({
  reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reporterName: String,
  reporterContact: String,
  title: { type: String, required: true },
  description: String,
  image: String,
  type: { type: String, required: true }, // Lost, Found
  location: String,
  date: String,
  status: { type: String, default: 'Lost' }, // Lost, Found, Claimed, Verified, Returned
  claimRequests: [{ userId: String, userName: String, contact: String, message: String, isApproved: Boolean }]
}, { timestamps: true });

const ClubSchema = new mongoose.Schema({
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  creatorName: String,
  clubName: { type: String, required: true },
  title: { type: String, required: true },
  description: String,
  category: { type: String, required: true }, // Extra-curricular, Sports, Technical
  openPositions: [String],
  requirements: String,
  activities: String,
  contact: String
}, { timestamps: true });

let MongooseUser, MongooseItem, MongooseAccommodation, MongooseResource, MongooseLostFound, MongooseClub;

if (useMongoDB) {
  MongooseUser = mongoose.model('User', UserSchema);
  MongooseItem = mongoose.model('Item', ItemSchema);
  MongooseAccommodation = mongoose.model('Accommodation', AccommodationSchema);
  MongooseResource = mongoose.model('Resource', ResourceSchema);
  MongooseLostFound = mongoose.model('LostFound', LostFoundSchema);
  MongooseClub = mongoose.model('Club', ClubSchema);
}

// Wrapper DB client returning Mongoose or File Collection
const getCollection = (name, mongooseModel) => {
  const fileColl = new FileCollection(name);
  return {
    find: async (query) => useMongoDB ? mongooseModel.find(query).lean() : fileColl.find(query),
    findOne: async (query) => useMongoDB ? mongooseModel.findOne(query).lean() : fileColl.findOne(query),
    findById: async (id) => useMongoDB ? mongooseModel.findById(id).lean() : fileColl.findById(id),
    create: async (doc) => useMongoDB ? (await mongooseModel.create(doc)).toObject() : fileColl.create(doc),
    findByIdAndUpdate: async (id, updateData) => useMongoDB ? mongooseModel.findByIdAndUpdate(id, updateData, { new: true }).lean() : fileColl.findByIdAndUpdate(id, updateData),
    findByIdAndDelete: async (id) => useMongoDB ? mongooseModel.findByIdAndDelete(id).lean() : fileColl.findByIdAndDelete(id),
    updateOne: async (query, updateData) => useMongoDB ? mongooseModel.updateOne(query, updateData) : fileColl.updateOne(query, updateData)
  };
};

export const db = {
  users: getCollection('users', MongooseUser),
  items: getCollection('items', MongooseItem),
  hostels: getCollection('hostels', MongooseAccommodation),
  resources: getCollection('resources', MongooseResource),
  lostfound: getCollection('lostfound', MongooseLostFound),
  clubs: getCollection('clubs', MongooseClub),
  isMongoDB: () => useMongoDB
};
