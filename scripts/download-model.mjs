import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, '..');
const targetDir = path.join(projectRoot, 'public', 'wasm');
const modelPath = path.join(targetDir, 'hand_landmarker.task');

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

const modelUrl = 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';

console.log(`Downloading MediaPipe hand_landmarker.task model...`);
const file = fs.createWriteStream(modelPath);

https.get(modelUrl, (response) => {
  if (response.statusCode === 200) {
    response.pipe(file);
    file.on('finish', () => {
      file.close();
      console.log('✅ hand_landmarker.task downloaded successfully to public/wasm!');
    });
  } else {
    console.warn(`Failed to download model, status code: ${response.statusCode}`);
  }
}).on('error', (err) => {
  console.warn('Warning: Could not download model asset locally:', err.message);
});
