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

    const outputFileName = `${uuidv4()}.avif`;
    const outputPath = path.join('/tmp', outputFileName); // Utilisation de /tmp pour la compatibilité avec Vercel

    // Conversion de l'image avec Sharp
    await sharp(imageBuffer)
      .toFormat('avif')
      .toFile(outputPath);

    console.log(`Conversion réussie. Fichier sauvegardé à ${outputPath}`);

    const convertedImage = fs.readFileSync(outputPath);
    res.setHeader('Content-Type', 'image/avif');
    res.send(convertedImage);

    // Nettoyage du fichier temporaire
    fs.unlinkSync(outputPath);
  } catch (error) {
    console.error('Erreur lors de la conversion avec Sharp:', error);

    // Vérification si l'erreur vient de Sharp ou d'une autre source
    if (error.message.includes('heif')) {
      return res.status(500).json({ error: 'Le format AVIF n\'est pas pris en charge sur ce serveur.' });
    } else if (error.code === 'ENOENT') {
      return res.status(500).json({ error: 'Impossible de lire ou écrire le fichier temporaire.' });
    } else {
      return res.status(500).json({ error: 'Failed to process the image' });
    }
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
