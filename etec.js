/* ETEC_A — script commun des écrans modernes (V19)
   Ce fichier fait le lien entre les pages et l'application CSPro (Action Invoker).
   Les pages n'ont aucune règle propre : elles affichent les données reçues
   et appellent les fonctions de la logique CSPro.

   Hors de CSPro (page ouverte dans un navigateur), les pages passent en
   « aperçu » avec des données d'exemple, pour vérifier leur apparence. */

var ETEC = (function () {
  "use strict";

  /* Même jeton que g_JETON dans la logique (PROC GLOBAL) */
  var JETON = "etec-a-v1-5b8e1d36-2f4c-4a97-9c03-e6d17a2b4f58";

  var CS = null;
  try {
    if (typeof CSProActionInvoker !== "undefined") {
      CS = new CSProActionInvoker(JETON);
    }
  } catch (e) {
    CS = null;
  }

  function dansCSPro() {
    return CS !== null;
  }

  /* Données envoyées par la logique (inputData de htmldialog) */
  function donnees() {
    if (!CS) return null;
    try {
      var d = CS.UI.getInputData();
      if (typeof d === "string") {
        try { d = JSON.parse(d); } catch (e) { /* texte simple */ }
      }
      return d || null;
    } catch (e) {
      return null;
    }
  }

  /* Ferme la page et renvoie le résultat à la logique (valeur de retour de htmldialog) */
  function fermer(resultat) {
    if (!CS) {
      window.alert("Aperçu : la page renverrait « " + resultat + " » à l'application.");
      return Promise.resolve(false);
    }
    return CS.UI.closeDialogAsync({ result: String(resultat) });
  }

  /* Appelle une fonction de la logique CSPro ; renvoie une promesse.
     Les fonctions qui répondent en JSON sont converties en objet. */
  function appeler(fonction, args) {
    if (!CS) {
      return Promise.reject(new Error("La page n'est pas ouverte dans l'application CSPro."));
    }
    return CS.Logic.invokeAsync({ "function": fonction, "arguments": args || {} }).then(function (r) {
      if (typeof r === "string") {
        var t = r.trim();
        if (t.charAt(0) === "{" || t.charAt(0) === "[") {
          try { return JSON.parse(t); } catch (e) { return r; }
        }
      }
      return r;
    });
  }

  /* Échappe un texte avant de l'insérer dans la page */
  function html(t) {
    return String(t === undefined || t === null ? "" : t)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function apercu() {
    if (CS) return;
    var b = document.createElement("div");
    b.className = "apercu";
    b.textContent = "Aperçu hors de CSPro : données d'exemple, les boutons ne modifient rien.";
    document.body.insertBefore(b, document.body.firstChild);
  }

  /* Étape 4 : affiche le résultat d'une opération ({ etat, message }) dans l'élément el */
  function bandeau(el, r) {
    if (!el) return;
    if (!r || typeof r !== "object" || !r.message) { el.className = "cache"; el.innerHTML = ""; return; }
    var ok = r.etat === "OK";
    el.className = "message bandeau " + (ok ? "message-ok" : "message-erreur");
    el.setAttribute("role", "status");
    el.innerHTML = (ok
      ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.7 2.7L16 10"/></svg>'
      : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3 2 20h20L12 3z"/><path d="M12 10v4M12 17.5v.5"/></svg>') +
      '<span>' + html(r.message) + '</span>';
    try { el.scrollIntoView({ block: "nearest" }); } catch (e) { /* ancien navigateur */ }
  }

  return { dansCSPro: dansCSPro, donnees: donnees, fermer: fermer, appeler: appeler, html: html, apercu: apercu, bandeau: bandeau };
})();
