import express from "express";
import mongoose from "mongoose";
import multer from "multer";
import cloudinary from "cloudinary";
import cors from "cors";
import bodyParser from "body-parser";

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Configure Cloudinary
cloudinary.v2.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET
});

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error(err));

// Multer setup for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Mongoose Schema
const studentSchema = new mongoose.Schema({
  name: String,
  studentId: String,
  college: String,
  photoUrl: String
});
const Student = mongoose.model("Student", studentSchema);

// Route to register student
app.post("/register", upload.single("photo"), async (req, res) => {
  try {
    const { name, studentId, college } = req.body;
    if (!req.file) return res.status(400).json({ error: "Photo is required" });

    // Upload to Cloudinary
    const result = await cloudinary.v2.uploader.upload_stream(
      { folder: "students" },
      async (error, result) => {
        if (error) return res.status(500).json({ error });

        // Save student in MongoDB
        const student = new Student({
          name,
          studentId,
          college,
          photoUrl: result.secure_url
        });
        await student.save();
        res.json({ message: "Student registered successfully", student });
      }
    );

    result.end(req.file.buffer); // Send file buffer to Cloudinary

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(process.env.PORT || 10000, () => {
  console.log("Server running on port 10000");
});
