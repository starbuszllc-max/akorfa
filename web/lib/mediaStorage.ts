const DB_NAME = 'akorfa-media-studio';
const DB_VERSION = 1;
const STORE_NAME = 'media-files';

interface StoredMediaFile {
  id: string;
  name: string;
  type: 'video' | 'audio' | 'image';
  size: number;
  duration?: number;
  data: ArrayBuffer;
  mimeType: string;
  createdAt: string;
}

let db: IDBDatabase | null = null;

export async function openDatabase(): Promise<IDBDatabase> {
  if (db) return db;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);

    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

export async function saveMediaFile(file: {
  id: string;
  file: File;
  type: 'video' | 'audio' | 'image';
  duration?: number;
}): Promise<void> {
  const database = await openDatabase();
  
  const arrayBuffer = await file.file.arrayBuffer();
  
  const storedFile: StoredMediaFile = {
    id: file.id,
    name: file.file.name,
    type: file.type,
    size: file.file.size,
    duration: file.duration,
    data: arrayBuffer,
    mimeType: file.file.type,
    createdAt: new Date().toISOString()
  };

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(storedFile);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function loadMediaFiles(): Promise<Array<{
  id: string;
  name: string;
  type: 'video' | 'audio' | 'image';
  size: number;
  duration?: number;
  url: string;
  file: File;
  createdAt: Date;
}>> {
  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      const storedFiles: StoredMediaFile[] = request.result;
      const mediaFiles = storedFiles.map(stored => {
        const blob = new Blob([stored.data], { type: stored.mimeType });
        const file = new File([blob], stored.name, { type: stored.mimeType });
        return {
          id: stored.id,
          name: stored.name,
          type: stored.type,
          size: stored.size,
          duration: stored.duration,
          url: URL.createObjectURL(blob),
          file,
          createdAt: new Date(stored.createdAt)
        };
      });
      resolve(mediaFiles);
    };

    request.onerror = () => reject(request.error);
  });
}

export async function deleteMediaFile(id: string): Promise<void> {
  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function clearAllMedia(): Promise<void> {
  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getStorageUsage(): Promise<{ used: number; available: number }> {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    return {
      used: estimate.usage || 0,
      available: estimate.quota || 0
    };
  }
  return { used: 0, available: 0 };
}
