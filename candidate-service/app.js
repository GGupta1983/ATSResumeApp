const mongoose = require('mongoose');

// MongoDB connection setup
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost/candidateservice');

mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('Mongoose connection error:', err);
});

// Candidate Schema definition
const candidateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: String,
  resume: String,
  skills: [String],
  experience: Number,
  sex: { type: String, enum: ['male', 'female', 'other'], required: false },
  status: { type: String, default: 'active' },
});


const Candidate = mongoose.model('Candidate', candidateSchema);

const express = require('express');
const { body, validationResult } = require('express-validator');
const sanitize = require('mongo-sanitize');
const app = express();
app.use(express.json());


// POST endpoint to add candidate data with validation
app.post('/candidates', [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('sex').optional().isIn(['male', 'female', 'other']).withMessage('Sex must be male, female, or other'),
  body('experience').optional().isNumeric().withMessage('Experience must be a number'),
], async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const sanitizedBody = sanitize(req.body);
    const candidate = new Candidate(sanitizedBody);
    await candidate.save();
    res.status(201).json(candidate);
  } catch (err) {
    next(err);
  }
});

// GET endpoint to view all candidates with pagination
app.get('/candidates', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const candidates = await Candidate.find().skip(skip).limit(limit);
    const total = await Candidate.countDocuments();

    res.status(200).json({
      data: candidates,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    });
  } catch (err) {
    next(err);
  }
});


// GET endpoint to view a specific candidate by ID
app.get('/candidates/:id', async (req, res, next) => {
  try {
    const candidate = await Candidate.findById(req.params.id);
    if (!candidate) return res.status(404).json({ error: 'Candidate not found' });
    res.status(200).json(candidate);
  } catch (err) {
    next(err);
  }
});

// PUT endpoint to update a candidate by ID with validation
app.put('/candidates/:id', [
  body('name').optional().notEmpty().withMessage('Name cannot be empty'),
  body('email').optional().isEmail().withMessage('Valid email is required'),
  body('sex').optional().isIn(['male', 'female', 'other']).withMessage('Sex must be male, female, or other'),
  body('experience').optional().isNumeric().withMessage('Experience must be a number'),
], async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const sanitizedBody = sanitize(req.body);
    const candidate = await Candidate.findByIdAndUpdate(req.params.id, sanitizedBody, { new: true, runValidators: true });
    if (!candidate) return res.status(404).json({ error: 'Candidate not found' });
    res.status(200).json(candidate);
  } catch (err) {
    next(err);
  }
});

// DELETE endpoint to remove a candidate by ID
app.delete('/candidates/:id', async (req, res, next) => {
  try {
    const candidate = await Candidate.findByIdAndDelete(req.params.id);
    if (!candidate) return res.status(404).json({ error: 'Candidate not found' });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// Centralized error handler middleware
app.use((err, req, res, next) => {
  console.error(err);
  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message });
  }
  if (err.name === 'CastError') {
    return res.status(400).json({ error: 'Invalid ID format' });
  }
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.CANDIDATE_SERVICE_PORT || 4007;
app.listen(PORT, () => console.log(`Candidate Service listening on port ${PORT}`));