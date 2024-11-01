const express = require('express');
const sharp = require('sharp');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(express.json());

app.post('/', async (req, res) => {
    const { imageUrl } = req.body;

    if (!imageUrl) {
        return res.status(400).json({ error: 'Image URL is required.' });
    }

    try {
        // Téléchargez l'image à partir de l'URL fournie
        const response = await axios({
            url: imageUrl,
            responseType: 'arraybuffer',
        });

        const imageBuffer = Buffer.from(response.data, 'binary');
        const outputFileName = `${uuidv4()}.avif`;
        const outputPath = path.join(__dirname, 'public', outputFileName);

        // Convertir en format AVIF
        await sharp(imageBuffer)
            .toFormat('avif')
            .toFile(outputPath);

        // Retourne le chemin de l'image convertie
        const imageUrl = `${req.protocol}://${req.get('host')}/${outputFileName}`;
        res.json({ imageUrl });
    } catch (error) {
        console.error('Error converting image:', error);
        res.status(500).json({ error: 'Failed to convert image' });
    }
});

// Servir les fichiers statiques depuis le dossier "public"
app.use(express.static(path.join(__dirname, 'public')));

// Démarrer le serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
