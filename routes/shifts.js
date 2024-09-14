const express = require('express');
const router = express.Router();
const { Shift } = require('../models/model');  // Importing the Shift model

//TODO: Test shift overlaps


// Create a new shift
// Before saving a new shift or updating an existing shift, we need to query the database to see if there are any shifts that overlap 
// with the new shift's startTime and endTime.
router.post('/new', async (req, res) => {
    try {
        const { employeeId, startTime, duration, jobId, location, role } = req.body;

        // Calculate endTime based on startTime and duration
        const endTime = new Date(new Date(startTime).getTime() + duration * 60 * 60 * 1000); //calculating end time twice?

        // If employeeId is provided, check for overlapping shifts
        if (employeeId) {
            const overlappingShift = await Shift.findOne({
                employeeId: employeeId, //looking at shifts that only the supplied user ID
                $or: [ // will return true if any of the following apply
                    { startTime: { $lt: endTime, $gte: startTime } }, // Overlaps with the new shift's startTime
                    { endTime: { $gt: startTime, $lte: endTime } }    // Overlaps with the new shift's endTime
                ]
            });

            if (overlappingShift) {
                return res.status(400).send({ error: 'Shift overlaps with an existing shift for this employee' });
            }
        }

        // Create the new shift
        const newShift = new Shift({ employeeId, startTime, duration, jobId, location, role });

        // Save the new shift to the database
        await newShift.save();

        // Send the created shift as a response with status 201 (Created)
        res.status(201).send(newShift);
    } catch (err) {
        // Send an error response with status 400 (Bad Request) if something goes wrong
        res.status(400).send({ error: err.message });
    }
});
/*
Testing:
    http://localhost:3000/shifts/new
    {
    "startTime": "2024-09-01T08:00:00Z",
    "duration": 8,
    "location": "Office",
    "role": "Developer",
    "jobId": "64e8234be8b15b63f8d1b2a1",  // Replace with an actual Job ID from your database
    "employeeId": "64e8233fe8b15b63f8d1b2a0"  // Optional: Replace with an actual Employee ID or remove to test 'Not Filled' status
    }


    TODO: Create a human readble ID and respond with a "success" message
*/

// Get all shifts
router.get('/', async (req, res) => {
    try {
        const shifts = await Shift.find().populate('employeeId');
        res.send(shifts);
    } catch (err) {
        res.status(500).send({ error: err.message });
    }
});

// Update a shift by ID
router.put('/:id', async (req, res) => {
    try {
        const shiftId = req.params.id;
        const updateData = req.body;

        // Find the current shift document to compare values
        const existingShift = await Shift.findById(shiftId);
        if (!existingShift) {
            return res.status(404).send({ error: 'Shift not found' });
        }

        // If startTime or duration is being updated, recalculate endTime
        if (updateData.startTime || updateData.duration) {
            const newStartTime = updateData.startTime ? new Date(updateData.startTime) : existingShift.startTime;
            const newDuration = updateData.duration !== undefined ? updateData.duration : existingShift.duration;
            updateData.endTime = new Date(newStartTime.getTime() + newDuration * 60 * 60 * 1000);
        }

        // If employeeId is provided or being updated, check for overlapping shifts
        if (updateData.employeeId || updateData.startTime || updateData.duration) {
            const employeeId = updateData.employeeId || existingShift.employeeId;// new ID or current
            const newStartTime = updateData.startTime ? new Date(updateData.startTime) : existingShift.startTime;
            const newEndTime = updateData.endTime ? new Date(updateData.endTime) : existingShift.endTime;

            const overlappingShift = await Shift.findOne({
                _id: { $ne: shiftId },  // Exclude the current shift being updated
                employeeId: employeeId,
                $or: [
                    { startTime: { $lt: newEndTime, $gte: newStartTime } }, // Overlaps with the new shift's startTime
                    { endTime: { $gt: newStartTime, $lte: newEndTime } }    // Overlaps with the new shift's endTime
                ]
            });

            if (overlappingShift) {
                return res.status(400).send({ error: 'Shift overlaps with an existing shift for this employee' });
            }
        }

        // Update the shift in the database
        const updatedShift = await Shift.findByIdAndUpdate(shiftId, updateData, { new: true, runValidators: true });
        if (!updatedShift) {
            return res.status(404).send({ error: 'Shift not found' });
        }

        res.send(updatedShift);
    } catch (err) {
        res.status(400).send({ error: err.message });
    }
});

// Delete a shift by ID
router.delete('/:id', async (req, res) => {
    try {
        const shift = await Shift.findByIdAndDelete(req.params.id);
        if (!shift) {
            return res.status(404).send({ error: 'Shift not found' });
        }
        res.send(shift);
    } catch (err) {
        res.status(500).send({ error: err.message });
    }
});

// Get all shifts
router.get('/', async (req, res) => {
    try {
        // Query the database to get all shifts
        const shifts = await Shift.find().populate('employeeId').populate('jobId');
        // Send the shifts as the response
        res.send(shifts);
    } catch (err) {
        // Handle any errors
        res.status(500).send({ error: err.message });
    }
});

module.exports = router;
