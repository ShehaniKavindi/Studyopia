import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

// opens the gallery, crops to a square, shrinks, returns a data URI (or null if cancelled)
export async function pickAvatar(): Promise<string | null> {
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 1,
  });
  if (res.canceled) return null;

  const ref = await ImageManipulator.manipulate(res.assets[0].uri)
    .resize({ width: 300 })
    .renderAsync();
  const out = await ref.saveAsync({ format: SaveFormat.JPEG, compress: 0.7, base64: true });
  return `data:image/jpeg;base64,${out.base64}`;
}