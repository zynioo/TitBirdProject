import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

def set_cell_background(cell, fill_hex):
    """Ustawia kolor tła komórki tabeli."""
    tc_pr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement('w:shd')
    shd.set(qn('w:val'), 'clear')
    shd.set(qn('w:color'), 'auto')
    shd.set(qn('w:fill'), fill_hex)
    tc_pr.append(shd)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    """Ustawia marginesy komórki."""
    tc_pr = cell._tc.get_or_add_tcPr()
    tc_mar = OxmlElement('w:tcMar')
    for m, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
        node = OxmlElement(f'w:{m}')
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tc_mar.append(node)
    tc_pr.append(tc_mar)

def create_report():
    doc = docx.Document()

    # Ustawienia marginesów
    for section in doc.sections:
        section.top_margin = Inches(0.8)
        section.bottom_margin = Inches(0.8)
        section.left_margin = Inches(0.8)
        section.right_margin = Inches(0.8)

    # Kolory
    PRIMARY_COLOR = RGBColor(30, 64, 175)     # Granat / ciemny niebieski
    SECONDARY_COLOR = RGBColor(71, 85, 105)   # Szary / slate
    DARK_COLOR = RGBColor(15, 23, 42)         # Ciemny tekst

    # --- TYTUŁ DOKUMENTU ---
    title_p = doc.add_paragraph()
    title_p.paragraph_format.space_before = Pt(0)
    title_p.paragraph_format.space_after = Pt(4)
    run_subj = title_p.add_run("TECHNOLOGIE WEBOWE – PROJEKT SEMESTRALNY\n")
    run_subj.font.size = Pt(10)
    run_subj.font.bold = True
    run_subj.font.color.rgb = SECONDARY_COLOR

    run_title = title_p.add_run("Raport z wdrożenia bezpiecznej aplikacji webowej: TitBird")
    run_title.font.size = Pt(20)
    run_title.font.bold = True
    run_title.font.color.rgb = PRIMARY_COLOR

    desc_p = doc.add_paragraph()
    desc_p.paragraph_format.space_after = Pt(16)
    r_desc = desc_p.add_run("System zgłaszania usterek sprzętu w pracowniach szkolnych z uwierzytelnianiem JWT, haszowaniem bcrypt, kontrolą ról RBAC oraz ochroną IDOR")
    r_desc.font.size = Pt(11)
    r_desc.font.italic = True
    r_desc.font.color.rgb = SECONDARY_COLOR

    # --- METADANE PROJEKTU ---
    meta_table = doc.add_table(rows=4, cols=2)
    meta_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    meta_data = [
        ("Autor projektu:", "Milan Sułek"),
        ("Przedmiot:", "Technologie Webowe (Informatyka)"),
        ("Link do repozytorium Git:", "https://github.com/zynioo/TitBirdProject"),
        ("Stos technologiczny:", "FastAPI (Python 3.12), SQLite, SQLAlchemy, React (Vite), Tailwind CSS")
    ]
    for i, (label, val) in enumerate(meta_data):
        row = meta_table.rows[i]
        c0, c1 = row.cells[0], row.cells[1]
        c0.width = Inches(2.2)
        c1.width = Inches(4.5)
        set_cell_background(c0, "F1F5F9")
        set_cell_background(c1, "FFFFFF")
        set_cell_margins(c0, 60, 60, 100, 100)
        set_cell_margins(c1, 60, 60, 100, 100)
        
        p0 = c0.paragraphs[0]
        p0.paragraph_format.space_after = Pt(2)
        r0 = p0.add_run(label)
        r0.font.bold = True
        r0.font.size = Pt(9.5)
        
        p1 = c1.paragraphs[0]
        p1.paragraph_format.space_after = Pt(2)
        r1 = p1.add_run(val)
        r1.font.size = Pt(9.5)
        if "http" in val:
            r1.font.bold = True
            r1.font.color.rgb = PRIMARY_COLOR

    doc.add_paragraph().paragraph_format.space_after = Pt(12)

    # --- 1. OPIS WDROŻONYCH ZMIAN I FUNKCJONALNOŚCI ---
    h1 = doc.add_paragraph()
    h1.paragraph_format.space_before = Pt(14)
    h1.paragraph_format.space_after = Pt(6)
    r_h1 = h1.add_run("1. Opis wdrożonych zmian i funkcjonalności aplikacji")
    r_h1.font.size = Pt(14)
    r_h1.font.bold = True
    r_h1.font.color.rgb = PRIMARY_COLOR

    p_f = doc.add_paragraph()
    p_f.paragraph_format.space_after = Pt(6)
    p_f.add_run(
        "Zgodnie z wymaganiami projektowymi aplikacja TitBird przeszła pełny proces modernizacji i zabezpieczenia. "
        "Zaimplementowano następujące kluczowe moduły funkcjonalne:\n"
    )

    funcs = [
        ("Rejestracja użytkowników:", "Formularz rejestracji umożliwia założenie nowego konta z podaniem unikalnego loginu (min. 3 znaki), bezpiecznego hasła (min. 6 znaków) oraz roli w systemie (Uczeń lub Opiekun pracowni). Dane są weryfikowane zarówno po stronie klienta (React), jak i serwera (FastAPI + Pydantic)."),
        ("Logowanie i wylogowywanie:", "Uwierzytelnianie oparte o standard JSON Web Tokens (JWT, algorytm HS256). Po pomyślnym sprawdzeniu hasła serwer wydaje token, który jest przechowywany w pamięci przeglądarki (localStorage). Przycisk 'Wyloguj' natychmiast unieważnia sesję w przeglądarce i resetuje stan."),
        ("Blokada dostępu dla niezalogowanych:", "Użytkownik bez aktywnego tokenu JWT nie ma dostępu do żadnych poufnych widoków – aplikacja automatycznie wyświetla ekran powitalny z logowaniem/rejestracją. Endpointy API odrzucają próby zapytań bez nagłówka Authorization kodem 401 Unauthorized."),
        ("Rejestrowanie usterek (funkcja główna 1):", "Zalogowany uczeń wypełnia formularz zgłoszenia sprzętowego: wybiera salę (np. Sala 204), numer stanowiska (walidacja 1–32), kategorię sprzętu (Monitor, Mysz/Klawiatura, PC, Kable, Sieć) oraz opis usterki. Każde zgłoszenie jest trwale powiązane z ID zalogowanego ucznia."),
        ("Przeglądanie i filtrowanie zgłoszeń (funkcja główna 2):", "Widok 'Wszystkie zgłoszenia' z filtrem pracowni oraz widok 'Moje zgłoszenia', w którym uczeń widzi aktualny stan naprawy wyłącznie swoich urządzeń."),
        ("Zarządzanie usterkami i panel Opiekuna (funkcja główna 3):", "Opiekun pracowni (administrator) ma możliwość zmiany statusu usterki ('Nowe' -> 'W trakcie' -> 'Naprawione' -> 'Anulowane'), zmiany priorytetu oraz usuwania zgłoszeń. Zwykły uczeń może wyłącznie anulować lub usunąć swoje własne zgłoszenie w statusie 'Nowe'.")
    ]

    for title, desc in funcs:
        p_item = doc.add_paragraph(style='List Bullet')
        p_item.paragraph_format.space_after = Pt(4)
        rt = p_item.add_run(title + " ")
        rt.font.bold = True
        p_item.add_run(desc)

    # --- 2. ZASTOSOWANE MECHANIZMY CYBERBEZPIECZEŃSTWA ---
    h2 = doc.add_paragraph()
    h2.paragraph_format.space_before = Pt(14)
    h2.paragraph_format.space_after = Pt(6)
    r_h2 = h2.add_run("2. Zastosowane mechanizmy cyberbezpieczeństwa")
    r_h2.font.size = Pt(14)
    r_h2.font.bold = True
    r_h2.font.color.rgb = PRIMARY_COLOR

    p_sec = doc.add_paragraph()
    p_sec.paragraph_format.space_after = Pt(6)
    p_sec.add_run("W aplikacji wdrożono zestaw wielowarstwowych zabezpieczeń:")

    sec_table = doc.add_table(rows=6, cols=3)
    sec_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    headers = ["Typ zagrożenia / Atak", "Zastosowane zabezpieczenie", "Procedura testowa i wynik"]
    hdr_row = sec_table.rows[0]
    for idx, name in enumerate(headers):
        cell = hdr_row.cells[idx]
        set_cell_background(cell, "1E40AF")
        set_cell_margins(cell, 80, 80, 100, 100)
        p = cell.paragraphs[0]
        p.paragraph_format.space_after = Pt(2)
        r = p.add_run(name)
        r.font.bold = True
        r.font.size = Pt(9)
        r.font.color.rgb = RGBColor(255, 255, 255)

    sec_rows = [
        ("Haszowanie haseł w bazie (Brak plaintextu)",
         "Algorytm bcrypt z 12 rundami soli (bcrypt.gensalt(12)). Żadne hasło nie jest przechowywane w postaci jawnej.",
         "Sprawdzenie tabeli 'users' w SQLite. Wszystkie rekordy posiadają hashe $2b$12$... Test zaliczony."),
        ("Ochrona przed IDOR / BOLA (Cudze rekordy)",
         "Weryfikacja właściciela zasobu po stronie API (ticket.owner_id == current_user.id).",
         "Uczeń uczen2 wysyła żądanie anulowania zgłoszenia uczen1. Serwer zwraca 403 Forbidden. Test zaliczony."),
        ("Walidacja serwerowa (Pydantic v2)",
         "Rygorystyczne reguły Pydantic: workstation_number ge=1 le=32, description min_length=5 max_length=2000.",
         "Wysłanie POST ze stanowiskiem #999 i opisem 'ab'. Serwer odrzuca żądanie kodem 422 Unprocessable Entity. Test zaliczony."),
        ("Ochrona ról administratora (RBAC)",
         "Zależność require_admin blokuje wywołania wrażliwych endpointów dla użytkowników z rolą 'student'.",
         "Próba oznaczenia usterki jako 'resolved' przez ucznia. Serwer zwraca 403 Forbidden. Test zaliczony."),
        ("Ochrona przed atakami XSS",
         "Bezpieczne renderowanie JSX w React (automatyczne traktowanie wstrzykiwanych danych jako stringi).",
         "Wpisanie w opisie usterki <script>alert('XSS')</script>. Tekst wyświetla się dosłownie, brak wykonania kodu. Test zaliczony.")
    ]

    for i, row_data in enumerate(sec_rows):
        row = sec_table.rows[i + 1]
        bg = "FFFFFF" if i % 2 == 0 else "F8FAFC"
        for col_idx, text in enumerate(row_data):
            cell = row.cells[col_idx]
            set_cell_background(cell, bg)
            set_cell_margins(cell, 60, 60, 80, 80)
            p = cell.paragraphs[0]
            p.paragraph_format.space_after = Pt(2)
            r = p.add_run(text)
            r.font.size = Pt(8.5)
            if col_idx == 0:
                r.font.bold = True

    doc.add_paragraph().paragraph_format.space_after = Pt(12)

    # --- 3. DOKUMENTACJA ZDJĘCIOWA (ZRZUTY EKRANU) ---
    h3 = doc.add_paragraph()
    h3.paragraph_format.space_before = Pt(14)
    h3.paragraph_format.space_after = Pt(6)
    r_h3 = h3.add_run("3. Dokumentacja zdjęciowa (Zrzuty ekranu)")
    r_h3.font.size = Pt(14)
    r_h3.font.bold = True
    r_h3.font.color.rgb = PRIMARY_COLOR

    screenshots = [
        ("Zrzut 1: Formularz logowania do systemu TitBird",
         "Widok logowania umożliwiający podanie danych uwierzytelniających oraz szybki wybór kont demonstracyjnych (Uczeń uczen1 oraz Opiekun nauczyciel). Zapewniona obsługa błędnych poświadczeń (komunikat 401 Unauthorized)."),
        ("Zrzut 2: Formularz rejestracji nowego użytkownika",
         "Formularz rejestracji z walidacją po stronie klienta (porównanie haseł, min. 6 znaków, unikalność loginu w bazie) oraz wyborem roli."),
        ("Zrzut 3: Podgląd bazy danych SQLite z zahaszowanymi hasłami bcrypt",
         "Wynik zapytania SQL: SELECT id, username, hashed_password, role FROM users; w bazie titbird.db. Wszystkie hasła mają bezpieczny format $2b$12$..."),
        ("Zrzut 4: Widok główny zgłoszeń po zalogowaniu oraz filtrowanie sal",
         "Przegląd zarejestrowanych zgłoszeń sprzętowych z podziałem na sale, kategorie, daty utworzenia, autorów oraz kolorystyczne odznaki statusów."),
        ("Zrzut 5: Formularz zgłaszania nowej usterki przez ucznia",
         "Formularz z walidacją numeru stanowiska w sali (1-32), wyborem kategorii ze spersonalizowanymi ikonami oraz licznikiem znaków opisu."),
        ("Zrzut 6: Interaktywny panel testów bezpieczeństwa (Security Showcase)",
         "Widok wbudowanego panelu testowego prezentujący na żywo blokady ataków IDOR (kod 403), błędy walidacji Pydantic (kod 422), escapowanie XSS oraz kontrolę ról RBAC."),
        ("Zrzut 7: Historia czytelnych commitów w repozytorium Git",
         "Potwierdzenie systematyczności pracy i realizacji projektu etapami zgodnie z konwencją Conventional Commits (git log --oneline).")
    ]

    for title, desc in screenshots:
        p_sc_title = doc.add_paragraph()
        p_sc_title.paragraph_format.space_before = Pt(10)
        p_sc_title.paragraph_format.space_after = Pt(2)
        r_st = p_sc_title.add_run(title)
        r_st.font.bold = True
        r_st.font.size = Pt(11)
        r_st.font.color.rgb = PRIMARY_COLOR

        p_sc_desc = doc.add_paragraph()
        p_sc_desc.paragraph_format.space_after = Pt(4)
        r_sd = p_sc_desc.add_run(desc)
        r_sd.font.size = Pt(9.5)
        r_sd.font.color.rgb = SECONDARY_COLOR

        # Ramka na wklejenie screena
        box_table = doc.add_table(rows=1, cols=1)
        box_table.alignment = WD_TABLE_ALIGNMENT.CENTER
        box_cell = box_table.rows[0].cells[0]
        box_cell.width = Inches(6.5)
        set_cell_background(box_cell, "F8FAFC")
        set_cell_margins(box_cell, 150, 150, 200, 200)
        p_box = box_cell.paragraphs[0]
        p_box.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_box.paragraph_format.space_after = Pt(0)
        r_box = p_box.add_run("[ MIEJSCE NA ZRZUT EKRANU: " + title.split(':')[1].strip() + " ]\n(Wklej tutaj zrzut ekranu)")
        r_box.font.size = Pt(9.5)
        r_box.font.bold = True
        r_box.font.color.rgb = RGBColor(148, 163, 184)

    # --- 4. POTWIERDZENIE Z BAZY DANYCH I GITA ---
    h4 = doc.add_paragraph()
    h4.paragraph_format.space_before = Pt(16)
    h4.paragraph_format.space_after = Pt(6)
    r_h4 = h4.add_run("4. Bezpośrednie potwierdzenia techniczne (Logi bazy i Gita)")
    r_h4.font.size = Pt(14)
    r_h4.font.bold = True
    r_h4.font.color.rgb = PRIMARY_COLOR

    p_db = doc.add_paragraph()
    p_db.paragraph_format.space_after = Pt(2)
    r_dbt = p_db.add_run("Zawartość tabeli 'users' w bazie titbird.db (Bcrypt hashes):")
    r_dbt.font.bold = True
    r_dbt.font.size = Pt(10)

    db_code = doc.add_paragraph()
    db_code.paragraph_format.space_after = Pt(8)
    r_c = db_code.add_run(
        "ID | Login       | Rola    | Hash hasła (bcrypt z solą)\n"
        "---+-------------+---------+--------------------------------------------------------------\n"
        " 1 | uczen1      | student | $2b$12$94bTHsoDiWmrS/5vcFTIeu89DnQTd5.Xtw4X92St7lFu05/AWl59G\n"
        " 2 | uczen2      | student | $2b$12$5QmXArQ5hVcs6rxblbQvI.Kr4Her30pBmFVSsGhtLv5mBBRyjfAWq\n"
        " 3 | nauczyciel  | admin   | $2b$12$nUdAXBEOEsAXg8epPZL5keMrVZYjj.4qxxoEl.41Ix9M4Rc3/p/Ki"
    )
    r_c.font.name = "Courier New"
    r_c.font.size = Pt(8)
    r_c.font.color.rgb = DARK_COLOR

    p_git = doc.add_paragraph()
    p_git.paragraph_format.space_after = Pt(2)
    r_gt = p_git.add_run("Historia commitów w repozytorium (git log --oneline):")
    r_gt.font.bold = True
    r_gt.font.size = Pt(10)

    git_code = doc.add_paragraph()
    git_code.paragraph_format.space_after = Pt(8)
    r_gc = git_code.add_run(
        "53e8491 docs: finalizacja dokumentacji, instrukcji i wynikow testow bezpieczenstwa\n"
        "0b3f32a test: automatyczne testy bezpieczenstwa (bcrypt, IDOR, RBAC, walidacja Pydantic)\n"
        "d96a877 feat(frontend): interfejs zgloszen, blokada niezalogowanych i panel testow bezpieczenstwa\n"
        "200cfd4 feat(frontend): formularze logowania i rejestracji z walidacja\n"
        "6727544 feat(backend): zabezpieczenie endpointow IDOR, walidacja i role RBAC\n"
        "5a3592f feat(backend): model User, haszowanie hasel bcrypt i autoryzacja JWT\n"
        "fa41057 feat(frontend): formularz zgloszen i lista usterek z filtrowaniem pracowni\n"
        "8473211 chore(frontend): konfiguracja projektu vite react i tailwind css\n"
        "c1238f2 feat(backend): endpointy do dodawania i pobierania usterek oraz skrypt seed\n"
        "932303a feat(backend): model bazy danych ticket oraz walidacja pydantic"
    )
    r_gc.font.name = "Courier New"
    r_gc.font.size = Pt(8)
    r_gc.font.color.rgb = DARK_COLOR

    # Wynik pytest
    p_pyt = doc.add_paragraph()
    p_pyt.paragraph_format.space_after = Pt(2)
    r_pt = p_pyt.add_run("Wynik wykonania zestawu testów automatycznych (pytest test_security.py -v):")
    r_pt.font.bold = True
    r_pt.font.size = Pt(10)

    pyt_code = doc.add_paragraph()
    pyt_code.paragraph_format.space_after = Pt(14)
    r_pc = pyt_code.add_run(
        "test_security.py::test_password_hashing_bcrypt PASSED                    [ 14%]\n"
        "test_security.py::test_unauthenticated_access_blocked PASSED             [ 28%]\n"
        "test_security.py::test_auth_registration_and_login PASSED                [ 42%]\n"
        "test_security.py::test_server_validation_pydantic PASSED                 [ 57%]\n"
        "test_security.py::test_idor_protection PASSED                            [ 71%]\n"
        "test_security.py::test_rbac_admin_protection PASSED                      [ 85%]\n"
        "test_security.py::test_database_plain_passwords_check PASSED             [100%]\n"
        "======================== 7 passed in 3.42s ========================="
    )
    r_pc.font.name = "Courier New"
    r_pc.font.size = Pt(8.5)
    r_pc.font.color.rgb = PRIMARY_COLOR

    out_path = "C:/Users/user/Desktop/titbirdproject/Raport_Bezpieczna_Aplikacja_Webowa_TitBird.docx"
    doc.save(out_path)
    print(f"Raport pomyślnie wygenerowany pod ścieżką: {out_path}")

if __name__ == "__main__":
    create_report()
