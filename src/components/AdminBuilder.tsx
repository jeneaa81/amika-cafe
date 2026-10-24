import React, { useState, useRef, useEffect } from 'react';
import type { Language, LoyaltyCard } from '../types';
import {
  type TvBoardConfig,
  type TvCoffeeItem,
  type TvDessertItem,
  type TvSlideItem,
  DEFAULT_TV_CONFIG,
  BUILTIN_INSTA_GALLERY,
  loadTvConfig,
  saveTvConfigLocal,
  compressImageFile,
} from '../utils/menuStore';
import { publishTvConfigToCloud } from '../utils/tvSync';
import {
  fetchMenuConfigFromSupabase,
  fetchAllLoyaltyCardsFromSupabase,
  saveLoyaltyCardToSupabase,
} from '../utils/supabaseClient';
import {
  Coffee,
  Cake,
  Image as ImageIcon,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Save,
  Upload,
  Download,
  RotateCcw,
  Sparkles,
  CheckCircle,
  Camera,
  FolderOpen,
  Columns,
  Tv,
  Award,
  AlertCircle,
  Undo2,
  Lock,
  KeyRound,
  LogOut,
  AlertTriangle,
  Cloud,
} from 'lucide-react';

const ADMIN_PASS_STORAGE_KEY = 'amika_admin_password_v1';
const ADMIN_SESSION_UNLOCKED_KEY = 'amika_admin_unlocked_v1';
const DEFAULT_ADMIN_PASSWORD = 'amika';
const MASTER_DEVELOPER_PASSWORD = 'amika#dev2026';

function getStoredAdminPassword(): string {
  try {
    return localStorage.getItem(ADMIN_PASS_STORAGE_KEY) || DEFAULT_ADMIN_PASSWORD;
  } catch {
    return DEFAULT_ADMIN_PASSWORD;
  }
}

interface AdminBuilderProps {
  language: Language;
  onExitAdminMode?: () => void;
  onOpenTvMode?: () => void;
}

const ADMIN_I18N = {
  ro: {
    // Login Gate
    loginBadge: 'Acces Protejat • Amika Café',
    loginTitle: 'Cabinetul Administratorului',
    loginSubtitle:
      'Introduceți parola pentru a edita cele 2 coloane de produse și caruselul foto de pe televizor.',
    passwordPlaceholder: 'Introduceți parola...',
    loginBtn: 'Intră în Cabinet',
    backToStoreBtn: 'Înapoi la vitrină',
    wrongPassword: '⚠️ Parolă incorectă! Vă rugăm să verificați și să încercați din nou.',
    // Top Bar
    topBadge: 'Cabinet Administrator • Tabletă / PC',
    unsavedBadge: 'Modificări nesalvate',
    syncedBadge: 'Sincronizat cu TV',
    mainTitle: 'Administrare Meniu (2 Coloane) & Carusel Foto TV',
    mainDesc1:
      'Editați liniștit denumirile, prețurile și fotografiile — ecranul televizorului ',
    mainDescNot: 'NU',
    mainDesc2: ' se reîncarcă la fiecare literă, ci doar după ce apăsați butonul ',
    mainDescBtn: '„Salvează și trimite pe TV”',
    discardBtn: 'Anulează modificările',
    discardTitle: 'Anulează modificările nesalvate',
    saveBtn: '💾 Salvează și trimite pe TV',
    savingBtn: 'Se trimite pe televizor...',
    // Secondary Toolbar
    exportBackup: 'Descarcă copie de rezervă (.json)',
    importBackup: 'Restaurează din copie',
    resetFactory: 'Resetează la standard',
    changePassBtn: 'Schimbă parola',
    previewTvBtn: 'Previzualizare TV',
    lockExitBtn: 'Ieșire (Blochează)',
    // Password Change Box
    newPassTitle: 'Schimbare parolă administrator',
    newPassPlaceholder: 'Parolă nouă (minim 3 caractere)...',
    saveNewPassBtn: 'Salvează parola nouă',
    cancelBtn: 'Anulează',
    passChangedToast: '🔑 Parola de administrator a fost actualizată cu succes!',
    passTooShortToast: '⚠️ Parola trebuie să conțină cel puțin 3 caractere',
    // Reset to factory modal
    resetModalTitle: 'Confirmare Resetare la Setările din Fabrică',
    resetModalDesc:
      'Toate pozițiile personalizate din cele 2 coloane și fotografiile din carusel vor fi înlocuite cu meniul standard Amika Café. Pentru securitate, introduceți parola de administrator:',
    resetPassPlaceholder: 'Introduceți parola de administrator...',
    resetConfirmBtn: 'Resetează la standard',
    // Tabs
    tabBoth: 'Ambele coloane (PC / Tabletă)',
    tabCoffee: '1. Coloana Cafea',
    tabDesserts: '2. Coloana 2 (Ceaiuri & Băuturi)',
    tabSlides: '3. Carusel Foto',
    // Coffee Column
    coffeeColTitle: 'Coloana 1: Cafea & Băuturi',
    coffeeColSub: 'Coloana din stânga a meniului de pe televizor',
    addCoffeeTopBtn: 'Adaugă băutură',
    addCoffeeBottomBtn: 'Adaugă băutură în Coloana 1',
    coffeeHeaderLabel: 'Titlul primei coloane (RO / RU)',
    headerRo: 'Titlu (RO)',
    headerRu: 'Titlu (RU)',
    // Dessert Column
    dessertColTitle: 'Coloana 2: Ceaiuri & Specialități (sau Meniu)',
    dessertColSub: 'A doua coloană a meniului de pe televizor',
    addDessertTopBtn: 'Adaugă poziție',
    addDessertBottomBtn: 'Adaugă poziție în Coloana 2',
    dessertHeaderLabel: 'Titlul celei de-a doua coloane (RO / RU)',
    // Item fields
    moveUp: 'Mută mai sus',
    moveDown: 'Mută mai jos',
    visibleOnTv: 'Vizibil',
    hiddenOnTv: 'Ascuns',
    deleteItem: 'Șterge poziția',
    nameRo: 'Denumire (RO)',
    nameRu: 'Denumire (RU)',
    priceMdl: 'Preț (MDL)',
    secondPriceLabel: 'Al 2-lea preț (L)',
    secondPricePlaceholder: 'ex. 35',
    discountPriceMdl: 'Reducere (L)',
    volumeMl: 'Volum (ml)',
    badgeLabel: 'Ecuson (TOP / NOU)',
    badgePlaceholder: 'Gol sau TOP',
    descRo: 'Descriere / Note (RO)',
    descRu: 'Descriere / Note (RU)',
    ingredientsRo: 'Ingrediente / Descriere (RO)',
    ingredientsRu: 'Ingrediente / Descriere (RU)',
    // Slides section
    slidesHeaderTitle: 'Partea dreaptă a ecranului TV: Carusel Foto',
    slidesWord: 'slide-uri',
    slidesHeaderDesc:
      'Încărcați orice număr de fotografii proprii de pe calculator sau tabletă. Acestea sunt optimizate automat pentru televizorul Full HD.',
    uploadPhotosBtn: '📷 Încarcă fotografii proprii (una sau mai multe)',
    uploadingPhotosBtn: 'Se procesează foto...',
    pickFromGalleryBtn: '🖼 Din colecția Amika (15 foto)',
    galleryPickerHint:
      'Apăsați pe orice fotografie din colecția Amika Café pentru a o adăuga în carusel:',
    slideNumOf: 'Slide #',
    slideOf: 'din',
    replacePhotoBtn: 'Schimbă foto',
    slideBadgeLabel: 'Ecusonul de sus (RO / RU)',
    slideTitleRo: 'Titlu mare (RO)',
    slideTitleRu: 'Titlu mare (RU)',
    slideSubtitleRo: 'Subtitlu (RO)',
    slideSubtitleRu: 'Subtitlu (RU)',
    slideDetailsRo: 'Descriere jos (RO)',
    slideDetailsRu: 'Descriere jos (RU)',
    // Bottom status
    bottomUnsavedText:
      '● Există modificări nesalvate în ciornă. Apăsați butonul din dreapta pentru a le trimite pe televizor.',
    bottomSavedText: '✓ Toate modificările sunt salvate și afișate pe televizor.',
    // Toasts & prompts
    toastDiscarded: '↩️ Modificările nesalvate au fost anulate',
    confirmReset:
      'Sigur doriți să încărcați meniul și fotografiile implicite Amika Café în editor? (Pentru aplicare pe TV apăsați apoi „Salvează și trimite pe TV”)',
    toastResetDraft:
      '🔄 Meniul standard a fost încărcat în ciornă. Apăsați „Salvează și trimite pe TV” pentru aplicare.',
    toastExported: '📥 Copia de rezervă a meniului și fotografiilor a fost descărcată!',
    toastImported:
      '📂 Copia a fost încărcată în editor! Verificați datele și apăsați „Salvează și trimite pe TV”.',
    toastBadFormat: '⚠️ Format invalid al fișierului de rezervă',
    toastJsonErr: '⚠️ Eroare la citirea fișierului JSON',
    toastAddedCoffee: '☕ Băutură nouă adăugată în ciornă (Coloana 1)',
    toastAddedDessert: '🥐 Desert nou adăugat în ciornă (Coloana 2)',
    toastMinOneSlide: '⚠️ În carusel trebuie să rămână cel puțin 1 slide',
    toastPhotosAdded:
      '📸 Fotografii adăugate în ciornă! Apăsați „Salvează și trimite pe TV” când sunteți gata.',
    toastPhotoReplaced: '📸 Fotografia slide-ului a fost actualizată în ciornă!',
    toastPhotoErr: '⚠️ Eroare la procesarea imaginii',
    toastGalleryAdded: '🖼 Slide adăugat în ciornă:',
  },
  ru: {
    // Login Gate
    loginBadge: 'Защищённый доступ • Amika Café',
    loginTitle: 'Кабинет Администратора',
    loginSubtitle:
      'Введите пароль администратора для редактирования 2 колонок меню и фото-карусели на телевизоре.',
    passwordPlaceholder: 'Введите пароль...',
    loginBtn: 'Войти в кабинет',
    backToStoreBtn: 'Назад к витрине',
    wrongPassword: '⚠️ Неверный пароль! Проверьте раскладку и попробуйте снова.',
    // Top Bar
    topBadge: 'Кабинет Администратора • Планшет / ПК',
    unsavedBadge: 'Есть несохранённые правки',
    syncedBadge: 'Синхронизировано с ТВ',
    mainTitle: 'Управление 2 колонками меню и Фото-каруселью ТВ',
    mainDesc1:
      'Спокойно вносите любые изменения в текст, цены и фото — телевизор ',
    mainDescNot: 'НЕ',
    mainDesc2: ' дергается при вводе символов и обновится только после нажатия кнопки ',
    mainDescBtn: '«Сохранить и отправить на ТВ»',
    discardBtn: 'Отменить правки',
    discardTitle: 'Отменить несохраненные изменения',
    saveBtn: '💾 Сохранить и отправить на ТВ',
    savingBtn: 'Отправка на телевизор...',
    // Secondary Toolbar
    exportBackup: 'Скачать резервную копию (.json)',
    importBackup: 'Восстановить из копии',
    resetFactory: 'Сбросить к заводским',
    changePassBtn: 'Сменить пароль',
    previewTvBtn: 'Предпросмотр ТВ-экрана',
    lockExitBtn: 'Выйти (Заблокировать)',
    // Password Change Box
    newPassTitle: 'Смена пароля администратора',
    newPassPlaceholder: 'Новый пароль (минимум 3 символа)...',
    saveNewPassBtn: 'Сохранить новый пароль',
    cancelBtn: 'Отмена',
    passChangedToast: '🔑 Пароль администратора успешно обновлён!',
    passTooShortToast: '⚠️ Пароль должен содержать минимум 3 символа',
    // Reset to factory modal
    resetModalTitle: 'Подтверждение сброса к заводским настройкам',
    resetModalDesc:
      'Все пользовательские позиции меню, чаи и карусель фотографий будут заменены стандартными настройками Amika Café. Для безопасности введите пароль администратора:',
    resetPassPlaceholder: 'Введите пароль администратора...',
    resetConfirmBtn: 'Сбросить к заводским',
    // Tabs
    tabBoth: 'Обе колонки рядом (ПК / Планшет)',
    tabCoffee: '1. Колонка Кофе',
    tabDesserts: '2. Колонка 2 (Чаи & Напитки)',
    tabSlides: '3. Фото-карусель',
    // Coffee Column
    coffeeColTitle: 'Колонка 1: Кофе и Напитки',
    coffeeColSub: 'Левая колонка меню на телевизоре',
    addCoffeeTopBtn: 'Добавить напиток',
    addCoffeeBottomBtn: 'Добавить напиток в Колонку 1',
    coffeeHeaderLabel: 'Заголовок первой колонки (RO / RU)',
    headerRo: 'Заголовок (RO)',
    headerRu: 'Заголовок (RU)',
    // Dessert Column
    dessertColTitle: 'Колонка 2: Чаи & Напитки (или Десерты)',
    dessertColSub: 'Вторая колонка меню на телевизоре',
    addDessertTopBtn: 'Добавить позицию',
    addDessertBottomBtn: 'Добавить позицию в Колонку 2',
    dessertHeaderLabel: 'Заголовок второй колонки (RO / RU)',
    // Item fields
    moveUp: 'Переместить выше',
    moveDown: 'Переместить ниже',
    visibleOnTv: 'Виден',
    hiddenOnTv: 'Скрыт',
    deleteItem: 'Удалить позицию',
    nameRo: 'Наименование (RO)',
    nameRu: 'Наименование (RU)',
    priceMdl: 'Цена (MDL)',
    secondPriceLabel: 'Вторая цена (L)',
    secondPricePlaceholder: 'напр. 35',
    discountPriceMdl: 'Скидка (L)',
    volumeMl: 'Объем (мл)',
    badgeLabel: 'Бейдж (ХИТ / TOP)',
    badgePlaceholder: 'Пусто или ХИТ',
    descRo: 'Описание (RO)',
    descRu: 'Описание (RU)',
    ingredientsRo: 'Состав / Описание (RO)',
    ingredientsRu: 'Состав / Описание (RU)',
    // Slides section
    slidesHeaderTitle: 'Правая часть экрана ТВ: Фото-карусель',
    slidesWord: 'слайдов',
    slidesHeaderDesc:
      'Загружайте любое количество своих фотографий с компьютера или планшета. Они автоматически оптимизируются под Full HD телевизор.',
    uploadPhotosBtn: '📷 Загрузить свои фото (можно несколько)',
    uploadingPhotosBtn: 'Обработка фото...',
    pickFromGalleryBtn: '🖼 Из коллекции Amika (15 фото)',
    galleryPickerHint:
      'Нажмите на любое фото из коллекции Amika Café, чтобы добавить его в карусель:',
    slideNumOf: 'Слайд №',
    slideOf: 'из',
    replacePhotoBtn: 'Заменить фото',
    slideBadgeLabel: 'Верхняя плашка-бейдж (RO / RU)',
    slideTitleRo: 'Заголовок (RO)',
    slideTitleRu: 'Заголовок (RU)',
    slideSubtitleRo: 'Подзаголовок (RO)',
    slideSubtitleRu: 'Подзаголовок (RU)',
    slideDetailsRo: 'Описание внизу (RO)',
    slideDetailsRu: 'Описание внизу (RU)',
    // Bottom status
    bottomUnsavedText:
      '● В черновике есть несохранённые изменения. Нажмите кнопку справа, чтобы отправить их на телевизор.',
    bottomSavedText: '✓ Все изменения сохранены и отправлены на телевизор.',
    // Toasts & prompts
    toastDiscarded: '↩️ Несохранённые правки отменены',
    confirmReset:
      'Загрузить стандартное меню и фотографии Amika Café по умолчанию? (Для отправки на ТВ нажмите затем «Сохранить и отправить на ТВ»)',
    toastResetDraft:
      '🔄 Стандартное меню загружено в черновик. Нажмите «Сохранить и отправить на ТВ» для применения.',
    toastExported: '📥 Резервная копия меню и фото скачана на устройство!',
    toastImported:
      '📂 Копия загружена в редактор! Проверьте данные и нажмите «Сохранить и отправить на ТВ».',
    toastBadFormat: '⚠️ Неверный формат файла резервной копии',
    toastJsonErr: '⚠️ Ошибка чтения JSON-файла',
    toastAddedCoffee: '☕ Позиция добавлена в черновик (Колонка 1)',
    toastAddedDessert: '🥐 Позиция добавлена в черновик (Колонка 2)',
    toastMinOneSlide: '⚠️ В карусели должен оставаться хотя бы 1 слайд',
    toastPhotosAdded:
      '📸 Фото добавлены в черновик! Нажмите «Сохранить и отправить на ТВ», когда будете готовы.',
    toastPhotoReplaced: '📸 Фото слайда заменено в черновике!',
    toastPhotoErr: '⚠️ Ошибка при обработке изображения',
    toastGalleryAdded: '🖼 Слайд добавлен в черновик:',
  },
};

export const AdminBuilder: React.FC<AdminBuilderProps> = ({
  language,
  onExitAdminMode,
  onOpenTvMode,
}) => {
  const L = ADMIN_I18N[language];

  // Password authentication state
  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(ADMIN_SESSION_UNLOCKED_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [showPasswordText, setShowPasswordText] = useState<boolean>(false);
  const [loginError, setLoginError] = useState<boolean>(false);

  // Change password panel inside Admin
  const [showChangePasswordBox, setShowChangePasswordBox] = useState<boolean>(false);
  const [newPasswordInput, setNewPasswordInput] = useState<string>('');

  // Factory reset modal state with password verification
  const [showResetModal, setShowResetModal] = useState<boolean>(false);
  const [resetPasswordInput, setResetPasswordInput] = useState<string>('');
  const [resetPasswordError, setResetPasswordError] = useState<boolean>(false);

  // Local draft state: edits NEVER trigger TV updates until "Save & Send to TV" is clicked
  const [draftConfig, setDraftConfig] = useState<TvBoardConfig>(() => loadTvConfig());
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);

  // Default to side-by-side 2-column view for Tablet / PC convenience
  const [subTab, setSubTab] = useState<'both_columns' | 'coffee' | 'desserts' | 'slides' | 'loyalty'>('both_columns');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [showInstaPicker, setShowInstaPicker] = useState<boolean>(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState<boolean>(false);
  const [isCloudConnected, setIsCloudConnected] = useState<boolean>(false);

  // Loyalty Management State (Admin Testing & Adjustments)
  const [loyaltyCardsList, setLoyaltyCardsList] = useState<LoyaltyCard[]>([]);
  const [isLoadingLoyalty, setIsLoadingLoyalty] = useState<boolean>(false);
  const [editingCardNumber, setEditingCardNumber] = useState<string>('AMIKA-8492');
  const [editingTgUserId, setEditingTgUserId] = useState<string>('1001');
  const [editingCustomerName, setEditingCustomerName] = useState<string>('Ion');
  const [editingStamps, setEditingStamps] = useState<number>(4);
  const [loyaltySearch, setLoyaltySearch] = useState<string>('');

  const loadLoyaltyCards = async () => {
    setIsLoadingLoyalty(true);
    try {
      const cards = await fetchAllLoyaltyCardsFromSupabase();
      if (Array.isArray(cards) && cards.length > 0) {
        setLoyaltyCardsList(cards);
      } else {
        // Pre-seed demo cards if empty in Supabase
        setLoyaltyCardsList([
          {
            cardNumber: 'AMIKA-8492',
            telegramUserId: 1001,
            customerName: 'Ion',
            currentStamps: 4,
            totalFreeCoffeesEarned: 1,
            lastUpdated: new Date().toISOString(),
          },
          {
            cardNumber: 'AMIKA-3105',
            telegramUserId: 1002,
            customerName: 'Elena',
            currentStamps: 2,
            totalFreeCoffeesEarned: 0,
            lastUpdated: new Date().toISOString(),
          },
        ]);
      }
    } catch (err) {
      console.warn('Failed to load loyalty cards:', err);
    } finally {
      setIsLoadingLoyalty(false);
    }
  };

  const handleSaveLoyaltyCard = async (
    cardNumber: string,
    tgId: number,
    name: string,
    stamps: number
  ) => {
    const card: LoyaltyCard = {
      cardNumber: cardNumber.trim() || 'AMIKA-DEMO',
      telegramUserId: tgId,
      customerName: name.trim() || undefined,
      currentStamps: Math.min(6, Math.max(0, stamps)),
      totalFreeCoffeesEarned: stamps >= 6 ? 1 : 0,
      lastUpdated: new Date().toISOString(),
    };
    const ok = await saveLoyaltyCardToSupabase(card);
    if (ok) {
      showToast(
        language === 'ro'
          ? `Cardul ${cardNumber} salvat (${stamps}/6 ștampile)!`
          : `Карта ${cardNumber} сохранена (${stamps}/6 чашек)!`
      );
      setLoyaltyCardsList((prev) => {
        const idx = prev.findIndex((c) => c.cardNumber === card.cardNumber);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = card;
          return next;
        }
        return [card, ...prev];
      });
    } else {
      showToast(
        language === 'ro'
          ? `Eroare la salvarea cardului în Supabase`
          : `Ошибка сохранения карты в Supabase`
      );
    }
  };

  // Auto-fetch latest menu from Supabase cloud database on mount
  useEffect(() => {
    let isMounted = true;
    fetchMenuConfigFromSupabase()
      .then((cloudCfg) => {
        if (!isMounted || !cloudCfg) return;
        setIsCloudConnected(true);
        const local = loadTvConfig();
        if (!local.updatedAt || cloudCfg.updatedAt >= local.updatedAt) {
          saveTvConfigLocal(cloudCfg);
          setDraftConfig(cloudCfg);
        }
      })
      .catch((err) => {
        console.warn('Initial Supabase fetch failed:', err);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const fileInputNewSlidesRef = useRef<HTMLInputElement | null>(null);
  const jsonImportRef = useRef<HTMLInputElement | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4500);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const expected = getStoredAdminPassword();
    const input = passwordInput.trim();
    if (input === expected || input === MASTER_DEVELOPER_PASSWORD) {
      setIsUnlocked(true);
      setLoginError(false);
      setPasswordInput('');
      try {
        sessionStorage.setItem(ADMIN_SESSION_UNLOCKED_KEY, 'true');
      } catch {}
    } else {
      setLoginError(true);
    }
  };

  const handleLockAdmin = () => {
    setIsUnlocked(false);
    try {
      sessionStorage.removeItem(ADMIN_SESSION_UNLOCKED_KEY);
    } catch {}
    if (onExitAdminMode) {
      onExitAdminMode();
    }
  };

  const handleSaveNewPassword = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newPasswordInput.trim();
    if (trimmed.length < 3) {
      showToast(L.passTooShortToast);
      return;
    }
    try {
      localStorage.setItem(ADMIN_PASS_STORAGE_KEY, trimmed);
    } catch {}
    setNewPasswordInput('');
    setShowChangePasswordBox(false);
    showToast(L.passChangedToast);
  };

  // Update draft in memory ONLY (does NOT save to localStorage or broadcast to TV)
  const updateDraft = (nextConfig: TvBoardConfig) => {
    setDraftConfig(nextConfig);
    setHasUnsavedChanges(true);
  };

  // Discard unsaved draft changes
  const handleDiscardDraft = () => {
    const saved = loadTvConfig();
    setDraftConfig(saved);
    setHasUnsavedChanges(false);
    showToast(L.toastDiscarded);
  };

  // Save & Push to TV ONLY on explicit button click
  const handleSaveAndSync = async () => {
    setIsSaving(true);
    try {
      const stamped: TvBoardConfig = {
        ...draftConfig,
        updatedAt: Date.now(),
      };
      setDraftConfig(stamped);
      saveTvConfigLocal(stamped);
      await publishTvConfigToCloud(stamped, (msg) => {
        showToast(msg);
      });
      setHasUnsavedChanges(false);
    } finally {
      setIsSaving(false);
    }
  };

  // Open password confirmation modal for factory reset
  const handleOpenResetModal = () => {
    setShowResetModal(true);
    setResetPasswordInput('');
    setResetPasswordError(false);
  };

  // Perform factory reset only after correct admin or master password
  const handleConfirmReset = (e: React.FormEvent) => {
    e.preventDefault();
    const expected = getStoredAdminPassword();
    const input = resetPasswordInput.trim();
    if (input === expected || input === MASTER_DEVELOPER_PASSWORD) {
      const fresh = JSON.parse(JSON.stringify(DEFAULT_TV_CONFIG)) as TvBoardConfig;
      updateDraft(fresh);
      setShowResetModal(false);
      setResetPasswordInput('');
      setResetPasswordError(false);
      showToast(L.toastResetDraft);
    } else {
      setResetPasswordError(true);
    }
  };

  // Export JSON backup
  const handleExportJson = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(draftConfig, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = `amika_cafe_menu_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    showToast(L.toastExported);
  };

  // Import JSON backup into draft
  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(String(ev.target?.result || '')) as TvBoardConfig;
        if (parsed && Array.isArray(parsed.coffeeItems) && Array.isArray(parsed.slides)) {
          updateDraft(parsed);
          showToast(L.toastImported);
        } else {
          showToast(L.toastBadFormat);
        }
      } catch {
        showToast(L.toastJsonErr);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // ================= COFFEE COLUMN HANDLERS (DRAFT ONLY) =================
  const updateCoffeeItem = (idx: number, patch: Partial<TvCoffeeItem>) => {
    const next = [...draftConfig.coffeeItems];
    next[idx] = { ...next[idx], ...patch };
    updateDraft({ ...draftConfig, coffeeItems: next });
  };

  const addCoffeeItem = () => {
    const newItem: TvCoffeeItem = {
      id: 'c-' + Date.now(),
      name: { ro: 'Băutură Nouă', ru: 'Новый напиток' },
      volume: '250 ml',
      notes: { ro: '100% Arabica Specialty', ru: '100% арабика свежей обжарки' },
      price: 45,
      badge: { ro: 'NOU', ru: 'НОВИНКА' },
      visible: true,
    };
    updateDraft({
      ...draftConfig,
      coffeeItems: [...draftConfig.coffeeItems, newItem],
    });
    showToast(L.toastAddedCoffee);
  };

  const removeCoffeeItem = (idx: number) => {
    const next = draftConfig.coffeeItems.filter((_, i) => i !== idx);
    updateDraft({ ...draftConfig, coffeeItems: next });
  };

  const moveCoffeeItem = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= draftConfig.coffeeItems.length) return;
    const next = [...draftConfig.coffeeItems];
    const temp = next[idx];
    next[idx] = next[target];
    next[target] = temp;
    updateDraft({ ...draftConfig, coffeeItems: next });
  };

  // ================= DESSERT COLUMN HANDLERS (DRAFT ONLY) =================
  const updateDessertItem = (idx: number, patch: Partial<TvDessertItem>) => {
    const next = [...draftConfig.dessertItems];
    next[idx] = { ...next[idx], ...patch };
    updateDraft({ ...draftConfig, dessertItems: next });
  };

  const addDessertItem = () => {
    const newItem: TvDessertItem = {
      id: 'd-' + Date.now(),
      name: { ro: 'Ceai / Poziție Nouă', ru: 'Новый чай / напиток' },
      volume: '400 ml',
      desc: { ro: 'Infuzie naturală proaspătă', ru: 'Натуральный сбор, свежее заваривание' },
      price: 45,
      discountPrice: 35,
      badge: null,
      visible: true,
    };
    updateDraft({
      ...draftConfig,
      dessertItems: [...draftConfig.dessertItems, newItem],
    });
    showToast(L.toastAddedDessert);
  };

  const removeDessertItem = (idx: number) => {
    const next = draftConfig.dessertItems.filter((_, i) => i !== idx);
    updateDraft({ ...draftConfig, dessertItems: next });
  };

  const moveDessertItem = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= draftConfig.dessertItems.length) return;
    const next = [...draftConfig.dessertItems];
    const temp = next[idx];
    next[idx] = next[target];
    next[target] = temp;
    updateDraft({ ...draftConfig, dessertItems: next });
  };

  // ================= SLIDES CAROUSEL HANDLERS (DRAFT ONLY) =================
  const updateSlide = (idx: number, patch: Partial<TvSlideItem>) => {
    const next = [...draftConfig.slides];
    next[idx] = { ...next[idx], ...patch };
    updateDraft({ ...draftConfig, slides: next });
  };

  const removeSlide = (idx: number) => {
    if (draftConfig.slides.length <= 1) {
      showToast(L.toastMinOneSlide);
      return;
    }
    const next = draftConfig.slides.filter((_, i) => i !== idx);
    updateDraft({ ...draftConfig, slides: next });
  };

  const moveSlide = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= draftConfig.slides.length) return;
    const next = [...draftConfig.slides];
    const temp = next[idx];
    next[idx] = next[target];
    next[target] = temp;
    updateDraft({ ...draftConfig, slides: next });
  };

  // Upload 1 or multiple custom photos from tablet/computer
  const handleUploadNewSlidePhotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingPhoto(true);
    try {
      const addedSlides: TvSlideItem[] = [];
      for (let i = 0; i < files.length; i++) {
        const compressedDataUrl = await compressImageFile(files[i], 1080, 0.78);
        addedSlides.push({
          id: 's-' + Date.now() + '-' + i,
          image: compressedDataUrl,
          badge: { ro: 'Amika Café • Cricova', ru: 'Amika Café • Крикова' },
          title: { ro: 'Recomandarea Barista', ru: 'Рекомендация Бариста' },
          subtitle: {
            ro: 'Cafea de specialitate & deserturi proaspete în fiecare zi',
            ru: 'Спешелти кофе и свежие крафтовые десерты каждый день',
          },
          details: {
            ro: 'Vă așteptăm cu drag pe str. Drumul Viilor 10, or. Cricova.',
            ru: 'Ждем вас с любовью по адресу: Крикова, str. Drumul Viilor 10.',
          },
          visible: true,
        });
      }

      updateDraft({
        ...draftConfig,
        slides: [...draftConfig.slides, ...addedSlides],
      });
      showToast(`${L.toastPhotosAdded} (+${addedSlides.length})`);
    } catch {
      showToast(L.toastPhotoErr);
    } finally {
      setIsUploadingPhoto(false);
      e.target.value = '';
    }
  };

  // Replace photo on an existing slide
  const handleReplaceSlidePhoto = async (idx: number, file?: File) => {
    if (!file) return;
    setIsUploadingPhoto(true);
    try {
      const compressedDataUrl = await compressImageFile(file, 1080, 0.78);
      updateSlide(idx, { image: compressedDataUrl });
      showToast(`${L.toastPhotoReplaced} (#${idx + 1})`);
    } catch {
      showToast(L.toastPhotoErr);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  // Add slide from built-in Instagram HD gallery
  const handleAddFromGallery = (path: string, label: string) => {
    const newSlide: TvSlideItem = {
      id: 's-' + Date.now(),
      image: path,
      badge: { ro: 'Amika Café • Specialty', ru: 'Amika Café • Specialty' },
      title: { ro: label, ru: label },
      subtitle: {
        ro: 'Gust autentic și atmosferă caldă în Cricova',
        ru: 'Настоящий вкус и теплая атмосфера в Крикова',
      },
      details: {
        ro: 'Str. Drumul Viilor 10 • 08:00 – 21:00',
        ru: 'Крикова, str. Drumul Viilor 10 • 08:00 – 21:00',
      },
      visible: true,
    };
    updateDraft({
      ...draftConfig,
      slides: [...draftConfig.slides, newSlide],
    });
    setShowInstaPicker(false);
    showToast(`${L.toastGalleryAdded} «${label}»`);
  };

  // ================= PASSWORD PROTECTION GATE =================
  if (!isUnlocked) {
    return (
      <div className="max-w-md mx-auto px-4 py-12">
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-stone-900 via-stone-900 to-amber-950/40 border border-amber-500/40 shadow-2xl space-y-6">
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-lg">
              <Lock className="w-8 h-8" />
            </div>

            <span className="px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {L.loginBadge}
            </span>

            <h2 className="text-2xl font-black text-white font-serif">
              {L.loginTitle}
            </h2>

            <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
              {L.loginSubtitle}
            </p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div className="relative">
              <input
                type={showPasswordText ? 'text' : 'password'}
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  if (loginError) setLoginError(false);
                }}
                placeholder={L.passwordPlaceholder}
                autoFocus
                className="w-full pl-4 pr-11 py-3.5 rounded-2xl bg-stone-950 border border-stone-700 focus:border-amber-500 focus:outline-none text-sm text-white font-semibold"
              />
              <button
                type="button"
                onClick={() => setShowPasswordText(!showPasswordText)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-stone-400 hover:text-stone-200"
              >
                {showPasswordText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {loginError && (
              <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-200 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{L.wrongPassword}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-stone-950 font-black text-sm shadow-lg shadow-amber-950/50 transition active:scale-98 cursor-pointer"
            >
              {L.loginBtn}
            </button>

            {onExitAdminMode && (
              <button
                type="button"
                onClick={onExitAdminMode}
                className="w-full py-2.5 rounded-2xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold transition cursor-pointer"
              >
                {L.backToStoreBtn}
              </button>
            )}
          </form>
        </div>
      </div>
    );
  }

  // Render Coffee Column Editor Block
  const renderCoffeeEditor = () => (
    <div className="space-y-4 bg-stone-900/40 p-4 sm:p-5 rounded-3xl border border-stone-800/90">
      <div className="flex items-center justify-between border-b border-stone-800 pb-3">
        <div className="flex items-center gap-2.5">
          <span className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
            <Coffee className="w-5 h-5" />
          </span>
          <div>
            <h4 className="text-sm sm:text-base font-extrabold text-white font-serif">
              {L.coffeeColTitle} ({draftConfig.coffeeItems.length})
            </h4>
            <p className="text-[11px] text-stone-400">{L.coffeeColSub}</p>
          </div>
        </div>
        <button
          onClick={addCoffeeItem}
          className="px-3 py-2 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/40 text-amber-300 font-bold text-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{L.addCoffeeTopBtn}</span>
        </button>
      </div>

      {/* Column Header Settings */}
      <div className="p-3.5 rounded-2xl bg-stone-900/90 border border-stone-800 space-y-2">
        <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
          {L.coffeeHeaderLabel}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] text-stone-400 block mb-1">{L.headerRo}</label>
            <input
              type="text"
              value={draftConfig.coffeeHeader.ro}
              onChange={(e) =>
                updateDraft({
                  ...draftConfig,
                  coffeeHeader: { ...draftConfig.coffeeHeader, ro: e.target.value },
                })
              }
              className="w-full p-2.5 rounded-xl bg-stone-950 border border-stone-700 focus:border-amber-500 focus:outline-none text-xs sm:text-sm text-white font-bold"
            />
          </div>
          <div>
            <label className="text-[11px] text-stone-400 block mb-1">{L.headerRu}</label>
            <input
              type="text"
              value={draftConfig.coffeeHeader.ru}
              onChange={(e) =>
                updateDraft({
                  ...draftConfig,
                  coffeeHeader: { ...draftConfig.coffeeHeader, ru: e.target.value },
                })
              }
              className="w-full p-2.5 rounded-xl bg-stone-950 border border-stone-700 focus:border-amber-500 focus:outline-none text-xs sm:text-sm text-white font-bold"
            />
          </div>
        </div>
      </div>

      {/* Coffee Items List */}
      <div className="space-y-3">
        {draftConfig.coffeeItems.map((item, idx) => (
          <div
            key={item.id}
            className={`p-4 rounded-2xl border space-y-3 transition ${
              item.visible
                ? 'bg-stone-900/90 border-stone-800 hover:border-stone-700'
                : 'bg-stone-950/50 border-stone-800/40 opacity-60'
            }`}
          >
            {/* Item Top Controls */}
            <div className="flex items-center justify-between border-b border-stone-800 pb-2.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs sm:text-sm font-extrabold text-amber-400 font-mono">
                  #{idx + 1} • {language === 'ro' ? item.name.ro || item.name.ru : item.name.ru || item.name.ro}
                </span>
                {item.secondPrice ? (
                  <span className="text-[11px] font-bold text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded-full border border-amber-500/30 font-mono">
                    {item.price} / {item.secondPrice} MDL
                  </span>
                ) : item.price > 0 ? (
                  <span className="text-[11px] font-semibold text-stone-400 font-mono">
                    {item.price} MDL
                  </span>
                ) : null}
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => moveCoffeeItem(idx, -1)}
                  disabled={idx === 0}
                  className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 disabled:opacity-30 text-stone-300"
                  title={L.moveUp}
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
                <button
                  onClick={() => moveCoffeeItem(idx, 1)}
                  disabled={idx === draftConfig.coffeeItems.length - 1}
                  className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 disabled:opacity-30 text-stone-300"
                  title={L.moveDown}
                >
                  <ArrowDown className="w-4 h-4" />
                </button>
                <button
                  onClick={() => updateCoffeeItem(idx, { visible: !item.visible })}
                  className={`px-2 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1 ${
                    item.visible
                      ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                      : 'bg-stone-800 border-stone-700 text-stone-400'
                  }`}
                >
                  {item.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  <span className="hidden sm:inline">{item.visible ? L.visibleOnTv : L.hiddenOnTv}</span>
                </button>
                <button
                  onClick={() => removeCoffeeItem(idx)}
                  className="p-1.5 rounded-lg bg-rose-950/50 hover:bg-rose-900/70 text-rose-300 border border-rose-500/30"
                  title={L.deleteItem}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Names RO / RU */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-stone-400 block mb-1">{L.nameRo}</label>
                <input
                  type="text"
                  value={item.name.ro}
                  onChange={(e) =>
                    updateCoffeeItem(idx, { name: { ...item.name, ro: e.target.value } })
                  }
                  className="w-full p-2.5 rounded-xl bg-stone-950 border border-stone-700 focus:border-amber-500 focus:outline-none text-xs sm:text-sm text-white font-semibold"
                />
              </div>
              <div>
                <label className="text-[11px] text-stone-400 block mb-1">{L.nameRu}</label>
                <input
                  type="text"
                  value={item.name.ru}
                  onChange={(e) =>
                    updateCoffeeItem(idx, { name: { ...item.name, ru: e.target.value } })
                  }
                  className="w-full p-2.5 rounded-xl bg-stone-950 border border-stone-700 focus:border-amber-500 focus:outline-none text-xs sm:text-sm text-white font-semibold"
                />
              </div>
            </div>

            {/* Price 1, Price 2 (Second dose/cup), Volume, Badge */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-end">
              <div>
                <label className="text-[11px] text-amber-400 font-bold block mb-1 truncate" title={L.priceMdl}>
                  {L.priceMdl}
                </label>
                <input
                  type="number"
                  value={item.price}
                  onChange={(e) =>
                    updateCoffeeItem(idx, { price: Number(e.target.value) || 0 })
                  }
                  className="w-full p-2.5 rounded-xl bg-stone-950 border border-amber-500/50 focus:border-amber-400 focus:outline-none text-xs sm:text-sm text-amber-300 font-mono font-black"
                />
              </div>
              <div>
                <label className="text-[11px] text-amber-300 font-bold block mb-1 truncate" title={L.secondPriceLabel}>
                  {L.secondPriceLabel}
                </label>
                <input
                  type="number"
                  placeholder={L.secondPricePlaceholder}
                  value={item.secondPrice ?? ''}
                  onChange={(e) => {
                    const raw = e.target.value.trim();
                    updateCoffeeItem(idx, {
                      secondPrice: raw === '' ? undefined : Number(raw),
                    });
                  }}
                  className="w-full p-2.5 rounded-xl bg-stone-950 border border-amber-500/40 focus:border-amber-400 focus:outline-none text-xs sm:text-sm text-amber-200 font-mono font-bold"
                />
              </div>
              <div>
                <label className="text-[11px] text-stone-400 block mb-1 truncate" title={L.volumeMl}>
                  {L.volumeMl}
                </label>
                <input
                  type="text"
                  placeholder="40 / 80 ml"
                  value={item.volume}
                  onChange={(e) => updateCoffeeItem(idx, { volume: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-stone-950 border border-stone-700 focus:border-amber-500 focus:outline-none text-xs sm:text-sm text-stone-200 font-mono"
                />
              </div>
              <div>
                <label className="text-[11px] text-stone-400 block mb-1 truncate" title={L.badgeLabel}>
                  {L.badgeLabel}
                </label>
                <input
                  type="text"
                  placeholder={L.badgePlaceholder}
                  value={item.badge ? (language === 'ro' ? item.badge.ro : item.badge.ru) : ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    updateCoffeeItem(idx, {
                      badge: val.trim() ? { ro: val, ru: val } : null,
                    });
                  }}
                  className="w-full p-2.5 rounded-xl bg-stone-950 border border-stone-700 focus:border-amber-500 focus:outline-none text-xs sm:text-sm text-amber-300 font-bold"
                />
              </div>
            </div>

            {/* Description RO / RU */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-stone-400 block mb-1">{L.descRo}</label>
                <input
                  type="text"
                  value={item.notes.ro}
                  onChange={(e) =>
                    updateCoffeeItem(idx, { notes: { ...item.notes, ro: e.target.value } })
                  }
                  className="w-full p-2 rounded-xl bg-stone-950 border border-stone-800 focus:border-amber-500 focus:outline-none text-xs text-stone-300"
                />
              </div>
              <div>
                <label className="text-[11px] text-stone-400 block mb-1">{L.descRu}</label>
                <input
                  type="text"
                  value={item.notes.ru}
                  onChange={(e) =>
                    updateCoffeeItem(idx, { notes: { ...item.notes, ru: e.target.value } })
                  }
                  className="w-full p-2 rounded-xl bg-stone-950 border border-stone-800 focus:border-amber-500 focus:outline-none text-xs text-stone-300"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={addCoffeeItem}
        className="w-full py-3.5 rounded-2xl bg-amber-600/20 hover:bg-amber-600/30 border border-dashed border-amber-500/50 text-amber-300 font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 transition active:scale-98 cursor-pointer"
      >
        <Plus className="w-4 h-4" />
        <span>{L.addCoffeeBottomBtn}</span>
      </button>
    </div>
  );

  // Render Desserts / Column 2 Editor Block
  const renderDessertsEditor = () => (
    <div className="space-y-4 bg-stone-900/40 p-4 sm:p-5 rounded-3xl border border-stone-800/90">
      <div className="flex items-center justify-between border-b border-stone-800 pb-3">
        <div className="flex items-center gap-2.5">
          <span className="p-2 rounded-xl bg-teal-500/20 text-teal-300">
            <Sparkles className="w-5 h-5" />
          </span>
          <div>
            <h4 className="text-sm sm:text-base font-extrabold text-white font-serif">
              {L.dessertColTitle} ({draftConfig.dessertItems.length})
            </h4>
            <p className="text-[11px] text-stone-400">{L.dessertColSub}</p>
          </div>
        </div>
        <button
          onClick={addDessertItem}
          className="px-3 py-2 rounded-xl bg-teal-600/20 hover:bg-teal-600/30 border border-teal-500/40 text-teal-300 font-bold text-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{L.addDessertTopBtn}</span>
        </button>
      </div>

      {/* Column Header Settings */}
      <div className="p-3.5 rounded-2xl bg-stone-900/90 border border-stone-800 space-y-2">
        <div className="text-[11px] font-bold text-teal-400 uppercase tracking-wider">
          {L.dessertHeaderLabel}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] text-stone-400 block mb-1">{L.headerRo}</label>
            <input
              type="text"
              value={draftConfig.dessertHeader.ro}
              onChange={(e) =>
                updateDraft({
                  ...draftConfig,
                  dessertHeader: { ...draftConfig.dessertHeader, ro: e.target.value },
                })
              }
              className="w-full p-2.5 rounded-xl bg-stone-950 border border-stone-700 focus:border-teal-500 focus:outline-none text-xs sm:text-sm text-white font-bold"
            />
          </div>
          <div>
            <label className="text-[11px] text-stone-400 block mb-1">{L.headerRu}</label>
            <input
              type="text"
              value={draftConfig.dessertHeader.ru}
              onChange={(e) =>
                updateDraft({
                  ...draftConfig,
                  dessertHeader: { ...draftConfig.dessertHeader, ru: e.target.value },
                })
              }
              className="w-full p-2.5 rounded-xl bg-stone-950 border border-stone-700 focus:border-teal-500 focus:outline-none text-xs sm:text-sm text-white font-bold"
            />
          </div>
        </div>
      </div>

      {/* Dessert Items List */}
      <div className="space-y-3">
        {draftConfig.dessertItems.map((item, idx) => (
          <div
            key={item.id}
            className={`p-4 rounded-2xl border space-y-3 transition ${
              item.visible
                ? 'bg-stone-900/90 border-stone-800 hover:border-stone-700'
                : 'bg-stone-950/50 border-stone-800/40 opacity-60'
            }`}
          >
            <div className="flex items-center justify-between border-b border-stone-800 pb-2.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs sm:text-sm font-extrabold text-rose-400 font-mono">
                  #{idx + 1} • {language === 'ro' ? item.name.ro || item.name.ru : item.name.ru || item.name.ro}
                </span>
                {item.secondPrice ? (
                  <span className="text-[11px] font-bold text-teal-300 bg-teal-500/15 px-2 py-0.5 rounded-full border border-teal-500/30 font-mono">
                    {item.price} / {item.secondPrice} MDL
                  </span>
                ) : item.price > 0 ? (
                  <span className="text-[11px] font-semibold text-stone-400 font-mono">
                    {item.price} MDL
                  </span>
                ) : null}
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => moveDessertItem(idx, -1)}
                  disabled={idx === 0}
                  className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 disabled:opacity-30 text-stone-300"
                  title={L.moveUp}
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
                <button
                  onClick={() => moveDessertItem(idx, 1)}
                  disabled={idx === draftConfig.dessertItems.length - 1}
                  className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 disabled:opacity-30 text-stone-300"
                  title={L.moveDown}
                >
                  <ArrowDown className="w-4 h-4" />
                </button>
                <button
                  onClick={() => updateDessertItem(idx, { visible: !item.visible })}
                  className={`px-2 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1 ${
                    item.visible
                      ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                      : 'bg-stone-800 border-stone-700 text-stone-400'
                  }`}
                >
                  {item.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  <span className="hidden sm:inline">{item.visible ? L.visibleOnTv : L.hiddenOnTv}</span>
                </button>
                <button
                  onClick={() => removeDessertItem(idx)}
                  className="p-1.5 rounded-lg bg-rose-950/50 hover:bg-rose-900/70 text-rose-300 border border-rose-500/30"
                  title={L.deleteItem}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Names RO / RU */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-stone-400 block mb-1">{L.nameRo}</label>
                <input
                  type="text"
                  value={item.name.ro}
                  onChange={(e) =>
                    updateDessertItem(idx, { name: { ...item.name, ro: e.target.value } })
                  }
                  className="w-full p-2.5 rounded-xl bg-stone-950 border border-stone-700 focus:border-rose-500 focus:outline-none text-xs sm:text-sm text-white font-semibold"
                />
              </div>
              <div>
                <label className="text-[11px] text-stone-400 block mb-1">{L.nameRu}</label>
                <input
                  type="text"
                  value={item.name.ru}
                  onChange={(e) =>
                    updateDessertItem(idx, { name: { ...item.name, ru: e.target.value } })
                  }
                  className="w-full p-2.5 rounded-xl bg-stone-950 border border-stone-700 focus:border-rose-500 focus:outline-none text-xs sm:text-sm text-white font-semibold"
                />
              </div>
            </div>

            {/* Price 1, Price 2 (Second dose/cup), Volume, Badge, Discount */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 items-end">
              <div>
                <label className="text-[11px] text-amber-400 font-bold block mb-1 truncate" title={L.priceMdl}>
                  {L.priceMdl}
                </label>
                <input
                  type="number"
                  value={item.price}
                  onChange={(e) => {
                    const p = Number(e.target.value) || 0;
                    updateDessertItem(idx, {
                      price: p,
                      discountPrice: item.discountPrice || Math.round(p * 0.7),
                    });
                  }}
                  className="w-full p-2.5 rounded-xl bg-stone-950 border border-amber-500/50 focus:border-amber-400 focus:outline-none text-xs sm:text-sm text-amber-300 font-mono font-black"
                />
              </div>
              <div>
                <label className="text-[11px] text-amber-300 font-bold block mb-1 truncate" title={L.secondPriceLabel}>
                  {L.secondPriceLabel}
                </label>
                <input
                  type="number"
                  placeholder={L.secondPricePlaceholder}
                  value={item.secondPrice ?? ''}
                  onChange={(e) => {
                    const raw = e.target.value.trim();
                    updateDessertItem(idx, {
                      secondPrice: raw === '' ? undefined : Number(raw),
                    });
                  }}
                  className="w-full p-2.5 rounded-xl bg-stone-950 border border-amber-500/40 focus:border-amber-400 focus:outline-none text-xs sm:text-sm text-amber-200 font-mono font-bold"
                />
              </div>
              <div>
                <label className="text-[11px] text-stone-400 block mb-1 truncate" title={L.volumeMl}>
                  {L.volumeMl}
                </label>
                <input
                  type="text"
                  placeholder="400 ml"
                  value={item.volume || ''}
                  onChange={(e) => updateDessertItem(idx, { volume: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-stone-950 border border-stone-700 focus:border-teal-500 focus:outline-none text-xs sm:text-sm text-stone-200 font-mono"
                />
              </div>
              <div>
                <label className="text-[11px] text-stone-400 block mb-1 truncate" title={L.badgeLabel}>
                  {L.badgeLabel}
                </label>
                <input
                  type="text"
                  placeholder="BIO / TOP"
                  value={item.badge ? (language === 'ro' ? item.badge.ro : item.badge.ru) : ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    updateDessertItem(idx, {
                      badge: val.trim() ? { ro: val, ru: val } : null,
                    });
                  }}
                  className="w-full p-2.5 rounded-xl bg-stone-950 border border-stone-700 focus:border-teal-500 focus:outline-none text-xs sm:text-sm text-teal-300 font-bold"
                />
              </div>
              <div>
                <label className="text-[11px] text-stone-400 block mb-1 truncate" title={`${L.discountPriceMdl} (Telegram)`}>
                  {L.discountPriceMdl}
                </label>
                <input
                  type="number"
                  value={item.discountPrice}
                  onChange={(e) =>
                    updateDessertItem(idx, { discountPrice: Number(e.target.value) || 0 })
                  }
                  className="w-full p-2.5 rounded-xl bg-stone-950 border border-stone-800 focus:border-rose-400 focus:outline-none text-xs sm:text-sm text-stone-300 font-mono"
                />
              </div>
            </div>

            {/* Description RO / RU */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-stone-400 block mb-1">{L.ingredientsRo}</label>
                <input
                  type="text"
                  value={item.desc.ro}
                  onChange={(e) =>
                    updateDessertItem(idx, { desc: { ...item.desc, ro: e.target.value } })
                  }
                  className="w-full p-2 rounded-xl bg-stone-950 border border-stone-800 focus:border-rose-500 focus:outline-none text-xs text-stone-300"
                />
              </div>
              <div>
                <label className="text-[11px] text-stone-400 block mb-1">{L.ingredientsRu}</label>
                <input
                  type="text"
                  value={item.desc.ru}
                  onChange={(e) =>
                    updateDessertItem(idx, { desc: { ...item.desc, ru: e.target.value } })
                  }
                  className="w-full p-2 rounded-xl bg-stone-950 border border-stone-800 focus:border-rose-500 focus:outline-none text-xs text-stone-300"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={addDessertItem}
        className="w-full py-3.5 rounded-2xl bg-rose-600/20 hover:bg-rose-600/30 border border-dashed border-rose-500/50 text-rose-300 font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 transition active:scale-98 cursor-pointer"
      >
        <Plus className="w-4 h-4" />
        <span>{L.addDessertBottomBtn}</span>
      </button>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-16">
      {/* Top Desktop/Tablet Action Bar */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-amber-950/70 via-stone-900 to-stone-900 border border-amber-500/40 shadow-2xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
                {L.topBadge}
              </span>
              {hasUnsavedChanges ? (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500 text-stone-950 flex items-center gap-1 animate-pulse">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{L.unsavedBadge}</span>
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>{L.syncedBadge}</span>
                </span>
              )}
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border flex items-center gap-1 ${
                  isCloudConnected
                    ? 'bg-sky-500/15 text-sky-300 border-sky-500/30'
                    : 'bg-stone-800 text-stone-400 border-stone-700'
                }`}
                title="Облачная база данных Supabase"
              >
                <Cloud className="w-3.5 h-3.5" />
                <span>Supabase DB</span>
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white font-serif mt-1.5">
              {L.mainTitle}
            </h2>
            <p className="text-xs sm:text-sm text-stone-300 mt-1">
              {L.mainDesc1}
              <b className="text-amber-300">{L.mainDescNot}</b>
              {L.mainDesc2}
              <b className="text-emerald-400">{L.mainDescBtn}</b>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {hasUnsavedChanges && (
              <button
                onClick={handleDiscardDraft}
                className="px-3.5 py-3 rounded-2xl bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                title={L.discardTitle}
              >
                <Undo2 className="w-4 h-4 text-amber-400" />
                <span>{L.discardBtn}</span>
              </button>
            )}

            <button
              onClick={handleSaveAndSync}
              disabled={isSaving}
              className={`px-6 py-3.5 rounded-2xl font-black text-xs sm:text-sm flex items-center gap-2 shadow-xl transition active:scale-95 cursor-pointer ${
                hasUnsavedChanges
                  ? 'bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white ring-2 ring-emerald-300/60 shadow-emerald-950/80'
                  : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-950/50'
              }`}
            >
              <Save className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>{isSaving ? L.savingBtn : L.saveBtn}</span>
            </button>
          </div>
        </div>

        {/* Secondary Toolbar: Backup, Restore, Password Change, Preview TV, Lock/Exit */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-stone-800/80">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportJson}
              className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>{L.exportBackup}</span>
            </button>

            <button
              onClick={() => jsonImportRef.current?.click()}
              className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-sky-400" />
              <span>{L.importBackup}</span>
            </button>
            <input
              ref={jsonImportRef}
              type="file"
              accept=".json"
              onChange={handleImportJson}
              className="hidden"
            />

            <button
              onClick={handleOpenResetModal}
              className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-rose-950/60 text-stone-400 hover:text-rose-300 border border-stone-700/80 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{L.resetFactory}</span>
            </button>

            <button
              onClick={() => setShowChangePasswordBox(!showChangePasswordBox)}
              className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-300 border border-stone-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5 text-amber-400" />
              <span>{L.changePassBtn}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {onOpenTvMode && (
              <button
                onClick={onOpenTvMode}
                className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Tv className="w-3.5 h-3.5 text-amber-400" />
                <span>{L.previewTvBtn}</span>
              </button>
            )}
            <button
              onClick={handleLockAdmin}
              className="px-3.5 py-1.5 rounded-xl bg-stone-800 hover:bg-rose-950/60 text-stone-300 hover:text-rose-200 border border-stone-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{L.lockExitBtn}</span>
            </button>
          </div>
        </div>

        {/* Inline Change Password Form */}
        {showChangePasswordBox && (
          <form
            onSubmit={handleSaveNewPassword}
            className="p-4 rounded-2xl bg-stone-950 border border-amber-500/40 flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
          >
            <div className="flex items-center gap-2 text-xs font-bold text-amber-300 shrink-0">
              <KeyRound className="w-4 h-4" />
              <span>{L.newPassTitle}:</span>
            </div>
            <input
              type="text"
              value={newPasswordInput}
              onChange={(e) => setNewPasswordInput(e.target.value)}
              placeholder={L.newPassPlaceholder}
              className="flex-1 p-2 rounded-xl bg-stone-900 border border-stone-700 text-xs text-white font-mono"
            />
            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-extrabold text-xs cursor-pointer"
              >
                {L.saveNewPassBtn}
              </button>
              <button
                type="button"
                onClick={() => setShowChangePasswordBox(false)}
                className="px-3 py-2 rounded-xl bg-stone-800 text-stone-300 text-xs font-semibold cursor-pointer"
              >
                {L.cancelBtn}
              </button>
            </div>
          </form>
        )}

        {/* Factory Reset Modal with Password Verification */}
        {showResetModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
            <div className="max-w-md w-full p-6 sm:p-7 rounded-3xl bg-stone-900 border border-rose-500/50 shadow-2xl space-y-5 animate-in zoom-in-95">
              <div className="flex items-center gap-3">
                <span className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400">
                  <AlertTriangle className="w-6 h-6" />
                </span>
                <div>
                  <h3 className="text-base font-black text-white font-serif">
                    {L.resetModalTitle}
                  </h3>
                  <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">
                    Amika Security Guard
                  </span>
                </div>
              </div>

              <p className="text-xs text-stone-300 leading-relaxed">
                {L.resetModalDesc}
              </p>

              <form onSubmit={handleConfirmReset} className="space-y-4">
                <div>
                  <input
                    type="password"
                    value={resetPasswordInput}
                    onChange={(e) => {
                      setResetPasswordInput(e.target.value);
                      if (resetPasswordError) setResetPasswordError(false);
                    }}
                    placeholder={L.resetPassPlaceholder}
                    autoFocus
                    className="w-full px-4 py-3 rounded-2xl bg-stone-950 border border-stone-700 focus:border-rose-500 focus:outline-none text-xs sm:text-sm text-white font-mono"
                  />
                </div>

                {resetPasswordError && (
                  <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-200 text-xs font-bold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{L.wrongPassword}</span>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowResetModal(false);
                      setResetPasswordInput('');
                      setResetPasswordError(false);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold transition cursor-pointer"
                  >
                    {L.cancelBtn}
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-black text-xs shadow-lg shadow-rose-950/60 transition active:scale-95 cursor-pointer flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{L.resetConfirmBtn}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Toast Notification */}
      {toastMsg && (
        <div className="p-4 rounded-2xl bg-emerald-950 border border-emerald-400 text-emerald-200 text-xs sm:text-sm font-bold flex items-center gap-2.5 shadow-2xl animate-in fade-in">
          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Navigation Tabs (Designed for Tablet & Desktop) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 bg-stone-900/90 p-2 rounded-2xl border border-stone-800">
        <button
          onClick={() => setSubTab('both_columns')}
          className={`py-3 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
            subTab === 'both_columns'
              ? 'bg-amber-600 text-stone-950 font-extrabold shadow-md'
              : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          <Columns className="w-4 h-4" />
          <span>{L.tabBoth}</span>
        </button>

        <button
          onClick={() => setSubTab('coffee')}
          className={`py-3 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
            subTab === 'coffee'
              ? 'bg-amber-600 text-stone-950 font-extrabold shadow-md'
              : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          <Coffee className="w-4 h-4" />
          <span>
            {L.tabCoffee} ({draftConfig.coffeeItems.length})
          </span>
        </button>

        <button
          onClick={() => setSubTab('desserts')}
          className={`py-3 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
            subTab === 'desserts'
              ? 'bg-rose-600 text-white font-extrabold shadow-md'
              : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          <Cake className="w-4 h-4" />
          <span>
            {L.tabDesserts} ({draftConfig.dessertItems.length})
          </span>
        </button>

        <button
          onClick={() => setSubTab('slides')}
          className={`py-3 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
            subTab === 'slides'
              ? 'bg-indigo-600 text-white font-extrabold shadow-md'
              : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          <span>
            {L.tabSlides} ({draftConfig.slides.length})
          </span>
        </button>

        <button
          onClick={() => {
            setSubTab('loyalty');
            loadLoyaltyCards();
          }}
          className={`py-3 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
            subTab === 'loyalty'
              ? 'bg-emerald-600 text-white font-extrabold shadow-md'
              : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>
            {language === 'ro' ? '4. Loialitate (Test)' : '4. Лояльность (Тест)'}
          </span>
        </button>
      </div>

      {/* ================= VIEW 0: BOTH COLUMNS SIDE-BY-SIDE (TABLET / PC) ================= */}
      {subTab === 'both_columns' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {renderCoffeeEditor()}
          {renderDessertsEditor()}
        </div>
      )}

      {/* ================= VIEW 1: COFFEE COLUMN ONLY ================= */}
      {subTab === 'coffee' && <div className="max-w-4xl mx-auto">{renderCoffeeEditor()}</div>}

      {/* ================= VIEW 2: DESSERTS COLUMN ONLY ================= */}
      {subTab === 'desserts' && <div className="max-w-4xl mx-auto">{renderDessertsEditor()}</div>}

      {/* ================= VIEW 3: PHOTO CAROUSEL EDITOR (MULTI-COLUMN GRID ON TABLET/PC) ================= */}
      {subTab === 'slides' && (
        <div className="space-y-6">
          {/* Upload Custom Photos Box */}
          <div className="p-5 rounded-3xl bg-indigo-950/40 border border-indigo-500/40 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="p-2.5 rounded-2xl bg-indigo-500/20 text-indigo-300">
                  <Camera className="w-6 h-6" />
                </span>
                <div>
                  <h4 className="text-sm sm:text-base font-extrabold text-white uppercase tracking-wider">
                    {L.slidesHeaderTitle} ({draftConfig.slides.length} {L.slidesWord})
                  </h4>
                  <p className="text-xs text-stone-300">{L.slidesHeaderDesc}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  onClick={() => fileInputNewSlidesRef.current?.click()}
                  disabled={isUploadingPhoto}
                  className="py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-lg transition active:scale-95 cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  <span>{isUploadingPhoto ? L.uploadingPhotosBtn : L.uploadPhotosBtn}</span>
                </button>
                <input
                  ref={fileInputNewSlidesRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleUploadNewSlidePhotos}
                  className="hidden"
                />

                <button
                  onClick={() => setShowInstaPicker(!showInstaPicker)}
                  className="py-3 px-4 rounded-2xl bg-stone-800 hover:bg-stone-700 text-amber-300 border border-amber-500/30 font-bold text-xs sm:text-sm flex items-center gap-2 transition active:scale-95 cursor-pointer"
                >
                  <FolderOpen className="w-4 h-4" />
                  <span>{L.pickFromGalleryBtn}</span>
                </button>
              </div>
            </div>

            {/* Built-in Instagram Gallery Picker */}
            {showInstaPicker && (
              <div className="p-4 rounded-2xl bg-stone-950 border border-stone-800 space-y-3">
                <div className="text-xs font-bold text-amber-400">{L.galleryPickerHint}</div>
                <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-8 gap-2.5">
                  {BUILTIN_INSTA_GALLERY.map((g, i) => (
                    <button
                      key={i}
                      onClick={() => handleAddFromGallery(g.path, g.label)}
                      className="group relative rounded-xl overflow-hidden border border-stone-700 hover:border-amber-400 aspect-square bg-stone-900 text-left cursor-pointer"
                    >
                      <img
                        src={import.meta.env.BASE_URL + g.path}
                        alt={g.label}
                        className="w-full h-full object-cover group-hover:scale-105 transition"
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-black/75 p-1 text-[10px] text-white font-semibold leading-tight truncate">
                        {g.label}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Slides Grid: 2 columns on Tablet, 3 columns on Desktop */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {draftConfig.slides.map((slide, idx) => {
              const imgSrc =
                slide.image.startsWith('data:') || slide.image.startsWith('http')
                  ? slide.image
                  : import.meta.env.BASE_URL + slide.image;

              return (
                <div
                  key={slide.id}
                  className={`p-4 rounded-3xl border space-y-3.5 flex flex-col justify-between transition ${
                    slide.visible
                      ? 'bg-stone-900/90 border-stone-800 hover:border-stone-700'
                      : 'bg-stone-950/50 border-stone-800/40 opacity-60'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Slide Header Controls */}
                    <div className="flex items-center justify-between border-b border-stone-800 pb-2.5">
                      <span className="text-xs sm:text-sm font-extrabold text-indigo-400 font-mono">
                        {L.slideNumOf}
                        {idx + 1} {L.slideOf} {draftConfig.slides.length}
                      </span>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => moveSlide(idx, -1)}
                          disabled={idx === 0}
                          className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 disabled:opacity-30 text-stone-300"
                          title={L.moveUp}
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => moveSlide(idx, 1)}
                          disabled={idx === draftConfig.slides.length - 1}
                          className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 disabled:opacity-30 text-stone-300"
                          title={L.moveDown}
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => updateSlide(idx, { visible: !slide.visible })}
                          className={`px-2 py-1 rounded-lg border text-xs font-bold flex items-center gap-1 ${
                            slide.visible
                              ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                              : 'bg-stone-800 border-stone-700 text-stone-400'
                          }`}
                        >
                          {slide.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                          <span>{slide.visible ? L.visibleOnTv : L.hiddenOnTv}</span>
                        </button>
                        <button
                          onClick={() => removeSlide(idx)}
                          className="p-1.5 rounded-lg bg-rose-950/50 hover:bg-rose-900/70 text-rose-300 border border-rose-500/30"
                          title={L.deleteItem}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Large Photo Preview + Replace Button */}
                    <div className="relative h-48 rounded-2xl overflow-hidden bg-stone-950 border border-stone-800 group">
                      <img
                        src={imgSrc}
                        alt={slide.title[language]}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-transparent to-transparent" />
                      <label className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-900/90 hover:bg-indigo-600 text-white border border-stone-700 text-xs font-bold cursor-pointer shadow-lg transition">
                        <Camera className="w-3.5 h-3.5 text-amber-400" />
                        <span>{L.replacePhotoBtn}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleReplaceSlidePhoto(idx, e.target.files?.[0])}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {/* Badge RO / RU */}
                    <div>
                      <label className="text-[11px] text-stone-400 block mb-1">
                        {L.slideBadgeLabel}
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="RO badge"
                          value={slide.badge.ro}
                          onChange={(e) =>
                            updateSlide(idx, { badge: { ...slide.badge, ro: e.target.value } })
                          }
                          className="w-full p-2 rounded-xl bg-stone-950 border border-stone-700 text-xs text-amber-300 font-bold"
                        />
                        <input
                          type="text"
                          placeholder="RU бейдж"
                          value={slide.badge.ru}
                          onChange={(e) =>
                            updateSlide(idx, { badge: { ...slide.badge, ru: e.target.value } })
                          }
                          className="w-full p-2 rounded-xl bg-stone-950 border border-stone-700 text-xs text-amber-300 font-bold"
                        />
                      </div>
                    </div>

                    {/* Slide Title RO / RU */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[11px] text-stone-400 block mb-1">{L.slideTitleRo}</label>
                        <input
                          type="text"
                          value={slide.title.ro}
                          onChange={(e) =>
                            updateSlide(idx, { title: { ...slide.title, ro: e.target.value } })
                          }
                          className="w-full p-2 rounded-xl bg-stone-950 border border-stone-700 text-xs text-white font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-stone-400 block mb-1">{L.slideTitleRu}</label>
                        <input
                          type="text"
                          value={slide.title.ru}
                          onChange={(e) =>
                            updateSlide(idx, { title: { ...slide.title, ru: e.target.value } })
                          }
                          className="w-full p-2 rounded-xl bg-stone-950 border border-stone-700 text-xs text-white font-bold"
                        />
                      </div>
                    </div>

                    {/* Slide Subtitle RO / RU */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[11px] text-stone-400 block mb-1">{L.slideSubtitleRo}</label>
                        <input
                          type="text"
                          value={slide.subtitle.ro}
                          onChange={(e) =>
                            updateSlide(idx, { subtitle: { ...slide.subtitle, ro: e.target.value } })
                          }
                          className="w-full p-2 rounded-xl bg-stone-950 border border-stone-800 text-xs text-amber-200"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-stone-400 block mb-1">{L.slideSubtitleRu}</label>
                        <input
                          type="text"
                          value={slide.subtitle.ru}
                          onChange={(e) =>
                            updateSlide(idx, { subtitle: { ...slide.subtitle, ru: e.target.value } })
                          }
                          className="w-full p-2 rounded-xl bg-stone-950 border border-stone-800 text-xs text-amber-200"
                        />
                      </div>
                    </div>

                    {/* Slide Details RO / RU */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[11px] text-stone-400 block mb-1">{L.slideDetailsRo}</label>
                        <input
                          type="text"
                          value={slide.details.ro}
                          onChange={(e) =>
                            updateSlide(idx, { details: { ...slide.details, ro: e.target.value } })
                          }
                          className="w-full p-2 rounded-xl bg-stone-950 border border-stone-800 text-xs text-stone-300"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-stone-400 block mb-1">{L.slideDetailsRu}</label>
                        <input
                          type="text"
                          value={slide.details.ru}
                          onChange={(e) =>
                            updateSlide(idx, { details: { ...slide.details, ru: e.target.value } })
                          }
                          className="w-full p-2 rounded-xl bg-stone-950 border border-stone-800 text-xs text-stone-300"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================= VIEW 4: LOYALTY CARDS MANAGER (ADMIN / TEST) ================= */}
      {subTab === 'loyalty' && (
        <div className="space-y-6 max-w-4xl mx-auto">
          {/* Card Stamp Adjustment Card */}
          <div className="p-6 rounded-3xl bg-stone-900 border border-emerald-500/40 shadow-2xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-serif">
                    {language === 'ro'
                      ? 'Gestiune Carduri de Loialitate (Test & Admin)'
                      : 'Управление Картами Лояльности (Тест & Админ)'}
                  </h3>
                  <p className="text-xs text-stone-400">
                    {language === 'ro'
                      ? 'Editați manual numărul de cești (0..6) pentru orice client în Supabase'
                      : 'Ручная корректировка чашек гостя (0..6) в Supabase'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={loadLoyaltyCards}
                disabled={isLoadingLoyalty}
                className="px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-750 text-stone-300 text-xs font-bold flex items-center gap-1.5 transition self-start sm:self-auto cursor-pointer"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${isLoadingLoyalty ? 'animate-spin' : ''}`} />
                <span>{language === 'ro' ? 'Reîncarcă' : 'Обновить'}</span>
              </button>
            </div>

            {/* Quick Adjustment Form */}
            <div className="p-4 rounded-2xl bg-stone-950/80 border border-stone-800 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block mb-1">
                    {language === 'ro' ? 'Număr Card (ex. AMIKA-8492)' : 'Номер карты'}
                  </label>
                  <input
                    type="text"
                    value={editingCardNumber}
                    onChange={(e) => setEditingCardNumber(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-stone-900 border border-stone-750 text-xs text-white font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block mb-1">
                    Telegram User ID
                  </label>
                  <input
                    type="number"
                    value={editingTgUserId}
                    onChange={(e) => setEditingTgUserId(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-stone-900 border border-stone-750 text-xs text-white font-mono"
                    placeholder="1001"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block mb-1">
                    {language === 'ro' ? 'Nume Oaspete' : 'Имя гостя'}
                  </label>
                  <input
                    type="text"
                    value={editingCustomerName}
                    onChange={(e) => setEditingCustomerName(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-stone-900 border border-stone-750 text-xs text-white"
                    placeholder="Ion"
                  />
                </div>
              </div>

              {/* Stamp selector buttons 0..6 */}
              <div>
                <label className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block mb-2">
                  {language === 'ro' ? 'Alege numărul de ștampile (0..6):' : 'Установить количество чашек (0..6):'}
                </label>
                <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                  {[0, 1, 2, 3, 4, 5, 6].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setEditingStamps(num)}
                      className={`py-3 rounded-xl text-xs sm:text-sm font-black transition flex flex-col items-center justify-center gap-1 cursor-pointer ${
                        editingStamps === num
                          ? num === 6
                            ? 'bg-amber-400 text-stone-950 ring-2 ring-amber-300 shadow-lg'
                            : 'bg-emerald-500 text-white ring-2 ring-emerald-300 shadow-lg'
                          : 'bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-800'
                      }`}
                    >
                      <Coffee className="w-4 h-4" />
                      <span>{num === 6 ? '🎁 6' : num}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  handleSaveLoyaltyCard(
                    editingCardNumber,
                    Number(editingTgUserId) || 0,
                    editingCustomerName,
                    editingStamps
                  )
                }
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs sm:text-sm font-black flex items-center justify-center gap-2 shadow-lg transition active:scale-98 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>
                  {language === 'ro'
                    ? `Salvează cardul ${editingCardNumber} (${editingStamps}/6)`
                    : `Сохранить карту ${editingCardNumber} (${editingStamps}/6 чашек)`}
                </span>
              </button>
            </div>

            {/* List of existing cards */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-stone-400">
                <span>
                  {language === 'ro' ? 'Carduri înregistrate' : 'Зарегистрированные карты'} (
                  {loyaltyCardsList.length})
                </span>
                <input
                  type="text"
                  placeholder={language === 'ro' ? 'Căutare card...' : 'Поиск карты...'}
                  value={loyaltySearch}
                  onChange={(e) => setLoyaltySearch(e.target.value)}
                  className="px-2.5 py-1 rounded-lg bg-stone-950 border border-stone-800 text-xs text-white"
                />
              </div>

              <div className="divide-y divide-stone-800/60 rounded-2xl border border-stone-800 bg-stone-950/60 overflow-hidden">
                {loyaltyCardsList
                  .filter(
                    (c) =>
                      !loyaltySearch ||
                      c.cardNumber.toLowerCase().includes(loyaltySearch.toLowerCase()) ||
                      (c.customerName &&
                        c.customerName.toLowerCase().includes(loyaltySearch.toLowerCase()))
                  )
                  .map((card) => (
                    <div
                      key={card.cardNumber}
                      className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-stone-900/60 transition"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold text-xs shrink-0">
                          {card.currentStamps}/6
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-white text-xs">
                              {card.cardNumber}
                            </span>
                            {card.customerName && (
                              <span className="text-xs text-stone-300 font-semibold">
                                • {card.customerName}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-stone-500">
                            TG ID: {card.telegramUserId || 'N/A'} • Gratuit: {card.totalFreeCoffeesEarned}
                          </span>
                        </div>
                      </div>

                      {/* Quick adjust buttons */}
                      <div className="flex items-center gap-1.5 self-end sm:self-auto">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCardNumber(card.cardNumber);
                            setEditingTgUserId(String(card.telegramUserId || ''));
                            setEditingCustomerName(card.customerName || '');
                            setEditingStamps(card.currentStamps);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-750 text-stone-300 text-[11px] font-bold cursor-pointer"
                        >
                          {language === 'ro' ? 'Selectează' : 'Выбрать'}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleSaveLoyaltyCard(
                              card.cardNumber,
                              card.telegramUserId || 0,
                              card.customerName || '',
                              Math.max(0, card.currentStamps - 1)
                            )
                          }
                          className="px-2.5 py-1 rounded-lg bg-stone-850 hover:bg-stone-800 text-stone-300 text-xs font-bold cursor-pointer"
                        >
                          -1
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleSaveLoyaltyCard(
                              card.cardNumber,
                              card.telegramUserId || 0,
                              card.customerName || '',
                              Math.min(6, card.currentStamps + 1)
                            )
                          }
                          className="px-2.5 py-1 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 text-xs font-bold border border-emerald-500/30 cursor-pointer"
                        >
                          +1
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleSaveLoyaltyCard(
                              card.cardNumber,
                              card.telegramUserId || 0,
                              card.customerName || '',
                              6
                            )
                          }
                          className="px-2.5 py-1 rounded-lg bg-amber-500/30 hover:bg-amber-500/50 text-amber-300 text-xs font-bold border border-amber-500/30 cursor-pointer"
                        >
                          🎁 6
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sticky / Bottom Save Bar for Tablet & Desktop */}
      <div className="pt-4 border-t border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-xs text-stone-400">
          {hasUnsavedChanges ? (
            <span className="text-amber-400 font-bold">{L.bottomUnsavedText}</span>
          ) : (
            <span>{L.bottomSavedText}</span>
          )}
        </div>

        <button
          onClick={handleSaveAndSync}
          disabled={isSaving}
          className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-950/60 transition active:scale-98 cursor-pointer"
        >
          <Sparkles className="w-5 h-5" />
          <span>{isSaving ? L.savingBtn : L.saveBtn}</span>
        </button>
      </div>
    </div>
  );
};
