# 1 prompt, 1 zdanie

Codziennie od poniedziałku do piątku tworzę jeden projekt z **jednego zdania**, bez żadnych dodatkowych iteracji. Co wyjdzie, udostępniam.

Autor: Bartłomiej Borowczyk · [vibemaster.pl](https://vibemaster.pl)

**Galeria z podglądem wszystkich projektów: [1prompt1zdanie.vibemaster.pl](https://1prompt1zdanie.vibemaster.pl)**

## Na czym polega eksperyment

- **Jedno zdanie.** Opisuję pomysł jednym zdaniem i dokładam stały dopisek (poniżej). Nic więcej.
- **Zero iteracji.** Nie poprawiam, nie dopytuję, nie proszę o zmiany. W każdej sesji jest dokładnie jedna moja wiadomość.
- **Wszystkie decyzje podejmuje model**: gatunek, wygląd, mechaniki, technologia, struktura plików.
- **Publikuję wynik takim, jaki jest**, razem z promptem. Dobry czy słaby.
- Projekt ma działać w przeglądarce po dwukrotnym kliknięciu `index.html`, bez instalowania czegokolwiek.

Stały dopisek po zdaniu z pomysłem:

> Ty podejmujsze wszystkie decyzje. Projekt ma być super i dać się odpalić w przeglądarce. O nic mnie nie pytaj tylko stwórz gotowy projekty. (Umieść go w folderze …)

Od dnia 3 nazwę folderu wybiera model („Umieść go w folderze dedykowanym i nazwij go zgodnie z konwencją nazewnictwa stosowaną we wczesniejszych projektach.”).

Prompty są cytowane dosłownie, z oryginalną pisownią i literówkami.

## Projekty

| # | Data | Projekt | Zdanie z pomysłem | Model | Czas pracy modelu |
| --- | --- | --- | --- | --- | --- |
| 1 | pon. 19.10.2026 | [Tarcza Ziemi](1-meteoryty-gra-opus5_5/) – gra w obronę Ziemi przed meteorytami | „Stwórz proszę grę w któej gracz ma za zadanie obronić ziemię przed spadającymi metorytami.” | Claude Opus 5.5 | ok. 35 min |
| 2 | wt. 20.10.2026 | [Sejsmo·Lab](2-trzesienie-ziemi-interaktywne-opus5_5/) – symulator trzęsień ziemi 3D | „Stwórz proszę interaktywną animacją 3D, w które gracz może testować różne wielkości trzesięnia ziemi w taki spośób by zobaczył efekt trzęsienia ziemi zależny od siły zjawiska.” | Claude Opus 5.5 | ok. 75 min |
| 3 | śr. 21.10.2026 | [Kapibara Kombat](3-kapibary-bijatyka-opus5_5/) – bijatyka kapibar dla 2 graczy na jednej klawiaturze | „Stwórz proszę grę typu street fighter / mortal kombat w której dwie kapybary walczą między sobą, a gracze grają na jednej klawaiturze i mają bardzo dużo ciosów i combo do wykorzsytania.” | Claude Opus 5.5 | ok. 60 min |
| 4 | czw. 22.10.2026 | [Oczami innych](4-zaburzenia-wzroku-symulator-opus5_5/) – symulator zaburzeń wzroku (krótkowzroczność, astygmatyzm, daltonizm, zaćma i ponad 20 innych) | „Stwórz proszę aplikację, która będzie pokazywała i wyjaśniała w jaki sposób świat widzą osoby z różnymi zaburzeniami wzroku np krótkowidze, dalekowidze, osoby z zezem, osoby z astygmatyzmem, daltonizmem i innymi nie wymienionymi.” | Claude Opus 5.5 | ok. 70 min |
| 5 | pt. 23.10.2026 | [Absurdoro](5-pomodoro-absurdalny-timer-opus5_5/) – absurdalny timer pomodoro, który odlicza czas na 12 sposobów (gąsienica je pomidora, kot zrzuca rzeczy ze stołu, zegar Dalego się topi) | „Stwórz proszę aplikację typu pomodoro, która w zabawny wręcz absurdalny sposób odlicza czas zadania na wiele sposobów by nie było nudno i użytkownik tworzac zadania, będąc w jego trakcie oraz po zakończeniu miał poczucie szkoku i niedowierzania w śmiesznych znaczeniu.” | Claude Opus 5.5 | ok. 30 min |

Pełny prompt, godzina i szczegóły są w README każdego projektu.

## Jak uruchomić

Najprościej w [galerii](https://1prompt1zdanie.vibemaster.pl): przycisk „Zagraj” otwiera projekt w przeglądarce. Lokalnie: wejdź do folderu projektu i kliknij dwa razy `index.html`. Projekty to czyste HTML, CSS i JavaScript, bez budowania i bez serwera.

## Narzędzie i konwencja

- Wszystkie projekty powstają w [Claude Code](https://claude.com/claude-code) (model podany w tabeli).
- Nazwa folderu: `numer-temat-model`, np. `1-meteoryty-gra-opus5_5`.
- Galeria to `index.html` w głównym folderze (lista projektów w tablicy `PROJEKTY`), miniatury leżą w `galeria/`.
