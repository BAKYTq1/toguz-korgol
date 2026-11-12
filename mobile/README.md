# Тогуз Коргоол — мобильное приложение

Приложение на Expo (React Native) для Android и iOS.

Правила игры, ИИ, переводы и онлайн-протокол берутся из веб-версии (`../src`), поэтому игроки
с телефона и с сайта играют по одним правилам и могут играть друг с другом.

## Запуск на своём телефоне

1. Установите Node.js 22.13 или новее.
2. Установите на телефон приложение **Expo Go** (Google Play / App Store).
3. В этой папке:
   ```
   npm install
   npx expo start
   ```
4. Отсканируйте QR-код из терминала: на Android — в Expo Go, на iPhone — камерой.
   Телефон и компьютер должны быть в одной сети Wi-Fi (или запустите `npx expo start --tunnel`).

## Проверки

```
npx tsc --noEmit   # типы
npx expo lint      # линтер
npx expo-doctor    # зависимости и конфигурация
```

## APK, который можно просто скачать и установить

```
npx eas-cli@latest login                                  # бесплатный аккаунт expo.dev
npx eas-cli@latest build -p android --profile preview     # профиль из eas.json, собирает .apk
```

Сборка идёт в облаке 10–20 минут, в конце CLI даёт ссылку на `.apk`. Ключ подписи Expo создаёт и хранит сам;
его же нужно использовать для всех следующих версий, иначе обновление поверх старой не установится.

Перед новой версией увеличьте в `app.json` поле `version` (например `1.0.1`) и число `android.versionCode`
(1 → 2 → 3…): Android ставит обновление поверх старой версии, только если это число стало больше.

## Сборка для Google Play и App Store

Сборка идёт в облаке Expo, Android Studio и Xcode не нужны:

```
npx eas-cli@latest login
npx eas-cli@latest build:configure
npx eas-cli@latest build --platform android   # .aab для Google Play
npx eas-cli@latest build --platform ios       # нужен аккаунт Apple Developer ($99/год)
```

Публикация: `npx eas-cli@latest submit --platform android` (нужен аккаунт Google Play Console, $25 один раз).

## Как устроено

- `src/app/` — экраны (Expo Router): `_layout.tsx` (шрифты, заставка), `index.tsx` (игра).
- `src/components/` — доска (SVG), карточки счёта, нижняя панель, окна.
- `src/game/useGameController.ts` — ходы, анимация посева, ИИ, очередь ходов соперника, подтверждение хода.
- `src/lib/firebase.ts` — Firebase для React Native (вход сохраняется между запусками).
- `src/shared.ts` — всё, что берётся из веб-версии.
- `metro.config.js` — подключает `../src` и подставляет `src/lib/firebase.ts` вместо веб-версии.

Если база Firestore перенесена в другой регион с отдельным ID, задайте его так же, как на сайте:
`EXPO_PUBLIC_FIRESTORE_DATABASE=<id>` в файле `.env`.
