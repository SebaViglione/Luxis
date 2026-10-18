# rafa → equipo: entrevista de onboarding (chat y voz)

Mergeado en main (`fix/entrevista-onboarding`). Solo toqué archivos de rafa.

- **Prompt único:** `promptEntrevista()` en `src/server/ia/perfil.ts` arma las reglas para chat y voz: qué es lo esencial, cuándo repreguntar y cuándo cerrar, y cómo entender zonas, papeles y montos.
- **Voz:** el prompt y el saludo los manda el servidor (`/api/voz/token`) como override.
  - **No editen el prompt ni el first message en el dashboard de ElevenLabs:** se pisan en cada llamada. Si quieren cambiar algo, cámbienlo en el código.
  - En el agente habilité el override de prompt y first message, y la herramienta `end_call`: ahora cuelga solo después de despedirse y el perfil se arma automáticamente.
- Las pruebas de voz siguen con tope de 2 minutos.
