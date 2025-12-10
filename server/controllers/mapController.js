const { MapItem, Tree, Plant } = require('../models/MapItem');

exports.getItemsInViewport = async (req, res) => {
  try {
    const { neLat, neLng, swLat, swLng } = req.query;

    if (!neLat || !neLng || !swLat || !swLng) {
      return res.status(400).json({ success: false, error: 'Missing coordinates' });
    }

    const items = await MapItem.find({
      location: {
        $geoWithin: {
          $box: [
            [parseFloat(swLng), parseFloat(swLat)], // bottom-left (SW)
            [parseFloat(neLng), parseFloat(neLat)]  // top-right (NE)
          ]
        }
      }
    });

    res.status(200).json({ success: true, count: items.length, data: items });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};


exports.addMapItem = async (req, res) => {
  try {
    const { kind, name, latitude, longitude, ...details } = req.body;

    const location = {
      type: 'Point',
      coordinates: [longitude, latitude] 
    };

    let newItem;

    
    if (kind === 'Tree') {
      newItem = await Tree.create({ name, location, ...details });
    } else if (kind === 'Plant') {
      newItem = await Plant.create({ name, location, ...details });
    } else {
      return res.status(400).json({ success: false, error: 'Invalid Item Kind' });
    }

    res.status(201).json({ success: true, data: newItem });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};