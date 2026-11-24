import {fileURLToPath} from 'node:url';
import {updateDeskDeviceArt} from './desk-device-art.mjs';

// The manifest retains gameplay footprints while the painter supplies the visual dimensions.
const source=fileURLToPath(new URL('../source/',import.meta.url));
await updateDeskDeviceArt(source);
