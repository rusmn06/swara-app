from app.database.connection import SessionLocal
from app.database.schemas import User
from app.core.security import hash_password

# Ganti kredensial di bawah ini sebelum menjalankan script
USERS_TO_SEED = [
    {
        "username": "admin",
        "password": "swara2026",
        "display_name": "Admin Swara",
        "role": "admin",
    },
    {
        "username": "manajer",
        "password": "swara2026",
        "display_name": "Executive",
        "role": "manajerial",
    },
]


def create_user(db, username: str, password: str, role: str, display_name: str | None = None):
    existing = db.query(User).filter(User.username == username).first()
    if existing:
        print(f"[SKIP] Username '{username}' already exists, skipped.")
        return

    user = User(
        username=username,
        password_hash=hash_password(password),
        display_name=display_name,
        role=role,
        is_active=True,
    )
    db.add(user)
    db.commit()
    print(f"[OK] User '{username}' ({role}) successfully created.")


def main():
    db = SessionLocal()
    try:
        for entry in USERS_TO_SEED:
            create_user(
                db,
                username=entry["username"],
                password=entry["password"],
                role=entry["role"],
                display_name=entry.get("display_name"),
            )
    finally:
        db.close()


if __name__ == "__main__":
    main()