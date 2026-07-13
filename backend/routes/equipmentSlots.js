const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const EquipmentSlot = require("../models/EquipmentSlot");
const Equipment = require("../models/Equipment");
const EquipmentBooking = require("../models/EquipmentBooking");
const Farmer = require("../models/Farmer");
const Notification = require("../models/Notification");
const auth = require("../middleware/auth");
const farmerAuth = require("../middleware/farmerAuth");
const { logAction } = require("../services/auditLogger");
const { generalWriteLimiter } = require("../middleware/rateLimiters");

// Standard error handler
const handleError = (res, error) => {
  console.error(error);
  return res.status(500).json({
    success: false,
    message: "Internal Server Error"
  });
};

// Helper to normalize date to midnight UTC
const normalizeDate = (dateVal) => {
  const d = new Date(dateVal);
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

// 1. Get All Slots (Admin only - supports filtering)
router.get("/", auth, async (req, res) => {
  try {
    const { equipment, date, status } = req.query;
    let query = {};

    if (equipment) {
      query.$or = [
        { equipmentId: { $regex: new RegExp(equipment, "i") } },
        { equipmentName: { $regex: new RegExp(equipment, "i") } }
      ];
    }

    if (date) {
      const parsedDate = normalizeDate(date);
      query.date = parsedDate;
    }

    if (status) {
      query.status = status;
    }

    const slots = await EquipmentSlot.find(query).sort({ startTime: 1 });
    res.json(slots);
  } catch (error) {
    handleError(res, error);
  }
});

// 2. Generate Slots (Admin only)
router.post("/generate", auth, async (req, res) => {
  try {
    const { equipmentId, date, startTime, endTime, slotDuration, price } = req.body;

    if (!equipmentId || !date || !startTime || !endTime || !slotDuration || price === undefined) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: equipmentId, date, startTime, endTime, slotDuration, price."
      });
    }

    const equipment = await Equipment.findOne({
      $or: [{ equipmentId: equipmentId }, { name: equipmentId }]
    });

    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: "Equipment not found."
      });
    }

    const normDate = normalizeDate(date);
    const dateStr = normDate.toISOString().split("T")[0];

    // Parse start and end times in IST (+05:30)
    const startParts = startTime.split(":");
    const endParts = endTime.split(":");

    const startDateTime = new Date(`${dateStr}T${startParts[0].padStart(2, "0")}:${startParts[1].padStart(2, "0")}:00+05:30`);
    const endDateTime = new Date(`${dateStr}T${endParts[0].padStart(2, "0")}:${endParts[1].padStart(2, "0")}:00+05:30`);

    if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime()) || startDateTime >= endDateTime) {
      return res.status(400).json({
        success: false,
        message: "Invalid start or end times configuration."
      });
    }

    const durationMs = slotDuration * 60 * 1000;
    const slotsToCreate = [];
    let currentStart = new Date(startDateTime);

    while (currentStart < endDateTime) {
      let currentEnd = new Date(currentStart.getTime() + durationMs);
      if (currentEnd > endDateTime) {
        currentEnd = new Date(endDateTime);
      }

      slotsToCreate.push({
        start: new Date(currentStart),
        end: new Date(currentEnd)
      });

      currentStart = new Date(currentEnd);
    }

    // Check for overlap collisions in DB before saving
    for (const slotInterval of slotsToCreate) {
      const overlap = await EquipmentSlot.findOne({
        equipmentId: equipment.equipmentId,
        isActive: true,
        $or: [
          {
            startTime: { $lt: slotInterval.end },
            endTime: { $gt: slotInterval.start }
          }
        ]
      });

      if (overlap) {
        return res.status(400).json({
          success: false,
          message: `Generation aborted: Overlapping slot found between ${slotInterval.start.toLocaleTimeString("en-US", { hour12: false, timeZone: "Asia/Kolkata" })} and ${slotInterval.end.toLocaleTimeString("en-US", { hour12: false, timeZone: "Asia/Kolkata" })}.`
        });
      }
    }

    // Insert all generated slots
    const createdSlots = [];
    for (const slotInterval of slotsToCreate) {
      const newSlot = new EquipmentSlot({
        equipmentId: equipment.equipmentId,
        equipmentName: equipment.name,
        date: normDate,
        startTime: slotInterval.start,
        endTime: slotInterval.end,
        slotDuration: Math.round((slotInterval.end - slotInterval.start) / 60000),
        price: Number(price),
        status: "Available",
        capacity: 1,
        bookedCount: 0,
        isActive: true,
        createdBy: req.admin.id
      });
      await newSlot.save();
      createdSlots.push(newSlot);
    }

    res.status(201).json({
      success: true,
      message: `Successfully generated ${createdSlots.length} slots.`,
      data: createdSlots
    });
  } catch (error) {
    handleError(res, error);
  }
});

// 3. Edit Slot Price or Capacity (Admin only)
router.put("/:id", auth, async (req, res) => {
  try {
    const { price, capacity, isActive } = req.body;
    const slot = await EquipmentSlot.findById(req.params.id);

    if (!slot) {
      return res.status(404).json({
        success: false,
        message: "Slot not found."
      });
    }

    if (slot.bookedCount > 0 && capacity !== undefined && Number(capacity) < slot.bookedCount) {
      return res.status(400).json({
        success: false,
        message: `Cannot decrease capacity below booked count (${slot.bookedCount}).`
      });
    }

    if (price !== undefined) slot.price = Number(price);
    if (capacity !== undefined) slot.capacity = Number(capacity);
    if (isActive !== undefined) slot.isActive = Boolean(isActive);

    // Update status based on capacity
    if (slot.bookedCount >= slot.capacity) {
      slot.status = "Booked";
    } else if (slot.status === "Booked") {
      slot.status = "Available";
    }

    await slot.save();
    res.json({
      success: true,
      message: "Slot updated successfully.",
      data: slot
    });
  } catch (error) {
    handleError(res, error);
  }
});

// 4. Delete Slot (Admin only)
router.delete("/:id", auth, async (req, res) => {
  try {
    const slot = await EquipmentSlot.findById(req.params.id);
    if (!slot) {
      return res.status(404).json({
        success: false,
        message: "Slot not found."
      });
    }

    if (slot.bookedCount > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete slot because active bookings exist."
      });
    }

    await EquipmentSlot.findByIdAndDelete(req.params.id);
    res.json({
      success: true,
      message: "Slot deleted successfully."
    });
  } catch (error) {
    handleError(res, error);
  }
});

// 5. Block / Unblock Slot (Admin only)
router.put("/:id/block", auth, async (req, res) => {
  try {
    const slot = await EquipmentSlot.findById(req.params.id);
    if (!slot) {
      return res.status(404).json({
        success: false,
        message: "Slot not found."
      });
    }

    if (slot.status === "Booked" || slot.bookedCount > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot block a slot that has active bookings."
      });
    }

    slot.status = slot.status === "Blocked" ? "Available" : "Blocked";
    await slot.save();

    res.json({
      success: true,
      message: `Slot is now ${slot.status.toLowerCase()}.`,
      data: slot
    });
  } catch (error) {
    handleError(res, error);
  }
});

// 6. Copy Slots (Admin only)
router.post("/copy", auth, async (req, res) => {
  try {
    const { equipmentId, sourceDate, days } = req.body;

    if (!equipmentId || !sourceDate || !days) {
      return res.status(400).json({
        success: false,
        message: "Missing parameters: equipmentId, sourceDate, and days count are required."
      });
    }

    const normSourceDate = normalizeDate(sourceDate);
    const sourceSlots = await EquipmentSlot.find({
      equipmentId: equipmentId,
      date: normSourceDate,
      isActive: true
    });

    if (sourceSlots.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No slots found on source date to copy."
      });
    }

    const numDays = Number(days);
    let copiedCount = 0;

    for (let i = 1; i <= numDays; i++) {
      const targetDate = new Date(normSourceDate.getTime() + i * 24 * 60 * 60 * 1000);
      const targetDateStr = targetDate.toISOString().split("T")[0];

      for (const srcSlot of sourceSlots) {
        // Offset start and end time by i days
        const targetStart = new Date(srcSlot.startTime.getTime() + i * 24 * 60 * 60 * 1000);
        const targetEnd = new Date(srcSlot.endTime.getTime() + i * 24 * 60 * 60 * 1000);

        // Check unique index collision
        const duplicate = await EquipmentSlot.findOne({
          equipmentId: srcSlot.equipmentId,
          startTime: targetStart,
          endTime: targetEnd
        });

        if (!duplicate) {
          const copiedSlot = new EquipmentSlot({
            equipmentId: srcSlot.equipmentId,
            equipmentName: srcSlot.equipmentName,
            date: targetDate,
            startTime: targetStart,
            endTime: targetEnd,
            slotDuration: srcSlot.slotDuration,
            price: srcSlot.price,
            status: "Available",
            capacity: srcSlot.capacity,
            bookedCount: 0,
            isActive: true,
            createdBy: req.admin.id
          });
          await copiedSlot.save();
          copiedCount++;
        }
      }
    }

    res.json({
      success: true,
      message: `Copied today's slot layout into the next ${days} days. Total slots created: ${copiedCount}`
    });
  } catch (error) {
    handleError(res, error);
  }
});

// 7. Get Available Slots (Farmer facing - Public/Protected)
router.get("/available", async (req, res) => {
  try {
    const { equipment, date } = req.query;

    if (!equipment || !date) {
      return res.status(400).json({
        success: false,
        message: "Missing query parameters: equipment and date are required."
      });
    }

    const normDate = normalizeDate(date);
    const slots = await EquipmentSlot.find({
      $or: [
        { equipmentId: equipment },
        { equipmentName: { $regex: new RegExp(equipment, "i") } }
      ],
      date: normDate,
      status: { $in: ["Available", "Booked"] },
      isActive: true
    }).sort({ startTime: 1 });

    res.json(slots);
  } catch (error) {
    handleError(res, error);
  }
});

// 8. Book Slot (Farmer transaction action)
router.post("/book", farmerAuth, generalWriteLimiter, async (req, res) => {
  const { slotId } = req.body;
  const farmerId = req.farmer.id;

  if (!slotId) {
    return res.status(400).json({
      success: false,
      message: "Slot ID is required."
    });
  }

  // Attempt using Mongo session transaction to secure concurrency
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    // Query slot using session to lock it
    const slot = await EquipmentSlot.findById(slotId).session(session);
    if (!slot) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: "Selected slot not found."
      });
    }

    if (!slot.isActive || slot.status !== "Available" || slot.bookedCount >= slot.capacity) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: "Slot is no longer available. Please select another slot."
      });
    }

    const farmer = await Farmer.findById(farmerId).session(session);
    if (!farmer) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: "Farmer account not found."
      });
    }

    // Increment booked count
    slot.bookedCount += 1;
    slot.bookedBy = farmer._id;
    if (slot.bookedCount >= slot.capacity) {
      slot.status = "Booked";
    }

    // Create the EquipmentBooking record
    const startTimeStr = slot.startTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Kolkata" });
    const endTimeStr = slot.endTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Kolkata" });

    const booking = new EquipmentBooking({
      farmerId: farmer.farmerId || farmer._id.toString(),
      farmerName: farmer.name,
      phone: farmer.phone,
      equipmentName: slot.equipmentName,
      bookingDate: slot.startTime, // Stored as native Date in schema now
      duration: `${startTimeStr} - ${endTimeStr}`,
      status: "Approved", // Autoclass approvals on slots
      adminRemarks: `Slot booked successfully: ${startTimeStr} - ${endTimeStr}`
    });

    await booking.save({ session });
    slot.bookingId = booking._id;
    await slot.save({ session });

    // Create Farmer Notification inside transaction
    await Notification.create([{
      farmerId: farmer._id,
      title: "Equipment Slot Booked",
      message: `You have successfully booked ${slot.equipmentName} for ${slot.date.toLocaleDateString("en-IN")} from ${startTimeStr} to ${endTimeStr}.`,
      type: "booking",
      priority: "high"
    }], { session });

    // Commit transaction
    await session.commitTransaction();
    session.endSession();

    // Trigger external logs outside transaction lock
    await logAction(farmer.name, "Farmer", "Bookings", "CREATE", `Booked machinery slot: ${slot.equipmentName} (${startTimeStr} - ${endTimeStr})`, req.ip);

    res.json({
      success: true,
      message: "Booking confirmed successfully.",
      data: {
        bookingId: booking._id,
        equipmentName: slot.equipmentName,
        date: slot.date,
        timeSlot: `${startTimeStr} - ${endTimeStr}`,
        price: slot.price
      }
    });

  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    session.endSession();
    handleError(res, error);
  }
});

module.exports = router;
