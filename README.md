# TitBird – System zgłaszania usterek w pracowniach komputerowych

**Autor:** Projekt indywidualny  
**Przedmiot:** Technologie Webowe – Projekt semestralny  
**Repozytorium:** [https://github.com/zynioo/TitBirdProject](https://github.com/zynioo/TitBirdProject)

---

## 1. Cel aplikacji
Aplikacja **TitBird** jest dedykowana uczniom oraz nauczycielom (opiekunom szkolnych pracowni komputerowych). Rozwiązuje powszechny problem gubiących się, zgłaszanych ustnie problemów ze sprzętem (np. uszkodzona mysz, brak połączenia z siecią, uszkodzony kabel HDMI, niedziałający monitor) oraz braku informacji zwrotnej o postępach w naprawie.

**Przykład użycia:**  
Uczeń siada przy stanowisku nr 12 w sali 204 i zauważa uszkodzony kabel HDMI. Loguje się do aplikacji TitBird, wypełnia prosty formularz, wskazując salę, numer stanowiska (z przedziału 1–32), kategorię sprzętu oraz krótki opis problemu. Opiekun pracowni (administrator) widzi nowe zgłoszenie w swoim panelu, diagnozuje i usuwa usterkę, a następnie zmienia status zgłoszenia na „Naprawione” i dodaje komentarz podsumowujący. Uczeń widzi aktualny stan naprawy na swoim koncie.

---

## 2. Planowane funkcje użytkowników
Zgodnie z wymaganiami projektowymi aplikacja oferuje następujące kluczowe czynności użytkownika:

1. **Tworzenie zgłoszenia:**  
   Zalogowany uczeń dodaje nowe zgłoszenie usterki, wskazując numer sali, numer stanowiska (1–32), kategorię usterki (np. *Monitor*, *Mysz/Klawiatura*, *PC/Stacja*, *Sieć*, *Okablowanie*, *Inne*) oraz opis problemu.
2. **Przeglądanie i edycja własnych zgłoszeń:**  
   Uczeń ma dostęp do listy wyłącznie własnych zgłoszeń wraz z ich aktualnym statusem (*Nowe*, *W trakcie*, *Naprawione*, *Anulowane*). Może edytować treść lub anulować własne zgłoszenie tak długo, jak posiada ono status *Nowe*.
3. **Komentowanie zgłoszeń:**  
   Zarówno uczeń (autor zgłoszenia), jak i opiekun pracowni mogą wymieniać wiadomości tekstowe wewnątrz widoku szczegółów konkretnego zgłoszenia (np. w celu dopytania o szczegóły usterki lub poinformowania o zamówieniu części).
4. **Panel opiekuna pracowni (Administrator):**  
   Opiekun posiada dostęp do zestawienia zgłoszeń ze wszystkich pracowni szkolnych. Może filtrować zgłoszenia po salach, kategoriach i statusach, zmieniać status i priorytet zgłoszeń (*Niski*, *Normalny*, *Wysoki*) oraz dodawać oficjalne odpowiedzi techniczne.

---

## 3. Technologie i architektura danych
* **Interfejs użytkownika (Frontend):**  
  * **React.js** (budowany przy użyciu narzędzia **Vite**) – dynamiczny, responsywny interfejs SPA (Single Page Application).
  * **Tailwind CSS** – nowoczesna, przejrzysta stylizacja komponentów (widok kafelkowy, tabele statusów, czytelne etykiety i formularze).
* **Obsługa logiki i API (Backend):**  
  * **Python 3** z frameworkiem **FastAPI** – wysoka wydajność, automatyczna dokumentacja OpenAPI / Swagger UI pod adresem `/docs`.
  * **Pydantic (v2)** – rygorystyczna walidacja typów danych i reguł biznesowych po stronie serwera.
  * **Uwierzytelnianie:** Tokeny **JWT (JSON Web Tokens)** z algorytmem `HS256`, haszowanie haseł algorytmem `bcrypt`.
* **Baza danych:**  
  * **SQLite** z wykorzystaniem ORM **SQLAlchemy** – lekka baza plikowa, idealna do uruchomienia na dowolnym komputerze bez instalacji zewnętrznych serwerów bazodanowych. Plik bazy (`titbird.db`) jest wykluczony z repozytorium Git i tworzony automatycznie przez skrypt inicjalizujący.

---

## 4. Zagrożenia i cyberbezpieczeństwo

Aplikacja implementuje zestaw mechanizmów obronnych odpowiadających wymaganiom z wytycznych projektowych:

| # | Zagrożenie / Typ ataku | Przykład ataku lub błędnych danych | Zastosowane zabezpieczenie | Procedura testowa i oczekiwany wynik |
| :---: | :--- | :--- | :--- | :--- |
| **1** | **Nieuprawniony dostęp do cudzych danych (IDOR / BOLA)** | Uczeń A próbuje zmodyfikować lub anulować zgłoszenie Ucznia B, wysyłając żądanie `DELETE /api/tickets/15` lub `PUT /api/tickets/15`. | **Kontrola właściciela zasobu po stronie API:** Serwer pobiera tożsamość z podpisanego tokenu JWT i weryfikuje warunek `ticket.owner_id == current_user.id`. | Wysłanie żądania modyfikacji cudzego rekordu. **Oczekiwany wynik:** Serwer zwraca kod `403 Forbidden`, rekord pozostaje niezmieniony. |
| **2** | **Przesłanie nieprawidłowych danych (Obejście formularza)** | Użytkownik omija walidację przeglądarki i wysyła bezpośrednio do API: ujemny numer stanowiska (`-5`), numer `999` (poza zakresem sali) lub opis o długości 100 000 znaków. | **Ścisła walidacja serwerowa Pydantic:** Weryfikacja typu, ograniczenia `ge=1, le=32` dla numeru stanowiska oraz `min_length=5, max_length=2000` dla opisu. | Przesłanie żądania POST z `workstation_number = 99`. **Oczekiwany wynik:** Serwer odrzuca żądanie z kodem `422 Unprocessable Entity` i precyzyjnym komunikatem o błędzie. |
| **3** | **Wstrzyknięcie złośliwego kodu (XSS - Cross-Site Scripting)** | Użytkownik wpisuje w opisie zgłoszenia lub w treści komentarza kod: `<script>alert('XSS')</script>` lub `<b>Formatowanie</b>`. | **Bezpieczne renderowanie JSX:** React domyślnie traktuje wstrzykiwane zmienne jako ciągi tekstowe i automatycznie escapuje encje HTML. Backend nie parsuje ani nie wykonuje kodu HTML. | Wprowadzenie znacznika `<b>Próba</b>` w komentarzu. **Oczekiwany wynik:** Tekst wyświetla się na ekranie dosłownie jako znaki `<b>Próba</b>`, brak wykonania skryptu. |
| **4** | **Eskalacja uprawnień / Akcje administratora przez ucznia (Bypass RBAC)** | Zwykły uczeń wysyła bezpośrednie żądanie `PATCH /api/tickets/15/status`, zmieniając status na „Naprawione” lub próbuje pobrać listę wszystkich zgłoszeń szkoły `GET /api/tickets/all`. | **Ochrona ról (Role-Based Access Control):** Endpointy administracyjne chronione są zależnością `require_admin`, sprawdzającą pole `role == "admin"` w zweryfikowanym tokenie JWT. | Wysłanie zapytania do endpointu administracyjnego z tokenem ucznia. **Oczekiwany wynik:** Odpowiedź serwera `403 Forbidden`, brak zmiany stanu danych. |
| **5** | **Wyciek sekretów i kluczy szyfrujących** | Przypadkowe umieszczenie klucza `SECRET_KEY` do podpisywania tokenów JWT w publicznym repozytorium GitHub. | **Separacja konfiguracji za pomocą `.env`:** Wszystkie sekrety i parametry konfiguracyjne ładowane są ze zmiennych środowiskowych. Plik `.env` jest wpisany do `.gitignore`, a w repozytorium znajduje się wyłącznie `.env.example`. | Przegląd historii commitów i plików w repozytorium. **Oczekiwany wynik:** Brak obecności kluczy kryptograficznych i wrażliwych danych w Git. |

---

## 5. Plan pracy (Praca samodzielna)
Projekt realizowany jest samodzielnie z zachowaniem czytelnej historii commitów w Git:

* **Etap 1 – Zgłoszenie pomysłu i przygotowanie repozytorium:**  
  * Konfiguracja repozytorium Git, połączenie ze zdalnym serwisem GitHub.
  * Opracowanie pliku `README.md` oraz reguł `.gitignore`.
  * *Commit:* `docs: zainicjalizowanie repozytorium i specyfikacja projektu w README.md`.
* **Etap 2 – Inicjalizacja szkieletu i pierwsza pełna funkcja (Vertical Slice):**  
  * Konfiguracja struktury backendu (FastAPI, SQLite, SQLAlchemy) oraz frontendu (Vite + React).
  * Utworzenie formularza zgłoszenia usterki, zapis do bazy oraz odczyt na liście zgłoszeń.
  * *Commit:* `feat: wdrozenie pierwszej dzialajacej funkcji zgloszenia (vertical slice)`.
* **Etap 3 – Uwierzytelnianie, role (RBAC) i zabezpieczenie IDOR:**  
  * Rejestracja, logowanie użytkowników, generowanie tokenów JWT i haszowanie haseł `bcrypt`.
  * Podział na role `student` i `admin`.
  * Wdrożenie zabezpieczeń IDOR (edycja/anulowanie tylko własnych zgłoszeń) oraz RBAC (panel opiekuna).
  * Skrypt `seed.py` generujący konta testowe i przykładowe usterki.
  * *Commit:* `feat: dodanie autoryzacji JWT, ról użytkowników oraz zabezpieczeń IDOR i RBAC`.
* **Etap 4 – Komentarze, filtry i zaawansowana walidacja:**  
  * Moduł komentarzy do zgłoszeń.
  * Filtrowanie zgłoszeń po salach i priorytetach w panelu nauczyciela.
  * Rygorystyczna walidacja danych wejściowych w Pydantic (zakresy stanowisk 1–32).
  * *Commit:* `feat: implementacja komentarzy, filtrowania pracowni i walidacji serwerowej`.
* **Etap 5 – Testy bezpieczeństwa i finalizacja dokumentacji:**  
  * Przeprowadzenie scenariuszy testowych (Swagger UI / konsola przeglądarki) weryfikujących blokady IDOR, RBAC, walidację i XSS.
  * Weryfikacja manualna i uzupełnienie sekcji z wynikami testów w dokumentacji.
  * *Commit:* `test: dodanie automatycznych testow bezpieczenstwa oraz finalizacja README`.

---

## 6. Instrukcja uruchomienia aplikacji

### Wymagania wstępne
* Python 3.10+ zainstalowany w systemie
* Node.js v18+ oraz npm

### Krok 1: Klonowanie repozytorium
```bash
git clone https://github.com/zynioo/TitBirdProject.git
cd TitBirdProject
```

### Krok 2: Uruchomienie Backendu (FastAPI)
1. Przejdź do katalogu backendu:
   ```bash
   cd backend
   ```
2. Utwórz i aktywuj wirtualne środowisko:
   ```bash
   # Windows (PowerShell):
   python -m venv venv
   .\venv\Scripts\Activate.ps1

   # Linux / macOS:
   python3 -m venv venv
   source venv/bin/activate
   ```
3. Zainstaluj wymagane pakiety:
   ```bash
   pip install -r requirements.txt
   ```
4. Utwórz plik konfiguracyjny `.env`:
   ```bash
   cp .env.example .env
   ```
5. Zainicjalizuj bazę danych i konta testowe:
   ```bash
   python seed.py
   ```
6. Uruchom serwer deweloperski:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   *API i interaktywna dokumentacja Swagger UI będą dostępne pod adresem:* `http://127.0.0.1:8000/docs`

### Krok 3: Uruchomienie Frontendu (React + Vite)
1. W nowym oknie terminala przejdź do katalogu frontendu:
   ```bash
   cd frontend
   ```
2. Zainstaluj zależności:
   ```bash
   npm install
   ```
3. Uruchom serwer deweloperski:
   ```bash
   npm run dev
   ```
   *Aplikacja będzie dostępna w przeglądarce pod adresem:* `http://localhost:5173`

---

## 7. Dane kont testowych

Do celów weryfikacji i prezentacji aplikacji przygotowane zostały wstępne konta demonstracyjne:

| Rola w systemie | Login | Hasło | Uprawnienia i zastosowanie |
| :--- | :--- | :--- | :--- |
| **Uczeń A** | `uczen1` | `HasloUcznia123!` | Zgłaszanie usterek, przeglądanie i edycja własnych wpisów |
| **Uczeń B** | `uczen2` | `HasloUcznia123!` | Używany do testowania blokady IDOR (próba edycji zgłoszeń Ucznia A) |
| **Opiekun (Admin)** | `nauczyciel` | `AdminNauczyciel123!` | Pełny dostęp do wszystkich zgłoszeń, zmiana statusów, priorytetów |
