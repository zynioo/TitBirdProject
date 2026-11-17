from app.database import engine, SessionLocal, Base
from app.models import Ticket, User
from app.auth import hash_password

def seed_data():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # 1. Sprawdź i dodaj użytkowników
        student1 = db.query(User).filter(User.username == "uczen1").first()
        if not student1:
            student1 = User(
                username="uczen1",
                hashed_password=hash_password("HasloUcznia123!"),
                role="student"
            )
            db.add(student1)

        student2 = db.query(User).filter(User.username == "uczen2").first()
        if not student2:
            student2 = User(
                username="uczen2",
                hashed_password=hash_password("HasloUcznia123!"),
                role="student"
            )
            db.add(student2)

        admin_user = db.query(User).filter(User.username == "nauczyciel").first()
        if not admin_user:
            admin_user = User(
                username="nauczyciel",
                hashed_password=hash_password("AdminNauczyciel123!"),
                role="admin"
            )
            db.add(admin_user)

        db.commit()
        db.refresh(student1)
        db.refresh(student2)
        db.refresh(admin_user)
        print("Pomyslnie utworzono uzytkownikow testowych (uczen1, uczen2, nauczyciel) z zahaszowanymi haslami bcrypt.")

        # 2. Sprawdź czy są już zgłoszenia
        existing_tickets = db.query(Ticket).count()
        if existing_tickets > 0:
            print(f"Baza zawiera juz {existing_tickets} zgloszen. Pomijanie seedowania zgloszen.")
            return

        sample_tickets = [
            Ticket(
                room="Sala 204",
                workstation_number=12,
                category="Okablowanie",
                description="Uszkodzony wtyk kabla HDMI, obraz na monitorze miga na zielono przy poruszeniu kablem.",
                status="new",
                priority="normal",
                owner_id=student1.id
            ),
            Ticket(
                room="Sala 204",
                workstation_number=5,
                category="Mysz/Klawiatura",
                description="Prawy przycisk myszy optycznej nie klika (zacięty fizycznie).",
                status="in_progress",
                priority="low",
                owner_id=student1.id
            ),
            Ticket(
                room="Sala 101",
                workstation_number=18,
                category="Monitor",
                description="Monitor LG nie włącza się, brak reakcji diody zasilania.",
                status="resolved",
                priority="high",
                owner_id=student2.id
            ),
            Ticket(
                room="Sala 205",
                workstation_number=3,
                category="Sieć/Internet",
                description="Karta sieciowa nie pobiera adresu IP z DHCP, brak dostępu do internetu.",
                status="new",
                priority="high",
                owner_id=student2.id
            )
        ]

        db.add_all(sample_tickets)
        db.commit()
        print(f"Pomyslnie dodano {len(sample_tickets)} przykladowych zgloszen powiazanych z uzytkownikami.")
    finally:
        db.close()

if __name__ == "__main__":
    seed_data()
