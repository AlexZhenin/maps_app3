# Автор: Женин Алексей, ФИТ-2-24 НМ
## Инструкции по установке
- Приложение сделано на основе react-native и expo. Для установки следовать инструкциям из официальной документации
- Приложение на SDK 52

## Реализация
- Первичная инициализация происходит в app/index.tsx
- Загрузка карты и маркеров, обработка нажатий на карте, текущего местоположения и уведомлений в components/Map.tsx
- Обработка списка изображений при добавлении изображений для маркера в components/ImageList.tsx
- Обработка экрана информации о конкретном маркере в app/marker/[id].tsx
- Инициализация и контекст базы данных в contexts/DatabaseContext.tsx
- Схема базы данных в database/schema.ts
```
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
```
- Операции с БД в database/operations.ts
- Типы описаны в types.ts

## Инструкция по тестированию
- Запуск приложения через npx expo start
- Нажать на кнопку в правом нижнем углу для центрирования карты на текущем местоположении
- Получить уведомления, если в зоне имеются уведомления
- Нажать на кнопку симуляции (выше кнопки центрирования) для симуляции движения

## Про тестирование
- При приближении к нескольким маркерам сразу, выводится одно уведомление со списком всех маркеров в радиусе
- Если о некоторых маркерах уже было уведомление в прошлую минуту (меняется в notifications.ts), то они не вносятся в список маркеров в уведомлении
- Если в радиусе имеется несколько "посещенных" маркеров и несколько "непосещенных", то в уведомлении выведутся только "непосещенные"
- При повторном приближении (когда маркер выходит из зоны, а потом снова входит) уведомление не срабатывает
- Фоновый режим не работает
- Тестирование при отключении служб геолокации не проводилось
