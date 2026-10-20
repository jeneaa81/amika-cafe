import type { Category, Language } from '../types';

export interface CategoryInfo {
  id: Category;
  name: Record<Language, string>;
  icon: string;
}

export const CATEGORIES: CategoryInfo[] = [
  {
    id: 'all',
    name: { ro: 'Toate', ru: 'Всё меню' },
    icon: 'Sparkles',
  },
  {
    id: 'coffee',
    name: { ro: 'Cafea Specialty', ru: 'Specialty Кофе' },
    icon: 'Coffee',
  },
  {
    id: 'foodberry',
    name: { ro: 'Deserturi Foodberry', ru: 'Десерты Foodberry' },
    icon: 'Cake',
  },
  {
    id: 'matcha_tea',
    name: { ro: 'Matcha & Ceaiuri', ru: 'Матча и Чаи' },
    icon: 'CupSoda',
  },
  {
    id: 'breakfast',
    name: { ro: 'Gustări & Panini', ru: 'Панини и Сэндвичи' },
    icon: 'Utensils',
  },
];
