export interface ThemeConfig {
  id: string
  name: string
  nameRu: string
  description: string
  previewColors: {
    bg: string
    primary: string
    secondary: string
    accent: string
  }
  isDark: boolean
}

export const THEMES: ThemeConfig[] = [
  {
    id: "neon-dark",
    name: "Neon Dark",
    nameRu: "Неон",
    description: "Темная тема с зеленым неоновым свечением",
    previewColors: {
      bg: "#0f0f0f",
      primary: "#22c55e",
      secondary: "#242424",
      accent: "#22c55e",
    },
    isDark: true,
  },
  {
    id: "light",
    name: "Light",
    nameRu: "Светлая",
    description: "Чистая светлая тема для дневного использования",
    previewColors: {
      bg: "#f5f7fa",
      primary: "#2a9d5c",
      secondary: "#e8ecf0",
      accent: "#2a9d5c",
    },
    isDark: false,
  },
  {
    id: "ocean",
    name: "Ocean Blue",
    nameRu: "Океан",
    description: "Глубокая синяя тема с голубыми акцентами",
    previewColors: {
      bg: "#0c1424",
      primary: "#38bdf8",
      secondary: "#1a2744",
      accent: "#38bdf8",
    },
    isDark: true,
  },
  {
    id: "sunset",
    name: "Sunset Amber",
    nameRu: "Закат",
    description: "Теплая тема с янтарными оттенками",
    previewColors: {
      bg: "#161210",
      primary: "#f5a623",
      secondary: "#261e17",
      accent: "#f5a623",
    },
    isDark: true,
  },
  {
    id: "rose",
    name: "Rose",
    nameRu: "Роза",
    description: "Элегантная тема с розовыми акцентами",
    previewColors: {
      bg: "#160f12",
      primary: "#e6648c",
      secondary: "#271a1f",
      accent: "#e6648c",
    },
    isDark: true,
  },
  {
    id: "forest",
    name: "Emerald Forest",
    nameRu: "Изумруд",
    description: "Природная тема с насыщенной зеленью",
    previewColors: {
      bg: "#0a140e",
      primary: "#2aaa6a",
      secondary: "#16241b",
      accent: "#2aaa6a",
    },
    isDark: true,
  },
  {
    id: "cyber",
    name: "Cyber Purple",
    nameRu: "Кибер",
    description: "Футуристическая тема с фиолетовыми акцентами",
    previewColors: {
      bg: "#120e18",
      primary: "#a064f0",
      secondary: "#1e1828",
      accent: "#a064f0",
    },
    isDark: true,
  },
  {
    id: "midnight",
    name: "Midnight",
    nameRu: "Полночь",
    description: "Глубокая ночная тема с синими тонами",
    previewColors: {
      bg: "#0a0e1a",
      primary: "#5088e6",
      secondary: "#161c2e",
      accent: "#5088e6",
    },
    isDark: true,
  },
  {
    id: "arctic",
    name: "Arctic Ice",
    nameRu: "Арктика",
    description: "Холодная ледяная тема с бирюзовыми акцентами",
    previewColors: {
      bg: "#0a1218",
      primary: "#5ce0d6",
      secondary: "#142028",
      accent: "#5ce0d6",
    },
    isDark: true,
  },
  {
    id: "blood",
    name: "Blood Moon",
    nameRu: "Кровавая луна",
    description: "Агрессивная тёмная тема с красными акцентами",
    previewColors: {
      bg: "#120808",
      primary: "#e53e3e",
      secondary: "#1e1010",
      accent: "#e53e3e",
    },
    isDark: true,
  },
  {
    id: "gold",
    name: "Royal Gold",
    nameRu: "Золото",
    description: "Премиум тема с золотыми акцентами на чёрном",
    previewColors: {
      bg: "#0c0a08",
      primary: "#d4a740",
      secondary: "#1a1610",
      accent: "#d4a740",
    },
    isDark: true,
  },
]

export const DEFAULT_THEME = "neon-dark"

export function getThemeById(id: string): ThemeConfig | undefined {
  return THEMES.find((t) => t.id === id)
}
