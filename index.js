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
    // Télécharge l'image depuis l'URL
    const response = await axios({
      url: imageUrl,
      responseType: 'arraybuffer',
    });

    const imageBuffer = Buffer.from(response.data, 'binary');
    const outputFileName = `${uuidv4()}.avif`;
    const outputPath = path.join(__dirname, 'public', outputFileName);

    // Convertit l'image en AVIF
    await sharp(imageBuffer)
      .toFormat('avif')
      .toFile(outputPath);

    // Envoie le fichier AVIF en tant que réponse
    res.set('Content-Type', 'image/avif');
    res.sendFile(outputPath, err => {
      if (err) {
        console.error('Error sending the file:', err);
        res.status(500).json({ error: 'Failed to send converted image' });
      } else {
        // Supprime le fichier après envoi
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

// Serve static files from the public directory
app.use(express.static('public'));

// Démarre le serveur sur le port spécifié par Vercel ou un port par défaut
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
