import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  try {
    const filePath = path.join(process.cwd(), 'server', 'data.json');
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    const products = data.products || [];

    res.status(200).json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err.message
    });
  }
} 