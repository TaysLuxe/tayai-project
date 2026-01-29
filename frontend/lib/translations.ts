/**
 * Translations for multi-language support (en, fr, nl, es, pt).
 * Use relative import: from '../lib/translations' or '@/lib/translations'
 */

export type Language = 'en' | 'fr' | 'nl' | 'es' | 'pt';

export interface Translations {
  common: {
    loading: string;
    settings: string;
    logout: string;
    cancel: string;
    language: string;
    online: string;
  };
  auth: {
    passwordsDoNotMatch: string;
    passwordTooShort: string;
    registrationFailed: string;
    createNewAccount: string;
    email: string;
    username: string;
    password: string;
    confirmPassword: string;
    register: string;
    alreadyHaveAccount: string;
    signIn: string;
    welcomeBack: string;
    signInToContinue: string;
    accountCreatedSuccess: string;
    dontHaveAccount: string;
    createAccount: string;
    loginFailed: string;
  };
  dashboard: {
    yourChats: string;
    newChat: string;
    searchChats: string;
    projects: string;
    tayAIWorkspace: string;
    noChatsYet: string;
    getHelp: string;
    helpCenter: string;
    releaseNotes: string;
    termsPolicies: string;
    keyboardShortcuts: string;
    learnMore: string;
    aboutTayAI: string;
    usagePolicy: string;
    chatWithTayAI: string;
  };
  chat: {
    startConversation: string;
    askTayAIAnything: string;
    copy: string;
    thumbsUp: string;
    thumbsDown: string;
    share: string;
    moreActions: string;
    branchInNewChat: string;
    replay: string;
    reportMessage: string;
    voiceChatEnded: string;
    listening: string;
    cancel: string;
    end: string;
    typeMessage: string;
    addFilesOrPhotos: string;
    takeScreenshot: string;
    startRecording: string;
    sendMessage: string;
    capturePhoto: string;
  };
  settings: {
    general: string;
    notifications: string;
    personalization: string;
    schedules: string;
    account: string;
    appearance: string;
    system: string;
    light: string;
    dark: string;
    accentColor: string;
    default: string;
    purple: string;
    blue: string;
    green: string;
    spokenLanguage: string;
    autoDetect: string;
    voice: string;
    separateVoice: string;
    showAdditionalModels: string;
  };
}

const translations: Record<Language, Translations> = {
  en: {
    common: { loading: 'Loading...', settings: 'Settings', logout: 'Log out', cancel: 'Cancel', language: 'Language', online: 'Online' },
    auth: { passwordsDoNotMatch: 'Passwords do not match', passwordTooShort: 'Password must be at least 8 characters', registrationFailed: 'Registration failed. Please try again.', createNewAccount: 'Create a new account', email: 'Email', username: 'Username', password: 'Password', confirmPassword: 'Confirm password', register: 'Register', alreadyHaveAccount: 'Already have an account?', signIn: 'Sign in', welcomeBack: 'Welcome back', signInToContinue: 'Sign in to continue', accountCreatedSuccess: 'Account created successfully. Sign in below.', dontHaveAccount: "Don't have an account?", createAccount: 'Create account', loginFailed: 'Login failed. Please try again.' },
    dashboard: { yourChats: 'Your chats', newChat: 'New chat', searchChats: 'Search chats', projects: 'Projects', tayAIWorkspace: 'TayAI Workspace', noChatsYet: 'No chats yet', getHelp: 'Get help', helpCenter: 'Help Center', releaseNotes: 'Release notes', termsPolicies: 'Terms & policies', keyboardShortcuts: 'Keyboard shortcuts', learnMore: 'Learn more', aboutTayAI: 'About TayAI', usagePolicy: 'Usage policy', chatWithTayAI: 'Chat with TayAI' },
    chat: { startConversation: 'Start a conversation', askTayAIAnything: 'Ask TayAI anything...', copy: 'Copy', thumbsUp: 'Thumbs up', thumbsDown: 'Thumbs down', share: 'Share', moreActions: 'More actions', branchInNewChat: 'Branch in new chat', replay: 'Replay', reportMessage: 'Report message', voiceChatEnded: 'Voice chat ended', listening: 'Listening...', cancel: 'Cancel', end: 'End', typeMessage: 'Type a message...', addFilesOrPhotos: 'Add files or photos', takeScreenshot: 'Take screenshot', startRecording: 'Start recording', sendMessage: 'Send message', capturePhoto: 'Capture photo' },
    settings: { general: 'General', notifications: 'Notifications', personalization: 'Personalization', schedules: 'Schedules', account: 'Account', appearance: 'Appearance', system: 'System', light: 'Light', dark: 'Dark', accentColor: 'Accent color', default: 'Default', purple: 'Purple', blue: 'Blue', green: 'Green', spokenLanguage: 'Spoken language', autoDetect: 'Auto-detect', voice: 'Voice', separateVoice: 'Separate voice for chat', showAdditionalModels: 'Show additional models' },
  },
  fr: {
    common: { loading: 'Chargement...', settings: 'Paramètres', logout: 'Déconnexion', cancel: 'Annuler', language: 'Langue', online: 'En ligne' },
    auth: { passwordsDoNotMatch: 'Les mots de passe ne correspondent pas', passwordTooShort: 'Le mot de passe doit contenir au moins 8 caractères', registrationFailed: "Échec de l'inscription. Veuillez réessayer.", createNewAccount: 'Créer un nouveau compte', email: 'E-mail', username: "Nom d'utilisateur", password: 'Mot de passe', confirmPassword: 'Confirmer le mot de passe', register: "S'inscrire", alreadyHaveAccount: 'Vous avez déjà un compte ?', signIn: 'Se connecter', welcomeBack: 'Bon retour', signInToContinue: 'Connectez-vous pour continuer', accountCreatedSuccess: 'Compte créé. Connectez-vous ci-dessous.', dontHaveAccount: "Vous n'avez pas de compte ?", createAccount: 'Créer un compte', loginFailed: 'Échec de la connexion. Veuillez réessayer.' },
    dashboard: { yourChats: 'Vos conversations', newChat: 'Nouvelle conversation', searchChats: 'Rechercher', projects: 'Projets', tayAIWorkspace: 'Espace TayAI', noChatsYet: 'Aucune conversation', getHelp: 'Aide', helpCenter: "Centre d'aide", releaseNotes: 'Notes de version', termsPolicies: 'Conditions et politiques', keyboardShortcuts: 'Raccourcis clavier', learnMore: 'En savoir plus', aboutTayAI: 'À propos de TayAI', usagePolicy: "Politique d'utilisation", chatWithTayAI: 'Discuter avec TayAI' },
    chat: { startConversation: 'Commencer une conversation', askTayAIAnything: "Demandez n'importe quoi à TayAI...", copy: 'Copier', thumbsUp: 'Pouce vers le haut', thumbsDown: 'Pouce vers le bas', share: 'Partager', moreActions: "Plus d'actions", branchInNewChat: 'Branche dans une nouvelle conversation', replay: 'Rejouer', reportMessage: 'Signaler le message', voiceChatEnded: 'Chat vocal terminé', listening: 'Écoute...', cancel: 'Annuler', end: 'Fin', typeMessage: 'Tapez un message...', addFilesOrPhotos: 'Ajouter des fichiers ou photos', takeScreenshot: 'Prendre une capture', startRecording: "Démarrer l'enregistrement", sendMessage: 'Envoyer', capturePhoto: 'Prendre une photo' },
    settings: { general: 'Général', notifications: 'Notifications', personalization: 'Personnalisation', schedules: 'Planification', account: 'Compte', appearance: 'Apparence', system: 'Système', light: 'Clair', dark: 'Sombre', accentColor: "Couleur d'accent", default: 'Par défaut', purple: 'Violet', blue: 'Bleu', green: 'Vert', spokenLanguage: 'Langue parlée', autoDetect: 'Détection automatique', voice: 'Voix', separateVoice: 'Voix séparée pour le chat', showAdditionalModels: 'Afficher les modèles supplémentaires' },
  },
  nl: {
    common: { loading: 'Laden...', settings: 'Instellingen', logout: 'Uitloggen', cancel: 'Annuleren', language: 'Taal', online: 'Online' },
    auth: { passwordsDoNotMatch: 'Wachtwoorden komen niet overeen', passwordTooShort: 'Wachtwoord moet minimaal 8 tekens zijn', registrationFailed: 'Registratie mislukt. Probeer het opnieuw.', createNewAccount: 'Nieuw account aanmaken', email: 'E-mail', username: 'Gebruikersnaam', password: 'Wachtwoord', confirmPassword: 'Bevestig wachtwoord', register: 'Registreren', alreadyHaveAccount: 'Heb je al een account?', signIn: 'Inloggen', welcomeBack: 'Welkom terug', signInToContinue: 'Log in om door te gaan', accountCreatedSuccess: 'Account aangemaakt. Log hieronder in.', dontHaveAccount: 'Nog geen account?', createAccount: 'Account aanmaken', loginFailed: 'Inloggen mislukt. Probeer het opnieuw.' },
    dashboard: { yourChats: 'Je gesprekken', newChat: 'Nieuw gesprek', searchChats: 'Zoeken', projects: 'Projecten', tayAIWorkspace: 'TayAI-werkruimte', noChatsYet: 'Nog geen gesprekken', getHelp: 'Hulp', helpCenter: 'Helpcentrum', releaseNotes: 'Release notes', termsPolicies: 'Voorwaarden en beleid', keyboardShortcuts: 'Sneltoetsen', learnMore: 'Meer info', aboutTayAI: 'Over TayAI', usagePolicy: 'Gebruiksbeleid', chatWithTayAI: 'Chat met TayAI' },
    chat: { startConversation: 'Start een gesprek', askTayAIAnything: 'Vraag TayAI iets...', copy: 'Kopiëren', thumbsUp: 'Duim omhoog', thumbsDown: 'Duim omlaag', share: 'Delen', moreActions: 'Meer acties', branchInNewChat: 'Vertakken in nieuw gesprek', replay: 'Opnieuw afspelen', reportMessage: 'Bericht melden', voiceChatEnded: 'Spraakchat beëindigd', listening: 'Luisteren...', cancel: 'Annuleren', end: 'Einde', typeMessage: 'Typ een bericht...', addFilesOrPhotos: "Bestanden of foto's toevoegen", takeScreenshot: 'Screenshot maken', startRecording: 'Opnemen starten', sendMessage: 'Versturen', capturePhoto: 'Foto maken' },
    settings: { general: 'Algemeen', notifications: 'Meldingen', personalization: 'Personalisatie', schedules: 'Planning', account: 'Account', appearance: 'Weergave', system: 'Systeem', light: 'Licht', dark: 'Donker', accentColor: 'Accentkleur', default: 'Standaard', purple: 'Paars', blue: 'Blauw', green: 'Groen', spokenLanguage: 'Gesproken taal', autoDetect: 'Auto-detectie', voice: 'Stem', separateVoice: 'Aparte stem voor chat', showAdditionalModels: 'Extra modellen tonen' },
  },
  es: {
    common: { loading: 'Cargando...', settings: 'Configuración', logout: 'Cerrar sesión', cancel: 'Cancelar', language: 'Idioma', online: 'En línea' },
    auth: { passwordsDoNotMatch: 'Las contraseñas no coinciden', passwordTooShort: 'La contraseña debe tener al menos 8 caracteres', registrationFailed: 'Error al registrarse. Inténtalo de nuevo.', createNewAccount: 'Crear una cuenta nueva', email: 'Correo electrónico', username: 'Usuario', password: 'Contraseña', confirmPassword: 'Confirmar contraseña', register: 'Registrarse', alreadyHaveAccount: '¿Ya tienes una cuenta?', signIn: 'Iniciar sesión', welcomeBack: 'Bienvenido de nuevo', signInToContinue: 'Inicia sesión para continuar', accountCreatedSuccess: 'Cuenta creada. Inicia sesión abajo.', dontHaveAccount: '¿No tienes cuenta?', createAccount: 'Crear cuenta', loginFailed: 'Error al iniciar sesión. Inténtalo de nuevo.' },
    dashboard: { yourChats: 'Tus conversaciones', newChat: 'Nueva conversación', searchChats: 'Buscar', projects: 'Proyectos', tayAIWorkspace: 'Espacio TayAI', noChatsYet: 'Sin conversaciones aún', getHelp: 'Ayuda', helpCenter: 'Centro de ayuda', releaseNotes: 'Notas de versión', termsPolicies: 'Términos y políticas', keyboardShortcuts: 'Atajos de teclado', learnMore: 'Más información', aboutTayAI: 'Acerca de TayAI', usagePolicy: 'Política de uso', chatWithTayAI: 'Chatear con TayAI' },
    chat: { startConversation: 'Iniciar una conversación', askTayAIAnything: 'Pregúntale lo que quieras a TayAI...', copy: 'Copiar', thumbsUp: 'Pulgar arriba', thumbsDown: 'Pulgar abajo', share: 'Compartir', moreActions: 'Más acciones', branchInNewChat: 'Ramificar en nueva conversación', replay: 'Repetir', reportMessage: 'Reportar mensaje', voiceChatEnded: 'Chat de voz terminado', listening: 'Escuchando...', cancel: 'Cancelar', end: 'Fin', typeMessage: 'Escribe un mensaje...', addFilesOrPhotos: 'Añadir archivos o fotos', takeScreenshot: 'Capturar pantalla', startRecording: 'Iniciar grabación', sendMessage: 'Enviar', capturePhoto: 'Tomar foto' },
    settings: { general: 'General', notifications: 'Notificaciones', personalization: 'Personalización', schedules: 'Horarios', account: 'Cuenta', appearance: 'Apariencia', system: 'Sistema', light: 'Claro', dark: 'Oscuro', accentColor: 'Color de acento', default: 'Por defecto', purple: 'Morado', blue: 'Azul', green: 'Verde', spokenLanguage: 'Idioma hablado', autoDetect: 'Detección automática', voice: 'Voz', separateVoice: 'Voz separada para el chat', showAdditionalModels: 'Mostrar modelos adicionales' },
  },
  pt: {
    common: { loading: 'A carregar...', settings: 'Definições', logout: 'Terminar sessão', cancel: 'Cancelar', language: 'Idioma', online: 'Online' },
    auth: { passwordsDoNotMatch: 'As palavras-passe não coincidem', passwordTooShort: 'A palavra-passe deve ter pelo menos 8 caracteres', registrationFailed: 'Registo falhou. Tente novamente.', createNewAccount: 'Criar nova conta', email: 'E-mail', username: 'Nome de utilizador', password: 'Palavra-passe', confirmPassword: 'Confirmar palavra-passe', register: 'Registar', alreadyHaveAccount: 'Já tem uma conta?', signIn: 'Iniciar sessão', welcomeBack: 'Bem-vindo de volta', signInToContinue: 'Inicie sessão para continuar', accountCreatedSuccess: 'Conta criada. Inicie sessão abaixo.', dontHaveAccount: 'Não tem conta?', createAccount: 'Criar conta', loginFailed: 'Falha ao iniciar sessão. Tente novamente.' },
    dashboard: { yourChats: 'As suas conversas', newChat: 'Nova conversa', searchChats: 'Pesquisar', projects: 'Projetos', tayAIWorkspace: 'Espaço TayAI', noChatsYet: 'Ainda sem conversas', getHelp: 'Ajuda', helpCenter: 'Centro de ajuda', releaseNotes: 'Notas de versão', termsPolicies: 'Termos e políticas', keyboardShortcuts: 'Atalhos de teclado', learnMore: 'Saber mais', aboutTayAI: 'Sobre o TayAI', usagePolicy: 'Política de utilização', chatWithTayAI: 'Conversar com TayAI' },
    chat: { startConversation: 'Iniciar uma conversa', askTayAIAnything: 'Pergunte qualquer coisa ao TayAI...', copy: 'Copiar', thumbsUp: 'Gosto', thumbsDown: 'Não gosto', share: 'Partilhar', moreActions: 'Mais ações', branchInNewChat: 'Ramificar em nova conversa', replay: 'Repetir', reportMessage: 'Reportar mensagem', voiceChatEnded: 'Chat de voz terminado', listening: 'A ouvir...', cancel: 'Cancelar', end: 'Fim', typeMessage: 'Escreva uma mensagem...', addFilesOrPhotos: 'Adicionar ficheiros ou fotos', takeScreenshot: 'Capturar ecrã', startRecording: 'Iniciar gravação', sendMessage: 'Enviar', capturePhoto: 'Capturar foto' },
    settings: { general: 'Geral', notifications: 'Notificações', personalization: 'Personalização', schedules: 'Horários', account: 'Conta', appearance: 'Aparência', system: 'Sistema', light: 'Claro', dark: 'Escuro', accentColor: 'Cor de destaque', default: 'Predefinido', purple: 'Roxo', blue: 'Azul', green: 'Verde', spokenLanguage: 'Idioma falado', autoDetect: 'Deteção automática', voice: 'Voz', separateVoice: 'Voz separada para o chat', showAdditionalModels: 'Mostrar modelos adicionais' },
  },
};

export function getTranslations(lang: Language): Translations {
  return translations[lang] ?? translations.en;
}

export const languageNames: Record<Language, string> = {
  en: 'English',
  fr: 'Français',
  nl: 'Nederlands',
  es: 'Español',
  pt: 'Português',
};

export const languageCodes: Record<string, Language> = {
  en: 'en',
  fr: 'fr',
  nl: 'nl',
  es: 'es',
  pt: 'pt',
};
