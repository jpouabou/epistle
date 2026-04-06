/**
 * Runs before any other app modules. Keeps URL polyfill off `auto` (no Platform at load time).
 * @format
 */

import 'react-native-gesture-handler';
import { setupURLPolyfill } from 'react-native-url-polyfill';

setupURLPolyfill();
