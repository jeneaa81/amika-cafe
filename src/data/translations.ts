import type { Language } from '../types';

export const TRANSLATIONS: Record<Language, Record<string, string>> = {
  ro: {
    // Header & Meta
    cafeName: 'Amika Café',
    cafeTagline: 'Specialty Coffee & Foodberry Bakery',
    locationShort: 'Cricova • str. Drumul Viilor 10',
    openStatus: 'Deschis acum • 07:00 – 22:00',
    roleClient: 'Client',
    roleBarista: 'Mod Barista / Proprietar',

    // Hero Promo
    heroTitle: 'Cafea fără așteptare în Cricova',
    heroSubtitle: 'Comandă din mers cu preluare rapidă și primește a 6-a cafea CADOU.',
    badgePartner: 'Partener Oficial Foodberry',
    btnOrderFast: 'Comandă la pachet',
    btnLoyalty: 'Cardul meu de loialitate',

    // Categories & Catalog
    searchPlaceholder: 'Caută cafea, deserturi Foodberry, matcha...',
    addToCart: 'Adaugă',
    customize: 'Personalizează',
    inCart: 'în coș',
    mdl: 'MDL',

    // Product customizer modal
    customizerTitle: 'Personalizează băutura',
    doseChoice: 'Alege mărimea / porția:',
    doseSingle: 'Standard / Solo',
    doseDouble: 'Dublu / Mare',
    milkChoice: 'Alege laptele:',
    syrupChoice: 'Adaugă sirop:',
    temperatureChoice: 'Temperatura:',
    hot: 'Fierbinte 🔥',
    iced: 'Cu gheață 🧊',
    btnConfirmAdd: 'Adaugă în coș • ',

    // Loyalty Card
    loyaltyTitle: 'Card de Loialitate Digital',
    loyaltySubtitle: 'Savurează cafeaua ta preferată la Amika Café. Fiecare a 6-a cafea este din partea casei!',
    loyaltyProgress: 'cafele adunate din 6',
    loyaltyCongrats: 'Felicitări! Ai adunat 6 cafele! Următoarea este GRATUITĂ! 🎉',
    scanHint: 'Arată acest cod QR barmanului la casă pentru a primi ștampila:',
    qrLabel: 'CARDUL TĂU VIP AMIKA',
    simulateBaristaStamp: '👉 Simulare: Barista scanează și pune ștampilă',
    stampAddedToast: 'Ștampilă adăugată cu succes! +1 cafea ☕',
    freeCoffeeCode: 'Cod cafea gratuită:',

    // Cart & Pre-order
    cartTitle: 'Comanda ta la pachet (Click & Collect)',
    emptyCartTitle: 'Coșul tău este gol',
    emptyCartDesc: 'Alege un cappuccino fin sau un desert artizanal de la Foodberry pentru a începe.',
    pickupTimeTitle: 'Când ridici comanda?',
    pickupIn5: 'Peste 5 min (Sunt pe drum)',
    pickupIn10: 'Peste 10 min (Recomandat)',
    pickupIn15: 'Peste 15 min',
    pickupCustom: 'La o oră anume',
    paymentMethodTitle: 'Metodă de achitare:',
    paymentPickup: 'La preluare la casă (Numerar sau Card)',
    paymentMia: 'MIA Plăți Instant (Fără comisioane)',
    customerNameLabel: 'Numele tău:',
    customerPhoneLabel: 'Telefon pentru confirmare:',
    orderNotesLabel: 'Mențiuni speciale (opțional):',
    orderSummary: 'Total spre plată:',
    btnSendOrder: 'Trimite comanda către Barista',
    orderSuccessTitle: 'Comandă trimisă cu succes!',
    orderSuccessDesc: 'Barista de la Amika Cafe a primit comanda ta și începe prepararea.',
    orderNumberLabel: 'Număr comandă:',
    orderPickupEst: 'Gata de ridicare:',

    // Barista & Owner Screen
    baristaScreenTitle: 'Panou Barista & Administrare Amika',
    baristaScreenDesc: 'Ecran pentru gestionarea fluxului de comenzi rapide și promoțiilor instantanee.',
    tabLiveOrders: 'Comenzi în flux',
    tabFlashSale: 'Flash-Vânzare de Seară (Foodberry)',
    noActiveOrders: 'Nu sunt comenzi noi în așteptare.',
    orderStatusNew: 'Nou • În așteptare',
    orderStatusPreparing: 'Se prepară ⏳',
    orderStatusReady: 'Gata de ridicare ✅',
    orderStatusCompleted: 'Eliberat / Încasat 💰',
    btnAccept: 'Începe prepararea',
    btnReady: 'Marchează ca Gata (Notifică clientul)',
    btnComplete: 'Comandă predată',
    
    // Flash Sale Tool (Night clearance for Foodberry)
    flashSaleTitle: 'Lichidare stoc de seară (Deserturi Foodberry)',
    flashSaleDesc: 'Pentru a nu avea pierderi la deserturile artizanale de la Foodberry, trimite o notificare push clienților din Cricova cu o reducere specială!',
    selectDessertLabel: 'Alege desertul rămas pe vitrină:',
    selectDiscountLabel: 'Procentul de reducere:',
    btnBroadcast: '📢 Trimite Notificare Push la 142 de clienți din Cricova',
    broadcastSuccessTitle: 'Mesaj transmis cu succes în Telegram!',
    broadcastSimulationText: 'Clienții Amika Café au primit pe telefon:',
    broadcastSampleText: '⚡ Ofertă de seară la Amika Café (Cricova)! Au mai rămas doar câteva porții de desert proaspăt de la Foodberry cu reducere de 30%. Vino la str. Drumul Viilor 10 până la 22:00 sau rezervă în bot!',

    // Bottom Navigation
    navMenu: 'Meniu',
    navLoyalty: 'Card Loialitate',
    navCart: 'Coș',
    navBarista: 'Barista',
  },
  ru: {
    // Header & Meta
    cafeName: 'Amika Café',
    cafeTagline: 'Specialty Coffee & Foodberry Bakery',
    locationShort: 'Крикова • ул. Друмул Виилор 10',
    openStatus: 'Открыто сейчас • 07:00 – 22:00',
    roleClient: 'Гость',
    roleBarista: 'Режим Бариста / Владелец',

    // Hero Promo
    heroTitle: 'Кофе без очередей в Крикова',
    heroSubtitle: 'Закажи на ходу с быстрой выдачей у стойки и получай каждый 6-й кофе в подарок.',
    badgePartner: 'Официальный партнер Foodberry',
    btnOrderFast: 'Кофе с собой',
    btnLoyalty: 'Карта постоянного гостя',

    // Categories & Catalog
    searchPlaceholder: 'Поиск: флэт уайт, круассан Foodberry, матча...',
    addToCart: 'В корзину',
    customize: 'Настроить',
    inCart: 'в корзине',
    mdl: 'MDL',

    // Product customizer modal
    customizerTitle: 'Настройка напитка',
    doseChoice: 'Выберите порцию / объем:',
    doseSingle: 'Стандарт / Одинарный',
    doseDouble: 'Двойной / Большой',
    milkChoice: 'Выберите молоко:',
    syrupChoice: 'Добавить сироп:',
    temperatureChoice: 'Температура подачи:',
    hot: 'Горячий 🔥',
    iced: 'Со льдом 🧊',
    btnConfirmAdd: 'Добавить в заказ • ',

    // Loyalty Card
    loyaltyTitle: 'Электронная карта лояльности',
    loyaltySubtitle: 'Пейте любимый кофе в Amika Café. Каждая 6-я чашка — за наш счет!',
    loyaltyProgress: 'чашек собрано из 6',
    loyaltyCongrats: 'Поздравляем! Вы собрали 6 чашек! Следующий кофе БЕСПЛАТНО! 🎉',
    scanHint: 'Покажите этот персональный QR-код бариста на кассе при оплате:',
    qrLabel: 'ВАША КАРТА AMIKA VIP',
    simulateBaristaStamp: '👉 Демо: Бариста сканирует и ставит штамп',
    stampAddedToast: 'Штамп успешно начислен! +1 кофе в копилку ☕',
    freeCoffeeCode: 'Промокод на бесплатный кофе:',

    // Cart & Pre-order
    cartTitle: 'Предзаказ с собой (Click & Collect)',
    emptyCartTitle: 'В корзине пока пусто',
    emptyCartDesc: 'Выберите ароматный кофе или свежий крафтовый десерт Foodberry из меню.',
    pickupTimeTitle: 'Когда заберете заказ?',
    pickupIn5: 'Через 5 минут (Уже иду)',
    pickupIn10: 'Через 10 минут (Рекомендуем)',
    pickupIn15: 'Через 15 минут',
    pickupCustom: 'Ко времени',
    paymentMethodTitle: 'Способ оплаты:',
    paymentPickup: 'При получении на кассе (Наличные или Карта)',
    paymentMia: 'MIA Мгновенные платежи (Без комиссии)',
    customerNameLabel: 'Ваше имя:',
    customerPhoneLabel: 'Телефон для связи:',
    orderNotesLabel: 'Пожелания к заказу (необязательно):',
    orderSummary: 'Итого к оплате:',
    btnSendOrder: 'Отправить заказ бариста',
    orderSuccessTitle: 'Заказ успешно отправлен!',
    orderSuccessDesc: 'Бариста в Amika Cafe уже принял заказ и начинает готовить напитки.',
    orderNumberLabel: 'Номер заказа:',
    orderPickupEst: 'Ожидаемое время выдачи:',

    // Barista & Owner Screen
    baristaScreenTitle: 'Панель Бариста и Управления Amika',
    baristaScreenDesc: 'Экран для мгновенного приема предзаказов и вечерней ликвидации скоропортящихся десертов.',
    tabLiveOrders: 'Входящие заказы',
    tabFlashSale: 'Flash-распродажа (Десерты Foodberry)',
    noActiveOrders: 'Новых заказов пока нет.',
    orderStatusNew: 'Новый • Ожидает',
    orderStatusPreparing: 'Готовится ⏳',
    orderStatusReady: 'Готов к выдаче ✅',
    orderStatusCompleted: 'Выдан / Оплачен 💰',
    btnAccept: 'Начать приготовление',
    btnReady: 'Готов (Уведомить клиента)',
    btnComplete: 'Заказ выдан',
    
    // Flash Sale Tool (Night clearance for Foodberry)
    flashSaleTitle: 'Вечерняя распродажа десертов Foodberry',
    flashSaleDesc: 'Чтобы не списывать в убыток свежие десерты Foodberry в конце смены, отправьте мгновенную скидку в Telegram постоянным гостям из Крикова!',
    selectDessertLabel: 'Выберите десерт на витрине:',
    selectDiscountLabel: 'Размер скидки:',
    btnBroadcast: '📢 Отправить Push-уведомление 142 подписчикам в Крикова',
    broadcastSuccessTitle: 'Уведомление успешно разослано в Telegram!',
    broadcastSimulationText: 'Что получили подписчики Amika Café на телефоны:',
    broadcastSampleText: '⚡ Вечерняя акция в Amika Café (Крикова)! На витрине осталось несколько свежих десертов Foodberry со скидкой 30%. Заходите на str. Drumul Viilor 10 до 22:00 или бронируйте прямо в боте!',

    // Bottom Navigation
    navMenu: 'Меню',
    navLoyalty: 'Штамп-карта',
    navCart: 'Заказ с собой',
    navBarista: 'Бариста',
  },
};
