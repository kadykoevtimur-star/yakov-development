# Yakov Development — production-ready сайт

Премиальный многоязычный сайт для **Yakov Development** (владелец Yakov Shkavron). Дизайн интерьеров, гипсокартонные работы, крупные объекты.

## Что внутри

- **Главная** (`index.html`): hero, о компании, услуги, **процесс работы (4 этапа)**, галерея, форма заказа
- **Админ-панель** (`admin.html`): загрузка фото, видео, просмотр заявок. Пароль задаётся как SHA-256 хеш в `admin.js` (cleartext в репо не хранится). Это клиентский шлюз, не security-boundary — для реального CMS нужен бэкенд.
- **3 языка**: עברית / Русский / English (с RTL для иврита)
- **Реальная отправка заявок на email** (через FormSubmit)
- **Плавающая WhatsApp-кнопка** прямо на телефон Якова
- **SEO**: Open Graph, Twitter Cards, JSON-LD (LocalBusiness/GeneralContractor schema)
- **Готовый деплой** на Netlify (есть `netlify.toml`, `robots.txt`, `sitemap.xml`)

---

## 🚀 Деплой за 60 секунд (Netlify Drop)

1. Открой **https://app.netlify.com/drop**
2. Перетащи всю папку `yakov-development` в окно
3. Получишь публичный URL вида `https://something-random.netlify.app`

После этого Netlify автоматически:
- Выдаст HTTPS сертификат
- Применит заголовки безопасности из `netlify.toml`
- Будет кешировать статику

### Своё доменное имя

В Netlify Dashboard → Domain settings → Add custom domain.

---

## 📨 Активация формы заказа (FormSubmit)

Заявки настроены на `yakovdevelopment@gmail.com`. **После первой отправки** заявки:

1. На почту придёт письмо от FormSubmit с просьбой подтвердить
2. Кликаешь ссылку в письме → активация
3. После этого все заявки приходят сразу на почту

### Сменить email для заявок

В `script.js` найди константу:
```js
const FORMSUBMIT_EMAIL = 'yakovdevelopment@gmail.com';
```
Замени на нужный email.

### Дублировать заявки на несколько почт

```js
const FORMSUBMIT_EMAIL = 'first@email.com';
// затем добавь в script.js второй fetch на другой email
```

---

## 📱 WhatsApp кнопка

Сейчас ведёт на номер `+972 53-713-6301` (первый телефон Якова).
Сменить: в `index.html` поиск `wa.me/972537136301`.

---

## 🗂️ Структура файлов

```
yakov-development/
├── index.html           Главная (с SEO, JSON-LD, WhatsApp)
├── admin.html           Админ-панель
├── styles.css           Стили
├── admin.css            Стили админки
├── i18n.js              Переводы RU/EN/HE
├── script.js            Логика + отправка на email
├── admin.js             Логика админки
├── logo.svg             Векторный логотип
├── logo.png             Растровый логотип (для OG-превью и фавикона)
├── netlify.toml         Конфиг деплоя
├── robots.txt           SEO роботы (запрещает /admin.html)
├── sitemap.xml          SEO карта сайта
└── README.md            Это
```

---

## 🛠️ Локальный запуск

```bash
cd yakov-development
python -m http.server 8765
# открой http://localhost:8765/
```

---

## ⚙️ Что точно нужно сделать после деплоя

1. **Подтвердить email в FormSubmit** (письмо после первой заявки)
2. **Сменить URL в SEO-тегах** в `index.html`: поиск `yakov-development.netlify.app` → заменить на свой реальный домен
3. **Загрузить реальные фото объектов** через админ-панель
4. **Иврит** — дать носителю на вычитку

---

## 📞 Контакты в сайте

- **Yakov Shkavron** — владелец
- **+972 53-713-6301** (основной, привязан к WhatsApp)
- **+972 52-482-1214** (второй)

Меняются в `index.html` (контактная секция + футер) и `script.js` (WhatsApp ссылка).

---

## 🎨 Кастомизация цвета акцента

В `styles.css` блок `:root`:
```css
--accent: #c9a961;       /* основной акцент (золото) */
--accent-2: #e8c878;     /* светлый акцент */
```
