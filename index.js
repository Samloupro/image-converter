const express = require('express');
const sharp = require('sharp');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(express.json());

app.post('/convert', async (req, res) => {
  const { imageUrl } = req.body;

  if (!imageUrl) {
    return res.status(400).json({ error: 'Image URL is required.' });
  }

  try {
    console.log('Fetching image from URL:', imageUrl);
    const response = await axios({
      url: imageUrl,
      responseType: 'arraybuffer',
    });

    const imageBuffer = Buffer.from(response.data, 'binary');
    const outputFileName = `${uuidv4()}.avif`;
    const outputPath = path.join(__dirname, 'public', outputFileName);

    try {
      console.log('Converting image to AVIF format...');
      await sharp(imageBuffer)
        .toFormat('avif')
        .toFile(outputPath);
      console.log('Image conversion successful:', outputFileName);
    } catch (sharpError) {
      console.error('Sharp conversion error:', sharpError);
      return res.status(500).json({ error: 'Failed to process the image' });
    }

    res.set('Content-Type', 'image/avif');
    res.sendFile(outputPath, err => {
      if (err) {
        console.error('Error sending the file:', err);
        res.status(500).json({ error: 'Failed to send converted image' });
      } else {
        fs.unlink(outputPath, unlinkErr => {
          if (unlinkErr) {
            console.error('Error deleting the file:', unlinkErr);
          }
        });
      }
    });
  } catch (error) {
    console.error('Error converting image:', error);
    res.status(500).json({ error: 'Failed to convert image' });
  }
});

app.use(express.static('public'));

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
