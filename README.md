# 1 prompt, 1 zdanie

Codziennie od poniedziałku do piątku tworzę jeden projekt z **jednego zdania**, bez żadnych dodatkowych iteracji. Co wyjdzie, udostępniam.

Autor: Bartłomiej Borowczyk · [vibemaster.pl](https://vibemaster.pl)

## Na czym polega eksperyment

- **Jedno zdanie.** Opisuję pomysł jednym zdaniem i dokładam stały dopisek (poniżej). Nic więcej.
- **Zero iteracji.** Nie poprawiam, nie dopytuję, nie proszę o zmiany. W każdej sesji jest dokładnie jedna moja wiadomość.
- **Wszystkie decyzje podejmuje model**: gatunek, wygląd, mechaniki, technologia, struktura plików.
- **Publikuję wynik takim, jaki jest**, razem z promptem. Dobry czy słaby.
- Projekt ma działać w przeglądarce po dwukrotnym kliknięciu `index.html`, bez instalowania czegokolwiek.

Stały dopisek po zdaniu z pomysłem:

> Ty podejmujsze wszystkie decyzje. Projekt ma być super i dać się odpalić w przeglądarce. O nic mnie nie pytaj tylko stwórz gotowy projekty. (Umieść go w folderze …)

Prompty są cytowane dosłownie, z oryginalną pisownią i literówkami.

## Projekty

| # | Data | Projekt | Zdanie z pomysłem | Model | Czas pracy modelu |
|---|---|---|---|---|---|
| 1 | pon. 19.10.2026 | [Tarcza Ziemi](1-meteoryty-gra-opus5_5/) – gra w obronę Ziemi przed meteorytami | „Stwórz proszę grę w któej gracz ma za zadanie obronić ziemię przed spadającymi metorytami.” | Claude Opus 5.5 | ok. 35 min |
| 2 | wt. 20.10.2026 | [Sejsmo·Lab](2-trzesienie-ziemi-interaktywne-opus5_5/) – symulator trzęsień ziemi 3D | „Stwórz proszę interaktywną animacją 3D, w które gracz może testować różne wielkości trzesięnia ziemi w taki spośób by zobaczył efekt trzęsienia ziemi zależny od siły zjawiska.” | Claude Opus 5.5 | ok. 75 min |

Pełny prompt, godzina i szczegóły są w README każdego projektu.

## Jak uruchomić

Wejdź do folderu projektu i kliknij dwa razy `index.html`. Projekty to czyste HTML, CSS i JavaScript, bez budowania i bez serwera.

## Narzędzie i konwencja

- Wszystkie projekty powstają w [Claude Code](https://claude.com/claude-code) (model podany w tabeli).
- Nazwa folderu: `numer-temat-model`, np. `1-meteoryty-gra-opus5_5`.
