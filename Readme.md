# PRO OC Insurance reporter

Rozšíření do prohlížeče obsahující automatický skript, který prochází přiložené Covid-19 žádanky s cílem ověřit správnost pojištění k datu vystavení a pokusit se nalézt platné číslo pojištěnce k datu vystavení a dnešnímu datu.

## Zásady ochrany osobních údajů

Osobní informace pacientů podmíněné přihlášením do modulu [Pacienti COVID-19](https://ereg.ksrzis.cz/Registr/CUDZadanky/VyhledaniPacienta) a webové aplikace [Žádanky testů COVID-19](https://eregpublicsecure.ksrzis.cz/Registr/CUD/Overeni) jsou použity pro přidání nových funkcí, které využívají [VZP B2B](https://www.vzp.cz/e-vzp/b2b-komunikace). **Žádná data nejsou jakkoliv zpracovávána.**

## Použití

1. Aktuálně (k 24.1.2022) se nelze k [VZP B2B endpoint](https://prod.b2b.vzp.cz) dotazovat z rozšíření v prohlížeči z důvodu CORS Policy. Je zapotřebí zadat do nastavení vlastní proxy server, který dotaz zproztředkuje, např. [VZP B2B CORS Proxy](https://github.com/PRO-OC/pro-oc-vzp-b2b-cors-proxy).

2. Aktuálně (k 10.3.2022) se nelze automatizovaně dotazovat k [VZP B2B endpoint](https://prod.b2b.vzp.cz) na pojištění za pomoci jména, přijmení a datumu narození. Z toho důvodu je potřeba do nastavení zadat vlastní proxy server, který dotaz zprostředkuje, např. [PRO OC VZP Point Proxy](https://github.com/PRO-OC/pro-oc-vzp-point-proxy).

2. Přesunout soubor se žádankami do složky **Assets/Žádanky.xlsx** ve formátu:
- **1. řádek** obsahující sloupce v tomto pořadí: Datum, Číslo žádanky, Jméno, Příjmení, Číslo pojištěnce, Číslo pacienta, Stav žádanky, Pojišťovna (řádek je nepovinný, může zůstat prázdný, data se ale vždy začínají načítat až od 2. řádku)
- **2. až n. řádek** konkrétních dat (nepovinné sloupce jsou Datum, Stav žádanky a Pojišťovna) 
- žádanky za předchozí den je pro přihlášené zdravotnické zařízení možné v tomto formátu vyexportovat na stránce [Moje žádanky](https://ereg.ksrzis.cz/Registr/CUDZadanky/MojeZadanky)

![Preview](preview/export.png)

3. Přihlásit se do webové aplikace [Žádanky Covid-19](https://eregpublicsecure.ksrzis.cz/Registr/CUD/Overeni/Prihlaseni) a modulu [Pacienti Covid-19](https://eregotp.ksrzis.cz/), kde je potřeba zakliknout roli Vakcinace
4. Rozšíření nahrát do prohlížeče, kliknout na ikonu rozšíření (v případě potřeby zobrazení logování kliknout prozkoumat popup okno a otevřít záložku console),  kliknout na tlačítko pod ikonou rozšíření

![Preview](preview/tlacitko_spusteni.png)

5. Zobrazené logy v consoli lze zpřehlednit např. takto `cat ulozit-jako-z-console-f12.log | grep '^popup.js:*' | sort -k8 -n > output.log`

## Logování

- Každý záznam uvádí číslo řádku ze vstupního Excel souboru ke kterému se vztahuje

```
popup.js:278 Vyžádaná úprava k Excel řádku č. 893. Žádanka č. 6619769999. Uvedené pojištění: `8002689999` na žádance nebylo v den vystavení žádanky: `Sat Dec 18 2021 12:18:34 GMT+0000 (Coordinated Universal Time)` platné. Pro danou osobu se nepodařil najít v ISIN žádný profil, který by odpovídalo jménu, přijmení, datumu narození a státní příslušnosti ze žádanky.
popup.js:300 Vyžádaná úprava k Excel řádku č. 1166. Žádanka č. 9297539999. Uvedené pojištění: `0406789999` na žádance nebylo v den vystavení žádanky: `Fri Dec 17 2021 15:02:30 GMT+0000 (Coordinated Universal Time)` platné. Pro danou osobu se ale podařilo na profilu v ISIN číslo: `1486878731` přečíst číslo pojištěnce: `0406289147`, které v danou chvíli platné bylo. K datu této kontroly platné je: `Tue Jan 25 2021 21:10:00 GMT+0000 (Coordinated Universal Time)`.
popup.js:302 Vyžádaná úprava k Excel řádku č. 1274. Žádanka č. 6048409999. Uvedené pojištění: `8060559999` na žádance nebylo v den vystavení žádanky: `Fri Dec 17 2021 12:31:53 GMT+0000 (Coordinated Universal Time)` platné. Pro danou osobu se nepodařilo na nalezeném profilu v ISIN přečíst číslo pojištěnce, které by v danou chvíli platné bylo.
popup.js:278 Vyžádaná úprava k Excel řádku č. 1812. Žádanka č. 7878219999. Uvedené pojištění: `9051789999` na žádance nebylo v den vystavení žádanky: `Thu Dec 16 2021 11:04:56 GMT+0000 (Coordinated Universal Time)` platné. Pro danou osobu se nepodařil najít v ISIN žádný profil, který by odpovídalo jménu, přijmení, datumu narození a státní příslušnosti ze žádanky.
```
