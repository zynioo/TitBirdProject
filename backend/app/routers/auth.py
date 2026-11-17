from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User
from app.schemas import UserCreate, UserLogin, UserResponse, TokenResponse
from app.auth import hash_password, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """
    Rejestracja nowego użytkownika.
    Hasło jest bezpiecznie haszowane przy użyciu algorytmu bcrypt z unikalną solą.
    """
    clean_username = user_data.username.strip()
    if len(clean_username) < 3:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nazwa użytkownika musi mieć co najmniej 3 znaki."
        )

    if len(user_data.password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Hasło musi mieć co najmniej 6 znaków."
        )

    # Sprawdzenie unikalności loginu
    existing_user = db.query(User).filter(User.username == clean_username).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Użytkownik o loginie '{clean_username}' już istnieje w systemie."
        )

    # Bezpieczne przypisanie roli - uczeń domyślnie
    user_role = user_data.role if user_data.role in ["student", "admin"] else "student"

    hashed_pw = hash_password(user_data.password)
    new_user = User(
        username=clean_username,
        hashed_password=hashed_pw,
        role=user_role
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token = create_access_token(data={"sub": new_user.username, "role": new_user.role, "id": new_user.id})
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(new_user)
    )

@router.post("/login", response_model=TokenResponse)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    """
    Uwierzytelnianie użytkownika i wydanie tokenu JWT.
    Weryfikacja hasha bcrypt zapobiega timing attacks.
    """
    clean_username = credentials.username.strip()
    user = db.query(User).filter(User.username == clean_username).first()
    
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Nieprawidłowa nazwa użytkownika lub hasło.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    token = create_access_token(data={"sub": user.username, "role": user.role, "id": user.id})
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )

@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """
    Zwraca profil aktualnie zalogowanego użytkownika (wymaga ważnego tokenu JWT).
    """
    return UserResponse.model_validate(current_user)
