import React, { useState, useRef } from 'react';
import type { Language } from '../types';
import {
  type TvBoardConfig,
  type TvCoffeeItem,
  type TvDessertItem,
  type TvSlideItem,
  DEFAULT_TV_CONFIG,
  BUILTIN_INSTA_GALLERY,
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
} from 'lucide-react';

interface AdminBuilderProps {
  language: Language;
  config: TvBoardConfig;
  onChangeConfig: (newConfig: TvBoardConfig) => void;
}

export const AdminBuilder: React.FC<AdminBuilderProps> = ({
  language,
  config,
  onChangeConfig,
}) => {
  const [subTab, setSubTab] = useState<'coffee' | 'desserts' | 'slides'>('coffee');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [showInstaPicker, setShowInstaPicker] = useState<boolean>(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState<boolean>(false);

  const fileInputNewSlidesRef = useRef<HTMLInputElement | null>(null);
  const jsonImportRef = useRef<HTMLInputElement | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Save & Push to TV
  const handleSaveAndSync = async () => {
    setIsSaving(true);
    try {
      await publishTvConfigToCloud(config, (msg) => {
        showToast(msg);
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Reset to factory defaults
  const handleResetDefaults = async () => {
    if (
      !window.confirm(
        language === 'ro'
          ? 'Sigur doriți să reveniți la meniul și fotografiile implicite Amika Café?'
          : 'Вернуть стандартное меню и фотографии Amika Café по умолчанию?'
      )
    ) {
      return;
    }
    const fresh = JSON.parse(JSON.stringify(DEFAULT_TV_CONFIG)) as TvBoardConfig;
    onChangeConfig(fresh);
    await publishTvConfigToCloud(fresh, showToast);
  };

  // Export JSON backup
  const handleExportJson = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(config, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = `amika_cafe_menu_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    showToast('📥 Резервная копия меню и фото скачана!');
  };

  // Import JSON backup
  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const parsed = JSON.parse(String(ev.target?.result || '')) as TvBoardConfig;
        if (parsed && Array.isArray(parsed.coffeeItems) && Array.isArray(parsed.slides)) {
          onChangeConfig(parsed);
          await publishTvConfigToCloud(parsed, showToast);
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

  // ================= COFFEE COLUMN HANDLERS =================
  const updateCoffeeItem = (idx: number, patch: Partial<TvCoffeeItem>) => {
    const next = [...config.coffeeItems];
    next[idx] = { ...next[idx], ...patch };
    onChangeConfig({ ...config, coffeeItems: next });
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
    onChangeConfig({
      ...config,
      coffeeItems: [...config.coffeeItems, newItem],
    });
    showToast('☕ Добавлена новая позиция в колонку Кофе');
  };

  const removeCoffeeItem = (idx: number) => {
    const next = config.coffeeItems.filter((_, i) => i !== idx);
    onChangeConfig({ ...config, coffeeItems: next });
  };

  const moveCoffeeItem = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= config.coffeeItems.length) return;
    const next = [...config.coffeeItems];
    const temp = next[idx];
    next[idx] = next[target];
    next[target] = temp;
    onChangeConfig({ ...config, coffeeItems: next });
  };

  // ================= DESSERT COLUMN HANDLERS =================
  const updateDessertItem = (idx: number, patch: Partial<TvDessertItem>) => {
    const next = [...config.dessertItems];
    next[idx] = { ...next[idx], ...patch };
    onChangeConfig({ ...config, dessertItems: next });
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
    onChangeConfig({
      ...config,
      dessertItems: [...config.dessertItems, newItem],
    });
    showToast('🥐 Добавлена новая позиция в колонку Десертов');
  };

  const removeDessertItem = (idx: number) => {
    const next = config.dessertItems.filter((_, i) => i !== idx);
    onChangeConfig({ ...config, dessertItems: next });
  };

  const moveDessertItem = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= config.dessertItems.length) return;
    const next = [...config.dessertItems];
    const temp = next[idx];
    next[idx] = next[target];
    next[target] = temp;
    onChangeConfig({ ...config, dessertItems: next });
  };

  // ================= SLIDES CAROUSEL HANDLERS =================
  const updateSlide = (idx: number, patch: Partial<TvSlideItem>) => {
    const next = [...config.slides];
    next[idx] = { ...next[idx], ...patch };
    onChangeConfig({ ...config, slides: next });
  };

  const removeSlide = (idx: number) => {
    if (config.slides.length <= 1) {
      showToast('⚠️ В карусели должен оставаться хотя бы 1 слайд');
      return;
    }
    const next = config.slides.filter((_, i) => i !== idx);
    onChangeConfig({ ...config, slides: next });
  };

  const moveSlide = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= config.slides.length) return;
    const next = [...config.slides];
    const temp = next[idx];
    next[idx] = next[target];
    next[target] = temp;
    onChangeConfig({ ...config, slides: next });
  };

  // Upload 1 or multiple custom photos from phone/computer
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

      onChangeConfig({
        ...config,
        slides: [...config.slides, ...addedSlides],
      });
      showToast(`📸 Загружено и сжато новых фото: ${addedSlides.length} шт.! Нажмите «Сохранить» для отправки на ТВ.`);
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
      showToast(`📸 Фото слайда №${idx + 1} обновлено!`);
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
    onChangeConfig({
      ...config,
      slides: [...config.slides, newSlide],
    });
    setShowInstaPicker(false);
    showToast(`🖼 Добавлен слайд «${label}»`);
  };

  return (
    <div className="space-y-4 pb-8">
      {/* Top Save & Sync Banner */}
      <div className="p-4 rounded-3xl bg-gradient-to-br from-amber-950/70 via-stone-900 to-stone-900 border border-amber-500/40 shadow-xl space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 block">
              Кабинет Администратора • TV & Меню
            </span>
            <h3 className="text-base font-bold text-white font-serif">
              Управление 2 колонками и фото-каруселью
            </h3>
          </div>

          <button
            onClick={handleSaveAndSync}
            disabled={isSaving}
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-950/60 transition active:scale-95 shrink-0 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Отправка...' : 'Сохранить на ТВ'}</span>
          </button>
        </div>

        <p className="text-[11px] text-stone-300 leading-relaxed">
          Редактируйте позиции, цены (RO / RU) и загружайте любое количество своих фотографий. При нажатии{' '}
          <b className="text-emerald-400">«Сохранить на ТВ»</b> экран телевизора обновится автоматически!
        </p>

        {/* Backup / Restore Row */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-stone-800/80">
          <button
            onClick={handleExportJson}
            className="px-2.5 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-[11px] font-semibold flex items-center gap-1 transition"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>Скачать копию</span>
          </button>

          <button
            onClick={() => jsonImportRef.current?.click()}
            className="px-2.5 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-[11px] font-semibold flex items-center gap-1 transition"
          >
            <Upload className="w-3.5 h-3.5 text-sky-400" />
            <span>Загрузить копию</span>
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
            className="px-2.5 py-1.5 rounded-xl bg-stone-800 hover:bg-rose-950/60 text-stone-400 hover:text-rose-300 text-[11px] font-semibold flex items-center gap-1 transition ml-auto"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Сброс</span>
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMsg && (
        <div className="p-3 rounded-2xl bg-emerald-950 border border-emerald-400 text-emerald-200 text-xs font-bold flex items-center gap-2 shadow-xl animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Sub-navigation: 3 Sections */}
      <div className="grid grid-cols-3 gap-1.5 bg-stone-950 p-1.5 rounded-2xl border border-stone-800">
        <button
          onClick={() => setSubTab('coffee')}
          className={`py-2.5 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
            subTab === 'coffee'
              ? 'bg-amber-600 text-stone-950 font-extrabold shadow-md'
              : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          <Coffee className="w-3.5 h-3.5" />
          <span>1. Кофе ({config.coffeeItems.length})</span>
        </button>

        <button
          onClick={() => setSubTab('desserts')}
          className={`py-2.5 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
            subTab === 'desserts'
              ? 'bg-rose-600 text-white font-extrabold shadow-md'
              : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          <Cake className="w-3.5 h-3.5" />
          <span>2. Десерты ({config.dessertItems.length})</span>
        </button>

        <button
          onClick={() => setSubTab('slides')}
          className={`py-2.5 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
            subTab === 'slides'
              ? 'bg-indigo-600 text-white font-extrabold shadow-md'
              : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5" />
          <span>3. Фото ({config.slides.length})</span>
        </button>
      </div>

      {/* ================= SECTION 1: COFFEE COLUMN EDITOR ================= */}
      {subTab === 'coffee' && (
        <div className="space-y-3">
          {/* Column Header Settings */}
          <div className="p-3.5 rounded-2xl bg-stone-900/90 border border-stone-800 space-y-2.5">
            <div className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              Заголовок первой колонки (Кофе и Напитки)
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-stone-400 block mb-0.5">Заголовок (RO)</label>
                <input
                  type="text"
                  value={config.coffeeHeader.ro}
                  onChange={(e) =>
                    onChangeConfig({
                      ...config,
                      coffeeHeader: { ...config.coffeeHeader, ro: e.target.value },
                    })
                  }
                  className="w-full p-2 rounded-xl bg-stone-950 border border-stone-700 text-xs text-white font-bold"
                />
              </div>
              <div>
                <label className="text-[10px] text-stone-400 block mb-0.5">Заголовок (RU)</label>
                <input
                  type="text"
                  value={config.coffeeHeader.ru}
                  onChange={(e) =>
                    onChangeConfig({
                      ...config,
                      coffeeHeader: { ...config.coffeeHeader, ru: e.target.value },
                    })
                  }
                  className="w-full p-2 rounded-xl bg-stone-950 border border-stone-700 text-xs text-white font-bold"
                />
              </div>
            </div>
          </div>

          {/* Items List */}
          {config.coffeeItems.map((item, idx) => (
            <div
              key={item.id}
              className={`p-3.5 rounded-2xl border space-y-2.5 transition ${
                item.visible
                  ? 'bg-stone-900/80 border-stone-800'
                  : 'bg-stone-950/50 border-stone-800/40 opacity-60'
              }`}
            >
              {/* Item Top Controls */}
              <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                <span className="text-xs font-extrabold text-amber-400 font-mono">
                  #{idx + 1} • {item.name.ru || item.name.ro}
                </span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => moveCoffeeItem(idx, -1)}
                    disabled={idx === 0}
                    className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 disabled:opacity-30 text-stone-300"
                    title="Вверх"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => moveCoffeeItem(idx, 1)}
                    disabled={idx === config.coffeeItems.length - 1}
                    className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 disabled:opacity-30 text-stone-300"
                    title="Вниз"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => updateCoffeeItem(idx, { visible: !item.visible })}
                    className={`p-1.5 rounded-lg border text-xs font-bold flex items-center gap-1 ${
                      item.visible
                        ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                        : 'bg-stone-800 border-stone-700 text-stone-400'
                    }`}
                    title={item.visible ? 'Показан на ТВ' : 'Скрыт'}
                  >
                    {item.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => removeCoffeeItem(idx)}
                    className="p-1.5 rounded-lg bg-rose-950/50 hover:bg-rose-900/70 text-rose-300 border border-rose-500/30"
                    title="Удалить позицию"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Names RO / RU */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-stone-400 block mb-0.5">Название (RO)</label>
                  <input
                    type="text"
                    value={item.name.ro}
                    onChange={(e) =>
                      updateCoffeeItem(idx, { name: { ...item.name, ro: e.target.value } })
                    }
                    className="w-full p-2 rounded-xl bg-stone-950 border border-stone-700 text-xs text-white font-semibold"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-stone-400 block mb-0.5">Название (RU)</label>
                  <input
                    type="text"
                    value={item.name.ru}
                    onChange={(e) =>
                      updateCoffeeItem(idx, { name: { ...item.name, ru: e.target.value } })
                    }
                    className="w-full p-2 rounded-xl bg-stone-950 border border-stone-700 text-xs text-white font-semibold"
                  />
                </div>
              </div>

              {/* Price, Volume, Badge */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] text-amber-400 font-bold block mb-0.5">Цена (MDL)</label>
                  <input
                    type="number"
                    value={item.price}
                    onChange={(e) =>
                      updateCoffeeItem(idx, { price: Number(e.target.value) || 0 })
                    }
                    className="w-full p-2 rounded-xl bg-stone-950 border border-amber-500/50 text-xs text-amber-300 font-mono font-black"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-stone-400 block mb-0.5">Объем (мл)</label>
                  <input
                    type="text"
                    value={item.volume}
                    onChange={(e) => updateCoffeeItem(idx, { volume: e.target.value })}
                    className="w-full p-2 rounded-xl bg-stone-950 border border-stone-700 text-xs text-stone-200 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-stone-400 block mb-0.5">Бейдж (ХИТ/TOP)</label>
                  <input
                    type="text"
                    placeholder="Пусто или ХИТ"
                    value={item.badge ? item.badge.ru : ''}
                    onChange={(e) => {
                      const val = e.target.value.trim();
                      updateCoffeeItem(idx, {
                        badge: val ? { ro: val, ru: val } : null,
                      });
                    }}
                    className="w-full p-2 rounded-xl bg-stone-950 border border-stone-700 text-xs text-amber-300 font-bold"
                  />
                </div>
              </div>

              {/* Description RO / RU */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-stone-400 block mb-0.5">Описание (RO)</label>
                  <input
                    type="text"
                    value={item.notes.ro}
                    onChange={(e) =>
                      updateCoffeeItem(idx, { notes: { ...item.notes, ro: e.target.value } })
                    }
                    className="w-full p-2 rounded-xl bg-stone-950 border border-stone-800 text-[11px] text-stone-300"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-stone-400 block mb-0.5">Описание (RU)</label>
                  <input
                    type="text"
                    value={item.notes.ru}
                    onChange={(e) =>
                      updateCoffeeItem(idx, { notes: { ...item.notes, ru: e.target.value } })
                    }
                    className="w-full p-2 rounded-xl bg-stone-950 border border-stone-800 text-[11px] text-stone-300"
                  />
                </div>
              </div>
            </div>
          ))}

          <button
            onClick={addCoffeeItem}
            className="w-full py-3 rounded-2xl bg-amber-600/20 hover:bg-amber-600/30 border border-dashed border-amber-500/50 text-amber-300 font-extrabold text-xs flex items-center justify-center gap-2 transition active:scale-98"
          >
            <Plus className="w-4 h-4" />
            <span>Добавить напиток в Колонку 1</span>
          </button>
        </div>
      )}

      {/* ================= SECTION 2: DESSERTS COLUMN EDITOR ================= */}
      {subTab === 'desserts' && (
        <div className="space-y-3">
          {/* Column Header Settings */}
          <div className="p-3.5 rounded-2xl bg-stone-900/90 border border-stone-800 space-y-2.5">
            <div className="text-xs font-bold text-rose-400 uppercase tracking-wider">
              Заголовок второй колонки (Десерты и Выпечка)
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-stone-400 block mb-0.5">Заголовок (RO)</label>
                <input
                  type="text"
                  value={config.dessertHeader.ro}
                  onChange={(e) =>
                    onChangeConfig({
                      ...config,
                      dessertHeader: { ...config.dessertHeader, ro: e.target.value },
                    })
                  }
                  className="w-full p-2 rounded-xl bg-stone-950 border border-stone-700 text-xs text-white font-bold"
                />
              </div>
              <div>
                <label className="text-[10px] text-stone-400 block mb-0.5">Заголовок (RU)</label>
                <input
                  type="text"
                  value={config.dessertHeader.ru}
                  onChange={(e) =>
                    onChangeConfig({
                      ...config,
                      dessertHeader: { ...config.dessertHeader, ru: e.target.value },
                    })
                  }
                  className="w-full p-2 rounded-xl bg-stone-950 border border-stone-700 text-xs text-white font-bold"
                />
              </div>
            </div>
          </div>

          {/* Dessert Items List */}
          {config.dessertItems.map((item, idx) => (
            <div
              key={item.id}
              className={`p-3.5 rounded-2xl border space-y-2.5 transition ${
                item.visible
                  ? 'bg-stone-900/80 border-stone-800'
                  : 'bg-stone-950/50 border-stone-800/40 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                <span className="text-xs font-extrabold text-rose-400 font-mono">
                  #{idx + 1} • {item.name.ru || item.name.ro}
                </span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => moveDessertItem(idx, -1)}
                    disabled={idx === 0}
                    className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 disabled:opacity-30 text-stone-300"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => moveDessertItem(idx, 1)}
                    disabled={idx === config.dessertItems.length - 1}
                    className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 disabled:opacity-30 text-stone-300"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => updateDessertItem(idx, { visible: !item.visible })}
                    className={`p-1.5 rounded-lg border text-xs font-bold ${
                      item.visible
                        ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                        : 'bg-stone-800 border-stone-700 text-stone-400'
                    }`}
                  >
                    {item.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => removeDessertItem(idx)}
                    className="p-1.5 rounded-lg bg-rose-950/50 hover:bg-rose-900/70 text-rose-300 border border-rose-500/30"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Names RO / RU */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-stone-400 block mb-0.5">Название (RO)</label>
                  <input
                    type="text"
                    value={item.name.ro}
                    onChange={(e) =>
                      updateDessertItem(idx, { name: { ...item.name, ro: e.target.value } })
                    }
                    className="w-full p-2 rounded-xl bg-stone-950 border border-stone-700 text-xs text-white font-semibold"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-stone-400 block mb-0.5">Название (RU)</label>
                  <input
                    type="text"
                    value={item.name.ru}
                    onChange={(e) =>
                      updateDessertItem(idx, { name: { ...item.name, ru: e.target.value } })
                    }
                    className="w-full p-2 rounded-xl bg-stone-950 border border-stone-700 text-xs text-white font-semibold"
                  />
                </div>
              </div>

              {/* Price, Discount Price, Badge */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] text-amber-400 font-bold block mb-0.5">Цена (MDL)</label>
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
                    className="w-full p-2 rounded-xl bg-stone-950 border border-amber-500/50 text-xs text-amber-300 font-mono font-black"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-rose-400 font-bold block mb-0.5">Цена -30% (L)</label>
                  <input
                    type="number"
                    value={item.discountPrice}
                    onChange={(e) =>
                      updateDessertItem(idx, { discountPrice: Number(e.target.value) || 0 })
                    }
                    className="w-full p-2 rounded-xl bg-stone-950 border border-rose-500/50 text-xs text-rose-300 font-mono font-black"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-stone-400 block mb-0.5">Бейдж</label>
                  <input
                    type="text"
                    placeholder="FOODBERRY"
                    value={item.badge ? item.badge.ru : ''}
                    onChange={(e) => {
                      const val = e.target.value.trim();
                      updateDessertItem(idx, {
                        badge: val ? { ro: val, ru: val } : null,
                      });
                    }}
                    className="w-full p-2 rounded-xl bg-stone-950 border border-stone-700 text-xs text-rose-300 font-bold"
                  />
                </div>
              </div>

              {/* Description RO / RU */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-stone-400 block mb-0.5">Состав / Описание (RO)</label>
                  <input
                    type="text"
                    value={item.desc.ro}
                    onChange={(e) =>
                      updateDessertItem(idx, { desc: { ...item.desc, ro: e.target.value } })
                    }
                    className="w-full p-2 rounded-xl bg-stone-950 border border-stone-800 text-[11px] text-stone-300"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-stone-400 block mb-0.5">Состав / Описание (RU)</label>
                  <input
                    type="text"
                    value={item.desc.ru}
                    onChange={(e) =>
                      updateDessertItem(idx, { desc: { ...item.desc, ru: e.target.value } })
                    }
                    className="w-full p-2 rounded-xl bg-stone-950 border border-stone-800 text-[11px] text-stone-300"
                  />
                </div>
              </div>
            </div>
          ))}

          <button
            onClick={addDessertItem}
            className="w-full py-3 rounded-2xl bg-rose-600/20 hover:bg-rose-600/30 border border-dashed border-rose-500/50 text-rose-300 font-extrabold text-xs flex items-center justify-center gap-2 transition active:scale-98"
          >
            <Plus className="w-4 h-4" />
            <span>Добавить десерт / выпечку в Колонку 2</span>
          </button>
        </div>
      )}

      {/* ================= SECTION 3: PHOTO CAROUSEL EDITOR ================= */}
      {subTab === 'slides' && (
        <div className="space-y-3">
          {/* Upload Custom Photos Box */}
          <div className="p-4 rounded-3xl bg-indigo-950/40 border border-indigo-500/40 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-indigo-400" />
                <div>
                  <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">
                    Загрузка фотографий в карусель ТВ
                  </h4>
                  <p className="text-[11px] text-stone-400">
                    Можно добавить любое количество своих фото (5, 10, 20+)
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                onClick={() => fileInputNewSlidesRef.current?.click()}
                disabled={isUploadingPhoto}
                className="py-3 px-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg transition active:scale-95 cursor-pointer"
              >
                <Camera className="w-4 h-4" />
                <span>
                  {isUploadingPhoto ? 'Сжатие фото...' : '📷 Загрузить фото с телефона / ПК'}
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
                className="py-3 px-3 rounded-2xl bg-stone-800 hover:bg-stone-700 text-amber-300 border border-amber-500/30 font-bold text-xs flex items-center justify-center gap-2 transition active:scale-95"
              >
                <FolderOpen className="w-4 h-4" />
                <span>🖼 Выбрать из галереи Amika (15 фото)</span>
              </button>
            </div>

            {/* Built-in Instagram Gallery Picker */}
            {showInstaPicker && (
              <div className="p-3 rounded-2xl bg-stone-950 border border-stone-800 space-y-2">
                <div className="text-[11px] font-bold text-amber-400">
                  Нажмите на любое фото, чтобы добавить его в карусель:
                </div>
                <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto pr-1">
                  {BUILTIN_INSTA_GALLERY.map((g, i) => (
                    <button
                      key={i}
                      onClick={() => handleAddFromGallery(g.path, g.label)}
                      className="group relative rounded-xl overflow-hidden border border-stone-700 hover:border-amber-400 aspect-square bg-stone-900 text-left"
                    >
                      <img
                        src={import.meta.env.BASE_URL + g.path}
                        alt={g.label}
                        className="w-full h-full object-cover group-hover:scale-105 transition"
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-black/75 p-1 text-[9px] text-white font-semibold leading-tight truncate">
                        {g.label}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Slides List */}
          {config.slides.map((slide, idx) => {
            const imgSrc = slide.image.startsWith('data:') || slide.image.startsWith('http')
              ? slide.image
              : import.meta.env.BASE_URL + slide.image;

            return (
              <div
                key={slide.id}
                className={`p-3.5 rounded-3xl border space-y-3 transition ${
                  slide.visible
                    ? 'bg-stone-900/90 border-stone-800'
                    : 'bg-stone-950/50 border-stone-800/40 opacity-60'
                }`}
              >
                {/* Slide Header Controls */}
                <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                  <span className="text-xs font-extrabold text-indigo-400 font-mono">
                    Слайд №{idx + 1} из {config.slides.length}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => moveSlide(idx, -1)}
                      disabled={idx === 0}
                      className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 disabled:opacity-30 text-stone-300"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => moveSlide(idx, 1)}
                      disabled={idx === config.slides.length - 1}
                      className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 disabled:opacity-30 text-stone-300"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => updateSlide(idx, { visible: !slide.visible })}
                      className={`p-1.5 rounded-lg border text-xs font-bold ${
                        slide.visible
                          ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                          : 'bg-stone-800 border-stone-700 text-stone-400'
                      }`}
                    >
                      {slide.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => removeSlide(idx)}
                      className="p-1.5 rounded-lg bg-rose-950/50 hover:bg-rose-900/70 text-rose-300 border border-rose-500/30"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Photo Preview + Replace Button */}
                <div className="flex items-center gap-3">
                  <div className="w-20 h-24 rounded-2xl overflow-hidden bg-stone-950 border border-stone-700 shrink-0">
                    <img
                      src={imgSrc}
                      alt={slide.title.ru}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 space-y-2">
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 text-xs font-bold cursor-pointer transition">
                      <Camera className="w-3.5 h-3.5" />
                      <span>Заменить фото с устройства</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleReplaceSlidePhoto(idx, e.target.files?.[0])}
                        className="hidden"
                      />
                    </label>

                    <div>
                      <label className="text-[10px] text-stone-400 block mb-0.5">
                        Верхняя плашка-бейдж (RO / RU)
                      </label>
                      <div className="grid grid-cols-2 gap-1.5">
                        <input
                          type="text"
                          placeholder="RO badge"
                          value={slide.badge.ro}
                          onChange={(e) =>
                            updateSlide(idx, { badge: { ...slide.badge, ro: e.target.value } })
                          }
                          className="w-full p-1.5 rounded-lg bg-stone-950 border border-stone-700 text-[11px] text-amber-300 font-bold"
                        />
                        <input
                          type="text"
                          placeholder="RU бейдж"
                          value={slide.badge.ru}
                          onChange={(e) =>
                            updateSlide(idx, { badge: { ...slide.badge, ru: e.target.value } })
                          }
                          className="w-full p-1.5 rounded-lg bg-stone-950 border border-stone-700 text-[11px] text-amber-300 font-bold"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Slide Title RO / RU */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-stone-400 block mb-0.5">Крупный заголовок (RO)</label>
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
                    <label className="text-[10px] text-stone-400 block mb-0.5">Крупный заголовок (RU)</label>
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
                    <label className="text-[10px] text-stone-400 block mb-0.5">Подзаголовок (RO)</label>
                    <input
                      type="text"
                      value={slide.subtitle.ro}
                      onChange={(e) =>
                        updateSlide(idx, { subtitle: { ...slide.subtitle, ro: e.target.value } })
                      }
                      className="w-full p-2 rounded-xl bg-stone-950 border border-stone-800 text-[11px] text-amber-200"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-stone-400 block mb-0.5">Подзаголовок (RU)</label>
                    <input
                      type="text"
                      value={slide.subtitle.ru}
                      onChange={(e) =>
                        updateSlide(idx, { subtitle: { ...slide.subtitle, ru: e.target.value } })
                      }
                      className="w-full p-2 rounded-xl bg-stone-950 border border-stone-800 text-[11px] text-amber-200"
                    />
                  </div>
                </div>

                {/* Slide Details RO / RU */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-stone-400 block mb-0.5">Описание внизу (RO)</label>
                    <input
                      type="text"
                      value={slide.details.ro}
                      onChange={(e) =>
                        updateSlide(idx, { details: { ...slide.details, ro: e.target.value } })
                      }
                      className="w-full p-2 rounded-xl bg-stone-950 border border-stone-800 text-[11px] text-stone-300"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-stone-400 block mb-0.5">Описание внизу (RU)</label>
                    <input
                      type="text"
                      value={slide.details.ru}
                      onChange={(e) =>
                        updateSlide(idx, { details: { ...slide.details, ru: e.target.value } })
                      }
                      className="w-full p-2 rounded-xl bg-stone-950 border border-stone-800 text-[11px] text-stone-300"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Bottom Save Button */}
      <button
        onClick={handleSaveAndSync}
        disabled={isSaving}
        className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-950/60 transition active:scale-98 cursor-pointer"
      >
        <Sparkles className="w-4 h-4" />
        <span>{isSaving ? 'Синхронизация с телевизором...' : '💾 Сохранить всё и обновить экран ТВ'}</span>
      </button>
    </div>
  );
};
