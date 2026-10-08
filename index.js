import 'react-native-gesture-handler';
import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
// appName resolves to "StreamZ" from app.json and must match
// MainActivity.getMainComponentName() in android/app/src/main/java/com/streamz/MainActivity.kt

AppRegistry.registerComponent(appName, () => App);
