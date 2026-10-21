# Kapibara Kombat

Bijatyka w stylu Street Fightera i Mortal Kombat, w której walczą kapibary. Dwóch graczy gra na jednej klawiaturze. Każda kapibara ma ponad 20 ruchów: ciosy podstawowe, ciosy specjalne, super cios i wykończenie. Do tego dochodzą combosy w łańcuchach i w powietrzu.

## Jak powstał

Dzień 3 eksperymentu [1 prompt, 1 zdanie](../README.md): jeden prompt, zero poprawek.

- **Data:** środa, 21.10.2026, godz. 11:42
- **Model:** Claude Opus 5.5 (`claude-opus-5-5`) w Claude Code
- **Czas pracy modelu:** ok. 60 minut
- **Prompt** (dosłownie, z oryginalną pisownią):

> Stwórz proszę grę typu street fighter / mortal kombat w której dwie kapybary walczą między sobą, a gracze grają na jednej klawaiturze i mają bardzo dużo ciosów i combo do wykorzsytania.
> Ty podejmujsze wszystkie decyzje. Projekt ma być super i dać się odpalić w przeglądarce. O nic mnie nie pytaj tylko stwórz gotowy projekty. Umieść go w folderze dedykowanym i nazwij go zgodnie z konwencją nazewnictwa stosowaną we wczesniejszych projektach.

## Jak uruchomić

Kliknij dwa razy plik **`index.html`**. Gra otworzy się w przeglądarce (Chrome, Edge, Firefox).
Nie trzeba niczego instalować ani budować.

> Czcionki ładują się z Google Fonts. Bez internetu gra działa tak samo, tylko z czcionką systemową.

## Sterowanie

| | Gracz 1 (lewa strona) | Gracz 2 (prawa strona) |
|---|---|---|
| Ruch, skok, kucanie | `W` `A` `S` `D` | strzałki |
| **LŁ** – lekka łapa | `T` | `O` lub `Num4` |
| **MŁ** – mocna łapa | `Y` | `P` lub `Num5` |
| **LK** – lekkie kopnięcie | `G` | `L` lub `Num1` |
| **MK** – mocne kopnięcie | `H` | `;` lub `Num2` |
| Pauza | `Esc` | `Esc` |

Kierunki liczą się względem postaci: „→” to zawsze „do rywala”. **Blok** to trzymanie kierunku od rywala. Stojąc blokujesz ciosy z góry i średnie, a kucając niskie i średnie.

> Wiele klawiatur nie rejestruje więcej niż 3–4 klawiszy naraz. Jeśli jakiś cios „nie wchodzi”, gracz 2 może użyć klawiatury numerycznej.

## Tryby

- **Walka 2 graczy** – obaj gracze na jednej klawiaturze.
- **Walka z komputerem** – 4 poziomy: Łatwy, Średni, Trudny, Mistrz. Komputer wykonuje te same ruchy co człowiek, łącznie z combosami i wykończeniami.
- **Trening**:
  - manekin może stać, kucać, skakać, blokować albo walczyć,
  - życie się odnawia, a pasek super może być bez limitu,
  - widać licznik ostatniego combo i historię wciśniętych kierunków,
  - można włączyć podgląd hitboxów.

  Klawisze: `1` – tryb manekina, `2` – hitboxy, `3` – reset pozycji, `4` – pasek super.
- W tle menu toczy się pokazowa walka dwóch kapibar sterowanych przez komputer.

## Kapibary

| Postać | Styl | Ciosy specjalne | Super (2 paski) | Kapibality |
|---|---|---|---|---|
| **Kapitan Kapi** – karateka z czerwoną opaską | wszechstronny | Pomarańczowa Kula `↓↘→+Ł`, Wznosząca Łapa `→↓↘+Ł`, Wiatrak Kapibary `↓↙←+K`, Bomba z Kąpieli `↓↓+K` | Pomarańczowy Wodospad | Owocowa Lawina `→↓→+MŁ` |
| **Mama Yuzu** – właścicielka onsenu | strefowa | Fala z Balii `↓↘→+Ł` (nisko), Gejzer `↓↙←+Ł`, Ręcznikowy Bicz `→↓↘+Ł`, Ślizg na Mydle `←→+K` | Wielka Fala (tsunami) | Wieczny Relaks `↓→↓+LK` |
| **Cień Trzciny** – ninja z bagien | szybki | Liść-Shuriken `↓↘→+Ł` (też w powietrzu), Teleport `↓↓+Ł`, Żurawi Kopniak `→↓↘+K`, Szarża Cienia `←→+Ł`, Nurkujący Kopniak (w powietrzu `↓+MK`) | Tysiąc Liści | Kapi-Maki `←→←+LŁ` |
| **Gruby Bruno** – sumita | zapaśnik | Bagienny Suplex `↓↓+Ł` (chwyt), Brzuchowa Szarża `←→+Ł` (pancerz), Młyn Łap `→↓↘+Ł`, Bagienne Tupnięcie `↓↓+K`, Lecący Brzuch `↓↘→+K` | Bomba z Trampoliny | Na Księżyc `↓↓↓+MŁ` |

Ł oznacza dowolną łapę, a K dowolne kopnięcie. Wersja z mocnym przyciskiem jest szybsza, dalsza albo mocniejsza.

## Ciosy wspólne i zasady combo

- 12 ciosów podstawowych: stojąc, kucając i w powietrzu.
- Ciosy z kierunkiem:
  - Główka z rozpędu `→+MŁ` – cios z góry,
  - Kopniak z półobrotu `←+MK` – odrzuca rywala.
- Rzut `LŁ+LK` z bliska. Z `←` rzuca za siebie. Rzut można przerwać, wciskając `LŁ+LK` zaraz po złapaniu.
- Doskok `→→` i odskok `←←`.
- **Łańcuchy**: po trafieniu lub bloku możesz od razu wejść w mocniejszy cios (LŁ → LK → MŁ → MK). Lekkie ciosy można powtarzać.
- Każdy cios naziemny można przerwać ciosem specjalnym, a cios specjalny super ciosem.
- **Wyrzut** `↓+MŁ`, a po nim `↑`, daje super skok i combo w powietrzu. Latający kopniak w combo odbija rywala od ziemi, więc da się dalej bić.
- **Super cios** kosztuje 2 paski: `↓↘→↓↘→+Ł` albo skrót `MŁ+MK`.
- **Przerywnik** kosztuje 1 pasek: `MŁ+MK` w trakcie obrywania wyrywa się z combo.
- Kontry (+20% obrażeń), osłabianie długich combo i limit żonglerki w powietrzu pilnują, żeby walka była uczciwa.
- **Wykończenia**: po ostatniej rundzie pojawia się napis „DOKOŃCZ GO!”. Wtedy można wykonać Kapibality postaci albo wspólną **Kapiprzyjaźń** `←←↓+LK`.

Pełna lista ciosów z przykładowymi combosami jest w menu **Lista ciosów** i w pauzie.

## Areny

- **Bagna Pantanalu** – zachód słońca, rzeka z kajmanem, kapibary-kibice z ptakami na głowach.
- **Gorące Źródła Yuzu** – zimowa noc, śnieg, latarnie, kibice wylegujący się w onsenie z owocami yuzu na głowach.
- **Dojo w Bambusach** – letnie popołudnie, chorągwie i spadające liście.

Kibice zrywają się z miejsc po mocnych ciosach i superach.

## Opcje

Opcje są zapisywane w przeglądarce:

- rundy do zwycięstwa (1–3),
- czas rundy (60 s, 99 s albo bez limitu),
- poziom komputera,
- wykończenia,
- efekty dźwiękowe, muzyka i komentator,
- hitboxy,
- pełny ekran.

Dźwięk, muzyka i piski kapibar są syntezowane na żywo przez Web Audio, bez plików audio. Do każdej areny gra osobny utwór. Komentator mówi po polsku przez syntezę mowy przeglądarki, jeśli jest w niej polski głos.

## Struktura

```
index.html          – strona i ekrany menu
css/style.css       – wygląd interfejsu
js/util.js          – matematyka, kolory, zapis ustawień
js/input.js         – klawiatura, układy graczy, rozpoznawanie ruchów specjalnych
js/audio.js         – efekty, muzyka generowana na żywo, komentator
js/rig.js           – rysowanie kapibary (szkielet z IK), pozy i ich przejścia
js/fx.js            – iskry trafień, kurz, krople, liście, napisy
js/moves.js         – ciosy wspólne, rzut, przerywnik
js/fighter.js       – wojownik: stany, łańcuchy combo, fizyka
js/characters.js    – cztery kapibary, ich kostiumy, ciosy specjalne, supery i pociski
js/finishers.js     – Kapibality i Kapiprzyjaźń
js/stage.js         – areny z paralaksą, kibice, pogoda
js/ai.js            – przeciwnik komputerowy
js/game.js          – rundy, trafienia, kamera, HUD
js/ui.js            – menu, wybór postaci, lista ciosów, opcje, wyniki
js/main.js          – pętla gry 60 kl./s i dopasowanie do okna
```
