import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, '..');
const sourceDir = path.join(projectRoot, 'node_modules', '@mediapipe', 'tasks-vision', 'wasm');
const targetDir = path.join(projectRoot, 'public', 'wasm');

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

if (fs.existsSync(sourceDir)) {
  const files = fs.readdirSync(sourceDir);
  files.forEach((file) => {
    const srcFile = path.join(sourceDir, file);
    const destFile = path.join(targetDir, file);
    fs.copyFileSync(srcFile, destFile);
    console.log(`Copied ${file} -> public/wasm/`);
  });
  console.log('✅ MediaPipe WASM assets successfully copied to public/wasm!');
} else {
  console.warn('⚠️ Warning: @mediapipe/tasks-vision/wasm directory not found in node_modules.');
}
