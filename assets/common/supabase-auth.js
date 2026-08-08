/* Client Supabase partage + helpers d'authentification, reutilisables sur
   n'importe quelle page (connexion, futures pages reservees aux membres...).
   Necessite que vendor/supabase.js et le script de config (URL + cle
   publishable) soient charges avant ce fichier. Expose window.SSBAuth. */
(function () {
  "use strict";

  var client =
    window.supabase && window.SSB_SUPABASE_URL && window.SSB_SUPABASE_ANON_KEY
      ? window.supabase.createClient(window.SSB_SUPABASE_URL, window.SSB_SUPABASE_ANON_KEY)
      : null;

  function translateAuthError(message) {
    var m = (message || "").toLowerCase();
    if (m.indexOf("invalid login credentials") !== -1) return "Email ou mot de passe incorrect.";
    if (m.indexOf("already registered") !== -1 || m.indexOf("already exists") !== -1) return "Un compte existe déjà avec cet email.";
    if (m.indexOf("password") !== -1 && m.indexOf("least") !== -1) return "Le mot de passe doit faire au moins 6 caractères.";
    if (m.indexOf("email not confirmed") !== -1) return "Confirme ton email avant de te connecter (vérifie ta boîte de réception).";
    if (m.indexOf("rate limit") !== -1) return "Trop de tentatives, réessaie dans quelques minutes.";
    return message || "Une erreur est survenue, réessaie.";
  }

  function signUp(email, password, name) {
    if (!client) return Promise.resolve({ success: false, message: "Connexion à Supabase indisponible." });
    // Sans ce parametre, le lien de confirmation recu par email pointe vers
    // le "Site URL" par defaut du projet Supabase (localhost:3000 tant que
    // ce reglage n'a pas ete mis a jour cote dashboard Supabase). On force
    // ici le retour vers le domaine reel d'ou vient l'inscription. Il faut
    // en plus que ce domaine soit ajoute a la liste blanche "Redirect URLs"
    // dans Supabase (Authentication > URL Configuration), sinon Supabase
    // ignore ce parametre et repart quand meme sur le Site URL par defaut.
    var emailRedirectTo = window.location.origin + window.location.pathname.replace(/[^/]*$/, "connexion.html");
    var options = { emailRedirectTo: emailRedirectTo };
    if (name) options.data = { name: name };
    return client.auth.signUp({ email: email, password: password, options: options }).then(function (res) {
      if (res.error) return { success: false, message: translateAuthError(res.error.message), raw: res.error };
      return { success: true, data: res.data, needsEmailConfirmation: !res.data.session };
    });
  }

  function signIn(email, password) {
    if (!client) return Promise.resolve({ success: false, message: "Connexion à Supabase indisponible." });
    return client.auth.signInWithPassword({ email: email, password: password }).then(function (res) {
      if (res.error) return { success: false, message: translateAuthError(res.error.message), raw: res.error };
      return { success: true, data: res.data };
    });
  }

  function signOut(redirectTo) {
    var p = client ? client.auth.signOut() : Promise.resolve();
    return p.then(function () {
      if (redirectTo) window.location.href = redirectTo;
    });
  }

  function getSession() {
    if (!client) return Promise.resolve(null);
    return client.auth.getSession().then(function (res) { return res.data.session; });
  }

  /* A appeler en haut d'une page reservee aux membres : redirige vers la
     connexion si personne n'est authentifie. */
  function requireAuth(redirectTo) {
    return getSession().then(function (session) {
      if (!session) window.location.href = redirectTo || "connexion.html";
      return session;
    });
  }

  window.SSBAuth = {
    client: client,
    signUp: signUp,
    signIn: signIn,
    signOut: signOut,
    getSession: getSession,
    requireAuth: requireAuth,
    translateAuthError: translateAuthError
  };
})();
