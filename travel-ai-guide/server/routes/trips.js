const express = require('express');
const axios = require('axios');
const Trip = require('../models/Trip');
const auth = require('../middleware/auth');

const router = express.Router();

// Generate Itinerary
router.post('/generate', auth, async (req, res) => {
  const { destination, persons, startDate, endDate } = req.body;
  try {
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
    const prompt = `Generate a detailed travel itinerary for ${persons} persons to ${destination} from ${startDate} to ${endDate}. Include daily activities, accommodations, and tips.`;
    const response = await axios.post(url, {
      contents: [{ parts: [{ text: prompt }] }]
    });
    const itinerary = response.data.candidates[0].content.parts[0].text;

    const trip = new Trip({ user: req.user.id, destination, persons, startDate, endDate, itinerary });
    await trip.save();

    res.json({ itinerary });
  } catch (err) {
    res.status(500).json({ message: 'Error generating itinerary' });
  }
});

// Get User Trips
router.get('/', auth, async (req, res) => {
  try {
    const trips = await Trip.find({ user: req.user.id });
    res.json(trips);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get Single Trip
router.get('/:id', auth, async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip || trip.user.toString() !== req.user.id) {
      return res.status(404).json({ message: 'Trip not found' });
    }
    res.json(trip);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
