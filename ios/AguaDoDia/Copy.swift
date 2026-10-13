import Foundation

enum Copy {
    static let values: [String: [String]] = [
        "title": ["Água do Dia", "Daily Water", "Agua del Día"],
        "subtitle": ["Uma garrafa de cada vez.", "One bottle at a time.", "Una botella a la vez."],
        "settings": ["Configurações", "Settings", "Configuración"],
        "bottle": ["Sua garrafa (ml)", "Your bottle (ml)", "Tu botella (ml)"],
        "goal": ["Meta diária (L)", "Daily goal (L)", "Meta diaria (L)"],
        "today": ["hoje", "today", "hoy"],
        "of": ["de", "of", "de"],
        "bottles": ["Garrafas registradas", "Bottles recorded", "Botellas registradas"],
        "progress": ["Seu progresso", "Your progress", "Tu progreso"],
        "success": ["Meta alcançada! 💙", "Goal reached! 💙", "¡Meta alcanzada! 💙"],
        "add": ["Adicionar garrafa", "Add bottle", "Añadir botella"],
        "reset": ["Zerar dia", "Reset day", "Reiniciar día"],
        "resetTitle": ["Recomeçar o dia?", "Start the day over?", "¿Empezar el día de nuevo?"],
        "resetHelp": ["A água e a contagem serão zeradas. Suas configurações serão mantidas.", "Water and bottle count will reset. Your settings will be kept.", "El agua y las botellas se reiniciarán. Se conservará tu configuración."],
        "cancel": ["Cancelar", "Cancel", "Cancelar"],
        "save": ["Salvar", "Save", "Guardar"],
        "close": ["Fechar", "Close", "Cerrar"],
        "language": ["Idioma", "Language", "Idioma"],
        "theme": ["Tema", "Theme", "Tema"],
        "system": ["Sistema", "System", "Sistema"],
        "light": ["Claro", "Light", "Claro"],
        "dark": ["Escuro", "Dark", "Oscuro"],
        "reminders": ["Lembretes de água", "Water reminders", "Recordatorios de agua"],
        "enable": ["Ativar lembretes", "Enable reminders", "Activar recordatorios"],
        "interval": ["Intervalo (minutos)", "Interval (minutes)", "Intervalo (minutos)"],
        "sound": ["Som de água enchendo um copo", "Water filling a glass sound", "Sonido de agua llenando un vaso"],
        "test": ["Testar aviso", "Test reminder", "Probar aviso"],
        "reminderTitle": ["Hora de tomar água! 💧", "Time to drink water! 💧", "¡Hora de tomar agua! 💧"],
        "reminderBody": ["Que tal uma pausa para se hidratar?", "How about a hydration break?", "¿Qué tal una pausa para hidratarte?"],
        "dismiss": ["Agora não", "Not now", "Ahora no"],
        "added": ["Água registrada! 💙", "Water recorded! 💙", "¡Agua registrada! 💙"],
        "help": ["O novo tamanho vale para as próximas garrafas. O volume já registrado será mantido.", "The new size applies to future bottles. Recorded water is kept.", "El nuevo tamaño se aplica a futuras botellas. Se conserva el agua registrada."],
        "invalid": ["Use valores maiores que zero.", "Use values greater than zero.", "Usa valores mayores que cero."],
        "footnote": ["Seu progresso reinicia a cada novo dia.", "Your progress resets each new day.", "Tu progreso se reinicia cada nuevo día."],
        "notificationError": ["Permita notificações nos Ajustes do iPhone para receber lembretes.", "Allow notifications in iPhone Settings to receive reminders.", "Permite notificaciones en Ajustes del iPhone para recibir recordatorios."],
        "reminderHelp": ["Os lembretes também chegam com o app fechado, conforme as permissões do iPhone.", "Reminders also arrive when the app is closed, according to iPhone permissions.", "Los avisos también llegan con la app cerrada, según los permisos del iPhone."],
        "preview": ["Prévia: os botões fecham o teste sem registrar água.", "Preview: buttons close the test without recording water.", "Vista previa: los botones cierran la prueba sin registrar agua."]
    ]
    static func text(_ key: String, language: String) -> String {
        let index = language == "en" ? 1 : language == "es" ? 2 : 0
        return values[key]?[index] ?? key
    }
}
