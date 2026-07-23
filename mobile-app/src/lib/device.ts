import AsyncStorage from '@react-native-async-storage/async-storage';

const uuidLike = () =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });

export async function getDeviceId(): Promise<string> {
  const key = 'canteen_device_id';
  let id = await AsyncStorage.getItem(key);
  if (!id) {
    id = uuidLike();
    await AsyncStorage.setItem(key, id);
  }
  return id;
}
