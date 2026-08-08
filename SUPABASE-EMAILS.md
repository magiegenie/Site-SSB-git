# Emails d'authentification SSB — à coller dans Supabase

Les emails envoyés par Supabase sont personnalisables sur **deux plans distincts**,
qui n'ont rien à voir l'un avec l'autre. Il faut traiter les deux pour que
l'email ne ressemble plus à un email Supabase.

| Ce qui te dérange | Où ça se règle |
|---|---|
| Le **contenu** de l'email (design, texte, bouton) | Authentication → Emails → Templates. Templates ci-dessous. |
| L'**expéditeur** affiché (« Supabase », `noreply@mail.app.supabase.io`) | Authentication → Emails → SMTP Settings. Impossible à changer autrement. |

---

## 1. L'expéditeur : brancher un SMTP à toi

Tant que le SMTP par défaut de Supabase est utilisé, l'email arrive de
`noreply@mail.app.supabase.io` avec « Supabase » comme nom d'expéditeur.
Aucun réglage de template ne change ça, c'est côté serveur d'envoi.

Deux limites supplémentaires du SMTP par défaut, qui comptent pour un vrai
lancement : il est **limité à quelques emails par heure**, et il est réservé
aux usages de test. Une soirée d'inscriptions après une conférence le
saturerait.

**Chez Brevo** (déjà utilisé pour la prospection AMIA, donc compte existant) :

1. Brevo → menu compte → **SMTP & API** → onglet **SMTP** → créer une clé SMTP
2. Noter les identifiants : serveur `smtp-relay.brevo.com`, port `587`,
   login (l'email du compte Brevo), et la clé SMTP générée
3. Supabase → **Authentication** → **Emails** → **SMTP Settings** → activer
   « Enable Custom SMTP » et remplir :
   - Sender email : `contact@sorbonnesportbusiness.fr`
   - Sender name : `Sorbonne Sport Business`
   - Host : `smtp-relay.brevo.com`
   - Port : `587`
   - Username : l'email du compte Brevo
   - Password : la clé SMTP Brevo
4. Save

⚠️ La clé SMTP est un secret : elle se saisit directement dans l'interface
Supabase, elle ne doit jamais être écrite dans le code du site ni poussée sur
GitHub.

⚠️ Pour que les emails n'atterrissent pas en spam, le domaine
`sorbonnesportbusiness.fr` doit être authentifié dans Brevo (enregistrements
DKIM/SPF à ajouter chez le registrar du domaine). Brevo guide pas à pas dans
**Expéditeurs & domaines**.

---

## 2. Le contenu : templates SSB

Supabase → **Authentication** → **Emails** → **Templates**. Choisir le template
dans la liste déroulante, coller le HTML correspondant dans le champ *Message
body*, ajuster l'objet, puis Save.

Les templates ci-dessous sont en HTML par tableaux avec styles en ligne, seule
forme fiable dans Gmail, Outlook et Mail iOS. Les polices du site (General
Sans, Fraunces) ne sont pas chargeables en email, on retombe donc
volontairement sur les polices système avec la même hiérarchie.

---

### Template « Confirm signup »

**Objet :** `Confirme ton adresse — Sorbonne Sport Business`

```html
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
<body style="margin:0; padding:0; background:#f6f5f2;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f5f2; padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px; background:#ffffff; border-radius:16px; overflow:hidden;">

        <tr><td style="background:#062750; padding:32px 36px;">
          <p style="margin:0; font-family:Helvetica,Arial,sans-serif; font-size:13px; letter-spacing:2px; text-transform:uppercase; color:#ffcf5c; font-weight:bold;">Sorbonne Sport Business</p>
        </td></tr>

        <tr><td style="padding:40px 36px 8px;">
          <h1 style="margin:0; font-family:Georgia,'Times New Roman',serif; font-size:30px; line-height:1.2; color:#041a35; font-weight:normal;">Plus qu'une étape.</h1>
        </td></tr>

        <tr><td style="padding:16px 36px 0;">
          <p style="margin:0; font-family:Helvetica,Arial,sans-serif; font-size:16px; line-height:1.6; color:#5b6472;">
            Ton compte Sorbonne Sport Business est créé. Confirme ton adresse email pour accéder à ton espace membre.
          </p>
        </td></tr>

        <tr><td style="padding:28px 36px 0;">
          <table role="presentation" cellpadding="0" cellspacing="0"><tr>
            <td style="background:#ffb607; border-radius:12px;">
              <a href="{{ .ConfirmationURL }}" style="display:inline-block; padding:15px 28px; font-family:Helvetica,Arial,sans-serif; font-size:16px; font-weight:bold; color:#041a35; text-decoration:none;">Confirmer mon adresse</a>
            </td>
          </tr></table>
        </td></tr>

        <tr><td style="padding:28px 36px 0;">
          <p style="margin:0; font-family:Helvetica,Arial,sans-serif; font-size:13px; line-height:1.6; color:#8a93a1;">
            Si le bouton ne fonctionne pas, copie ce lien dans ton navigateur :<br />
            <a href="{{ .ConfirmationURL }}" style="color:#0a2f5c; word-break:break-all;">{{ .ConfirmationURL }}</a>
          </p>
        </td></tr>

        <tr><td style="padding:28px 36px 36px;">
          <p style="margin:0; padding-top:20px; border-top:1px solid #eceae5; font-family:Helvetica,Arial,sans-serif; font-size:13px; line-height:1.6; color:#8a93a1;">
            Tu n'es pas à l'origine de cette inscription ? Ignore simplement cet email, aucun compte ne sera activé.
          </p>
        </td></tr>

      </table>

      <p style="margin:20px 0 0; font-family:Helvetica,Arial,sans-serif; font-size:12px; color:#8a93a1;">
        Sorbonne Sport Business, association étudiante, Paris 1 Panthéon-Sorbonne.
      </p>
    </td></tr>
  </table>
</body>
</html>
```

---

### Template « Reset password »

**Objet :** `Réinitialise ton mot de passe — Sorbonne Sport Business`

```html
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
<body style="margin:0; padding:0; background:#f6f5f2;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f5f2; padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px; background:#ffffff; border-radius:16px; overflow:hidden;">

        <tr><td style="background:#062750; padding:32px 36px;">
          <p style="margin:0; font-family:Helvetica,Arial,sans-serif; font-size:13px; letter-spacing:2px; text-transform:uppercase; color:#ffcf5c; font-weight:bold;">Sorbonne Sport Business</p>
        </td></tr>

        <tr><td style="padding:40px 36px 8px;">
          <h1 style="margin:0; font-family:Georgia,'Times New Roman',serif; font-size:30px; line-height:1.2; color:#041a35; font-weight:normal;">Nouveau mot de passe.</h1>
        </td></tr>

        <tr><td style="padding:16px 36px 0;">
          <p style="margin:0; font-family:Helvetica,Arial,sans-serif; font-size:16px; line-height:1.6; color:#5b6472;">
            Tu as demandé à réinitialiser le mot de passe de ton espace membre. Ce lien est valable une heure.
          </p>
        </td></tr>

        <tr><td style="padding:28px 36px 0;">
          <table role="presentation" cellpadding="0" cellspacing="0"><tr>
            <td style="background:#ffb607; border-radius:12px;">
              <a href="{{ .ConfirmationURL }}" style="display:inline-block; padding:15px 28px; font-family:Helvetica,Arial,sans-serif; font-size:16px; font-weight:bold; color:#041a35; text-decoration:none;">Choisir un nouveau mot de passe</a>
            </td>
          </tr></table>
        </td></tr>

        <tr><td style="padding:28px 36px 0;">
          <p style="margin:0; font-family:Helvetica,Arial,sans-serif; font-size:13px; line-height:1.6; color:#8a93a1;">
            Si le bouton ne fonctionne pas, copie ce lien dans ton navigateur :<br />
            <a href="{{ .ConfirmationURL }}" style="color:#0a2f5c; word-break:break-all;">{{ .ConfirmationURL }}</a>
          </p>
        </td></tr>

        <tr><td style="padding:28px 36px 36px;">
          <p style="margin:0; padding-top:20px; border-top:1px solid #eceae5; font-family:Helvetica,Arial,sans-serif; font-size:13px; line-height:1.6; color:#8a93a1;">
            Tu n'as rien demandé ? Ignore cet email, ton mot de passe actuel reste valable.
          </p>
        </td></tr>

      </table>

      <p style="margin:20px 0 0; font-family:Helvetica,Arial,sans-serif; font-size:12px; color:#8a93a1;">
        Sorbonne Sport Business, association étudiante, Paris 1 Panthéon-Sorbonne.
      </p>
    </td></tr>
  </table>
</body>
</html>
```

---

## 3. Rappel du réglage qui casse tout s'il est oublié

**Authentication → URL Configuration** doit contenir le domaine réel du site,
sinon les liens de confirmation repartent vers `localhost:3000` :

- Site URL : `https://green-wildcat-740586.hostingersite.com`
- Redirect URLs : `https://green-wildcat-740586.hostingersite.com/**`

Le jour où le site passe sur `sorbonnesportbusiness.fr`, ces deux champs sont
à mettre à jour en même temps que le domaine, sinon les inscriptions cassent
silencieusement.
