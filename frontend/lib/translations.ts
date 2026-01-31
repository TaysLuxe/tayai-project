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
    forgotPassword: string;
    resetPassword: string;
    enterEmailForReset: string;
    sendResetLink: string;
    backToSignIn: string;
    enterNewPassword: string;
    setNewPassword: string;
    resetLinkSent: string;
    checkEmailOrCopyLink: string;
    copyLink: string;
    linkCopied: string;
    passwordResetSuccess: string;
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
    addPhotosAndFiles: string;
    addFromGoogleDrive: string;
    createImage: string;
    thinking: string;
    deepResearch: string;
    shoppingResearch: string;
    takeScreenshot: string;
    startRecording: string;
    dictate: string;
    readAloud: string;
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
    auth: { passwordsDoNotMatch: 'Passwords do not match', passwordTooShort: 'Password must be at least 8 characters', registrationFailed: 'Registration failed. Please try again.', createNewAccount: 'Create a new account', email: 'Email', username: 'Username', password: 'Password', confirmPassword: 'Confirm password', register: 'Register', alreadyHaveAccount: 'Already have an account?', signIn: 'Sign in', welcomeBack: 'Welcome back', signInToContinue: 'Sign in to continue', accountCreatedSuccess: 'Account created successfully. Sign in below.', dontHaveAccount: "Don't have an account?", createAccount: 'Create account', loginFailed: 'Login failed. Please try again.', forgotPassword: 'Forgot password?', resetPassword: 'Reset password', enterEmailForReset: "Enter your email and we'll send you a link to reset your password.", sendResetLink: 'Send reset link', backToSignIn: 'Back to sign in', enterNewPassword: 'Enter your new password', setNewPassword: 'Set new password', resetLinkSent: 'If an account exists with that email, we sent a reset link.', checkEmailOrCopyLink: 'Check your email or copy the link below (for development):', copyLink: 'Copy link', linkCopied: 'Link copied!', passwordResetSuccess: 'Password reset successfully. You can now sign in.' },
    dashboard: { yourChats: 'Your chats', newChat: 'New chat', searchChats: 'Search chats', projects: 'Projects', tayAIWorkspace: 'TayAI Workspace', noChatsYet: 'No chats yet', getHelp: 'Get help', helpCenter: 'Help Center', releaseNotes: 'Release notes', termsPolicies: 'Terms & policies', keyboardShortcuts: 'Keyboard shortcuts', learnMore: 'Learn more', aboutTayAI: 'About TayAI', usagePolicy: 'Usage policy', chatWithTayAI: 'Chat with TayAI' },
    chat: { startConversation: 'Ready when you are.', askTayAIAnything: 'Ask anything', copy: 'Copy', thumbsUp: 'Thumbs up', thumbsDown: 'Thumbs down', share: 'Share', moreActions: 'More actions', branchInNewChat: 'Branch in new chat', replay: 'Replay', reportMessage: 'Report message', voiceChatEnded: 'Voice chat ended', listening: 'Listening...', cancel: 'Cancel', end: 'End', typeMessage: 'Ask anything', addFilesOrPhotos: 'Add files or photos', addPhotosAndFiles: 'Add photos & files', addFromGoogleDrive: 'Add from Google Drive', createImage: 'Create image', thinking: 'Thinking', deepResearch: 'Deep research', shoppingResearch: 'Shopping research', takeScreenshot: 'Take screenshot', startRecording: 'Start recording', dictate: 'Dictate', readAloud: 'Read aloud', sendMessage: 'Send message', capturePhoto: 'Capture photo' },
    settings: { general: 'General', notifications: 'Notifications', personalization: 'Personalization', schedules: 'Schedules', account: 'Account', appearance: 'Appearance', system: 'System', light: 'Light', dark: 'Dark', accentColor: 'Accent color', default: 'Default', purple: 'Purple', blue: 'Blue', green: 'Green', spokenLanguage: 'Spoken language', autoDetect: 'Auto-detect', voice: 'Voice', separateVoice: 'Separate voice for chat', showAdditionalModels: 'Show additional models' },
  },
  fr: {
    common: { loading: 'Chargement...', settings: 'Paramètres', logout: 'Déconnexion', cancel: 'Annuler', language: 'Langue', online: 'En ligne' },
    auth: { passwordsDoNotMatch: 'Les mots de passe ne correspondent pas', passwordTooShort: 'Le mot de passe doit contenir au moins 8 caractères', registrationFailed: "Échec de l'inscription. Veuillez réessayer.", createNewAccount: 'Créer un nouveau compte', email: 'E-mail', username: "Nom d'utilisateur", password: 'Mot de passe', confirmPassword: 'Confirmer le mot de passe', register: "S'inscrire", alreadyHaveAccount: 'Vous avez déjà un compte ?', signIn: 'Se connecter', welcomeBack: 'Bon retour', signInToContinue: 'Connectez-vous pour continuer', accountCreatedSuccess: 'Compte créé. Connectez-vous ci-dessous.', dontHaveAccount: "Vous n'avez pas de compte ?", createAccount: 'Créer un compte', loginFailed: 'Échec de la connexion. Veuillez réessayer.', forgotPassword: 'Mot de passe oublié ?', resetPassword: 'Réinitialiser le mot de passe', enterEmailForReset: "Entrez votre e-mail et nous vous enverrons un lien pour réinitialiser votre mot de passe.", sendResetLink: 'Envoyer le lien', backToSignIn: 'Retour à la connexion', enterNewPassword: 'Entrez votre nouveau mot de passe', setNewPassword: 'Définir le nouveau mot de passe', resetLinkSent: "Si un compte existe avec cet e-mail, nous avons envoyé un lien de réinitialisation.", checkEmailOrCopyLink: "Vérifiez votre e-mail ou copiez le lien ci-dessous (pour le développement) :", copyLink: 'Copier le lien', linkCopied: 'Lien copié !', passwordResetSuccess: 'Mot de passe réinitialisé. Vous pouvez maintenant vous connecter.' },
    dashboard: { yourChats: 'Vos conversations', newChat: 'Nouvelle conversation', searchChats: 'Rechercher', projects: 'Projets', tayAIWorkspace: 'Espace TayAI', noChatsYet: 'Aucune conversation', getHelp: 'Aide', helpCenter: "Centre d'aide", releaseNotes: 'Notes de version', termsPolicies: 'Conditions et politiques', keyboardShortcuts: 'Raccourcis clavier', learnMore: 'En savoir plus', aboutTayAI: 'À propos de TayAI', usagePolicy: "Politique d'utilisation", chatWithTayAI: 'Discuter avec TayAI' },
    chat: { startConversation: 'Commencer une conversation', askTayAIAnything: "Demandez n'importe quoi à TayAI...", copy: 'Copier', thumbsUp: 'Pouce vers le haut', thumbsDown: 'Pouce vers le bas', share: 'Partager', moreActions: "Plus d'actions", branchInNewChat: 'Branche dans une nouvelle conversation', replay: 'Rejouer', reportMessage: 'Signaler le message', voiceChatEnded: 'Chat vocal terminé', listening: 'Écoute...', cancel: 'Annuler', end: 'Fin', typeMessage: 'Tapez un message...', addFilesOrPhotos: 'Ajouter des fichiers ou photos', addPhotosAndFiles: 'Ajouter photos et fichiers', addFromGoogleDrive: 'Ajouter depuis Google Drive', createImage: 'Créer une image', thinking: 'Réflexion', deepResearch: 'Recherche approfondie', shoppingResearch: 'Recherche shopping', takeScreenshot: 'Prendre une capture', startRecording: "Démarrer l'enregistrement", dictate: 'Dicter', readAloud: 'Lire à voix haute', sendMessage: 'Envoyer', capturePhoto: 'Prendre une photo' },
    settings: { general: 'Général', notifications: 'Notifications', personalization: 'Personnalisation', schedules: 'Planification', account: 'Compte', appearance: 'Apparence', system: 'Système', light: 'Clair', dark: 'Sombre', accentColor: "Couleur d'accent", default: 'Par défaut', purple: 'Violet', blue: 'Bleu', green: 'Vert', spokenLanguage: 'Langue parlée', autoDetect: 'Détection automatique', voice: 'Voix', separateVoice: 'Voix séparée pour le chat', showAdditionalModels: 'Afficher les modèles supplémentaires' },
  },
  nl: {
    common: { loading: 'Laden...', settings: 'Instellingen', logout: 'Uitloggen', cancel: 'Annuleren', language: 'Taal', online: 'Online' },
    auth: { passwordsDoNotMatch: 'Wachtwoorden komen niet overeen', passwordTooShort: 'Wachtwoord moet minimaal 8 tekens zijn', registrationFailed: 'Registratie mislukt. Probeer het opnieuw.', createNewAccount: 'Nieuw account aanmaken', email: 'E-mail', username: 'Gebruikersnaam', password: 'Wachtwoord', confirmPassword: 'Bevestig wachtwoord', register: 'Registreren', alreadyHaveAccount: 'Heb je al een account?', signIn: 'Inloggen', welcomeBack: 'Welkom terug', signInToContinue: 'Log in om door te gaan', accountCreatedSuccess: 'Account aangemaakt. Log hieronder in.', dontHaveAccount: 'Nog geen account?', createAccount: 'Account aanmaken', loginFailed: 'Inloggen mislukt. Probeer het opnieuw.', forgotPassword: 'Wachtwoord vergeten?', resetPassword: 'Wachtwoord resetten', enterEmailForReset: "Voer je e-mail in en we sturen je een link om je wachtwoord te resetten.", sendResetLink: 'Stuur resetlink', backToSignIn: 'Terug naar inloggen', enterNewPassword: 'Voer je nieuwe wachtwoord in', setNewPassword: 'Nieuw wachtwoord instellen', resetLinkSent: "Als er een account bestaat met dat e-mailadres, hebben we een resetlink gestuurd.", checkEmailOrCopyLink: "Controleer je e-mail of kopieer de link hieronder (voor ontwikkeling):", copyLink: 'Link kopiëren', linkCopied: 'Link gekopieerd!', passwordResetSuccess: 'Wachtwoord gereset. Je kunt nu inloggen.' },
    dashboard: { yourChats: 'Je gesprekken', newChat: 'Nieuw gesprek', searchChats: 'Zoeken', projects: 'Projecten', tayAIWorkspace: 'TayAI-werkruimte', noChatsYet: 'Nog geen gesprekken', getHelp: 'Hulp', helpCenter: 'Helpcentrum', releaseNotes: 'Release notes', termsPolicies: 'Voorwaarden en beleid', keyboardShortcuts: 'Sneltoetsen', learnMore: 'Meer info', aboutTayAI: 'Over TayAI', usagePolicy: 'Gebruiksbeleid', chatWithTayAI: 'Chat met TayAI' },
    chat: { startConversation: 'Start een gesprek', askTayAIAnything: 'Vraag TayAI iets...', copy: 'Kopiëren', thumbsUp: 'Duim omhoog', thumbsDown: 'Duim omlaag', share: 'Delen', moreActions: 'Meer acties', branchInNewChat: 'Vertakken in nieuw gesprek', replay: 'Opnieuw afspelen', reportMessage: 'Bericht melden', voiceChatEnded: 'Spraakchat beëindigd', listening: 'Luisteren...', cancel: 'Annuleren', end: 'Einde', typeMessage: 'Typ een bericht...', addFilesOrPhotos: "Bestanden of foto's toevoegen", addPhotosAndFiles: "Foto's en bestanden toevoegen", addFromGoogleDrive: 'Toevoegen vanaf Google Drive', createImage: 'Afbeelding maken', thinking: 'Denken', deepResearch: 'Diepgaand onderzoek', shoppingResearch: 'Shopping onderzoek', takeScreenshot: 'Screenshot maken', startRecording: 'Opnemen starten', dictate: 'Dicteren', readAloud: 'Voorlezen', sendMessage: 'Versturen', capturePhoto: 'Foto maken' },
    settings: { general: 'Algemeen', notifications: 'Meldingen', personalization: 'Personalisatie', schedules: 'Planning', account: 'Account', appearance: 'Weergave', system: 'Systeem', light: 'Licht', dark: 'Donker', accentColor: 'Accentkleur', default: 'Standaard', purple: 'Paars', blue: 'Blauw', green: 'Groen', spokenLanguage: 'Gesproken taal', autoDetect: 'Auto-detectie', voice: 'Stem', separateVoice: 'Aparte stem voor chat', showAdditionalModels: 'Extra modellen tonen' },
  },
  es: {
    common: { loading: 'Cargando...', settings: 'Configuración', logout: 'Cerrar sesión', cancel: 'Cancelar', language: 'Idioma', online: 'En línea' },
    auth: { passwordsDoNotMatch: 'Las contraseñas no coinciden', passwordTooShort: 'La contraseña debe tener al menos 8 caracteres', registrationFailed: 'Error al registrarse. Inténtalo de nuevo.', createNewAccount: 'Crear una cuenta nueva', email: 'Correo electrónico', username: 'Usuario', password: 'Contraseña', confirmPassword: 'Confirmar contraseña', register: 'Registrarse', alreadyHaveAccount: '¿Ya tienes una cuenta?', signIn: 'Iniciar sesión', welcomeBack: 'Bienvenido de nuevo', signInToContinue: 'Inicia sesión para continuar', accountCreatedSuccess: 'Cuenta creada. Inicia sesión abajo.', dontHaveAccount: '¿No tienes cuenta?', createAccount: 'Crear cuenta', loginFailed: 'Error al iniciar sesión. Inténtalo de nuevo.', forgotPassword: '¿Olvidaste tu contraseña?', resetPassword: 'Restablecer contraseña', enterEmailForReset: "Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.", sendResetLink: 'Enviar enlace', backToSignIn: 'Volver a iniciar sesión', enterNewPassword: 'Ingresa tu nueva contraseña', setNewPassword: 'Establecer nueva contraseña', resetLinkSent: "Si existe una cuenta con ese correo, enviamos un enlace de restablecimiento.", checkEmailOrCopyLink: "Revisa tu correo o copia el enlace a continuación (para desarrollo):", copyLink: 'Copiar enlace', linkCopied: '¡Enlace copiado!', passwordResetSuccess: 'Contraseña restablecida. Ya puedes iniciar sesión.' },
    dashboard: { yourChats: 'Tus conversaciones', newChat: 'Nueva conversación', searchChats: 'Buscar', projects: 'Proyectos', tayAIWorkspace: 'Espacio TayAI', noChatsYet: 'Sin conversaciones aún', getHelp: 'Ayuda', helpCenter: 'Centro de ayuda', releaseNotes: 'Notas de versión', termsPolicies: 'Términos y políticas', keyboardShortcuts: 'Atajos de teclado', learnMore: 'Más información', aboutTayAI: 'Acerca de TayAI', usagePolicy: 'Política de uso', chatWithTayAI: 'Chatear con TayAI' },
    chat: { startConversation: 'Iniciar una conversación', askTayAIAnything: 'Pregúntale lo que quieras a TayAI...', copy: 'Copiar', thumbsUp: 'Pulgar arriba', thumbsDown: 'Pulgar abajo', share: 'Compartir', moreActions: 'Más acciones', branchInNewChat: 'Ramificar en nueva conversación', replay: 'Repetir', reportMessage: 'Reportar mensaje', voiceChatEnded: 'Chat de voz terminado', listening: 'Escuchando...', cancel: 'Cancelar', end: 'Fin', typeMessage: 'Escribe un mensaje...', addFilesOrPhotos: 'Añadir archivos o fotos', addPhotosAndFiles: 'Añadir fotos y archivos', addFromGoogleDrive: 'Añadir desde Google Drive', createImage: 'Crear imagen', thinking: 'Pensamiento', deepResearch: 'Investigación profunda', shoppingResearch: 'Investigación de compras', takeScreenshot: 'Capturar pantalla', startRecording: 'Iniciar grabación', dictate: 'Dictar', readAloud: 'Leer en voz alta', sendMessage: 'Enviar', capturePhoto: 'Tomar foto' },
    settings: { general: 'General', notifications: 'Notificaciones', personalization: 'Personalización', schedules: 'Horarios', account: 'Cuenta', appearance: 'Apariencia', system: 'Sistema', light: 'Claro', dark: 'Oscuro', accentColor: 'Color de acento', default: 'Por defecto', purple: 'Morado', blue: 'Azul', green: 'Verde', spokenLanguage: 'Idioma hablado', autoDetect: 'Detección automática', voice: 'Voz', separateVoice: 'Voz separada para el chat', showAdditionalModels: 'Mostrar modelos adicionales' },
  },
  pt: {
    common: { loading: 'A carregar...', settings: 'Definições', logout: 'Terminar sessão', cancel: 'Cancelar', language: 'Idioma', online: 'Online' },
    auth: { passwordsDoNotMatch: 'As palavras-passe não coincidem', passwordTooShort: 'A palavra-passe deve ter pelo menos 8 caracteres', registrationFailed: 'Registo falhou. Tente novamente.', createNewAccount: 'Criar nova conta', email: 'E-mail', username: 'Nome de utilizador', password: 'Palavra-passe', confirmPassword: 'Confirmar palavra-passe', register: 'Registar', alreadyHaveAccount: 'Já tem uma conta?', signIn: 'Iniciar sessão', welcomeBack: 'Bem-vindo de volta', signInToContinue: 'Inicie sessão para continuar', accountCreatedSuccess: 'Conta criada. Inicie sessão abaixo.', dontHaveAccount: 'Não tem conta?', createAccount: 'Criar conta', loginFailed: 'Falha ao iniciar sessão. Tente novamente.', forgotPassword: 'Esqueceu a palavra-passe?', resetPassword: 'Repor palavra-passe', enterEmailForReset: "Introduza o seu e-mail e enviaremos um link para repor a palavra-passe.", sendResetLink: 'Enviar link', backToSignIn: 'Voltar ao início de sessão', enterNewPassword: 'Introduza a nova palavra-passe', setNewPassword: 'Definir nova palavra-passe', resetLinkSent: "Se existir uma conta com esse e-mail, enviamos um link de reposição.", checkEmailOrCopyLink: "Verifique o seu e-mail ou copie o link abaixo (para desenvolvimento):", copyLink: 'Copiar link', linkCopied: 'Link copiado!', passwordResetSuccess: 'Palavra-passe reposta. Pode agora iniciar sessão.' },
    dashboard: { yourChats: 'As suas conversas', newChat: 'Nova conversa', searchChats: 'Pesquisar', projects: 'Projetos', tayAIWorkspace: 'Espaço TayAI', noChatsYet: 'Ainda sem conversas', getHelp: 'Ajuda', helpCenter: 'Centro de ajuda', releaseNotes: 'Notas de versão', termsPolicies: 'Termos e políticas', keyboardShortcuts: 'Atalhos de teclado', learnMore: 'Saber mais', aboutTayAI: 'Sobre o TayAI', usagePolicy: 'Política de utilização', chatWithTayAI: 'Conversar com TayAI' },
    chat: { startConversation: 'Iniciar uma conversa', askTayAIAnything: 'Pergunte qualquer coisa ao TayAI...', copy: 'Copiar', thumbsUp: 'Gosto', thumbsDown: 'Não gosto', share: 'Partilhar', moreActions: 'Mais ações', branchInNewChat: 'Ramificar em nova conversa', replay: 'Repetir', reportMessage: 'Reportar mensagem', voiceChatEnded: 'Chat de voz terminado', listening: 'A ouvir...', cancel: 'Cancelar', end: 'Fim', typeMessage: 'Escreva uma mensagem...', addFilesOrPhotos: 'Adicionar ficheiros ou fotos', addPhotosAndFiles: 'Adicionar fotos e ficheiros', addFromGoogleDrive: 'Adicionar do Google Drive', createImage: 'Criar imagem', thinking: 'Pensamento', deepResearch: 'Investigação aprofundada', shoppingResearch: 'Investigação de compras', takeScreenshot: 'Capturar ecrã', startRecording: 'Iniciar gravação', dictate: 'Ditar', readAloud: 'Ler em voz alta', sendMessage: 'Enviar', capturePhoto: 'Capturar foto' },
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
