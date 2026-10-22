import type { SolveRecord } from "./types";

const DB_NAME = "cube-arena";
const STORE_NAME = "solves";
const DB_VERSION = 1;

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;

      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, {
          keyPath: "id",
        });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error ?? new Error("Failed to open solve database."));
    };
  });
}

export async function getAllSolves(userId: string): Promise<SolveRecord[]> {
  const database = await openDatabase();

  try {
    return await new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, "readonly");
      const request = transaction.objectStore(STORE_NAME).getAll();

      request.onsuccess = () => {
        const solves = (request.result as SolveRecord[]).filter(
          (solve) => solve.userId === userId,
        );

        solves.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );

        resolve(solves);
      };

      request.onerror = () => {
        reject(request.error ?? new Error("Failed to load solve history."));
      };
    });
  } finally {
    database.close();
  }
}

export async function saveSolve(solve: SolveRecord): Promise<void> {
  const database = await openDatabase();

  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, "readwrite");

      transaction.objectStore(STORE_NAME).put(solve);

      transaction.oncomplete = () => resolve();

      transaction.onerror = () => {
        reject(transaction.error ?? new Error("Failed to save solve."));
      };

      transaction.onabort = () => {
        reject(transaction.error ?? new Error("Saving solve was aborted."));
      };
    });
  } finally {
    database.close();
  }
}
