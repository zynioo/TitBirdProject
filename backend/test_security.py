import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.auth import hash_password, verify_password
from app.database import SessionLocal
from app.models import User, Ticket

client = TestClient(app)

def test_password_hashing_bcrypt():
    """Weryfikacja haszowania bcrypt z solą."""
    raw_pass = "MojeSuperTajneHaslo123!"
    hashed = hash_password(raw_pass)
    
    assert hashed != raw_pass
    assert hashed.startswith("$2b$") or hashed.startswith("$2a$")
    assert verify_password(raw_pass, hashed) is True
    assert verify_password("ZleHaslo", hashed) is False

def test_unauthenticated_access_blocked():
    """Wymóg logowania: niezalogowany użytkownik nie ma dostępu do API (401 Unauthorized)."""
    res = client.get("/api/tickets")
    assert res.status_code == 401
    assert "Wymagane jest uwierzytelnienie" in res.json()["detail"]

def test_auth_registration_and_login():
    """Rejestracja i logowanie użytkownika oraz wydanie tokenu JWT."""
    username = "test_user_unique_1"
    password = "TestPassword123!"

    # 1. Rejestracja
    reg_res = client.post("/api/auth/register", json={
        "username": username,
        "password": password,
        "role": "student"
    })
    # Może zwrócić 201 lub 400 jeśli już istnieje
    if reg_res.status_code == 201:
        data = reg_res.json()
        assert "access_token" in data
        assert data["user"]["username"] == username
    else:
        assert reg_res.status_code == 400

    # 2. Próba ponownej rejestracji tego samego loginu (blokada duplikatów)
    dup_res = client.post("/api/auth/register", json={
        "username": username,
        "password": password,
        "role": "student"
    })
    assert dup_res.status_code == 400

    # 3. Logowanie z poprawnym hasłem
    login_res = client.post("/api/auth/login", json={
        "username": username,
        "password": password
    })
    assert login_res.status_code == 200
    assert "access_token" in login_res.json()

    # 4. Logowanie z błędnym hasłem
    bad_login = client.post("/api/auth/login", json={
        "username": username,
        "password": "CalkowicieBledneHaslo"
    })
    assert bad_login.status_code == 401

def test_server_validation_pydantic():
    """Ścisła walidacja serwerowa Pydantic - odrzucenie błędnych danych (422)."""
    # Logowanie jako uczen1
    login_res = client.post("/api/auth/login", json={
        "username": "uczen1",
        "password": "HasloUcznia123!"
    })
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Błędny numer stanowiska (999 > 32)
    bad_workstation = client.post("/api/tickets", headers=headers, json={
        "room": "Sala 204",
        "workstation_number": 999,
        "category": "Monitor",
        "description": "Poprawny opis usterki sprzętu"
    })
    assert bad_workstation.status_code == 422

    # Zbyt krótki opis (< 5 znaków)
    short_desc = client.post("/api/tickets", headers=headers, json={
        "room": "Sala 204",
        "workstation_number": 10,
        "category": "Monitor",
        "description": "ab"
    })
    assert short_desc.status_code == 422

def test_idor_protection():
    """
    Test bezpieczeństwa IDOR (Insecure Direct Object Reference).
    Uczeń 2 próbuje zmienić lub usunąć zgłoszenie należące do Ucznia 1.
    Oczekiwany wynik: 403 Forbidden, rekord bez zmian.
    """
    # 1. Zaloguj jako uczen1 i utwórz zgłoszenie
    token_u1 = client.post("/api/auth/login", json={
        "username": "uczen1", "password": "HasloUcznia123!"
    }).json()["access_token"]
    
    t_res = client.post("/api/tickets", headers={"Authorization": f"Bearer {token_u1}"}, json={
        "room": "Sala 204",
        "workstation_number": 15,
        "category": "Okablowanie",
        "description": "Zgłoszenie testowe IDOR do weryfikacji uprawnień"
    })
    assert t_res.status_code == 201
    ticket_id = t_res.json()["id"]

    # 2. Zaloguj jako uczen2
    token_u2 = client.post("/api/auth/login", json={
        "username": "uczen2", "password": "HasloUcznia123!"
    }).json()["access_token"]

    # 3. Uczeń 2 próbuje anulować zgłoszenie Ucznia 1
    idor_patch = client.patch(
        f"/api/tickets/{ticket_id}/status",
        headers={"Authorization": f"Bearer {token_u2}"},
        json={"status": "cancelled"}
    )
    assert idor_patch.status_code == 403
    assert "IDOR" in idor_patch.json()["detail"] or "innego użytkownika" in idor_patch.json()["detail"]

    # 4. Uczeń 2 próbuje usunąć zgłoszenie Ucznia 1
    idor_delete = client.delete(
        f"/api/tickets/{ticket_id}",
        headers={"Authorization": f"Bearer {token_u2}"}
    )
    assert idor_delete.status_code == 403

def test_rbac_admin_protection():
    """
    Test kontroli dostępu opartej na rolach (RBAC).
    Zwykły uczeń nie może oznaczać usterek jako naprawionych (403 Forbidden).
    Opiekun pracowni (admin) ma pełne uprawnienia (200 OK).
    """
    # Zgłoszenie
    token_u1 = client.post("/api/auth/login", json={
        "username": "uczen1", "password": "HasloUcznia123!"
    }).json()["access_token"]

    ticket = client.post("/api/tickets", headers={"Authorization": f"Bearer {token_u1}"}, json={
        "room": "Sala 101",
        "workstation_number": 8,
        "category": "PC/Stacja",
        "description": "Zgłoszenie do testu ról RBAC"
    }).json()

    # Uczeń próbuje oznaczyć status jako "resolved"
    student_try = client.patch(
        f"/api/tickets/{ticket['id']}/status",
        headers={"Authorization": f"Bearer {token_u1}"},
        json={"status": "resolved"}
    )
    assert student_try.status_code == 403

    # Nauczyciel (admin) oznacza jako "resolved"
    token_admin = client.post("/api/auth/login", json={
        "username": "nauczyciel", "password": "AdminNauczyciel123!"
    }).json()["access_token"]

    admin_try = client.patch(
        f"/api/tickets/{ticket['id']}/status",
        headers={"Authorization": f"Bearer {token_admin}"},
        json={"status": "resolved", "priority": "high"}
    )
    assert admin_try.status_code == 200
    assert admin_try.json()["status"] == "resolved"
    assert admin_try.json()["priority"] == "high"

def test_database_plain_passwords_check():
    """Weryfikacja bazy danych: upewnienie się, że w bazie nie ma żadnych haseł w jawnym tekście."""
    db = SessionLocal()
    try:
        users = db.query(User).all()
        assert len(users) >= 3
        for u in users:
            assert u.hashed_password != "HasloUcznia123!"
            assert u.hashed_password != "AdminNauczyciel123!"
            assert u.hashed_password.startswith("$2b$")
    finally:
        db.close()
