const express = require('express');
const sharp = require('sharp');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Route de base pour vérifier que le serveur fonctionne
app.get('/', (req, res) => {
  res.send('Bienvenue sur le convertisseur d\'images AVIF!');
});

// Route pour la conversion d'image
app.post('/convert', async (req, res) => {
  const { imageUrl } = req.body;

  if (!imageUrl) {
    return res.status(400).json({ error: 'Image URL is required.' });
  }

  try {
    // Télécharger l'image depuis l'URL fournie
    const response = await axios({
      url: imageUrl,
      responseType: 'arraybuffer',
    });

    const imageBuffer = Buffer.from(response.data, 'binary');
    const outputFileName = `${uuidv4()}.avif`;
    const outputPath = path.join(__dirname, 'public', outputFileName);

    // Convertir l'image en AVIF
    await sharp(imageBuffer)
      .toFormat('avif')
      .toFile(outputPath);

    // Envoyer le lien de l'image convertie en réponse
    const fileUrl = `${req.protocol}://${req.get('host')}/${outputFileName}`;
    res.json({ url: fileUrl });
  } catch (error) {
    console.error('Error converting image:', error);
    res.status(500).json({ error: 'Failed to convert image' });
  }
});

// Servir les fichiers statiques (pour les images converties)
app.use(express.static(path.join(__dirname, 'public')));

// Démarrer le serveur
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
