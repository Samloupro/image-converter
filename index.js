const express = require('express');
const sharp = require('sharp');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(express.json());

app.post('/convert', async (req, res) => {
  const { imageUrl } = req.body;
  
  if (!imageUrl) {
    return res.status(400).json({ error: 'Image URL is required.' });
  }

  try {
    const response = await axios({
      url: imageUrl,
      responseType: 'arraybuffer',
    });
    
    const imageBuffer = Buffer.from(response.data, 'binary');
    const outputFileName = `${uuidv4()}.avif`;
    const outputPath = path.join(__dirname, 'public', outputFileName);

    await sharp(imageBuffer)
      .toFormat('avif')
      .toFile(outputPath);

    const baseUrl = req.protocol + '://' + req.get('host');
    const convertedImageUrl = `${baseUrl}/public/${outputFileName}`;

    res.json({ avifUrl: convertedImageUrl });
  } catch (error) {
    console.error('Error converting image:', error);
    res.status(500).json({ error: 'Failed to convert image' });
  }
});

app.use('/public', express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
