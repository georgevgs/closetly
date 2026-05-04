import AsyncStorage from "@react-native-async-storage/async-storage";

export const cacheStorage = {
  getString: (key: string) => AsyncStorage.getItem(key),
  setString: (key: string, value: string) => AsyncStorage.setItem(key, value),
  remove: (key: string) => AsyncStorage.removeItem(key),
  clearAll: () => AsyncStorage.clear(),
};

export const zustandStorage = {
  getItem: (name: string) => AsyncStorage.getItem(name),
  setItem: (name: string, value: string) => AsyncStorage.setItem(name, value),
  removeItem: (name: string) => AsyncStorage.removeItem(name),
};
