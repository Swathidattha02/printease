const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');
const pricing = require('../config/pricing');

exports.handleFileUpload = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const filePath = req.file.path;
    const buffer = await fs.promises.readFile(filePath);
    const data = await pdf(buffer);
    const totalPages = data.numpages || 0;

    const { printType = 'BW', copies = 1 } = req.body;
    const copiesNum = parseInt(copies, 10) || 1;
    const rate = (String(printType).toLowerCase() === 'color') ? pricing.PRICE_PER_PAGE_COLOR : pricing.PRICE_PER_PAGE_BW;
    const totalAmount = totalPages * rate * copiesNum;

    const fileURL = `${req.protocol}://${req.get('host')}/uploads/${path.basename(filePath)}`;

    return res.json({ fileURL, totalPages, totalAmount });
  } catch (err) {
    next(err);
  }
};
