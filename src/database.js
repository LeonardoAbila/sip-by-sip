import { createBackup, validateBackup } from './profileBackup.js';

// sql.js runs SQLite in memory. IndexedDB stores the exported database file.
// Each write loads the latest file inside one IndexedDB transaction, so writes
// from separate tabs cannot replace unrelated profiles or progress.
const DATABASE_NAME = 'sip-by-sip-sqlite';
const FILE_KEY = 'database';
const PROFILES_KEY = 'aguaPrototypeProfiles';
const PROGRESS_KEY = 'aguaApp';

function query(database, sql, parameters = []) {
  const statement = database.prepare(sql);
  try {
    statement.bind(parameters);
    const rows = [];
    while (statement.step()) rows.push(statement.getAsObject());
    return rows;
  } finally {
    statement.free();
  }
}

function migrate(database, legacyStorage) {
  database.run(`
    CREATE TABLE IF NOT EXISTS profiles (id TEXT PRIMARY KEY, username TEXT NOT NULL, data TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS progress (storage_key TEXT PRIMARY KEY, data TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL);
  `);
  if (query(database, "SELECT value FROM metadata WHERE key = 'localStorage-migrated'").length) return;

  // Keep the original entries intact as a backup. Migration and its marker are
  // persisted together; a failed write can safely be retried on the next load.
  const rawProfiles = legacyStorage.getItem(PROFILES_KEY);
  let profiles;
  try { profiles = JSON.parse(rawProfiles); } catch { profiles = []; }
  if (Array.isArray(profiles)) {
    for (const profile of profiles) {
      if (profile && typeof profile.id === 'string' && typeof profile.username === 'string') {
        database.run('INSERT OR IGNORE INTO profiles VALUES (?, ?, ?)',
          [profile.id, profile.username.toLowerCase(), JSON.stringify(profile)]);
      }
    }
  }
  for (let index = 0; index < legacyStorage.length; index += 1) {
    const key = legacyStorage.key(index);
    if (key === PROGRESS_KEY || key?.startsWith(`${PROGRESS_KEY}:perfil:`)) {
      const data = legacyStorage.getItem(key);
      let saved;
      try { saved = JSON.parse(data); } catch {
        // Invalid legacy JSON is left untouched; normal loading uses defaults.
        continue;
      }
      if (saved && typeof saved === 'object' && !Array.isArray(saved)) {
        database.run('INSERT INTO progress VALUES (?, ?) ON CONFLICT(storage_key) DO NOTHING', [key, data]);
      }
    }
  }
  database.run("INSERT INTO metadata VALUES ('localStorage-migrated', '1')");
}

export async function createDatabase({ SQL, indexedDB, legacyStorage, name = DATABASE_NAME }) {
  const connection = await new Promise((resolve, reject) => {
    const request = indexedDB.open(name, 1);
    request.onupgradeneeded = () => request.result.createObjectStore('files');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('Feche as outras abas do app e tente novamente.'));
  });
  connection.onversionchange = () => connection.close();
  let database;
  let pending = Promise.resolve();
  const failedProgress = new Set();

  function transaction(change, inspect) {
    return new Promise((resolve, reject) => {
      let next;
      let result;
      let failure;
      const transaction = connection.transaction('files', change ? 'readwrite' : 'readonly');
      const files = transaction.objectStore('files');
      const request = files.get(FILE_KEY);
      request.onsuccess = () => {
        try {
          // Never replace a corrupt persisted file with an empty database.
          next = new SQL.Database(request.result);
          if (inspect) result = inspect(next);
          if (change) {
            result = change(next);
            files.put(next.export(), FILE_KEY);
          }
        } catch (error) {
          failure = error;
          transaction.abort();
        }
      };
      transaction.oncomplete = () => {
        database?.close();
        database = next;
        resolve(result);
      };
      transaction.onabort = () => {
        next?.close();
        reject(failure || transaction.error || new Error('Não foi possível salvar os dados.'));
      };
      transaction.onerror = () => { failure ||= transaction.error; };
    });
  }

  // Serialize local operations as well, so reads and writes update the cache in
  // order. A failed operation does not prevent a later save from being retried.
  function enqueue(change, inspect) {
    const operation = pending.then(() => transaction(change, inspect));
    pending = operation.catch(() => {});
    return operation;
  }

  try {
    await enqueue(database => migrate(database, legacyStorage));
  } catch (error) {
    connection.close();
    throw error;
  }

  return {
    readProfiles() {
      return query(database, 'SELECT data FROM profiles ORDER BY rowid').map(row => JSON.parse(row.data));
    },
    readProgress(key) {
      return query(database, 'SELECT data FROM progress WHERE storage_key = ?', [key])[0]?.data ?? null;
    },
    refresh() { return enqueue(); },
    saveProfile(profile, { create = false } = {}) {
      return enqueue(database => {
        if (create) {
          if (query(database, 'SELECT id FROM profiles WHERE username = ?', [profile.username.toLowerCase()]).length) {
            throw new Error('Este usuário já existe. Escolha outro nome ou entre na sua conta.');
          }
          database.run('INSERT INTO profiles VALUES (?, ?, ?)',
            [profile.id, profile.username.toLowerCase(), JSON.stringify(profile)]);
        } else {
          if (!query(database, 'SELECT id FROM profiles WHERE id = ?', [profile.id]).length) {
            throw new Error('Perfil não encontrado. Entre novamente.');
          }
          database.run('UPDATE profiles SET username = ?, data = ? WHERE id = ?',
            [profile.username.toLowerCase(), JSON.stringify(profile), profile.id]);
        }
      });
    },
    saveProgress(key, state) {
      // Capture this version before the asynchronous transaction begins.
      const data = JSON.stringify(state);
      return enqueue(database => {
        database.run('INSERT INTO progress VALUES (?, ?) ON CONFLICT(storage_key) DO UPDATE SET data = excluded.data', [key, data]);
      }).then(result => { failedProgress.delete(key); return result; }, error => {
        failedProgress.add(key);
        throw error;
      });
    },
    exportProfile(id) {
      return enqueue(null, database => {
        const key = `${PROGRESS_KEY}:perfil:${id}`;
        if (failedProgress.has(key)) throw new Error('Unsaved progress');
        const profile = query(database, 'SELECT data FROM profiles WHERE id = ?', [id])[0];
        const progress = query(database, 'SELECT data FROM progress WHERE storage_key = ?', [key])[0];
        if (!profile || !progress) throw new Error('Missing profile or progress');
        return createBackup(JSON.parse(profile.data), JSON.parse(progress.data));
      });
    },
    restoreProfile(id, input) {
      // Revalidate at the persistence boundary and snapshot before enqueueing.
      let backup;
      try { backup = validateBackup(input); } catch (error) { return Promise.reject(error); }
      return enqueue(database => {
        const row = query(database, 'SELECT data FROM profiles WHERE id = ?', [id])[0];
        if (!row) throw new Error('Missing destination profile');
        const destination = JSON.parse(row.data);
        const { age, weight, goalLiters, onboardingComplete } = backup.profile;
        const profile = { ...destination, age, weight, goalLiters, onboardingComplete };
        database.run('UPDATE profiles SET data = ? WHERE id = ?', [JSON.stringify(profile), id]);
        database.run('INSERT INTO progress VALUES (?, ?) ON CONFLICT(storage_key) DO UPDATE SET data = excluded.data',
          [`${PROGRESS_KEY}:perfil:${id}`, JSON.stringify(backup.progress)]);
        return profile;
      }).then(profile => { failedProgress.delete(`${PROGRESS_KEY}:perfil:${id}`); return profile; });
    },
    async close() {
      await pending;
      database.close();
      connection.close();
    },
  };
}

let activeDatabase;

export async function initializeDatabase(options) {
  const next = await createDatabase(options);
  await activeDatabase?.close();
  activeDatabase = next;
}

function ready() {
  if (!activeDatabase) throw new Error('O armazenamento ainda não está pronto.');
  return activeDatabase;
}

export const readStoredProfiles = () => ready().readProfiles();
export const readProgress = key => ready().readProgress(key);
export const saveProfile = (profile, options) => ready().saveProfile(profile, options);
export const saveProgress = (key, state) => ready().saveProgress(key, state);
export const refreshDatabase = () => ready().refresh();

export const exportProfile = id => ready().exportProfile(id);
export const restoreProfile = (id, backup) => ready().restoreProfile(id, backup);
