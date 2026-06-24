export type Lang = 'ru' | 'en';

export const LANGS: { id: Lang; label: string }[] = [
  { id: 'ru', label: 'Русский' },
  { id: 'en', label: 'English' },
];

/** Локаль Intl для форматирования дат/чисел по выбранному языку. */
export const LOCALE: Record<Lang, string> = {
  ru: 'ru-RU',
  en: 'en-US',
};

export type TranslationKey = keyof (typeof translations)['ru'];

export const translations = {
  ru: {
    'tab.balance': 'Баланс',
    'tab.dynamics': 'Динамика',
    'tab.settings': 'Настройки',
    'nav.label': 'Навигация по разделам',

    'sources.title': 'Источники',
    'sources.empty': 'Добавьте свой первый источник',
    'sources.add': 'Добавить источник',

    'item.edit': 'Редактировать',
    'item.delete': 'Удалить',

    'modal.editTitle': 'Редактировать',
    'modal.newTitle': 'Новый источник',
    'modal.name': 'Название',
    'modal.namePlaceholder': 'Например, Сбербанк',
    'modal.amount': 'Сумма (₽)',
    'modal.color': 'Цвет',
    'modal.customColor': 'Свой цвет',
    'modal.save': 'Сохранить',
    'modal.add': 'Добавить',

    'donut.total': 'Всего',

    'dynamics.title': 'Динамика баланса',
    'dynamics.aria': 'Динамика баланса по месяцам',
    'chart.empty': 'Пока нет данных по месяцам',
    'chart.emptyHint': 'Баланс на конец каждого месяца будет сохраняться автоматически',

    'settings.title': 'Настройки',
    'settings.appearance': 'Оформление',
    'settings.theme': 'Тема',
    'settings.theme.dark': 'Тёмная',
    'settings.theme.light': 'Светлая',
    'settings.language': 'Язык',
    'settings.data': 'Данные',
    'settings.dataDesc': 'Сохраните резервную копию баланса и динамики или восстановите её из файла.',
    'settings.export': 'Экспорт в JSON',
    'settings.import': 'Импорт из JSON',
    'settings.importError': 'Не удалось прочитать файл. Проверьте, что это корректный бэкап fin-track.',
    'settings.importSuccess': 'Данные восстановлены',
  },
  en: {
    'tab.balance': 'Balance',
    'tab.dynamics': 'Dynamics',
    'tab.settings': 'Settings',
    'nav.label': 'Section navigation',

    'sources.title': 'Sources',
    'sources.empty': 'Add your first source',
    'sources.add': 'Add source',

    'item.edit': 'Edit',
    'item.delete': 'Delete',

    'modal.editTitle': 'Edit',
    'modal.newTitle': 'New source',
    'modal.name': 'Name',
    'modal.namePlaceholder': 'e.g. Bank of America',
    'modal.amount': 'Amount (₽)',
    'modal.color': 'Color',
    'modal.customColor': 'Custom color',
    'modal.save': 'Save',
    'modal.add': 'Add',

    'donut.total': 'Total',

    'dynamics.title': 'Balance dynamics',
    'dynamics.aria': 'Monthly balance dynamics',
    'chart.empty': 'No monthly data yet',
    'chart.emptyHint': 'The balance at the end of each month is saved automatically',

    'settings.title': 'Settings',
    'settings.appearance': 'Appearance',
    'settings.theme': 'Theme',
    'settings.theme.dark': 'Dark',
    'settings.theme.light': 'Light',
    'settings.language': 'Language',
    'settings.data': 'Data',
    'settings.dataDesc': 'Back up your balance and dynamics, or restore them from a file.',
    'settings.export': 'Export to JSON',
    'settings.import': 'Import from JSON',
    'settings.importError': 'Could not read the file. Make sure it is a valid fin-track backup.',
    'settings.importSuccess': 'Data restored',
  },
} satisfies Record<Lang, Record<string, string>>;
