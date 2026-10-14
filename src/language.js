export const LANGUAGE_KEY = 'aguaLanguage';
export const languages = { 'pt-BR': 'Português (BR)', en: 'English', es: 'Español' };

export function readLanguage() {
  try {
    const saved = localStorage.getItem(LANGUAGE_KEY);
    return Object.hasOwn(languages, saved) ? saved : 'pt-BR';
  } catch {
    return 'pt-BR';
  }
}

export const translations = {
  'pt-BR': {
    appearance: 'Aparência', favoriteColor: 'Sua cor favorita', appearanceHelp: 'Salve para aplicar o modo e a cor escolhidos.', exit: 'Sair', colors: { green: 'Verde', blue: 'Azul', purple: 'Roxo', rose: 'Rosa', orange: 'Laranja' },
    calendarEyebrow: 'UM DIA DE CADA VEZ', calendarTitle: 'Seu calendário de hidratação', previousMonth: 'Mês anterior', nextMonth: 'Próximo mês',
    calendarStatuses: {
    appearance: 'Apariencia', favoriteColor: 'Tu color favorito', appearanceHelp: 'Guarda para aplicar el modo y el color elegidos.', exit: 'Salir', colors: { green: 'Verde', blue: 'Azul', purple: 'Morado', rose: 'Rosa', orange: 'Naranja' }, completed: 'Meta cumprida', missed: 'Meta não cumprida', pending: 'Hoje em andamento', untracked: 'Sem histórico', future: 'Dia futuro' },
    calendarStreakHelp: days => days > 0 ? `Você está mantendo uma ofensiva de ${days} ${days === 1 ? 'dia' : 'dias'}. Continue cumprindo sua meta diária!` : 'Cumpra a meta de hoje para começar uma nova ofensiva.',
    calendarSummary: (completed, missed) => `Neste mês: ${completed} ${completed === 1 ? 'dia com meta cumprida' : 'dias com meta cumprida'} · ${missed} ${missed === 1 ? 'dia sem cumprir a meta' : 'dias sem cumprir a meta'}.`,
    achievements: 'Suas conquistas', points: 'Pontos acumulados', streak: 'Ofensiva', streakDays: days => `${days} ${days === 1 ? 'dia' : 'dias'}`, pointsEarned: points => `Meta cumprida! +${points} pontos hoje. Sua ofensiva continua!`, pointsPending: points => `Cumpra a meta de hoje para ganhar ${points} pontos e continuar sua ofensiva.`,
    dailyOverview: 'SEU DIA EM EQUILÍBRIO', dashboardTitle: 'Um gole de cada vez.', todayLabel: 'Hoje', smallSteps: 'Pequenos hábitos, grandes mudanças.', bottleLog: 'Suas garrafas', remaining: 'Falta para a meta', remindersOff: 'Uma pausa para se cuidar. Ative um lembrete.',
    reminderSound: 'Som de água enchendo um copo', testReminder: 'Testar aviso', reminderPreviewHelp: 'Prévia do aviso: os botões apenas fecham o teste, sem registrar água ou alterar seus lembretes.', reminders: 'Lembretes de água', enableReminders: 'Ativar lembretes', reminderInterval: 'Intervalo', everyMinutes: minutes => `A cada ${minutes} minutos`, reminderHelp: 'Os avisos aparecem enquanto o app estiver aberto. Ao registrar água ou dispensar um aviso, o intervalo recomeça.', reminderTitle: 'Hora de tomar água! 💧', reminderMessage: 'Que tal uma pausa para se hidratar?', dismissReminder: 'Agora não',
    close: 'Fechar', waterAdded: 'Água registrada! 💙', home: 'Início', navigation: 'Navegação principal', language: 'Idioma', title: 'Sip by Sip', subtitle: 'Uma garrafa de cada vez.',
    settings: 'Configurações', darkMode: 'Modo escuro', bottle: 'Sua garrafa',
    consumption: 'Consumo de hoje', goalToday: goal => `de ${goal} L hoje`,
    bottles: count => `${count} ${count === 1 ? 'garrafa registrada' : 'garrafas registradas'}`,
    remainingBottles: count => count === 0 ? 'Meta cumprida! Nenhuma garrafa faltando.' : `${count} ${count === 1 ? 'garrafa fantasma falta' : 'garrafas fantasmas faltam'} para a meta.`,
    progress: 'Seu progresso', progressLabel: 'Progresso da meta diária', success: 'Meta alcançada! 💙',
    empty: 'Registre sua primeira garrafa do dia.', add: '+ Adicionar garrafa', reset: 'Zerar dia',
    footnote: 'Seu progresso reinicia a cada novo dia.',
    storageError: 'O navegador não permitiu salvar. Seu progresso ficará disponível apenas enquanto o app estiver aberto.',
    resetTitle: 'Recomeçar o dia?', resetHelp: 'O total de água e a contagem de garrafas serão zerados. Suas configurações e conquistas já obtidas serão mantidas.',
    cancel: 'Cancelar', save: 'Salvar', settingsIntro: 'Escolha o tamanho da sua garrafa e sua meta diária.',
    changeBottleSize: 'Alterar tamanho', bottleSize: 'Sua garrafa (ml)', dailyGoal: 'Meta diária (L)', invalid: 'Use valores maiores que zero.',
    settingsHelp: 'O novo tamanho vale para as próximas garrafas. A água já registrada será mantida.',
  },
  en: {
    appearance: 'Appearance', favoriteColor: 'Your favorite color', appearanceHelp: 'Save to apply your chosen mode and color.', exit: 'Exit', colors: { green: 'Green', blue: 'Blue', purple: 'Purple', rose: 'Pink', orange: 'Orange' },
    calendarEyebrow: 'ONE DAY AT A TIME', calendarTitle: 'Your hydration calendar', previousMonth: 'Previous month', nextMonth: 'Next month',
    calendarStatuses: { completed: 'Goal achieved', missed: 'Goal not achieved', pending: 'Today in progress', untracked: 'No history', future: 'Future day' },
    calendarStreakHelp: days => days > 0 ? `Your current streak is ${days} ${days === 1 ? 'day' : 'days'}. Keep reaching your daily goal!` : "Reach today's goal to start a new streak.",
    calendarSummary: (completed, missed) => `This month: ${completed} ${completed === 1 ? 'day' : 'days'} with the goal achieved · ${missed} ${missed === 1 ? 'day' : 'days'} without reaching the goal.`,
    achievements: 'Your achievements', points: 'Total points', streak: 'Daily streak', streakDays: days => `${days} ${days === 1 ? 'day' : 'days'}`, pointsEarned: points => `Goal achieved! +${points} points today. Keep your streak going!`, pointsPending: points => `Reach today's goal to earn ${points} points and continue your streak.`,
    dailyOverview: 'YOUR DAILY BALANCE', dashboardTitle: 'One sip at a time.', todayLabel: 'Today', smallSteps: 'Small habits, meaningful changes.', bottleLog: 'Your bottles', remaining: 'Left to your goal', remindersOff: 'Make time for yourself. Set a reminder.',
    reminderSound: 'Sound of water filling a glass', testReminder: 'Test reminder', reminderPreviewHelp: 'Reminder preview: the buttons only close this test, without recording water or changing your reminders.', reminders: 'Water reminders', enableReminders: 'Enable reminders', reminderInterval: 'Interval', everyMinutes: minutes => `Every ${minutes} minutes`, reminderHelp: 'Reminders appear while the app is open. Recording water or dismissing a reminder restarts the interval.', reminderTitle: 'Time to drink water! 💧', reminderMessage: 'How about a hydration break?', dismissReminder: 'Not now',
    close: 'Close', waterAdded: 'Water recorded! 💙', home: 'Home', navigation: 'Main navigation', language: 'Language', title: 'Sip by Sip', subtitle: 'One bottle at a time.',
    settings: 'Settings', darkMode: 'Dark mode', bottle: 'Your bottle',
    consumption: "Today's water intake", goalToday: goal => `of ${goal} L today`,
    bottles: count => `${count} ${count === 1 ? 'bottle recorded' : 'bottles recorded'}`,
    remainingBottles: count => count === 0 ? 'Goal reached! No bottles remaining.' : `${count} ghost ${count === 1 ? 'bottle' : 'bottles'} left to your goal.`,
    progress: 'Your progress', progressLabel: 'Daily goal progress', success: 'Goal reached! 💙',
    empty: 'Record your first bottle of the day.', add: '+ Add bottle', reset: 'Reset day',
    footnote: 'Your progress resets each new day.',
    storageError: 'Your browser could not save your progress. It will only be available while the app is open.',
    resetTitle: 'Start the day over?', resetHelp: 'Your water total and bottle count will be reset. Your settings and earned achievements will be kept.',
    cancel: 'Cancel', save: 'Save', settingsIntro: 'Choose your bottle size and daily goal.',
    changeBottleSize: 'Change size', bottleSize: 'Your bottle (ml)', dailyGoal: 'Daily goal (L)', invalid: 'Use values greater than zero.',
    settingsHelp: 'The new size applies to future bottles. Water already recorded will be kept.',
  },
  es: {
    calendarEyebrow: 'UN DÍA A LA VEZ', calendarTitle: 'Tu calendario de hidratación', previousMonth: 'Mes anterior', nextMonth: 'Próximo mes',
    calendarStatuses: { completed: 'Meta cumplida', missed: 'Meta no cumplida', pending: 'Hoy en curso', untracked: 'Sin historial', future: 'Día futuro' },
    calendarStreakHelp: days => days > 0 ? `Tu racha actual es de ${days} ${days === 1 ? 'día' : 'días'}. ¡Sigue cumpliendo tu meta diaria!` : 'Cumple la meta de hoy para empezar una nueva racha.',
    calendarSummary: (completed, missed) => `Este mes: ${completed} ${completed === 1 ? 'día' : 'días'} con la meta cumplida · ${missed} ${missed === 1 ? 'día' : 'días'} sin cumplir la meta.`,
    achievements: 'Tus logros', points: 'Puntos acumulados', streak: 'Racha diaria', streakDays: days => `${days} ${days === 1 ? 'día' : 'días'}`, pointsEarned: points => `¡Meta cumplida! +${points} puntos hoy. ¡Tu racha continúa!`, pointsPending: points => `Cumple la meta de hoy para ganar ${points} puntos y continuar tu racha.`,
    dailyOverview: 'TU DÍA EN EQUILIBRIO', dashboardTitle: 'Un sorbo a la vez.', todayLabel: 'Hoy', smallSteps: 'Pequeños hábitos, grandes cambios.', bottleLog: 'Tus botellas', remaining: 'Falta para la meta', remindersOff: 'Una pausa para cuidarte. Activa un recordatorio.',
    reminderSound: 'Sonido de agua llenando un vaso', testReminder: 'Probar aviso', reminderPreviewHelp: 'Vista previa: los botones solo cierran la prueba, sin registrar agua ni cambiar tus recordatorios.', reminders: 'Recordatorios de agua', enableReminders: 'Activar recordatorios', reminderInterval: 'Intervalo', everyMinutes: minutes => `Cada ${minutes} minutos`, reminderHelp: 'Los avisos aparecen mientras la aplicación esté abierta. Registrar agua o descartar un aviso reinicia el intervalo.', reminderTitle: '¡Hora de tomar agua! 💧', reminderMessage: '¿Qué tal una pausa para hidratarte?', dismissReminder: 'Ahora no',
    close: 'Cerrar', waterAdded: '¡Agua registrada! 💙', home: 'Inicio', navigation: 'Navegación principal', language: 'Idioma', title: 'Sip by Sip', subtitle: 'Una botella a la vez.',
    settings: 'Configuración', darkMode: 'Modo oscuro', bottle: 'Tu botella',
    consumption: 'Consumo de hoy', goalToday: goal => `de ${goal} L hoy`,
    bottles: count => `${count} ${count === 1 ? 'botella registrada' : 'botellas registradas'}`,
    remainingBottles: count => count === 0 ? '¡Meta cumplida! No faltan botellas.' : `${count} ${count === 1 ? 'botella fantasma restante' : 'botellas fantasma restantes'} para la meta.`,
    progress: 'Tu progreso', progressLabel: 'Progreso de la meta diaria', success: '¡Meta alcanzada! 💙',
    empty: 'Registra tu primera botella del día.', add: '+ Añadir botella', reset: 'Reiniciar día',
    footnote: 'Tu progreso se reinicia cada nuevo día.',
    storageError: 'El navegador no pudo guardar tu progreso. Solo estará disponible mientras la aplicación esté abierta.',
    resetTitle: '¿Empezar el día de nuevo?', resetHelp: 'El total de agua y el número de botellas se reiniciarán. Se conservarán tu configuración y los logros obtenidos.',
    cancel: 'Cancelar', save: 'Guardar', settingsIntro: 'Elige el tamaño de tu botella y tu meta diaria.',
    changeBottleSize: 'Cambiar tamaño', bottleSize: 'Tu botella (ml)', dailyGoal: 'Meta diaria (L)', invalid: 'Usa valores mayores que cero.',
    settingsHelp: 'El nuevo tamaño se aplica a las próximas botellas. Se conservará el agua ya registrada.',
  },
};
