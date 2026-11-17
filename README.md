# TitBird – System zgłaszania usterek w pracowniach komputerowych

**Autor:** Milan Sułek  
**Przedmiot:** Technologie Webowe – Projekt semestralny  
**Repozytorium:** [https://github.com/zynioo/TitBirdProject](https://github.com/zynioo/TitBirdProject)

---

## 1. Cel aplikacji
Aplikacja **TitBird** jest dedykowana uczniom oraz nauczycielom (opiekunom szkolnych pracowni komputerowych). Rozwiązuje powszechny problem gubiących się, zgłaszanych ustnie problemów ze sprzętem (np. uszkodzona mysz, brak połączenia z siecią, uszkodzony kabel HDMI, niedziałający monitor) oraz braku informacji zwrotnej o postępach w naprawie.

**Przykład użycia:**  
Uczeń siada przy stanowisku nr 12 w sali 204 i zauważa uszkodzony kabel HDMI. Loguje się do aplikacji TitBird, wypełnia prosty formularz, wskazując salę, numer stanowiska (z przedziału 1–32), kategorię sprzętu oraz krótki opis problemu. Opiekun pracowni (administrator) widzi nowe zgłoszenie w swoim panelu, diagnozuje i usuwa usterkę, a następnie zmienia status zgłoszenia na „Naprawione” i wybiera priorytet. Uczeń widzi aktualny stan naprawy na swoim koncie w zakładce „Moje zgłoszenia”.

---

## 2. Główne funkcje aplikacji

1. **Uwierzytelnianie i autoryzacja:**
   * Rejestracja nowego użytkownika z wyborem roli (`student` / `admin`).
   * Bezpieczne logowanie z walidacją poświadczeń i generowaniem tokenu **JWT**.
   * Przycisk wylogowania i czyszczenie tokenu z pamięci przeglądarki.
   * **Blokada dostępu:** niezalogowany użytkownik nie ma wglądu w zgłoszenia ani formularze (zarówno na poziomie React Router / stanu, jak i API).

2. **Tworzenie zgłoszenia:**  
   Zalogowany uczeń dodaje nowe zgłoszenie usterki, wskazując salę, numer stanowiska (1–32), kategorię usterki (*Monitor*, *Mysz/Klawiatura*, *PC/Stacja*, *Sieć*, *Okablowanie*, *Inne*) oraz opis problemu.

3. **Przeglądanie i filtrowanie zgłoszeń:**  
   * Widok „Wszystkie zgłoszenia” z filtrowaniem po salach.
   * Widok „Moje zgłoszenia” – uczeń widzi wyłącznie usterki zgłoszone przez siebie.

4. **Zarządzanie usterkami i anulowanie (IDOR Protection):**
   * Uczeń może anulować wyłącznie własne zgłoszenie i tylko wtedy, gdy ma ono status *Nowe*. Próba manipulacji cudzym zgłoszeniem jest blokowana kodem `403 Forbidden`.
   * Uczeń może usunąć wyłącznie własne zgłoszenie.

5. **Panel opiekuna pracowni (Administrator / RBAC):**  
   Opiekun posiada pełne uprawnienia do zmiany statusu zgłoszeń (*Nowe*, *W trakcie*, *Naprawione*, *Anulowane*), ustalania priorytetu (*Niski*, *Normalny*, *Wysoki*) oraz usuwania wpisów.

6. **Interaktywny panel weryfikacji cyberbezpieczeństwa (Security Showcase):**
   * Wbudowana w interfejs karta pozwalająca na żywo przetestować i zaprezentować mechanizmy obronne: IDOR, walidację Pydantic, escaping XSS, blokadę ról RBAC oraz strukturę bazy danych.

---

## 3. Technologie i architektura danych
* **Interfejs użytkownika (Frontend):**  
  * **React.js** (budowany przy użyciu **Vite**) – dynamiczny, responsywny interfejs SPA.
  * **Tailwind CSS** – nowoczesna, przejrzysta stylizacja komponentów.
  * **Lucide React** – ikony interfejsu.
* **Obsługa logiki i API (Backend):**  
  * **Python 3.12** z frameworkiem **FastAPI** – wysoka wydajność, automatyczna dokumentacja OpenAPI / Swagger UI pod adresem `/docs`.
  * **Pydantic (v2)** – rygorystyczna walidacja typów danych i reguł biznesowych po stronie serwera.
  * **Uwierzytelnianie:** Tokeny **JWT (JSON Web Tokens)** z algorytmem `HS256`, haszowanie haseł algorytmem `bcrypt` z unikalną solą.
* **Baza danych:**  
  * **SQLite** z wykorzystaniem ORM **SQLAlchemy** – lekka baza plikowa. Plik bazy (`titbird.db`) jest wykluczony z repozytorium Git i tworzony automatycznie przez skrypt inicjalizujący `seed.py`.

---

## 4. Zagrożenia i cyberbezpieczeństwo

Aplikacja implementuje komplet mechanizmów obronnych odpowiadających wymaganiom z wytycznych projektowych:

| # | Zagrożenie / Typ ataku | Przykład ataku lub błędnych danych | Zastosowane zabezpieczenie | Procedura testowa i wynik |
| :---: | :--- | :--- | :--- | :--- |
| **1** | **Nieuprawniony dostęp do cudzych danych (IDOR / BOLA)** | Uczeń A próbuje zmodyfikować lub usunąć zgłoszenie Ucznia B (`PATCH /api/tickets/15/status` lub `DELETE /api/tickets/15`). | **Kontrola właściciela zasobu po stronie API:** Serwer pobiera tożsamość z tokenu JWT i weryfikuje warunek `ticket.owner_id == current_user.id`. | Wysłanie żądania modyfikacji cudzego rekordu. **Wynik:** Serwer zwraca kod `403 Forbidden`, rekord pozostaje niezmieniony. Test automatyczny `test_idor_protection` zaliczony. |
| **2** | **Przesłanie nieprawidłowych danych (Obejście formularza)** | Użytkownik omija walidację przeglądarki i wysyła bezpośrednio do API: numer stanowiska `999` (poza zakresem sali) lub opis o długości 2 znaków. | **Ścisła walidacja serwerowa Pydantic v2:** Weryfikacja typu, ograniczenia `ge=1, le=32` dla numeru stanowiska oraz `min_length=5, max_length=2000` dla opisu. | Przesłanie żądania POST z `workstation_number = 999`. **Wynik:** Serwer odrzuca żądanie z kodem `422 Unprocessable Entity`. Test `test_server_validation_pydantic` zaliczony. |
| **3** | **Wstrzyknięcie złośliwego kodu (XSS - Cross-Site Scripting)** | Użytkownik wpisuje w opisie zgłoszenia kod: `<script>alert('XSS')</script><b>Formatowanie</b>`. | **Bezpieczne renderowanie JSX:** React domyślnie traktuje wstrzykiwane zmienne jako ciągi tekstowe i automatycznie escapuje encje HTML. | Wprowadzenie znacznika `<script>alert('XSS')</script>` w opisie. **Wynik:** Tekst wyświetla się na ekranie dosłownie jako znaki tekstu, brak wykonania skryptu w przeglądarce. |
| **4** | **Eskalacja uprawnień / Akcje administratora przez ucznia (Bypass RBAC)** | Zwykły uczeń wysyła żądanie `PATCH /api/tickets/15/status`, zmieniając status na „Naprawione” (`resolved`). | **Ochrona ról (Role-Based Access Control):** Endpointy administracyjne chronione są weryfikacją `current_user.role == "admin"`. | Wysłanie zapytania z tokenem ucznia. **Wynik:** Odpowiedź serwera `403 Forbidden`, brak zmiany stanu danych. Test `test_rbac_admin_protection` zaliczony. |
| **5** | **Przechowywanie haseł otwartym tekstem (Plaintext Passwords)** | Włamanie do bazy danych lub nieuprawniony odczyt tabeli użytkowników. | **Haszowanie haseł algorytmem bcrypt:** Przed zapisem hasło jest haszowane z 12 rundami soli (`bcrypt.gensalt(12)`). W bazie nie ma ani jednego hasła jawnego. | Weryfikacja zawartości tabeli `users` w SQLite. **Wynik:** Wszystkie hasła zapisane jako hashe `$2b$12$...`. Test `test_database_plain_passwords_check` zaliczony. |
| **6** | **Dostęp niezalogowanych użytkowników do danych (Brak autoryzacji)** | Próba odczytania listy zgłoszeń `GET /api/tickets` bez nagłówka Authorization. | **Wymóg tokenu JWT (Bearer Token):** Każdy chroniony endpoint odrzuca żądanie bez podpisanego tokenu. | Wysłanie żądania GET bez tokenu. **Wynik:** Serwer zwraca kod `401 Unauthorized`. Test `test_unauthenticated_access_blocked` zaliczony. |

---

## 5. Historia commitów w Git (Praca etapowa)

1. `docs: zainicjalizowanie repozytorium i specyfikacja projektu w README.md`
2. `feat: wdrozenie pierwszej dzialajacej funkcji zgloszenia (vertical slice)`
3. `feat(frontend): formularz zgloszen i lista usterek z filtrowaniem pracowni`
4. `feat(backend): model User, haszowanie hasel bcrypt i autoryzacja JWT`
5. `feat(backend): zabezpieczenie endpointow IDOR, walidacja i role RBAC`
6. `feat(frontend): formularze logowania i rejestracji z walidacja`
7. `feat(frontend): interfejs zgloszen, blokada niezalogowanych i panel testow bezpieczenstwa`
8. `test: automatyczne testy bezpieczenstwa (bcrypt, IDOR, RBAC, walidacja Pydantic)`
9. `docs: finalizacja dokumentacji, instrukcji i wynikow testow bezpieczenstwa`

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
1. W osobnym oknie terminala przejdź do katalogu frontendu:
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

### Krok 4: Uruchomienie automatycznych testów bezpieczeństwa
W katalogu `backend`:
```bash
pytest test_security.py -v
```

---

## 7. Dane kont testowych

Do celów weryfikacji i prezentacji aplikacji przygotowane zostały konta demonstracyjne w skrypcie `seed.py`:

| Rola w systemie | Login | Hasło | Uprawnienia i zastosowanie |
| :--- | :--- | :--- | :--- |
| **Uczeń A** | `uczen1` | `HasloUcznia123!` | Zgłaszanie usterek, przeglądanie i anulowanie wyłącznie własnych zgłoszeń |
| **Uczeń B** | `uczen2` | `HasloUcznia123!` | Używany do testowania blokady IDOR (próba anulowania zgłoszeń Ucznia A) |
| **Opiekun (Admin)** | `nauczyciel` | `AdminNauczyciel123!` | Pełny dostęp do wszystkich zgłoszeń, zmiana statusów, priorytetów |
