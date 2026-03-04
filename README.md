# 🗺️ KyivMap

Інтерактивна карта Києва з реальними даними з OpenStreetMap. Одним HTML-файлом, без бекенду, без залежностей для встановлення.

---

## ✨ Можливості

- **Реальні дані** — об'єкти завантажуються з OpenStreetMap через Overpass API
- **20 категорій** — кафе, ресторани, аптеки, музеї, банки, парки та інше
- **Ледаче завантаження** — кожна категорія грузиться лише при кліку, один запит за раз
- **Кешування** — повторний клік по категорії миттєвий (дані в пам'яті)
- **Кластеризація** — маркери групуються при віддаленні
- **Пошук** — фільтрує вже завантажені об'єкти по назві
- **Світла / темна тема** — перемикається кнопкою 🌙 / ☀️
- **Адаптивний дизайн** — працює на desktop, планшеті та мобільному
- **Popup з адресою** — клік по маркеру показує назву та адресу об'єкта
- **Підсвітка при наведенні** — маркер яскравішає, popup відкривається автоматично

---

## 🚀 Запуск

Просто відкрийте `kyiv-map.html` у браузері. Потрібен доступ до інтернету для завантаження даних.

```bash
# або через локальний сервер
npx serve .
python -m http.server 8080
```

> **Примітка:** Відкриття через `file://` працює, але деякі браузери можуть блокувати зовнішні запити. Рекомендується локальний сервер.

---

## 📦 Залежності

Всі підключаються через CDN, нічого встановлювати не потрібно:

| Бібліотека | Версія | Призначення |
|---|---|---|
| [Leaflet.js](https://leafletjs.com) | 1.9.4 | Рендер карти |
| [Leaflet.markercluster](https://github.com/Leaflet/Leaflet.markercluster) | 1.5.3 | Кластеризація маркерів |
| [CartoDB Basemaps](https://carto.com/basemaps/) | — | Тайли карти (темна/світла) |
| [Overpass API](https://overpass-api.de) | — | Дані OpenStreetMap |
| [Google Fonts](https://fonts.google.com) | — | Unbounded, Geologica |

---

## 🗂️ Категорії

| Emoji | Назва | OSM-тег |
|---|---|---|
| ☕ | Кафе / Кав'ярні | `amenity=cafe` |
| 🍽️ | Ресторани | `amenity=restaurant` |
| 🍔 | Фастфуд | `amenity=fast_food` |
| 🍺 | Бари / Паби | `amenity=bar\|pub\|nightclub` |
| 🎬 | Кінотеатри | `amenity=cinema` |
| 🎭 | Театри | `amenity=theatre` |
| 🏛️ | Музеї | `tourism=museum` |
| 🏨 | Готелі | `tourism=hotel\|hostel\|guest_house` |
| 💊 | Аптеки | `amenity=pharmacy` |
| 🏥 | Лікарні / Клініки | `amenity=hospital\|clinic` |
| 🛒 | Супермаркети | `shop=supermarket\|convenience` |
| 💻 | Електроніка | `shop=electronics\|computer\|mobile_phone` |
| 👗 | Одяг / Мода | `shop=clothes` |
| 🏦 | Банки / АТМ | `amenity=bank\|atm` |
| 🏋️ | Спортзали / Фітнес | `leisure=fitness_centre\|sports_centre` |
| ⛽ | АЗС | `amenity=fuel` |
| 🏫 | Школи | `amenity=school` |
| 🎓 | Університети | `amenity=university\|college` |
| ⛪ | Церкви / Храми | `amenity=place_of_worship` |
| 🌳 | Парки | `leisure=park` |

---

## ⚙️ Структура коду

```
kyiv-map.html
│
├── <style>          — CSS з CSS-змінними для темної/світлої теми
│
├── <header>         — логотип, пошук, перемикач теми, кнопка сайдбару (mobile)
│
├── <aside>          — сайдбар з категоріями
│
├── #map-wrap        — контейнер карти + лоадер + empty state
│
└── <script>
    ├── CATS{}       — конфіг категорій (emoji, колір, Overpass-запит)
    ├── fetchCat()   — запит до Overpass API з AbortController
    ├── renderPlaces() — відрисовка маркерів через MarkerClusterGroup
    ├── loadCat()    — оркестратор: завантаження → рендер → стан UI
    ├── applyTheme() — перемикання теми + тайлів + ребілд кластерів
    └── buildSidebar() — генерація кнопок категорій
```

---

## 🌐 Як працює Overpass API

При кліку на категорію надсилається **один** POST-запит:

```
POST https://overpass-api.de/api/interpreter
data=[out:json][timeout:30];(node["amenity"="cafe"](50.213,30.239,50.591,30.825));out center 3000;
```

- `bbox` — bounding box Києва
- `out center 3000` — максимум 3000 об'єктів, повертати центр для way/relation
- `AbortController` — якщо юзер швидко перемикає категорії, попередній запит скасовується

**Ліміти Overpass API (публічний сервер):**
- Не більше ~2-3 запитів на хвилину з одного IP
- Якщо отримали `429` — сервер перевантажений, зачекайте 30-60 секунд
- Якщо `504` — таймаут, спробуйте ще раз

---

## 📱 Адаптивність

| Розмір | Поведінка |
|---|---|
| `> 768px` | Сайдбар завжди видимий зліва |
| `≤ 768px` | Сайдбар прихований, відкривається кнопкою ☰ |
| `≤ 480px` | Пошук і бейдж сховані, карта на весь екран |

---

## 🛠️ Кастомізація

**Змінити місто** — замініть координати центру та bbox:
```javascript
// Центр карти
const map = L.map('map', { center: [50.4501, 30.5234], zoom: 13 });

// Bounding box для Overpass-запитів
const BBOX = '50.213,30.239,50.591,30.825';
```

**Додати нову категорію** — додайте об'єкт у `CATS`:
```javascript
const CATS = {
  // ...
  library: {
    label: "Бібліотеки",
    emoji: "📚",
    color: "#a5f3fc",
    osm: `node["amenity"="library"](bbox);`
  },
};
```

**Знайти потрібний OSM-тег** → [taginfo.openstreetmap.org](https://taginfo.openstreetmap.org)

---

## 📄 Ліцензія

Дані карти © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright), ліцензія ODbL.
