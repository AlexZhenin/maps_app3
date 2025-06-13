// schema.ts
import * as SQLite from 'expo-sqlite';

const DATABASE_NAME = 'markers.db';
const DATABASE_VERSION = 1;

let isInitialized = false;
const db = SQLite.openDatabaseAsync(DATABASE_NAME);

export const initDatabase = async () => {
    if (isInitialized) return;
    
    const db_ = await db;
    try {
        // Проверяем текущую версию пользовательской базы данных
        let userVersion = 0;
        const versionResult = await db_.getFirstAsync<{user_version: number}>('PRAGMA user_version;');
        if (versionResult) {
            userVersion = versionResult.user_version;
        }

        // Если версия не совпадает, выполняем миграции
        if (userVersion !== DATABASE_VERSION) {
            await db_.execAsync(`
                PRAGMA foreign_keys = ON;
                
                CREATE TABLE IF NOT EXISTS markers (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    latitude REAL NOT NULL,
                    longitude REAL NOT NULL,
                    description TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                );
                
                CREATE TABLE IF NOT EXISTS marker_images (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    marker_id INTEGER NOT NULL,
                    uri TEXT NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (marker_id) REFERENCES markers (id) ON DELETE CASCADE
                );
                
                PRAGMA user_version = ${DATABASE_VERSION};
            `);
            isInitialized = true;
            console.log(`База данных обновлена до версии ${DATABASE_VERSION}`);
        }
    } catch (error) {
        console.error('Ошибка инициализации базы данных:', error);
        throw error;
    }
};

export default db;