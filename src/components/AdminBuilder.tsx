import React, { useState, useRef } from 'react';
import type { Language } from '../types';
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
  AlertCircle,
  Undo2,
} from 'lucide-react';

interface AdminBuilderProps {
  language: Language;
  onExitAdminMode?: () => void;
  onOpenTvMode?: () => void;
}

export const AdminBuilder: React.FC<AdminBuilderProps> = ({
  language,
  onExitAdminMode,
  onOpenTvMode,
}) => {
  // Local draft state: edits NEVER trigger TV updates until "Save & Send to TV" is clicked
  const [draftConfig, setDraftConfig] = useState<TvBoardConfig>(() => loadTvConfig());
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);

  // Default to side-by-side 2-column view for Tablet / PC convenience
  const [subTab, setSubTab] = useState<'both_columns' | 'coffee' | 'desserts' | 'slides'>('both_columns');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [showInstaPicker, setShowInstaPicker] = useState<boolean>(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState<boolean>(false);

  const fileInputNewSlidesRef = useRef<HTMLInputElement | null>(null);
  const jsonImportRef = useRef<HTMLInputElement | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4500);
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
    showToast('↩️ Несохранённые правки отменены');
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

  // Reset to factory defaults
  const handleResetDefaults = () => {
    if (
      !window.confirm(
        language === 'ro'
          ? 'Sigur doriți să încărcați meniul și fotografiile implicite Amika Café în editor?'
          : 'Загрузить стандартное меню и фотографии Amika Café по умолчанию? (Для отправки на ТВ нажмите «Сохранить и отправить на ТВ»)'
      )
    ) {
      return;
    }
    const fresh = JSON.parse(JSON.stringify(DEFAULT_TV_CONFIG)) as TvBoardConfig;
    updateDraft(fresh);
    showToast('🔄 Стандартное меню загружено в черновик. Нажмите «Сохранить и отправить на ТВ» для применения.');
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
    showToast('📥 Резервная копия меню и фото скачана на устройство!');
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
          showToast('📂 Копия загружена в редактор! Проверьте данные и нажмите «Сохранить и отправить на ТВ».');
        } else {
          showToast('⚠️ Неверный формат файла резервной копии');
        }
      } catch {
        showToast('⚠️ Ошибка чтения JSON-файла');
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
    showToast('☕ Позиция добавлена в черновик (Колонка 1)');
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
      name: { ro: 'Desert Artizanal Nou', ru: 'Новый десерт Foodberry' },
      desc: { ro: 'Ingrediente naturale premium', ru: 'Натуральные ингредиенты, ручная работа' },
      price: 55,
      discountPrice: 39,
      badge: { ro: 'FOODBERRY', ru: 'FOODBERRY' },
      visible: true,
    };
    updateDraft({
      ...draftConfig,
      dessertItems: [...draftConfig.dessertItems, newItem],
    });
    showToast('🥐 Позиция добавлена в черновик (Колонка 2)');
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
      showToast('⚠️ В карусели должен оставаться хотя бы 1 слайд');
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
      showToast(
        `📸 Добавлено в черновик фото: ${addedSlides.length} шт. Нажмите «Сохранить и отправить на ТВ», когда будете готовы!`
      );
    } catch {
      showToast('⚠️ Не удалось обработать изображение');
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
      showToast(`📸 Фото слайда №${idx + 1} заменено в черновике!`);
    } catch {
      showToast('⚠️ Ошибка при загрузке фото');
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
    showToast(`🖼 Слайд «${label}» добавлен в черновик`);
  };

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
              Колонка 1: Кофе и Напитки ({draftConfig.coffeeItems.length})
            </h4>
            <p className="text-[11px] text-stone-400">
              Левая колонка меню на телевизоре
            </p>
          </div>
        </div>
        <button
          onClick={addCoffeeItem}
          className="px-3 py-2 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/40 text-amber-300 font-bold text-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Добавить напиток</span>
        </button>
      </div>

      {/* Column Header Settings */}
      <div className="p-3.5 rounded-2xl bg-stone-900/90 border border-stone-800 space-y-2">
        <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
          Заголовок первой колонки (RO / RU)
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] text-stone-400 block mb-1">Заголовок (RO)</label>
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
            <label className="text-[11px] text-stone-400 block mb-1">Заголовок (RU)</label>
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
              <span className="text-xs sm:text-sm font-extrabold text-amber-400 font-mono">
                #{idx + 1} • {item.name.ru || item.name.ro}
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => moveCoffeeItem(idx, -1)}
                  disabled={idx === 0}
                  className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 disabled:opacity-30 text-stone-300"
                  title="Переместить выше"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
                <button
                  onClick={() => moveCoffeeItem(idx, 1)}
                  disabled={idx === draftConfig.coffeeItems.length - 1}
                  className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 disabled:opacity-30 text-stone-300"
                  title="Переместить ниже"
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
                  title={item.visible ? 'Показан на ТВ' : 'Скрыт на ТВ'}
                >
                  {item.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  <span className="hidden sm:inline">{item.visible ? 'Виден' : 'Скрыт'}</span>
                </button>
                <button
                  onClick={() => removeCoffeeItem(idx)}
                  className="p-1.5 rounded-lg bg-rose-950/50 hover:bg-rose-900/70 text-rose-300 border border-rose-500/30"
                  title="Удалить позицию"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Names RO / RU */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-stone-400 block mb-1">Наименование (RO)</label>
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
                <label className="text-[11px] text-stone-400 block mb-1">Наименование (RU)</label>
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

            {/* Price, Volume, Badge */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] text-amber-400 font-bold block mb-1">Цена (MDL)</label>
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
                <label className="text-[11px] text-stone-400 block mb-1">Объем (мл)</label>
                <input
                  type="text"
                  value={item.volume}
                  onChange={(e) => updateCoffeeItem(idx, { volume: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-stone-950 border border-stone-700 focus:border-amber-500 focus:outline-none text-xs sm:text-sm text-stone-200 font-mono"
                />
              </div>
              <div>
                <label className="text-[11px] text-stone-400 block mb-1">Бейдж (ХИТ/TOP)</label>
                <input
                  type="text"
                  placeholder="Пусто или ХИТ"
                  value={item.badge ? item.badge.ru : ''}
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
                <label className="text-[11px] text-stone-400 block mb-1">Описание (RO)</label>
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
                <label className="text-[11px] text-stone-400 block mb-1">Описание (RU)</label>
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
        <span>Добавить напиток в Колонку 1</span>
      </button>
    </div>
  );

  // Render Desserts Column Editor Block
  const renderDessertsEditor = () => (
    <div className="space-y-4 bg-stone-900/40 p-4 sm:p-5 rounded-3xl border border-stone-800/90">
      <div className="flex items-center justify-between border-b border-stone-800 pb-3">
        <div className="flex items-center gap-2.5">
          <span className="p-2 rounded-xl bg-rose-500/20 text-rose-400">
            <Cake className="w-5 h-5" />
          </span>
          <div>
            <h4 className="text-sm sm:text-base font-extrabold text-white font-serif">
              Колонка 2: Десерты и Выпечка ({draftConfig.dessertItems.length})
            </h4>
            <p className="text-[11px] text-stone-400">
              Вторая колонка меню на телевизоре
            </p>
          </div>
        </div>
        <button
          onClick={addDessertItem}
          className="px-3 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-300 font-bold text-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Добавить десерт</span>
        </button>
      </div>

      {/* Column Header Settings */}
      <div className="p-3.5 rounded-2xl bg-stone-900/90 border border-stone-800 space-y-2">
        <div className="text-[11px] font-bold text-rose-400 uppercase tracking-wider">
          Заголовок второй колонки (RO / RU)
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] text-stone-400 block mb-1">Заголовок (RO)</label>
            <input
              type="text"
              value={draftConfig.dessertHeader.ro}
              onChange={(e) =>
                updateDraft({
                  ...draftConfig,
                  dessertHeader: { ...draftConfig.dessertHeader, ro: e.target.value },
                })
              }
              className="w-full p-2.5 rounded-xl bg-stone-950 border border-stone-700 focus:border-rose-500 focus:outline-none text-xs sm:text-sm text-white font-bold"
            />
          </div>
          <div>
            <label className="text-[11px] text-stone-400 block mb-1">Заголовок (RU)</label>
            <input
              type="text"
              value={draftConfig.dessertHeader.ru}
              onChange={(e) =>
                updateDraft({
                  ...draftConfig,
                  dessertHeader: { ...draftConfig.dessertHeader, ru: e.target.value },
                })
              }
              className="w-full p-2.5 rounded-xl bg-stone-950 border border-stone-700 focus:border-rose-500 focus:outline-none text-xs sm:text-sm text-white font-bold"
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
              <span className="text-xs sm:text-sm font-extrabold text-rose-400 font-mono">
                #{idx + 1} • {item.name.ru || item.name.ro}
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => moveDessertItem(idx, -1)}
                  disabled={idx === 0}
                  className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 disabled:opacity-30 text-stone-300"
                  title="Переместить выше"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
                <button
                  onClick={() => moveDessertItem(idx, 1)}
                  disabled={idx === draftConfig.dessertItems.length - 1}
                  className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 disabled:opacity-30 text-stone-300"
                  title="Переместить ниже"
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
                  title={item.visible ? 'Показан на ТВ' : 'Скрыт на ТВ'}
                >
                  {item.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  <span className="hidden sm:inline">{item.visible ? 'Виден' : 'Скрыт'}</span>
                </button>
                <button
                  onClick={() => removeDessertItem(idx)}
                  className="p-1.5 rounded-lg bg-rose-950/50 hover:bg-rose-900/70 text-rose-300 border border-rose-500/30"
                  title="Удалить позицию"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Names RO / RU */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-stone-400 block mb-1">Наименование (RO)</label>
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
                <label className="text-[11px] text-stone-400 block mb-1">Наименование (RU)</label>
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

            {/* Price, Discount Price, Badge */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] text-amber-400 font-bold block mb-1">Цена (MDL)</label>
                <input
                  type="number"
                  value={item.price}
                  onChange={(e) => {
                    const p = Number(e.target.value) || 0;
                    updateDessertItem(idx, {
                      price: p,
                      discountPrice: Math.round(p * 0.7),
                    });
                  }}
                  className="w-full p-2.5 rounded-xl bg-stone-950 border border-amber-500/50 focus:border-amber-400 focus:outline-none text-xs sm:text-sm text-amber-300 font-mono font-black"
                />
              </div>
              <div>
                <label className="text-[11px] text-rose-400 font-bold block mb-1">Вечер -30% (L)</label>
                <input
                  type="number"
                  value={item.discountPrice}
                  onChange={(e) =>
                    updateDessertItem(idx, { discountPrice: Number(e.target.value) || 0 })
                  }
                  className="w-full p-2.5 rounded-xl bg-stone-950 border border-rose-500/50 focus:border-rose-400 focus:outline-none text-xs sm:text-sm text-rose-300 font-mono font-black"
                />
              </div>
              <div>
                <label className="text-[11px] text-stone-400 block mb-1">Бейдж</label>
                <input
                  type="text"
                  placeholder="FOODBERRY"
                  value={item.badge ? item.badge.ru : ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    updateDessertItem(idx, {
                      badge: val.trim() ? { ro: val, ru: val } : null,
                    });
                  }}
                  className="w-full p-2.5 rounded-xl bg-stone-950 border border-stone-700 focus:border-rose-500 focus:outline-none text-xs sm:text-sm text-rose-300 font-bold"
                />
              </div>
            </div>

            {/* Description RO / RU */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-stone-400 block mb-1">Состав / Описание (RO)</label>
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
                <label className="text-[11px] text-stone-400 block mb-1">Состав / Описание (RU)</label>
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
        <span>Добавить десерт / выпечку в Колонку 2</span>
      </button>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-16">
      {/* Top Desktop/Tablet Action Bar */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-amber-950/70 via-stone-900 to-stone-900 border border-amber-500/40 shadow-2xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
                Кабинет Администратора • Планшет / ПК
              </span>
              {hasUnsavedChanges ? (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500 text-stone-950 flex items-center gap-1 animate-pulse">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Есть несохранённые правки</span>
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Синхронизировано с ТВ</span>
                </span>
              )}
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white font-serif mt-1.5">
              Управление 2 колонками меню и Фото-каруселью ТВ
            </h2>
            <p className="text-xs sm:text-sm text-stone-300 mt-1">
              Спокойно вносите любые изменения в текст, цены и фото — телевизор <b className="text-amber-300">НЕ</b> дергается при вводе символов и обновится только после нажатия кнопки <b className="text-emerald-400">«Сохранить и отправить на ТВ»</b>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {hasUnsavedChanges && (
              <button
                onClick={handleDiscardDraft}
                className="px-3.5 py-3 rounded-2xl bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                title="Отменить несохраненные изменения"
              >
                <Undo2 className="w-4 h-4 text-amber-400" />
                <span>Отменить правки</span>
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
              <span>
                {isSaving
                  ? 'Отправка на телевизор...'
                  : '💾 Сохранить и отправить на ТВ'}
              </span>
            </button>
          </div>
        </div>

        {/* Secondary Toolbar: Backup, Restore, Preview TV, Exit */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-stone-800/80">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportJson}
              className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>Скачать резервную копию (.json)</span>
            </button>

            <button
              onClick={() => jsonImportRef.current?.click()}
              className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-sky-400" />
              <span>Восстановить из копии</span>
            </button>
            <input
              ref={jsonImportRef}
              type="file"
              accept=".json"
              onChange={handleImportJson}
              className="hidden"
            />

            <button
              onClick={handleResetDefaults}
              className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-rose-950/60 text-stone-400 hover:text-rose-300 border border-stone-700/80 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Сбросить к заводским</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {onOpenTvMode && (
              <button
                onClick={onOpenTvMode}
                className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Tv className="w-3.5 h-3.5 text-amber-400" />
                <span>Предпросмотр ТВ-экрана</span>
              </button>
            )}
            {onExitAdminMode && (
              <button
                onClick={onExitAdminMode}
                className="px-3.5 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 text-xs font-semibold transition cursor-pointer"
              >
                {language === 'ro' ? 'Închide Admin' : 'Вернуться к витрине'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMsg && (
        <div className="p-4 rounded-2xl bg-emerald-950 border border-emerald-400 text-emerald-200 text-xs sm:text-sm font-bold flex items-center gap-2.5 shadow-2xl animate-in fade-in">
          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Navigation Tabs (Designed for Tablet & Desktop) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-stone-900/90 p-2 rounded-2xl border border-stone-800">
        <button
          onClick={() => setSubTab('both_columns')}
          className={`py-3 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
            subTab === 'both_columns'
              ? 'bg-amber-600 text-stone-950 font-extrabold shadow-md'
              : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          <Columns className="w-4 h-4" />
          <span>Обе колонки рядом (ПК/Планшет)</span>
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
          <span>1. Колонка Кофе ({draftConfig.coffeeItems.length})</span>
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
          <span>2. Колонка Десерты ({draftConfig.dessertItems.length})</span>
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
          <span>3. Фото-карусель ({draftConfig.slides.length})</span>
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
      {subTab === 'coffee' && (
        <div className="max-w-4xl mx-auto">
          {renderCoffeeEditor()}
        </div>
      )}

      {/* ================= VIEW 2: DESSERTS COLUMN ONLY ================= */}
      {subTab === 'desserts' && (
        <div className="max-w-4xl mx-auto">
          {renderDessertsEditor()}
        </div>
      )}

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
                    Правая часть экрана ТВ: Фото-карусель ({draftConfig.slides.length} слайдов)
                  </h4>
                  <p className="text-xs text-stone-300">
                    Загружайте любое количество своих фотографий с компьютера или планшета. Они автоматически оптимизируются под Full HD телевизор.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  onClick={() => fileInputNewSlidesRef.current?.click()}
                  disabled={isUploadingPhoto}
                  className="py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-lg transition active:scale-95 cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  <span>
                    {isUploadingPhoto ? 'Обработка фото...' : '📷 Загрузить свои фото (можно несколько)'}
                  </span>
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
                  <span>🖼 Из коллекции Amika (15 фото)</span>
                </button>
              </div>
            </div>

            {/* Built-in Instagram Gallery Picker */}
            {showInstaPicker && (
              <div className="p-4 rounded-2xl bg-stone-950 border border-stone-800 space-y-3">
                <div className="text-xs font-bold text-amber-400">
                  Нажмите на любое фото из коллекции Amika Café, чтобы добавить его в карусель:
                </div>
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
                        Слайд №{idx + 1} из {draftConfig.slides.length}
                      </span>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => moveSlide(idx, -1)}
                          disabled={idx === 0}
                          className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 disabled:opacity-30 text-stone-300"
                          title="Раньше"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => moveSlide(idx, 1)}
                          disabled={idx === draftConfig.slides.length - 1}
                          className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 disabled:opacity-30 text-stone-300"
                          title="Позже"
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
                          <span>{slide.visible ? 'Вкл' : 'Скрыт'}</span>
                        </button>
                        <button
                          onClick={() => removeSlide(idx)}
                          className="p-1.5 rounded-lg bg-rose-950/50 hover:bg-rose-900/70 text-rose-300 border border-rose-500/30"
                          title="Удалить слайд"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Large Photo Preview + Replace Button */}
                    <div className="relative h-48 rounded-2xl overflow-hidden bg-stone-950 border border-stone-800 group">
                      <img
                        src={imgSrc}
                        alt={slide.title.ru}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-transparent to-transparent" />
                      <label className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-900/90 hover:bg-indigo-600 text-white border border-stone-700 text-xs font-bold cursor-pointer shadow-lg transition">
                        <Camera className="w-3.5 h-3.5 text-amber-400" />
                        <span>Заменить фото</span>
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
                        Верхняя плашка-бейдж (RO / RU)
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
                        <label className="text-[11px] text-stone-400 block mb-1">Заголовок (RO)</label>
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
                        <label className="text-[11px] text-stone-400 block mb-1">Заголовок (RU)</label>
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
                        <label className="text-[11px] text-stone-400 block mb-1">Подзаголовок (RO)</label>
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
                        <label className="text-[11px] text-stone-400 block mb-1">Подзаголовок (RU)</label>
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
                        <label className="text-[11px] text-stone-400 block mb-1">Описание внизу (RO)</label>
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
                        <label className="text-[11px] text-stone-400 block mb-1">Описание внизу (RU)</label>
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

      {/* Sticky / Bottom Save Bar for Tablet & Desktop */}
      <div className="pt-4 border-t border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-xs text-stone-400">
          {hasUnsavedChanges ? (
            <span className="text-amber-400 font-bold">
              ● В черновике есть несохранённые изменения. Нажмите кнопку справа, чтобы отправить их на телевизор.
            </span>
          ) : (
            <span>✓ Все изменения сохранены и отправлены на телевизор.</span>
          )}
        </div>

        <button
          onClick={handleSaveAndSync}
          disabled={isSaving}
          className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-950/60 transition active:scale-98 cursor-pointer"
        >
          <Sparkles className="w-5 h-5" />
          <span>{isSaving ? 'Синхронизация с телевизором...' : '💾 Сохранить и отправить на ТВ'}</span>
        </button>
      </div>
    </div>
  );
};
