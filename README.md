TCP Server & Client – Node.js
Ky projekt implementon një server dhe klient TCP në Node.js me menaxhim privilegjesh, monitorim trafiku dhe operacione mbi file-t në server.

Server

Dëgjon klientët në IP/Port të specifikuar.

Mbështet deri në 3 klientë aktivë; klientët e tjerë futen në pritje.

Ruaj mesazhet e klientëve (server_messages.txt).

Mbyll lidhjet e paaktivitetit >5min dhe rikuperon klientët e rifutur.

Monitoron trafikun dhe statistikat (/stats):

Numri i lidhjeve aktive

IP-të e klientëve

Mesazhet e dërguara

Bytes të dërguara/pranuara

Menaxhon privilegjet: super, admin, user



Klienti
Lidhet me serverin dhe vendos rolin: super, admin, user.


Operacione mbi file-t sipas privilegjeve:


Rol	Komanda të lejuara

Super	/read, /write, /execute
Admin	/list, /read, /upload, /download, /delete, /search, /info
User	/read, /stats


Ngarkon dhe shkarkon file në server (base64).
Klientët me privilegje të plotë kanë kohë përgjigjeje më të shpejtë.


Instalimi

git clone https://github.com/username/Gr_25_RrjetaKompujterike.git

cd Gr_25_RrjetaKompujterike

npm install

node server.js

node client.js


Zgjidh rolin në fillim dhe përdor komandat sipas privilegjeve.


