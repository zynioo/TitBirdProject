from app.database import engine, SessionLocal, Base
from app.models import Ticket

def seed_data():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # Sprawdź czy są już dane
        existing_count = db.query(Ticket).count()
        if existing_count > 0:
            print(f"Baza zawiera juz {existing_count} zgloszen. Pomijanie seedowania.")
            return

        sample_tickets = [
            Ticket(
                room="Sala 204",
                workstation_number=12,
                category="Okablowanie",
                description="Uszkodzony wtyk kabla HDMI, obraz na monitorze miga na zielono przy poruszeniu kablem.",
                status="new",
                priority="normal"
            ),
            Ticket(
                room="Sala 204",
                workstation_number=5,
                category="Mysz/Klawiatura",
                description="Prawy przycisk myszy optycznej nie klika (zacięty fizycznie).",
                status="in_progress",
                priority="low"
            ),
            Ticket(
                room="Sala 101",
                workstation_number=18,
                category="Monitor",
                description="Monitor LG nie włącza się, brak reakcji diody zasilania.",
                status="resolved",
                priority="high"
            ),
            Ticket(
                room="Sala 205",
                workstation_number=3,
                category="Sieć/Internet",
                description="Karta sieciowa nie pobiera adresu IP z DHCP, brak dostępu do internetu.",
                status="new",
                priority="high"
            )
        ]

        db.add_all(sample_tickets)
        db.commit()
        print(f"Pomyslnie dodano {len(sample_tickets)} przykladowych zgloszen do bazy titbird.db!")
    finally:
        db.close()

if __name__ == "__main__":
    seed_data()
