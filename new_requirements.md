
# 1. Por cada usuario y pantalla abra un json que contenga toda la información necesaria para esa pantalla, esto sera utilizado por HAVI para tener un Context-Awareness total de cada pagina de la app.


## Pantallas

- Login
- Home
- Perfil
- Salud financiera
- Contexto del chat
- Pagos 
- Transferir 
- Buzon

Analizar que field pueden ser derivados de los logs transaccionales y cuales serias dummy data para completar la experiencia


# 2. Omnipresencia de HAVI para redireccionarte a la pantalla que necesites,(por ejemplo generandote botones de acceso directo en el chat) detectandola a través de los comentarios que le des o que pidas directamente en el chat de HAVI. HAVI tendra que inferir a que pantalla quiere ir el usuario.


# 3. HAVI debe aparecer siempre en cualquier pantalla, dentro de la app al estar loggeado para ofrecer su ayuda.

Cacheo de informacion del perfil cargado en el celular para solo poner contrasena.

# 4. Vamos a quitar lo de que se cambie la mascota en base al archetipo del usuario, el usuario ya lo elige a placer en el frontend ya creado.

# 5. Mascota default por arquetipo, pero el usuario ya puede cambiarla a su gusto, esto se guarda en el perfil del usuario para que siempre tenga la misma mascota aunque cambie de dispositivo.

# 6. Recomendacion de por que medios el json de perfiles y pantallas puede ser modificado, a lo que voy, es que puede ser buena idea que estos jsons esten almacenados en una base de datos y que, por ejemplo, los fields creados desde el pipeline de ML se actualizen en la base de datos y el backend solo haga queries a la base de datos para obtener la informacion actualizada. Tambien quedaria otra duda de si solo se corre el pipeline una vez o se corre cada cierto tiempo para actualizar los perfiles.