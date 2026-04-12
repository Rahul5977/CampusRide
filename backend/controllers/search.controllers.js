import Group from "../models/groups.model.js";
import TravelPlan from "../models/travelPlan.model.js";
import { startOfUtcDay } from "../utils/dateUtils.js";

function parseDateStart(d) {
  if (!d) return null;
  const x = new Date(d);
  return Number.isNaN(x.getTime()) ? null : x;
}

export const searchGroups = async (req, res) => {
  try {
    const {
      q,
      trainNumber,
      destination,
      dateFrom,
      dateTo,
      timeFrom,
      timeTo,
    } = req.query;

    const filter = {
      status: { $in: ["Open"] },
    };

    const from = parseDateStart(dateFrom);
    const to = parseDateStart(dateTo);

    if (from && to) {
      filter.departureDate = { $gte: from, $lte: to };
    } else if (from) {
      filter.departureDate = { $gte: from };
    } else if (to) {
      filter.departureDate = { $lte: to };
    } else {
      filter.departureDate = { $gte: startOfUtcDay() };
    }

    if (destination) filter.destination = destination;
    if (trainNumber) filter.trainNumber = trainNumber;

    if (q && q.trim()) {
      filter.$text = { $search: q.trim() };
    }

    let mongoQuery = Group.find(filter)
      .populate("creator", "name avatar email phone gender hostel year branch")
      .populate("members", "name avatar email phone gender hostel year branch");

    if (q && q.trim()) {
      mongoQuery = mongoQuery
        .select({ score: { $meta: "textScore" } })
        .sort({ score: { $meta: "textScore" }, departureDate: 1 });
    } else {
      mongoQuery = mongoQuery.sort({ departureDate: 1 });
    }

    let groups = await mongoQuery.lean();

    const tf = timeFrom ? new Date(timeFrom) : null;
    const tt = timeTo ? new Date(timeTo) : null;
    if (
      tf &&
      tt &&
      !Number.isNaN(tf.getTime()) &&
      !Number.isNaN(tt.getTime())
    ) {
      groups = groups.filter((g) => {
        const leave = new Date(g.campusLeaveTime).getTime();
        return leave >= tf.getTime() && leave <= tt.getTime();
      });
    }

    return res.status(200).json({ success: true, groups });
  } catch (error) {
    console.error("searchGroups:", error);
    return res.status(500).json({
      success: false,
      message: "Search failed.",
    });
  }
};

export const searchTravelPlans = async (req, res) => {
  try {
    const { trainNumber, destination, date } = req.query;

    const filter = {
      visibility: "public",
      userId: { $ne: req.user._id },
    };

    if (destination) filter.destination = destination;
    if (trainNumber) filter.trainNumber = trainNumber;

    if (date) {
      const d = new Date(date);
      const next = new Date(d);
      next.setUTCDate(next.getUTCDate() + 1);
      filter.departureDate = { $gte: d, $lt: next };
    }

    const plans = await TravelPlan.find(filter)
      .populate("userId", "name avatar year branch hostel")
      .sort({ departureDate: 1 })
      .limit(100);

    return res.status(200).json({ success: true, plans });
  } catch (error) {
    console.error("searchTravelPlans:", error);
    return res.status(500).json({
      success: false,
      message: "Search failed.",
    });
  }
};
