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
    console.log(`Fetching image from URL: ${imageUrl}`);
    const response = await axios({
      url: imageUrl,
      responseType: 'arraybuffer',
    });

    const imageBuffer = Buffer.from(response.data, 'binary');
    console.log('Converting image to AVIF format...');

    // Utilisation d'un nom de fichier unique et du dossier temporaire
    const outputFileName = `${uuidv4()}.avif`;
    const outputPath = path.join('/tmp', outputFileName); // Utilisation du dossier temporaire /tmp

    await sharp(imageBuffer)
      .toFormat('avif')
      .toFile(outputPath);

    console.log(`Conversion successful. File saved to ${outputPath}`);

    // Lecture du fichier converti et envoi de son contenu en réponse
    const convertedImage = fs.readFileSync(outputPath);
    res.setHeader('Content-Type', 'image/avif');
    res.send(convertedImage);

    // Nettoyage du fichier temporaire après l'envoi
    fs.unlinkSync(outputPath);
  } catch (error) {
    console.error('Sharp conversion error:', error);
    res.status(500).json({ error: 'Failed to convert image' });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
